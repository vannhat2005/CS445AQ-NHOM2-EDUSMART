package com.example.back_end.controller;

import com.example.back_end.dto.response.ApiResponse;
import com.example.back_end.dto.response.ZaloPayPaymentResponse;
import com.example.back_end.service.ZaloPayService;

import lombok.RequiredArgsConstructor;

import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/student/checkout")
@RequiredArgsConstructor
public class StudentZaloPayController {

    private final ZaloPayService zaloPayService;

    // ==========================================Ê
    // 1. TẠO QR THANH TOÁN
    // ==========================================
    @PostMapping("/{registrationId}/pay/zalopay")
    public ApiResponse<ZaloPayPaymentResponse> createPayment(
            @PathVariable Integer registrationId
    ) {

        ZaloPayPaymentResponse result =
                zaloPayService.createPayment(registrationId);

        return ApiResponse.<ZaloPayPaymentResponse>builder()
                .code(1000)
                .message("Tạo thanh toán ZaloPay thành công")
                .result(result)
                .build();
    }

    // ==========================================
    // 2. KIỂM TRA TRẠNG THÁI TRONG DATABASE
    // ==========================================
    @GetMapping("/{registrationId}/payment-status")
    public ApiResponse<ZaloPayPaymentResponse> getPaymentStatus(
            @PathVariable Integer registrationId
    ) {

        ZaloPayPaymentResponse result =
                zaloPayService.getPaymentStatus(registrationId);

        return ApiResponse.<ZaloPayPaymentResponse>builder()
                .code(1000)
                .message("Lấy trạng thái thanh toán thành công")
                .result(result)
                .build();
    }

    // ==========================================
    // 3. ĐỐI SOÁT TRẠNG THÁI VỚI ZALOPAY
    // ==========================================
    @PostMapping("/{registrationId}/refresh-payment")
    public ApiResponse<ZaloPayPaymentResponse> refreshPayment(
            @PathVariable Integer registrationId
    ) {

        ZaloPayPaymentResponse result =
                zaloPayService.refreshPaymentStatus(registrationId);

        return ApiResponse.<ZaloPayPaymentResponse>builder()
                .code(1000)
                .message("Đã kiểm tra trạng thái thanh toán")
                .result(result)
                .build();
    }
}