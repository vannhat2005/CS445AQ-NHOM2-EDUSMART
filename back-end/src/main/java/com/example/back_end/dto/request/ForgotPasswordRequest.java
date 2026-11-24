
package com.example.back_end.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record ForgotPasswordRequest(

        @NotBlank(message = "Vui lòng nhập Email")
        @Email(message = "Email không hợp lệ")
        String email

) {
}
