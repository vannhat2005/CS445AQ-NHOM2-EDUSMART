
package com.example.back_end.service;

import com.example.back_end.dto.request.ForgotPasswordRequest;
import com.example.back_end.dto.request.VerifyOtpRequest;
import com.example.back_end.dto.request.ResetPasswordRequest;
import com.example.back_end.dto.response.VerifyOtpResponse;

public interface ForgotPasswordService {

    // Gửi mã OTP đến Email
    void sendOtp(ForgotPasswordRequest request);

    // Kiểm tra OTP và cấp reset token
    VerifyOtpResponse verifyOtp(VerifyOtpRequest request);

    // Đặt lại mật khẩu mới
    void resetPassword(ResetPasswordRequest request);
}
