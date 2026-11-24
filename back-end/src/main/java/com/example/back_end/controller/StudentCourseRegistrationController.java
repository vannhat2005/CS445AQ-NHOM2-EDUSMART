
package com.example.back_end.controller;

import com.example.back_end.dto.response.ApiResponse;
import com.example.back_end.dto.response.CourseRegisterResponse;

import com.example.back_end.service.CourseRegistrationService;

import lombok.RequiredArgsConstructor;

import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/student/courses")
@RequiredArgsConstructor
public class StudentCourseRegistrationController {

    private final CourseRegistrationService registrationService;

    // ==========================================
    // SINH VIÊN BẤM "ĐĂNG KÝ NGAY"
    // ==========================================

    @PostMapping("/{courseId}/register")
    public ApiResponse<CourseRegisterResponse> registerCourse(
            @PathVariable Integer courseId
    ) {

        CourseRegisterResponse result =
                registrationService.registerCourse(courseId);

        return ApiResponse.<CourseRegisterResponse>builder()
                .code(1000)
                .message(result.getMessage())
                .result(result)
                .build();
    }

    // ==========================================
    // SINH VIÊN BẤM "XÁC NHẬN THANH TOÁN"
    // ==========================================

    @PostMapping("/{registrationId}/confirm-payment")
    public ApiResponse<CourseRegisterResponse> confirmPayment(
            @PathVariable Integer registrationId
    ) {

        CourseRegisterResponse result =
                registrationService.confirmPayment(registrationId);

        return ApiResponse.<CourseRegisterResponse>builder()
                .code(1000)
                .message(result.getMessage())
                .result(result)
                .build();
    }
}
