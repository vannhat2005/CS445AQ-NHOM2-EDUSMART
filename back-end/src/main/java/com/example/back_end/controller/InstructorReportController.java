package com.example.back_end.controller;

import com.example.back_end.dto.response.ApiResponse;
import com.example.back_end.dto.response.InstructorReportResponse;
import com.example.back_end.dto.response.InstructorReportFilterResponse;
import com.example.back_end.entity.User;
import com.example.back_end.exception.AppException;
import com.example.back_end.exception.ErrorCode;
import com.example.back_end.repository.UserRepository;
import com.example.back_end.service.InstructorReportService;

import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Objects;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/instructors/{instructorId}/reports")
public class InstructorReportController {

    private final InstructorReportService instructorReportService;
    private final UserRepository userRepository;

    // ==================== 1. LẤY DANH SÁCH KHÓA HỌC ====================

    @GetMapping("/courses")
    public ApiResponse<List<InstructorReportFilterResponse>> getCourses(
            @PathVariable Integer instructorId) {

        // Kiểm tra quyền truy cập báo cáo
        validateCurrentInstructor(instructorId);

        return ApiResponse.<List<InstructorReportFilterResponse>>builder()
                .message("Lấy danh sách khóa học thành công")
                .result(instructorReportService.getCourses(instructorId))
                .build();
    }

    // ==================== 2. LẤY DANH SÁCH CHƯƠNG HỌC ====================

    @GetMapping("/courses/{courseId}/chapters")
    public ApiResponse<List<InstructorReportFilterResponse>> getChapters(
            @PathVariable Integer instructorId,
            @PathVariable Integer courseId) {

        // Kiểm tra quyền truy cập báo cáo
        validateCurrentInstructor(instructorId);

        return ApiResponse.<List<InstructorReportFilterResponse>>builder()
                .message("Lấy danh sách chương học thành công")
                .result(instructorReportService.getChapters(instructorId, courseId))
                .build();
    }

    // ==================== 3. LẤY BÁO CÁO THỐNG KÊ ====================

    @GetMapping
    public ApiResponse<InstructorReportResponse> getReport(
            @PathVariable Integer instructorId,
            @RequestParam(required = false) Integer courseId,
            @RequestParam(required = false) Integer chapterId,
            @RequestParam(defaultValue = "all") String assessmentType,
            @RequestParam(defaultValue = "all") String timeRange,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate) {

        // Kiểm tra quyền truy cập báo cáo
        validateCurrentInstructor(instructorId);

        return ApiResponse.<InstructorReportResponse>builder()
                .message("Lấy báo cáo thống kê thành công")
                .result(instructorReportService.getReport(
                        instructorId, courseId, chapterId,
                        assessmentType, timeRange, fromDate, toDate))
                .build();
    }

    // ==================== 4. KIỂM TRA QUYỀN TRUY CẬP ====================

    private void validateCurrentInstructor(Integer instructorId) {

        // Lấy thông tin xác thực của tài khoản đang đăng nhập
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        // Kiểm tra tài khoản đã được xác thực hay chưa
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new AppException(ErrorCode.REPORT_ACCESS_DENIED);
        }

        // Lấy thông tin tài khoản hiện tại
        User currentUser = userRepository.findByUsername(authentication.getName())
                .orElseThrow(() -> new AppException(ErrorCode.REPORT_ACCESS_DENIED));

        // Không cho phép truy cập báo cáo của giảng viên khác
        if (!Objects.equals(currentUser.getUserId(), instructorId)) {
            throw new AppException(ErrorCode.REPORT_ACCESS_DENIED);
        }
    }
}