package com.example.back_end.service;
import com.example.back_end.dto.request.CategoryRequest;
import com.example.back_end.dto.response.CategoryResponse;

import java.util.List;

public interface CategoryService {

    // Lấy danh sách danh mục, tìm kiếm và lọc theo trạng thái
    List<CategoryResponse> getCategories(String keyword, Boolean status);

    // Lấy thông tin chi tiết danh mục theo ID
    CategoryResponse getCategory(Integer categoryId);

    // Thêm danh mục khóa học mới
    CategoryResponse createCategory(CategoryRequest request);

    // Cập nhật thông tin và trạng thái danh mục
    CategoryResponse updateCategory(Integer categoryId, CategoryRequest request);
}
