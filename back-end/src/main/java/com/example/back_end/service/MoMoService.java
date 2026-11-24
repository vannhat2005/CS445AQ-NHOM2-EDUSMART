
package com.example.back_end.service;

import com.example.back_end.dto.response.MoMoPaymentResponse;

public interface MoMoService {

    MoMoPaymentResponse createPayment(
            Integer registrationId
    );

    MoMoPaymentResponse getPaymentStatus(
            Integer registrationId
    );

    MoMoPaymentResponse refreshPaymentStatus(
            Integer registrationId
    );
}
