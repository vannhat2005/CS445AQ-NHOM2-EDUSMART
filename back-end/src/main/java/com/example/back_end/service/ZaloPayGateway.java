
package com.example.back_end.service;

import com.example.back_end.config.ZaloPayConfig;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.HexFormat;
import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class ZaloPayGateway {

    private final ZaloPayConfig config;
    private final ObjectMapper mapper;

    private final RestClient client = RestClient.create();

    private static final ZoneId VIETNAM_ZONE =
            ZoneId.of("Asia/Ho_Chi_Minh");

    // ==========================================
    // 1. HMAC SHA256
    // ==========================================

    public String hmac(String data, String key) {

        if (data == null) {
            throw new IllegalArgumentException(
                    "Dữ liệu tạo HMAC không được null"
            );
        }

        if (key == null || key.isBlank()) {
            throw new IllegalStateException(
                    "ZaloPay key chưa được cấu hình"
            );
        }

        try {
            Mac mac = Mac.getInstance("HmacSHA256");

            SecretKeySpec secretKey = new SecretKeySpec(
                    key.getBytes(StandardCharsets.UTF_8),
                    "HmacSHA256"
            );

            mac.init(secretKey);

            byte[] hash = mac.doFinal(
                    data.getBytes(StandardCharsets.UTF_8)
            );

            return HexFormat.of().formatHex(hash);

        } catch (Exception e) {
            throw new IllegalStateException(
                    "Không thể tạo HMAC SHA256",
                    e
            );
        }
    }

    // ==========================================
    // 2. VERIFY CALLBACK
    // ==========================================

    public boolean verifyCallback(
            String data,
            String mac
    ) {

        if (data == null
                || mac == null
                || mac.isBlank()) {
            return false;
        }

        String expected = hmac(
                data,
                config.getKey2()
        );

        byte[] expectedBytes = expected.getBytes(
                StandardCharsets.US_ASCII
        );

        byte[] actualBytes = mac
                .trim()
                .toLowerCase(Locale.ROOT)
                .getBytes(StandardCharsets.US_ASCII);

        return MessageDigest.isEqual(
                expectedBytes,
                actualBytes
        );
    }

    // ==========================================
    // 3. VALIDATE CONFIG
    // ==========================================

    private void validateConfig(String url) {

        if (config.getAppId() <= 0) {
            throw new IllegalStateException(
                    "ZaloPay app-id không hợp lệ"
            );
        }

        if (config.getKey1() == null
                || config.getKey1().isBlank()) {
            throw new IllegalStateException(
                    "Thiếu ZaloPay key1"
            );
        }

        if (url == null || url.isBlank()) {
            throw new IllegalStateException(
                    "Thiếu URL ZaloPay API"
            );
        }

        if (!url.startsWith("https://")) {
            throw new IllegalStateException(
                    "ZaloPay API URL phải sử dụng HTTPS"
            );
        }
    }

    // ==========================================
    // 4. VALIDATE APP TRANS ID
    // ==========================================

    private void validateAppTransId(
            String appTransId
    ) {

        if (appTransId == null
                || appTransId.isBlank()) {
            throw new IllegalArgumentException(
                    "appTransId không được để trống"
            );
        }

        String today = LocalDate.now(
                VIETNAM_ZONE
        ).format(
                DateTimeFormatter.ofPattern("yyMMdd")
        );

        if (!appTransId.startsWith(today + "_")) {
            throw new IllegalArgumentException(
                    "appTransId phải bắt đầu bằng "
                            + today + "_"
            );
        }

        if (appTransId.length() > 40) {
            throw new IllegalArgumentException(
                    "appTransId vượt quá 40 ký tự"
            );
        }
    }

    // ==========================================
    // 5. POST FORM TO ZALOPAY
    // ==========================================

    private JsonNode postForm(
            String url,
            MultiValueMap<String, String> form,
            String apiName
    ) {

        try {

            String response = client.post()
                    .uri(url)
                    .contentType(
                            MediaType.APPLICATION_FORM_URLENCODED
                    )
                    .body(form)
                    .retrieve()
                    .body(String.class);

            if (response == null
                    || response.isBlank()) {
                throw new IllegalStateException(
                        apiName + " trả về dữ liệu rỗng"
                );
            }

            JsonNode result = mapper.readTree(response);

            if (result == null || !result.isObject()) {
                throw new IllegalStateException(
                        apiName + " trả về JSON không hợp lệ"
                );
            }

            return result;

        } catch (RestClientResponseException e) {

            String responseBody =
                    e.getResponseBodyAsString(
                            StandardCharsets.UTF_8
                    );

            throw new IllegalStateException(
                    apiName
                            + " lỗi HTTP "
                            + e.getStatusCode().value()
                            + " | response="
                            + responseBody,
                    e
            );

        } catch (IllegalStateException e) {
            throw e;

        } catch (Exception e) {

            throw new IllegalStateException(
                    "Lỗi gọi " + apiName
                            + ": " + e.getMessage(),
                    e
            );
        }
    }

    // ==========================================
    // 6. CREATE ORDER
    // ==========================================

    public JsonNode createOrder(
            String appTransId,
            Integer userId,
            long amount
    ) {

        validateConfig(config.getCreateUrl());
        validateAppTransId(appTransId);

        if (userId == null || userId <= 0) {
            throw new IllegalArgumentException(
                    "userId không hợp lệ"
            );
        }

        if (amount <= 0) {
            throw new IllegalArgumentException(
                    "Số tiền thanh toán phải lớn hơn 0"
            );
        }

        try {

            long appTime = System.currentTimeMillis();

            String appUser = String.valueOf(userId);

            // EMBED DATA
            Map<String, Object> embed =
                    new LinkedHashMap<>();

            String redirectUrl =
                    config.getRedirectUrl();

            if (redirectUrl != null
                    && !redirectUrl.isBlank()) {

                embed.put(
                        "redirecturl",
                        redirectUrl.trim()
                );
            }

            String embedData =
                    mapper.writeValueAsString(embed);

            String item = "[]";

            // HMAC CREATE ORDER
            // app_id|app_trans_id|app_user|amount|
            // app_time|embed_data|item

            String data = String.join(
                    "|",
                    String.valueOf(config.getAppId()),
                    appTransId,
                    appUser,
                    String.valueOf(amount),
                    String.valueOf(appTime),
                    embedData,
                    item
            );

            String mac = hmac(
                    data,
                    config.getKey1()
            );

            // FORM REQUEST
            MultiValueMap<String, String> form =
                    new LinkedMultiValueMap<>();

            form.add(
                    "app_id",
                    String.valueOf(config.getAppId())
            );

            form.add(
                    "app_user",
                    appUser
            );

            form.add(
                    "app_trans_id",
                    appTransId
            );

            form.add(
                    "app_time",
                    String.valueOf(appTime)
            );

            form.add(
                    "amount",
                    String.valueOf(amount)
            );

            form.add(
                    "description",
                    "Thanh toan khoa hoc EduSmart"
            );

            form.add(
                    "bank_code",
                    ""
            );

            form.add(
                    "embed_data",
                    embedData
            );

            form.add(
                    "item",
                    item
            );

            form.add(
                    "expire_duration_seconds",
                    "900"
            );

            String callbackUrl =
                    config.getCallbackUrl();

            if (callbackUrl != null
                    && !callbackUrl.isBlank()) {

                form.add(
                        "callback_url",
                        callbackUrl.trim()
                );
            }

            form.add(
                    "mac",
                    mac
            );

            return postForm(
                    config.getCreateUrl(),
                    form,
                    "ZaloPay Create API"
            );

        } catch (IllegalStateException e) {
            throw e;

        } catch (Exception e) {
            throw new IllegalStateException(
                    "Không thể tạo đơn ZaloPay: "
                            + e.getMessage(),
                    e
            );
        }
    }

    // ==========================================
    // 7. QUERY ORDER
    // ==========================================

    public JsonNode queryOrder(
            String appTransId
    ) {

        validateConfig(config.getQueryUrl());

        if (appTransId == null
                || appTransId.isBlank()) {
            throw new IllegalArgumentException(
                    "appTransId không được để trống"
            );
        }

        // HMAC QUERY ORDER
        // app_id|app_trans_id|key1

        String data = String.join(
                "|",
                String.valueOf(config.getAppId()),
                appTransId,
                config.getKey1()
        );

        String mac = hmac(
                data,
                config.getKey1()
        );

        MultiValueMap<String, String> form =
                new LinkedMultiValueMap<>();

        form.add(
                "app_id",
                String.valueOf(config.getAppId())
        );

        form.add(
                "app_trans_id",
                appTransId
        );

        form.add(
                "mac",
                mac
        );

        return postForm(
                config.getQueryUrl(),
                form,
                "ZaloPay Query API"
        );
    }
}
