package com.example.back_end.dto.response;

import com.example.back_end.enumType.AccountStatus;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class AccountResponse {
    private Integer userId;
    private String fullName;
    private String username;
    private String email;
    private String role;
    private AccountStatus status;
}