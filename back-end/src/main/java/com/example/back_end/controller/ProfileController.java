package com.example.back_end.controller;

import com.example.back_end.dto.request.ProfileUpdateRequest;
import com.example.back_end.dto.response.ApiResponse;
import com.example.back_end.dto.response.ProfileResponse;
import com.example.back_end.service.ProfileService;

import lombok.RequiredArgsConstructor;

import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class ProfileController {

    private final ProfileService profileService;

    // ========================================
    // 1. LẤY THÔNG TIN CÁ NHÂN
    // ========================================

    @GetMapping("/my-info")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<ProfileResponse> getPersonalProfile() {

        return ApiResponse.<ProfileResponse>builder()
                .result(profileService.getPersonalProfile())
                .build();
    }

    // ========================================
    // 2. CẬP NHẬT THÔNG TIN CÁ NHÂN
    // ========================================

    @PutMapping(
            value = "/my-info",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE
    )
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<ProfileResponse> updatePersonalProfile(
            @ModelAttribute ProfileUpdateRequest request) {

        return ApiResponse.<ProfileResponse>builder()
                .message("Cập nhật thông tin cá nhân thành công!")
                .result(profileService.updatePersonalProfile(request))
                .build();
    }
}