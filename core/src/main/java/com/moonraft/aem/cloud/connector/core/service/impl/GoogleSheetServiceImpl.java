package com.moonraft.aem.cloud.connector.core.service.impl;

import com.moonraft.aem.cloud.connector.core.service.GoogleSheetService;
import org.osgi.service.component.annotations.Activate;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.metatype.annotations.AttributeDefinition;
import org.osgi.service.metatype.annotations.AttributeType;
import org.osgi.service.metatype.annotations.Designate;
import org.osgi.service.metatype.annotations.ObjectClassDefinition;

/**
 * The type Google sheet service.
 */
@Component(service = GoogleSheetService.class)
@Designate(ocd = GoogleSheetServiceImpl.GoogleSheetsServiceConfig.class)
public class GoogleSheetServiceImpl implements GoogleSheetService {

    private String captchaSecretKey;

    private String getCaptchaVerifyApiUrl;

    /**
     * The interface Google sheets service config.
     */
    @ObjectClassDefinition(name = "Google Sheets Connector OSGI Configuration", description = "OSGi Configuration For Google Sheets Service")
    @interface GoogleSheetsServiceConfig {

        /**
         * Captcha secret key string.
         *
         * @return the string
         */
        @AttributeDefinition(name = "Captcha Secret Key", description = "secret key for captcha verification", type = AttributeType.STRING)
        String captchaSecretKey();

        /**
         * Folder id string.
         *
         * @return the string
         */
        @AttributeDefinition(name = "Captcha verification Api URL", description = "API url for captcha verification", type = AttributeType.STRING)
        String captchaVerifyApiUrl();


    }

    /**
     * Activate.
     *
     * @param config the config
     */
    @Activate
    protected void activate(GoogleSheetsServiceConfig config) {

        this.captchaSecretKey = config.captchaSecretKey();
        this.getCaptchaVerifyApiUrl = config.captchaVerifyApiUrl();

    }

    @Override
    public String getCaptchaSecretKey() {
        return captchaSecretKey;
    }

    @Override
    public String getCaptchaVerifyApiUrl() {
        return getCaptchaVerifyApiUrl;
    }
}
