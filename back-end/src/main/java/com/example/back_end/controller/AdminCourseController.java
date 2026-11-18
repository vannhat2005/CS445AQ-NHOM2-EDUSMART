
package com.example.back_end.controller;

import com.example.back_end.dto.request.AdminCourseCreateRequest;
import com.example.back_end.dto.request.AdminCourseUpdateRequest;
import com.example.back_end.dto.response.AdminCourseResponse;
import com.example.back_end.dto.response.AdminCourseStatisticsResponse;
import com.example.back_end.dto.response.ApiResponse;
import com.example.back_end.service.AdminCourseService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/courses")
@RequiredArgsConstructor
public class AdminCourseController {

    private final AdminCourseService adminCourseService;

    // Lấy danh sách khóa học, tìm kiếm, lọc và phân trang
    @GetMapping
    public ApiResponse<Page<AdminCourseResponse>> getAll(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Integer categoryId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "5") int size) {
        return ApiResponse.<Page<AdminCourseResponse>>builder()
                .message("Lấy danh sách khóa học thành công")
                .result(adminCourseService.getAll(keyword, categoryId, page, size))
                .build();
    }

    // Lấy thống kê khóa học
    @GetMapping("/statistics")
    public ApiResponse<AdminCourseStatisticsResponse> getStatistics() {
        return ApiResponse.<AdminCourseStatisticsResponse>builder()
                .message("Lấy thống kê khóa học thành công")
                .result(adminCourseService.getStatistics())
                .build();
    }

    // Lấy danh sách giảng viên
    @GetMapping("/instructors")
    public ApiResponse<List<Map<String, Object>>> getInstructors() {
        return ApiResponse.<List<Map<String, Object>>>builder()
                .message("Lấy danh sách giảng viên thành công")
                .result(adminCourseService.getInstructors())
                .build();
    }

    // Xem chi tiết khóa học
    @GetMapping("/{id}")
    public ApiResponse<AdminCourseResponse> getById(@PathVariable Integer id) {
        return ApiResponse.<AdminCourseResponse>builder()
                .message("Lấy thông tin khóa học thành công")
                .result(adminCourseService.getById(id))
                .build();
    }

    // Thêm khóa học mới
    @PostMapping
    public ApiResponse<AdminCourseResponse> create(@Valid @RequestBody AdminCourseCreateRequest request) {
        return ApiResponse.<AdminCourseResponse>builder()
                .message("Thêm khóa học thành công")
                .result(adminCourseService.create(request))
                .build();
    }

    // Cập nhật thông tin khóa học
    @PutMapping("/{id}")
    public ApiResponse<AdminCourseResponse> update(@PathVariable Integer id, @Valid @RequestBody AdminCourseUpdateRequest request) {
        return ApiResponse.<AdminCourseResponse>builder()
                .message("Cập nhật thông tin khóa học thành công")
                .result(adminCourseService.update(id, request))
                .build();
    }
}
