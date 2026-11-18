
package com.example.back_end.controller;

import com.example.back_end.dto.response.ApiResponse;
import com.example.back_end.dto.response.PageResponse;
import com.example.back_end.dto.response.FeaturedCourseResponse;
import com.example.back_end.dto.response.TopCategoryResponse;

import com.example.back_end.service.HomeCourseService;

import lombok.RequiredArgsConstructor;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/public/home")
@RequiredArgsConstructor
public class HomeCourseController {

    private final HomeCourseService homeCourseService;

    // ==========================================
    // 1. TOP 3 DANH MỤC NHIỀU HỌC VIÊN NHẤT
    // ==========================================

    @GetMapping("/top-categories")
    public ApiResponse<List<TopCategoryResponse>> getTopCategories() {

        List<TopCategoryResponse> categories =
                homeCourseService.getTop3Categories();

        return ApiResponse.<List<TopCategoryResponse>>builder()
                .code(1000)
                .message("Lấy danh mục nổi bật thành công")
                .result(categories)
                .build();
    }

    // ==========================================
    // 2. KHÓA HỌC THEO DANH MỤC + PHÂN TRANG
    // ==========================================

    @GetMapping("/courses")
    public ApiResponse<PageResponse<FeaturedCourseResponse>> getCourses(

            @RequestParam(
                    name = "categoryId",
                    required = false
            )
            Integer categoryId,

            @RequestParam(
                    name = "sort",
                    defaultValue = "newest"
            )
            String sort,

            @RequestParam(
                    name = "page",
                    defaultValue = "1"
            )
            int page,

            @RequestParam(
                    name = "size",
                    defaultValue = "8"
            )
            int size
    ) {

        PageResponse<FeaturedCourseResponse> courses =
                homeCourseService.getCourses(
                        categoryId,
                        sort,
                        page,
                        size
                );

        return ApiResponse
                .<PageResponse<FeaturedCourseResponse>>builder()
                .code(1000)
                .message("Lấy danh sách khóa học thành công")
                .result(courses)
                .build();
    }

    // ==========================================
    // 3. XỬ LÝ THAM SỐ KHÔNG HỢP LỆ
    // ==========================================

    @ExceptionHandler(IllegalArgumentException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ApiResponse<Void> handleBadRequest(
            IllegalArgumentException exception
    ) {

        return ApiResponse.<Void>builder()
                .code(1001)
                .message(exception.getMessage())
                .build();
    }
}
