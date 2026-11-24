
package com.example.back_end.controller;

import com.example.back_end.dto.request.ForgotPasswordRequest;
import com.example.back_end.dto.request.VerifyOtpRequest;
import com.example.back_end.dto.request.ResetPasswordRequest;
import com.example.back_end.dto.response.ApiResponse;
import com.example.back_end.dto.response.VerifyOtpResponse;
import com.example.back_end.service.ForgotPasswordService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class ForgotPasswordController {

    private final ForgotPasswordService forgotPasswordService;

    // API 1: Gửi mã OTP đến Email
    @PostMapping("/forgot-password")
    public ApiResponse<Void> forgotPassword(
            @Valid @RequestBody ForgotPasswordRequest request
    ) {

        forgotPasswordService.sendOtp(request);

        return ApiResponse.<Void>builder()
                .message(
                        "Nếu Email đã đăng ký, mã OTP sẽ được gửi đến hộp thư"
                )
                .build();
    }

    // API 2: Gửi lại mã OTP
    @PostMapping("/resend-otp")
    public ApiResponse<Void> resendOtp(
            @Valid @RequestBody ForgotPasswordRequest request
    ) {

        forgotPasswordService.sendOtp(request);

        return ApiResponse.<Void>builder()
                .message(
                        "Nếu đủ điều kiện, mã OTP mới sẽ được gửi đến Email"
                )
                .build();
    }

    // API 3: Xác thực mã OTP
    @PostMapping("/verify-otp")
    public ApiResponse<VerifyOtpResponse> verifyOtp(
            @Valid @RequestBody VerifyOtpRequest request
    ) {

        VerifyOtpResponse result =
                forgotPasswordService.verifyOtp(request);

        return ApiResponse.<VerifyOtpResponse>builder()
                .message("Xác thực OTP thành công")
                .result(result)
                .build();
    }

    // API 4: Đặt lại mật khẩu mới
    @PostMapping("/reset-password")
    public ApiResponse<Void> resetPassword(
            @Valid @RequestBody ResetPasswordRequest request
    ) {

        forgotPasswordService.resetPassword(request);

        return ApiResponse.<Void>builder()
                .message("Đặt lại mật khẩu thành công")
                .build();
    }
}
