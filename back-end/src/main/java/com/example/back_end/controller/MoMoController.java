
package com.example.back_end.controller;

import com.example.back_end.dto.response.ApiResponse;
import com.example.back_end.dto.response.MoMoPaymentResponse;

import com.example.back_end.service.MoMoService;

import lombok.RequiredArgsConstructor;

import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/student/checkout")
@RequiredArgsConstructor
public class MoMoController {

    private final MoMoService momoService;

    // ==========================================
    // 1. TẠO THANH TOÁN MOMO
    // ==========================================

    @PostMapping("/{registrationId}/pay/momo")
    public ApiResponse<MoMoPaymentResponse> createPayment(
            @PathVariable Integer registrationId
    ) {

        MoMoPaymentResponse result =
                momoService.createPayment(registrationId);

        return ApiResponse.<MoMoPaymentResponse>builder()
                .code(1000)
                .message("Tạo thanh toán MoMo thành công")
                .result(result)
                .build();
    }

    // ==========================================
    // 2. LẤY TRẠNG THÁI THANH TOÁN
    // ==========================================

    @GetMapping("/{registrationId}/momo/status")
    public ApiResponse<MoMoPaymentResponse> getPaymentStatus(
            @PathVariable Integer registrationId
    ) {

        MoMoPaymentResponse result =
                momoService.getPaymentStatus(registrationId);

        return ApiResponse.<MoMoPaymentResponse>builder()
                .code(1000)
                .message("Lấy trạng thái MoMo thành công")
                .result(result)
                .build();
    }

    // ==========================================
    // 3. ĐỐI SOÁT THANH TOÁN MOMO
    // ==========================================

    @PostMapping("/{registrationId}/momo/refresh")
    public ApiResponse<MoMoPaymentResponse> refreshPaymentStatus(
            @PathVariable Integer registrationId
    ) {

        MoMoPaymentResponse result =
                momoService.refreshPaymentStatus(registrationId);

        return ApiResponse.<MoMoPaymentResponse>builder()
                .code(1000)
                .message("Đối soát MoMo thành công")
                .result(result)
                .build();
    }
}
