package com.moonraft.aem.cloud.connector.core.servlets;

import com.google.api.client.googleapis.auth.oauth2.GoogleCredential;
import com.google.api.client.googleapis.javanet.GoogleNetHttpTransport;
import com.google.api.client.http.HttpTransport;
import com.google.api.client.json.JsonFactory;
import com.google.api.client.json.jackson2.JacksonFactory;
import com.google.api.services.drive.Drive;
import com.google.api.services.drive.DriveScopes;
import com.google.api.services.drive.model.File;
import com.google.api.services.drive.model.FileList;
import com.moonraft.aem.cloud.connector.core.service.GoogleDriveService;
import org.apache.sling.api.SlingHttpServletRequest;
import org.apache.sling.api.SlingHttpServletResponse;
import org.apache.sling.api.servlets.HttpConstants;
import org.apache.sling.api.servlets.SlingSafeMethodsServlet;
import org.apache.sling.servlets.annotations.SlingServletResourceTypes;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.servlet.Servlet;
import java.io.*;
import java.security.GeneralSecurityException;
import java.util.Collections;

/**
 * The type Google Drive servlet.
 * purpose is to connect to google server and get the content from it
 */
@Component(service = {Servlet.class})
@SlingServletResourceTypes(resourceTypes = "moonraft/components/page", methods = HttpConstants.METHOD_GET, extensions = "json", selectors = "gConnect")
public class GoogleDriveServlet extends SlingSafeMethodsServlet {

    @Reference
    private transient GoogleDriveService googleDriveService;


    private static final JsonFactory JSON_FACTORY = JacksonFactory.getDefaultInstance();

    private static final Logger LOGGER = LoggerFactory.getLogger(GoogleDriveServlet.class);

    @Override
    protected void doGet(SlingHttpServletRequest request, SlingHttpServletResponse response) {
        String folderIdSuffix = request.getRequestPathInfo().getSuffix();
        if (folderIdSuffix != null || !googleDriveService.getFolderID().isEmpty()) {
            String folderId = folderIdSuffix == null || !folderIdSuffix.contains("folder") ? googleDriveService.getFolderID() : folderIdSuffix.split("/")[2];
            String folderType = folderIdSuffix == null || folderIdSuffix.contains("orderBy") ? "folder" : folderIdSuffix.split("/")[1];
            String nextPageToken = folderIdSuffix != null && folderIdSuffix.contains("npToken") ? folderIdSuffix.split("/")[4] : null;
            String searchText = folderIdSuffix != null && folderIdSuffix.split("/")[1].equals("q") ? folderIdSuffix.split("/")[2] : null;
            String sortString = folderIdSuffix != null && folderIdSuffix.contains("orderBy") ? folderIdSuffix.split("/orderBy/")[1] : "";
            String modSortString = sortString.contains("/") ? sortString.split("/")[0]+" "+sortString.split("/")[1]:sortString;
            if (searchText != null) {
                getSearchResult(searchText, response, nextPageToken, modSortString);
            } else {
                getFolderDetailedContent(folderId, folderType, response, nextPageToken, modSortString);
            }
        } else {
            try {
                response.getWriter().write("{'error':'Value_error'}");
            } catch (IOException e) {
                LOGGER.error("error in printing the value %s", e);
            }
        }
    }

    /**
     * Convert string to input stream.
     *
     * @param initialString the initial string
     * @return the input stream
     */
    private InputStream convertStringToInputStream(String initialString) {
        return new ByteArrayInputStream(initialString.getBytes());
    }

    /**
     * Connect to google drive.
     * method to connect to google drive server
     *
     * @return the drive object
     */
    private Drive connectToGoogleDrive() {
        try {
            String privateKey = googleDriveService.getPrivateKey();
            HttpTransport httpTransport = GoogleNetHttpTransport.newTrustedTransport();
            GoogleCredential credential = GoogleCredential.fromStream(convertStringToInputStream(privateKey)).createScoped(Collections.singleton(DriveScopes.DRIVE_READONLY));
            return new Drive(httpTransport, JSON_FACTORY, credential);
        } catch (IOException | GeneralSecurityException e) {
            LOGGER.error("error connecting to google drive");
            return null;
        }
    }

    /**
     * Gets folder content of a selected folder id using google Drive service
     *
     * @param service  the service
     * @param response the response
     * @param folderId the folder id
     */
    private void getChildFiles(Drive service, SlingHttpServletResponse response, String folderId, String nextPageToken, String sortString) throws IOException {
        response.setContentType("application/json");
        try {
            FileList result = service.files().list().setOrderBy(sortString).setPageSize(googleDriveService.getPageSize()).setPageToken(nextPageToken).setFields("nextPageToken, files(createdTime, description,fileExtension,fullFileExtension,hasThumbnail,iconLink,id,kind,mimeType,name,parents,size)").set("q", String.format("'%s' in parents", folderId)).execute();
            response.getWriter().write(result.toPrettyString());
        } catch (IOException e) {
            LOGGER.error("error in fetching folder content %s", e);
            response.getWriter().write("{'error':'internal_error'}");
        }
    }

    /**
     * Download file based on the provided folderId
     *
     * @param service  the service
     * @param folderId the folder id
     * @param response the response
     */
    private void downloadFile(Drive service, String folderId, SlingHttpServletResponse response) {
        try {
            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
            service.files().get(folderId).executeMediaAndDownloadTo(outputStream);
            File fileToDownload = service.files().get(folderId).execute();
            String mimeType = fileToDownload.getMimeType();
            String fileName = fileToDownload.getName();
            byte[] byteArray = outputStream.toByteArray();
            response.setContentType(mimeType);
            response.setHeader("Content-Disposition", "attachment;filename=\"" + fileName + "\"");
            response.setContentLength(byteArray.length);
            OutputStream os = response.getOutputStream();
            os.write(byteArray, 0, byteArray.length);
            os.close();
        } catch (IOException e) {
            LOGGER.error("error while fetching the file");
        }
    }

    private void getFolderDetailedContent(String folderId, String folderType, SlingHttpServletResponse response, String nextPageToken, String sortString) {
        Drive service = connectToGoogleDrive();
        if (service != null) {
            if (folderType != null && folderType.equals("folder")) {
                try {
                    getChildFiles(service, response, folderId, nextPageToken, sortString);
                } catch (IOException e) {
                    LOGGER.error("error in fetching folders %s", e);
                }
            } else {
                downloadFile(service, folderId, response);
            }
        } else {
            try {
                response.getWriter().write("{'error':'internal_error'}");
            } catch (IOException e) {
                LOGGER.error("error in sending the response %s", e);
            }
            LOGGER.error("Failed to connect to a google drive server");
        }
    }

    private void getSearchResult(String searchString, SlingHttpServletResponse response, String nextPageToken, String sortString) {
        Drive service = connectToGoogleDrive();
        try {
            if (service != null) {
                response.setContentType("application/json");
                FileList result = service.files().list().setOrderBy(sortString).setPageToken(nextPageToken).setFields("nextPageToken, files(createdTime, description,fileExtension,fullFileExtension,hasThumbnail,iconLink,id,kind,mimeType,name,parents,size)").setQ(String.format("fullText contains '%s'", searchString)).execute();
                response.getWriter().write(result.toPrettyString());
            } else {
                response.getWriter().write("{'error':'internal_error'}");
            }
        } catch (IOException e) {
            LOGGER.error("Error in connecting to google server %s", e);
        }

    }
}
