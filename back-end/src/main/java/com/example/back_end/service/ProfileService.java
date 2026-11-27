package com.example.back_end.service;

import com.example.back_end.dto.request.ProfileUpdateRequest;
import com.example.back_end.dto.response.ProfileResponse;

public interface ProfileService {

    // Lấy thông tin cá nhân của tài khoản đang đăng nhập
    ProfileResponse getPersonalProfile();

    // Cập nhật thông tin cá nhân và ảnh đại diện
    ProfileResponse updatePersonalProfile(ProfileUpdateRequest request);
}