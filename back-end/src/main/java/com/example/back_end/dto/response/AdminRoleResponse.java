package com.example.back_end.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class AdminRoleResponse {

    private Integer userId;
    private String username;
    private String fullName;
    private String email;
    private String role;
}