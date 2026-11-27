package com.example.back_end.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ProfileResponse {

    // ID tài khoản
    Long userId;

    // Tên đăng nhập
    String username;

    // Họ và tên
    String fullName;

    // Địa chỉ email
    String email;

    // Đường dẫn ảnh đại diện
    String avatarUrl;
}