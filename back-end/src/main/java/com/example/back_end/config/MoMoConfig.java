
package com.example.back_end.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Getter
@Setter
@Configuration
@ConfigurationProperties(prefix = "momo")
public class MoMoConfig {

    private String partnerCode;
    private String accessKey;
    private String secretKey;

    private String createUrl;
    private String queryUrl;

    private String ipnUrl;
    private String redirectUrl;
}
