
package com.example.back_end.dto.request;

import jakarta.validation.constraints.NotBlank;

public record ResetPasswordRequest(

        @NotBlank(message = "Thiếu mã xác thực")
        String resetToken,

        @NotBlank(message = "Vui lòng nhập mật khẩu mới")
        String newPassword,

        @NotBlank(message = "Vui lòng xác nhận mật khẩu")
        String confirmPassword

) {
}
