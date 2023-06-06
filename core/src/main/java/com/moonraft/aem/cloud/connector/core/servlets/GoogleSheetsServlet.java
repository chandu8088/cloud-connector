package com.moonraft.aem.cloud.connector.core.servlets;

import com.adobe.granite.crypto.CryptoException;
import com.adobe.granite.crypto.CryptoSupport;
import com.google.api.client.googleapis.auth.oauth2.GoogleCredential;
import com.google.api.client.googleapis.javanet.GoogleNetHttpTransport;
import com.google.api.client.http.ByteArrayContent;
import com.google.api.client.http.HttpTransport;
import com.google.api.client.json.JsonFactory;
import com.google.api.client.json.jackson2.JacksonFactory;
import com.google.api.services.drive.Drive;
import com.google.api.services.drive.DriveScopes;
import com.google.api.services.drive.model.File;
import com.google.api.services.sheets.v4.Sheets;
import com.google.api.services.sheets.v4.SheetsScopes;
import com.google.api.services.sheets.v4.model.AppendValuesResponse;
import com.google.api.services.sheets.v4.model.ValueRange;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import com.moonraft.aem.cloud.connector.core.service.GoogleDriveService;
import com.moonraft.aem.cloud.connector.core.service.GoogleSheetService;
import org.apache.http.HttpResponse;
import org.apache.http.NameValuePair;
import org.apache.http.client.config.RequestConfig;
import org.apache.http.client.entity.UrlEncodedFormEntity;
import org.apache.http.client.methods.HttpPost;
import org.apache.http.impl.client.CloseableHttpClient;
import org.apache.http.impl.client.HttpClientBuilder;
import org.apache.http.message.BasicNameValuePair;
import org.apache.http.util.EntityUtils;
import org.apache.sling.api.SlingHttpServletRequest;
import org.apache.sling.api.SlingHttpServletResponse;
import org.apache.sling.api.resource.Resource;
import org.apache.sling.api.resource.ResourceResolver;
import org.apache.sling.api.resource.ValueMap;
import org.apache.sling.api.servlets.HttpConstants;
import org.apache.sling.api.servlets.SlingAllMethodsServlet;
import org.apache.sling.servlets.annotations.SlingServletResourceTypes;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.servlet.Servlet;
import javax.servlet.ServletException;
import java.io.IOException;
import java.security.GeneralSecurityException;
import java.util.*;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

import static com.moonraft.aem.cloud.connector.core.utils.CommonUtils.convertStringToInputStream;

/**
 * The type Google sheets servlet.
 */
@Component(service = {Servlet.class})
@SlingServletResourceTypes(resourceTypes = "moonraft/components/page", methods = HttpConstants.METHOD_POST, extensions = "json", selectors = "gSheets")
public class GoogleSheetsServlet extends SlingAllMethodsServlet {

    private static final Logger LOGGER = LoggerFactory.getLogger(GoogleSheetsServlet.class);

    private static final JsonFactory JSON_FACTORY = JacksonFactory.getDefaultInstance();

    private static final String APPLICATION_NAME = "MR-AEM-Google-Connector";

    @Reference
    private transient GoogleDriveService googleDriveService;

    @Reference
    private transient CryptoSupport cryptoSupport;

    @Reference
    private transient GoogleSheetService googleSheetService;

    /**
     * Post method for Google Sheets Service
     */
    @Override
    protected void doPost(SlingHttpServletRequest request, SlingHttpServletResponse response) throws ServletException, IOException {
        String jsonString = request.getReader().lines().collect(Collectors.joining());
        LOGGER.debug("Form json data is : {}",jsonString);
        JsonElement jsonElement = JsonParser.parseString(jsonString);
        JsonObject jsonObject = jsonElement.getAsJsonObject();
        // verifying captcha token
        boolean status = verifyCaptcha(jsonObject);
        LOGGER.debug("Captcha verification Status is : {}",status);
        if (status) {
            //writing to Spread Sheet if Captcha Verification succeed
            AppendValuesResponse result = fetchSheetIdAndWriteToSheet(request, jsonObject);
            response.setHeader("Access-Control-Allow-Origin", "*");
            LOGGER.debug("Updated the Spread Sheet with result : {}",result);
            response.getWriter().write(result != null ? result.toPrettyString() : null);
        } else {
            LOGGER.error("Captcha Verification failed");
            response.getWriter().write("Captcha verification Failed");
        }

    }

