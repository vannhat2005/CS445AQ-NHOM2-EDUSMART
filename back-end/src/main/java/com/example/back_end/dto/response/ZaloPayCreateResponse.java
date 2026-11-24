package com.example.back_end.dto.response;

public record ZaloPayCreateResponse(
        boolean success,
        String message,
        String appTransId,
        Long amount,
        String qrCode,
        String orderUrl,
        Integer returnCode
) {}