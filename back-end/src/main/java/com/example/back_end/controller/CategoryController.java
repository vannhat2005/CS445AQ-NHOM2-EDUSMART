package com.example.back_end.controller;

import com.example.back_end.dto.request.CategoryRequest;
import com.example.back_end.dto.response.ApiResponse;
import com.example.back_end.dto.response.CategoryResponse;
import com.example.back_end.service.CategoryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/categories")
@RequiredArgsConstructor
public class CategoryController {

    // Service xử lý nghiệp vụ quản lý danh mục
    private final CategoryService categoryService;

    // Lấy danh sách, tìm kiếm theo từ khóa và lọc trạng thái
    @GetMapping
    public List<CategoryResponse> getCategories(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Boolean status) {

        return categoryService.getCategories(keyword, status);
    }

    // Lấy thông tin chi tiết danh mục theo ID
    @GetMapping("/{categoryId}")
    public CategoryResponse getCategory(
            @PathVariable Integer categoryId) {

        return categoryService.getCategory(categoryId);
    }

    // Thêm danh mục khóa học mới
    @PostMapping
    public ApiResponse<CategoryResponse> createCategory(
            @Valid @RequestBody CategoryRequest request) {

        // Gọi Service thêm danh mục
        CategoryResponse response = categoryService.createCategory(request);

        // Trả về thông báo thêm thành công cho Frontend
        return ApiResponse.<CategoryResponse>builder()
                .code(200)
                .message("Thêm danh mục thành công")
                .result(response)
                .build();
    }

    // Cập nhật thông tin và trạng thái danh mục
    @PutMapping("/{categoryId}")
    public ApiResponse<CategoryResponse> updateCategory(
            @PathVariable Integer categoryId,
            @Valid @RequestBody CategoryRequest request) {

        // Gọi Service cập nhật danh mục
        CategoryResponse response = categoryService.updateCategory(categoryId, request);

        // Trả về thông báo cập nhật thành công cho Frontend
        return ApiResponse.<CategoryResponse>builder()
                .code(200)
                .message("Cập nhật danh mục thành công")
                .result(response)
                .build();
    }
}