package com.example.back_end.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Data
@Component
@ConfigurationProperties(prefix = "zalopay")
public class ZaloPayConfig {

    private Integer appId;
    private String key1;
    private String key2;
    private String createUrl;
    private String queryUrl;
    private String callbackUrl;
    private String redirectUrl;
}