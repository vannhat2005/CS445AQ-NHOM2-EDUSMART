
package com.example.back_end.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class MoMoPaymentResponse {

    private Integer registrationId;
    private Integer courseId;
    private Integer paymentId;

    private String enrollmentCode;
    private String orderId;

    private long amount;

    private String payUrl;
    private String qrCode;
    private String deeplink;

    private String paymentStatus;
    private String registrationStatus;

    private String message;
}
