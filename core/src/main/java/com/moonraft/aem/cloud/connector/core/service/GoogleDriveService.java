package com.moonraft.aem.cloud.connector.core.service;

/**
 *Google Drive Service Interface
 */
public interface GoogleDriveService {

    /**
     * Gets api key.
     *
     * @return the api key
     */
    String getPrivateKey();


    /**
     * Returns the Limit per page
     *
     * @return per page limit
     */
    int getPageSize();

    /**
     * Gets folder id.
     *
     * @return the folder id
     */
    String getFolderID();


}
