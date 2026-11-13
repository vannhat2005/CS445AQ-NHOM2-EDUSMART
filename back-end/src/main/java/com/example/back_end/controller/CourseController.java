package com.example.back_end.controller;

import com.example.back_end.dto.request.CourseRequest;
import com.example.back_end.dto.response.ApiResponse;
import com.example.back_end.dto.response.CourseResponse;
import com.example.back_end.dto.response.PageResponse;
import com.example.back_end.service.CourseService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/courses")
@RequiredArgsConstructor
public class CourseController {

    private final CourseService courseService;

    /**
     * API: Lấy danh sách khóa học được phân công (Dành cho Giảng viên)
     * Method: GET
     * URL: /api/courses/assigned/{instructorId}?pageNo=1&pageSize=10
     */
    @GetMapping("/assigned/{instructorId}")
    public ApiResponse<PageResponse<CourseResponse>> getAssignedCourses(
            @PathVariable Integer instructorId,
            @RequestParam(defaultValue = "1") int pageNo,
            @RequestParam(defaultValue = "10") int pageSize) {
        System.out.println(">>> ID GIẢNG VIÊN ĐANG GỌI API LÀ: " + instructorId);
        // Gọi service lấy dữ liệu
        PageResponse<CourseResponse> pageData = courseService.getAssignedCourses(instructorId, pageNo, pageSize);

        // Trả về ApiResponse trực tiếp không qua ResponseEntity
        return ApiResponse.<PageResponse<CourseResponse>>builder()
                .message("Lấy danh sách khóa học phân công thành công")
                .result(pageData)
                .build(); // Tự động lấy code = 1000 (Thành công)
    }

    // API: Giảng viên xem chi tiết khóa học được phân công
    // Method: GET
    // URL: /api/courses/assigned/{instructorId}/{courseId}

    @GetMapping("/assigned/{instructorId}/{courseId}")
    public ApiResponse<CourseResponse> getAssignedCourseDetail(
            @PathVariable Integer instructorId,
            @PathVariable Integer courseId) {

        CourseResponse response = courseService.getAssignedCourseDetail(
                courseId, instructorId
        );

        return ApiResponse.<CourseResponse>builder()
                .message("Lấy chi tiết khóa học thành công")
                .result(response)
                .build();
    }

    /**
     * API: Tạo mới khóa học
     * Method: POST
     * URL: /api/courses
     */
    @PostMapping
    public ApiResponse<Void> createCourse(@Valid @RequestBody CourseRequest request) {

        // Lấy instructorId từ request body để truyền vào service
        courseService.createCourse(request, request.getInstructorId());

        // Trả về ApiResponse thành công, không có result (Void)
        return ApiResponse.<Void>builder()
                .message("Tạo khóa học thành công")
                .build(); // Tự động lấy code = 1000
    }
}