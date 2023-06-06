package com.moonraft.aem.cloud.connector.core.models;

import com.adobe.granite.crypto.CryptoException;
import com.adobe.granite.crypto.CryptoSupport;
import org.apache.sling.api.resource.Resource;
import org.apache.sling.models.annotations.DefaultInjectionStrategy;
import org.apache.sling.models.annotations.Model;
import org.apache.sling.models.annotations.injectorspecific.SlingObject;

import javax.inject.Inject;

@Model(adaptables = Resource.class,defaultInjectionStrategy = DefaultInjectionStrategy.OPTIONAL)
public class SurveyFormModel {

    @Inject
    private transient CryptoSupport cryptoSupport;

    @SlingObject
    private Resource currentResource;

    @Inject
    private String spreadSheetId;

    public String getCurrentResource() {
        try {
            return cryptoSupport.protect(currentResource.getPath());
        } catch (CryptoException e) {
            throw new RuntimeException(e);
        }
    }

    public String getSpreadSheetId() {
        return spreadSheetId;
    }
}
