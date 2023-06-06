package com.moonraft.aem.cloud.connector.core.models;

import org.apache.sling.api.resource.Resource;
import org.apache.sling.models.annotations.DefaultInjectionStrategy;
import org.apache.sling.models.annotations.Model;

import javax.inject.Inject;


@Model(adaptables = Resource.class,defaultInjectionStrategy = DefaultInjectionStrategy.OPTIONAL)
public class GoogleDriveModel {

    @Inject
    private String folderId;

    @Inject
    private int pageSize;

    public String getFolderId() {
        return folderId;
    }

    public int getPageSize() {
        return pageSize;
    }
}
