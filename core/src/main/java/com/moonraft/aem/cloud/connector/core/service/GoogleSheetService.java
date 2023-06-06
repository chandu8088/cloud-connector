package com.moonraft.aem.cloud.connector.core.service;

/**
 * The interface Google sheet service.
 */
public interface GoogleSheetService {
    /**
     * Gets captcha secret key.
     *
     * @return the captcha secret key
     */
    String getCaptchaSecretKey();

    /**
     * Gets captcha verify api url.
     *
     * @return the captcha verify api url
     */
    String getCaptchaVerifyApiUrl();
}
