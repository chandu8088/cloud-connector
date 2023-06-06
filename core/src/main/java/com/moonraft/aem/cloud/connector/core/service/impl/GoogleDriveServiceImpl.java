package com.moonraft.aem.cloud.connector.core.service.impl;

import com.moonraft.aem.cloud.connector.core.service.GoogleDriveService;
import org.osgi.service.component.annotations.Activate;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.metatype.annotations.AttributeDefinition;
import org.osgi.service.metatype.annotations.AttributeType;
import org.osgi.service.metatype.annotations.Designate;
import org.osgi.service.metatype.annotations.ObjectClassDefinition;

/**
 * The type Google Drive service.
 */
@Component(service = GoogleDriveService.class)
@Designate(ocd = GoogleDriveServiceImpl.GoogleDriveServiceConfig.class)
public class GoogleDriveServiceImpl implements GoogleDriveService {

    private String privateKey;

    private int pageSize;

    private String folderId;

    /**
     * The interface Google Drive service config.
     */
    @ObjectClassDefinition(name = "Cloud connector OSGi Configuration", description = "OSGi Configuration For Cloud connector Service")
    @interface GoogleDriveServiceConfig {

        /**
         * Api key string.
         *
         * @return the string
         */
        @AttributeDefinition(name = "Google Drive API Key", description = "Google Drive API Key", type = AttributeType.STRING)
        String privateKey();

        /**
         * Limit per page string.
         *
         * @return the string
         */
        @AttributeDefinition(name = "No of files in a page", description = "No of files in a page", type = AttributeType.STRING)
        int pageSize();

        /**
         * Folder id string.
         *
         * @return the string
         */
        @AttributeDefinition(name = "Folder ID", description = "Folder ID", type = AttributeType.STRING)
        String folderID();


    }

    /**
     * Activate.
     *
     * @param config the config
     */
    @Activate
    protected void activate(GoogleDriveServiceConfig config) {

        this.privateKey = config.privateKey();
        this.pageSize = config.pageSize();
        this.folderId = config.folderID();

    }

    @Override
    public String getPrivateKey() {
        return privateKey;
    }

    @Override
    public int getPageSize() {
        return pageSize;
    }

    @Override
    public String getFolderID() {
        return folderId;
    }
}
