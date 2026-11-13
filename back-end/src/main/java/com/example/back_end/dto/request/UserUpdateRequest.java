package com.example.back_end.dto.request;

import com.example.back_end.enumType.AccountStatus;
import jakarta.validation.constraints.Email;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserUpdateRequest {

    private String fullName;

    @Email(message = "Invalid email format")
    private String email;

    private String avatarUrl;

    private Integer roleId;

    private AccountStatus status;
}