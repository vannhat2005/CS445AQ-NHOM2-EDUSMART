
package com.example.back_end.service;

import com.example.back_end.config.MoMoConfig;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.HexFormat;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class MoMoGateway {

    private final MoMoConfig config;
    private final ObjectMapper mapper;

    private final RestClient client = RestClient.create();

    public String hmac(String data) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");

            mac.init(new SecretKeySpec(
                    config.getSecretKey().getBytes(StandardCharsets.UTF_8),
                    "HmacSHA256"
            ));

            return HexFormat.of().formatHex(
                    mac.doFinal(data.getBytes(StandardCharsets.UTF_8))
            );

        } catch (Exception e) {
            throw new IllegalStateException(
                    "Không tạo được chữ ký MoMo", e
            );
        }
    }

    public boolean validSignature(
            String data,
            String signature
    ) {
        if (signature == null
                || !signature.matches("(?i)[0-9a-f]{64}")) {
            return false;
        }

        return MessageDigest.isEqual(
                hmac(data).getBytes(StandardCharsets.US_ASCII),
                signature.toLowerCase()
                        .getBytes(StandardCharsets.US_ASCII)
        );
    }

    public JsonNode createOrder(
            String orderId,
            long amount
    ) {
        try {
            String requestId = UUID.randomUUID().toString();

            String orderInfo = "Thanh toan khoa hoc EduSmart";
            String extraData = "";
            String requestType = "captureWallet";

            String raw = "accessKey=" + config.getAccessKey()
                    + "&amount=" + amount
                    + "&extraData=" + extraData
                    + "&ipnUrl=" + config.getIpnUrl()
                    + "&orderId=" + orderId
                    + "&orderInfo=" + orderInfo
                    + "&partnerCode=" + config.getPartnerCode()
                    + "&redirectUrl=" + config.getRedirectUrl()
                    + "&requestId=" + requestId
                    + "&requestType=" + requestType;

            Map<String, Object> body = new LinkedHashMap<>();

            body.put("partnerCode", config.getPartnerCode());
            body.put("requestId", requestId);
            body.put("amount", amount);
            body.put("orderId", orderId);
            body.put("orderInfo", orderInfo);
            body.put("redirectUrl", config.getRedirectUrl());
            body.put("ipnUrl", config.getIpnUrl());
            body.put("requestType", requestType);
            body.put("extraData", extraData);
            body.put("lang", "vi");
            body.put("autoCapture", true);
            body.put("signature", hmac(raw));

            String response = client.post()
                    .uri(config.getCreateUrl())
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(body)
                    .retrieve()
                    .body(String.class);

            return mapper.readTree(response);

        } catch (Exception e) {
            throw new IllegalStateException(
                    "Lỗi gọi MoMo Create API", e
            );
        }
    }

    public JsonNode queryOrder(String orderId) {
        try {
            String requestId = UUID.randomUUID().toString();

            String raw = "accessKey=" + config.getAccessKey()
                    + "&orderId=" + orderId
                    + "&partnerCode=" + config.getPartnerCode()
                    + "&requestId=" + requestId;

            Map<String, Object> body = new LinkedHashMap<>();

            body.put("partnerCode", config.getPartnerCode());
            body.put("requestId", requestId);
            body.put("orderId", orderId);
            body.put("lang", "vi");
            body.put("signature", hmac(raw));

            String response = client.post()
                    .uri(config.getQueryUrl())
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(body)
                    .retrieve()
                    .body(String.class);

            return mapper.readTree(response);

        } catch (Exception e) {
            throw new IllegalStateException(
                    "Lỗi gọi MoMo Query API", e
            );
        }
    }

    public void verifyIpn(JsonNode json) {

        String partnerCode = required(json, "partnerCode");

        if (!config.getPartnerCode().equals(partnerCode)) {
            throw new SecurityException(
                    "MoMo partnerCode không hợp lệ"
            );
        }

        String raw = "accessKey=" + config.getAccessKey()
                + "&amount=" + required(json, "amount")
                + "&extraData=" + required(json, "extraData")
                + "&message=" + required(json, "message")
                + "&orderId=" + required(json, "orderId")
                + "&orderInfo=" + required(json, "orderInfo")
                + "&orderType=" + required(json, "orderType")
                + "&partnerCode=" + partnerCode
                + "&payType=" + required(json, "payType")
                + "&requestId=" + required(json, "requestId")
                + "&responseTime=" + required(json, "responseTime")
                + "&resultCode=" + required(json, "resultCode")
                + "&transId=" + required(json, "transId");

        if (!validSignature(
                raw,
                required(json, "signature")
        )) {
            throw new SecurityException(
                    "Chữ ký IPN MoMo không hợp lệ"
            );
        }
    }

    private String required(
            JsonNode node,
            String field
    ) {
        if (!node.hasNonNull(field)) {
            throw new SecurityException(
                    "Thiếu trường IPN: " + field
            );
        }

        return node.get(field).asText();
    }
}
