package com.moonraft.aem.cloud.connector.core.utils;

import java.io.ByteArrayInputStream;
import java.io.InputStream;

public class CommonUtils {

    public static InputStream convertStringToInputStream(String initialString) {
        return new ByteArrayInputStream(initialString.getBytes());
    }
}
