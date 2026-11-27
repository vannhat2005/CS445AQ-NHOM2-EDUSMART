package com.example.back_end.dto.request;

import lombok.*;
import lombok.experimental.FieldDefaults;
import org.springframework.web.multipart.MultipartFile;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ProfileUpdateRequest {

    // Họ và tên người dùng
    String fullName;

    // Ảnh đại diện mới, không bắt buộc
    MultipartFile avatar;
}