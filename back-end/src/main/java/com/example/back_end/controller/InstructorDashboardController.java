package com.example.back_end.controller;

import com.example.back_end.dto.response.ApiResponse;
import com.example.back_end.dto.response.InstructorDashboardResponse;
import com.example.back_end.service.InstructorDashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/instructors/dashboard")
@RequiredArgsConstructor
public class InstructorDashboardController {

    private final InstructorDashboardService dashboardService;

    // ==========================================
    // LẤY THÔNG TIN TRANG CHỦ GIẢNG VIÊN
    // ==========================================

    @GetMapping
    @PreAuthorize("hasRole('INSTRUCTOR')")
    public ApiResponse<InstructorDashboardResponse> getDashboard() {

        return ApiResponse.<InstructorDashboardResponse>builder()
                .result(dashboardService.getDashboard())
                .build();
    }
}