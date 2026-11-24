
package com.example.back_end.service;

import com.example.back_end.dto.response.ZaloPayPaymentResponse;

public interface ZaloPayService {

    // 1. Sinh viên tạo thanh toán khóa học
    ZaloPayPaymentResponse createPayment(
            Integer registrationId
    );

    // 2. Kiểm tra trạng thái thanh toán trong Database
    ZaloPayPaymentResponse getPaymentStatus(
            Integer registrationId
    );

    // 3. Truy vấn lại trạng thái từ ZaloPay
    ZaloPayPaymentResponse refreshPaymentStatus(
            Integer registrationId
    );
}
