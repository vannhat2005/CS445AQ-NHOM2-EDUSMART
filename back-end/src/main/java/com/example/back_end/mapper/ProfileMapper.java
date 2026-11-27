package com.example.back_end.mapper;

import com.example.back_end.dto.response.ProfileResponse;
import com.example.back_end.entity.User;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface ProfileMapper {

    // Chuyển thông tin tài khoản sang dữ liệu trả về Frontend
    ProfileResponse toProfileResponse(User user);
}