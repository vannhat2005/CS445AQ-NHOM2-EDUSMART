package com.example.back_end.dto.response;

import com.example.back_end.enumType.AccountStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserResponse {

    private Integer userId;

    private String username;

    private String fullName;

    private String email;

    private String avatarUrl;

    private Integer roleId;      // Chỉ lấy ID của role

    private String roleName;     // Trả thêm tên Role để Front-end dễ hiển thị

    private AccountStatus status;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
}