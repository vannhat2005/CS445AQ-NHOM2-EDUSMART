package com.example.back_end.dto.request;

import com.example.back_end.enumType.AccountStatus;
import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class AccountRequest {

    @NotBlank(message = "Họ tên không được để trống")
    private String fullName;

    @NotBlank(message = "Tên đăng nhập không được để trống")
    private String username;

    @NotBlank(message = "Email không được để trống")
    @Email(message = "Email không hợp lệ")
    private String email;

    private String password;

    private String role;

    @NotNull(message = "Trạng thái không được để trống")
    private AccountStatus status;
}