    /**
     * Method to get Google Sheet Service
     */
    private Sheets connectToGoogleSheets() {
        try {
            HttpTransport httpTransport = GoogleNetHttpTransport.newTrustedTransport();
            GoogleCredential credential = GoogleCredential.fromStream(convertStringToInputStream(googleDriveService.getPrivateKey()))
                    .createScoped(Collections.singleton(SheetsScopes.SPREADSHEETS));
            LOGGER.debug("Connecting to Google Sheet Service");
            return new Sheets.Builder(httpTransport, JSON_FACTORY, credential)
                    .setApplicationName(APPLICATION_NAME)
                    .build();
        } catch (GeneralSecurityException | IOException e) {
            LOGGER.error("error in connecting to google sheets server {0}", e);
            return null;
        }
    }

    /**
     * Method to write form data to Spread Sheet
     */
    private AppendValuesResponse writeToGoogleSheet(Sheets sheetsService, String spreadSheetID, List<List<Object>> paramList) {
        ValueRange body = new ValueRange()
                .setValues(paramList);

        try {
            //write form values to Spread Sheet
            LOGGER.debug("Adding {} values to servlet",body);
            return sheetsService.spreadsheets().values().append(spreadSheetID, "A1", body).setValueInputOption("RAW").execute();
        } catch (IOException e) {
            LOGGER.error("Error in writing content to Google Sheets : {0}", e);
            return new AppendValuesResponse();
        }
    }

    /**
     * Method to fetch file upload data and create a list of form data
     * returns a form data in the form of list
     */
    private List<List<Object>> createList(JsonObject jsonObject,String parentFolderId) {
        List<List<Object>> parameterArray = new ArrayList<>();
        List<Object> parameterList = new ArrayList<>();
        for (String key : jsonObject.keySet()
        ) {
            LOGGER.debug("Creating a List to store it in Spread Sheet");
            // Check whether the jsonObject contains base 64 data to upload it to drive
            if (jsonObject.get(key).toString().contains("data") && jsonObject.get(key).toString().contains("base64")) {
                String base64Data = jsonObject.get(key).toString().replace("\"", "").split("base64,")[1];
                String testingString = key.split("content")[0];
                String name = null;
                String type = null;
                for (String key1 : jsonObject.keySet()) {
                    //condition to fetch name of the file
                    if (key1.contains(testingString + "name")) {
                        name = jsonObject.get(key1).toString().replace("\"", "");
                    }
                    // condition to fetch type of file from json object
                    if (key1.contains(testingString + "type")) {
                        type = jsonObject.get(key1).toString().replace("\"", "");
                    }
                }
                try {
                    String fileId = uploadFileToDrive(base64Data, name, type,parentFolderId);
                    LOGGER.debug("Uploaded a file with File Id {} under Parent with Parent ID {}",fileId,parentFolderId);
                    //replace base 64 data from json object replace it with uploaded file id
                    String fileIdPath = "https://drive.google.com/file/d/"+fileId+"/view";
                    jsonObject.addProperty(key, fileIdPath);
                } catch (IOException e) {
                    LOGGER.error("Error in uploading file to google drive {0}", e);
                }

            }
            //creating list of form data to store it to Spread Sheet except captcha token
            if (!Objects.equals(key, "captcha-token") && !Objects.equals(key, "resource-path")) {
                String param = jsonObject.get(key).toString().replace("\"", "");
                parameterList.add(param.isEmpty() ? "-" : param);
            }
        }
        parameterArray.add(parameterList);
        LOGGER.debug("Generated Array for of form values {}",parameterArray);
        return parameterArray;
    }

