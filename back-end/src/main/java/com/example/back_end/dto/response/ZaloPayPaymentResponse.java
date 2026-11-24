package com.example.back_end.dto.response;

import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ZaloPayPaymentResponse {

    private Integer registrationId;
    private Integer courseId;
    private Integer paymentId;

    private String enrollmentCode;
    private String appTransId;

    private Long amount;

    private String qrCode;

    private String paymentStatus;
    private String registrationStatus;

    private String message;
}