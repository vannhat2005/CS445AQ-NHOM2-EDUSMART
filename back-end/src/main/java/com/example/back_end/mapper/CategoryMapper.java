package com.example.back_end.mapper;

import com.example.back_end.dto.request.CategoryRequest;
import com.example.back_end.dto.response.CategoryResponse;
import com.example.back_end.entity.Category;
import org.mapstruct.*;

@Mapper(componentModel = "spring")
public interface CategoryMapper {

    // Chuyển Entity thành Response để trả về Frontend
    CategoryResponse toResponse(Category category);

    // Chuyển Request thành Entity khi thêm danh mục
    Category toEntity(CategoryRequest request);

    // Cập nhật thông tin Entity từ Request, giữ nguyên ID
    @Mapping(target = "categoryId", ignore = true)
    void updateCategory(CategoryRequest request, @MappingTarget Category category);
}