    /**
     * Method for captcha verification
     * returns boolean value if succeed
     */
    private boolean verifyCaptcha(JsonObject jsonObject) throws IOException {
        String captchaResponse = jsonObject.get("captcha-token").getAsString();
        CloseableHttpClient httpClient = HttpClientBuilder.create().build();
        HttpPost httpPost = new HttpPost(googleSheetService.getCaptchaVerifyApiUrl());
        List<NameValuePair> params = new ArrayList<>();
        //getting url and secret key from osgi config
        params.add(new BasicNameValuePair("secret", googleSheetService.getCaptchaSecretKey()));
        params.add(new BasicNameValuePair("response", captchaResponse));
        httpPost.setEntity(new UrlEncodedFormEntity(params));
        //set timeout
        RequestConfig config = RequestConfig.custom()
                .setConnectTimeout((int) TimeUnit.SECONDS.toMillis(5))
                .setConnectionRequestTimeout((int) TimeUnit.SECONDS.toMillis(5))
                .setSocketTimeout((int) TimeUnit.SECONDS.toMillis(5))
                .build();
        httpPost.setConfig(config);
        HttpResponse httpResponse = httpClient.execute(httpPost);
        // getting status of captcha verification
        if (httpResponse.getStatusLine().getStatusCode() == 200) {
            JsonElement httpJsonElement = JsonParser.parseString(EntityUtils.toString(httpResponse.getEntity()));
            JsonObject httpJsonObject = httpJsonElement.getAsJsonObject();
            return httpJsonObject.get("success").getAsBoolean();
        }
        LOGGER.debug("Captcha Verification Failed check private key or captcha token");
        return false;
    }

    /**
     * method to fetch Spread Sheet ID from dialog and store the form data in the sheet
     */
    private AppendValuesResponse fetchSheetIdAndWriteToSheet(SlingHttpServletRequest request, JsonObject jsonObject) {
        try {
            ResourceResolver resolver = request.getResourceResolver();
            // getting actual resource path which is protected
            String path = cryptoSupport.unprotect(jsonObject.get("resource-path").getAsString());
            Resource pageResource = resolver.getResource(path);
            ValueMap pageProperties = pageResource.adaptTo(ValueMap.class);
            //getting Spread Sheet ID which is configured at dialog level
            String spreadSheetId = pageProperties.get("spreadSheetId", "");
            String parentFolderId = pageProperties.get("parentFolderId","");
            LOGGER.debug("Sheet id fetched from dialog is {}",spreadSheetId);
            Sheets service = connectToGoogleSheets();
            List<List<Object>> list = createList(jsonObject,parentFolderId);
            if (service != null && !spreadSheetId.isBlank()) {
                return writeToGoogleSheet(service, spreadSheetId, list);
            } else {
                LOGGER.error("Please Configure SpreadSheet Id in Dialog");
                return new AppendValuesResponse();
            }
        } catch (CryptoException e) {
            LOGGER.error("Error in fetching spreadsheet ID from dialog {0}", e);
            return new AppendValuesResponse();
        }
    }

    /**
     * Method to upload files to Google Drive
     * returns file id of uploaded file
     */
    private String uploadFileToDrive(String jsonData, String name, String type,String parentFolderId) throws IOException {
        //getting Google Drive Service to upload a file
        Drive service = connectToDrive();
        //fetch the parent Folder ID from config
        byte[] data = java.util.Base64.getDecoder().decode(jsonData);
        //converting base 64 data to ByteArray
        ByteArrayContent mediaContent = new ByteArrayContent(type, data);
        File fileMetadata = new File();
        fileMetadata.setName(name);

        Drive.Files.Get file1 = service.files().get(parentFolderId);
        file1.setFields(parentFolderId);
        fileMetadata.setParents(Collections.singletonList(parentFolderId));
        //storing the file to drive
        File uploadedFile = service.files().create(fileMetadata, mediaContent)
                .setFields("id,webContentLink,webViewLink")
                .execute();
        LOGGER.debug("Uploaded a file with file Id {}",uploadedFile.getId());
        return uploadedFile.getId();
    }

    /**
     * method to get Google Drive service to upload files to it
     */
    private Drive connectToDrive() {
        try {
            String privateKey = googleDriveService.getPrivateKey();
            HttpTransport httpTransport = GoogleNetHttpTransport.newTrustedTransport();
            GoogleCredential credential = GoogleCredential.fromStream(convertStringToInputStream(privateKey)).createScoped(Collections.singleton(DriveScopes.DRIVE_FILE));
            LOGGER.debug("Fetching Google Drive Service For FIle Upload");
            return new Drive(httpTransport, JSON_FACTORY, credential);
        } catch (IOException | GeneralSecurityException e) {
            LOGGER.error("error connecting to google drive");
            return null;
        }
    }
}
