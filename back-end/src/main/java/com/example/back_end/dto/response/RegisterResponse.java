package com.example.back_end.dto.response;


import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RegisterResponse {

    private Integer userId;

    private String username;

    private String fullName;

    private String email;

    private String role;

    private String status;
}
