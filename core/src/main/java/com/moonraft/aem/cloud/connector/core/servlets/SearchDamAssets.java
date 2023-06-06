package com.moonraft.aem.cloud.connector.core.servlets;

import com.day.cq.dam.api.Asset;
import com.day.cq.dam.api.AssetManager;
import com.day.cq.search.QueryBuilder;
import com.google.gson.*;
import org.apache.commons.lang3.StringUtils;
import org.apache.sling.api.SlingHttpServletRequest;
import org.apache.sling.api.SlingHttpServletResponse;
import org.apache.sling.api.resource.Resource;
import org.apache.sling.api.resource.ResourceResolver;
import org.apache.sling.api.resource.ValueMap;
import org.apache.sling.api.servlets.HttpConstants;
import org.apache.sling.api.servlets.SlingSafeMethodsServlet;
import org.apache.sling.servlets.annotations.SlingServletResourceTypes;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;

import javax.jcr.*;
import javax.jcr.query.Query;
import javax.jcr.query.QueryManager;
import javax.jcr.query.QueryResult;
import javax.servlet.Servlet;
import javax.servlet.ServletException;
import java.io.IOException;
import java.util.*;

@Component(service = {Servlet.class})
@SlingServletResourceTypes(resourceTypes = "moonraft/components/page", methods = HttpConstants.METHOD_GET, extensions = "json", selectors = "search")
public class SearchDamAssets extends SlingSafeMethodsServlet {

    @Reference
    private QueryBuilder queryBuilder;


    @Override
    protected void doGet(SlingHttpServletRequest request, SlingHttpServletResponse response) throws ServletException, IOException {
        try {
            Session session = request.getResourceResolver().adaptTo(Session.class);
            String resourcePath = request.getRequestPathInfo().getSuffix();
            String domain = request.getScheme() + "://" + request.getServerName() + ":" + request.getServerPort();
            String searchText = request.getParameter("q");
            ResourceResolver resolver = request.getResourceResolver();
            Resource pageResource = resolver.getResource(Objects.requireNonNull(resourcePath));
            ValueMap pageProperties = Objects.requireNonNull(pageResource).adaptTo(ValueMap.class);
            String rootPath = pageProperties.get("rootPath", StringUtils.EMPTY);
            QueryManager queryManager = session.getWorkspace().getQueryManager();
            String queryString = "SELECT * FROM [nt:base] WHERE ISDESCENDANTNODE('" + rootPath + "') AND LOWER(NAME()) LIKE '%" + searchText.toLowerCase() + "%'";
            Query query = queryManager.createQuery(queryString, Query.JCR_SQL2);
            QueryResult result = query.execute();
            NodeIterator nodeIterator = result.getNodes();
            List<Map<String, Object>> entities = new ArrayList<>();
            while (nodeIterator.hasNext()) {
                Node node = nodeIterator.nextNode();
                Map<String, Object> entity = createEntity(node, domain);
                entities.add(entity);
            }
            // Create JSON structure for "properties"
            Map<String, Object> properties = new HashMap<>();
            int index = rootPath.lastIndexOf("/");
            String propertyName = rootPath.substring(index + 1);
            properties.put("name", propertyName);
            // Create the final JSON structure
            Map<String, Object> json = new HashMap<>();
            json.put("entities", entities);
            json.put("properties", properties);
            //jsonObject.add("properties",jsonArray);
            Gson gson = new GsonBuilder().setPrettyPrinting().create();
            String jsonString = gson.toJson(json);
            response.getWriter().write(jsonString);
        } catch (Exception e) {
            response.sendError(404, "Not Found");
        }
    }

    private static Map<String, Object> createEntity(Node node, String domain) throws Exception {
        Map<String, Object> entity = new HashMap<>();
        List<Map<String, Object>> links = new ArrayList<>();
        String href = domain.concat(node.getPath()).concat(".json").replace("/content/dam", "/api/assets");
        Map<String, Object> selfLink = createLink("self", href);
        links.add(selfLink);
        Map<String, Object> meteData = new HashMap<>();
        if (node.getPrimaryNodeType().getName().equals("nt:folder")) {
            entity.put("rel", new String[]{"child"});
            entity.put("class", new String[]{"assets/folder"});
        } else {
            String assetType = getPropertyValue(node, "dc:format");
            meteData.put("dc:format", assetType == null ? node.getPrimaryNodeType().getName() : assetType);
            entity.put("class", new String[]{"assets/asset"});
        }
        Map<String, Object> properties = new HashMap<>();
        if (meteData.size() > 0) {
            properties.put("metadata", meteData);
        }
        properties.put("name", node.getName());
        entity.put("properties", properties);
        entity.put("links", links);
        return entity;
    }

    private static Map<String, Object> createLink(String rel, String href) {
        Map<String, Object> link = new HashMap<>();
        link.put("rel", new String[]{rel});
        link.put("href", href);
        return link;
    }

    private static String getPropertyValue(Node node, String propertyName) throws Exception {
        if (node.hasProperty(propertyName)) {
            Property property = node.getProperty(propertyName);
            return property.getString();
        }

        NodeIterator nodeIterator = node.getNodes();
        while (nodeIterator.hasNext()) {
            Node childNode = nodeIterator.nextNode();
            String propertyValue = getPropertyValue(childNode, propertyName);
            if (propertyValue != null) {
                return propertyValue;
            }
        }

        return null;
    }
}
