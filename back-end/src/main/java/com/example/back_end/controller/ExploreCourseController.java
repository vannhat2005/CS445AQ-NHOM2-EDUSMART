
package com.example.back_end.controller;

import com.example.back_end.dto.response.ApiResponse;
import com.example.back_end.dto.response.CourseSearchResponse;
import com.example.back_end.dto.response.PageResponse;
import com.example.back_end.repository.CategoryRepository;
import com.example.back_end.service.ExploreCourseService;

import lombok.RequiredArgsConstructor;

import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/public/explore")
@RequiredArgsConstructor
public class ExploreCourseController {

    private final ExploreCourseService exploreCourseService;
    private final CategoryRepository categoryRepository;

    // Lấy tất cả danh mục khóa học
    @GetMapping("/categories")
    public ApiResponse<List<CategoryItem>> categories() {

        List<CategoryItem> categories =
                categoryRepository.findAll()
                        .stream()
                        .map(category -> new CategoryItem(
                                category.getCategoryId(),
                                category.getName()
                        ))
                        .toList();

        return ApiResponse.<List<CategoryItem>>builder()
                .message("Lấy danh mục thành công")
                .result(categories)
                .build();
    }

    // Lọc, tìm kiếm, sắp xếp và phân trang
    @GetMapping("/courses")
    public ApiResponse<PageResponse<CourseSearchResponse>> courses(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Integer categoryId,
            @RequestParam(required = false) BigDecimal minPrice,
            @RequestParam(required = false) BigDecimal maxPrice,
            @RequestParam(defaultValue = "newest") String sort,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "8") int size
    ) {

        PageResponse<CourseSearchResponse> result =
                exploreCourseService.search(
                        keyword,
                        categoryId,
                        minPrice,
                        maxPrice,
                        sort,
                        page,
                        size
                );

        return ApiResponse.<PageResponse<CourseSearchResponse>>builder()
                .message("Lấy danh sách khóa học thành công")
                .result(result)
                .build();
    }

    public record CategoryItem(
            Integer categoryId,
            String name
    ) {}
}
