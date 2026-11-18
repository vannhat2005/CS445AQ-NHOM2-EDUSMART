package com.example.back_end.repository;

import com.example.back_end.entity.Category;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CategoryRepository extends JpaRepository<Category, Integer> {

    // Kiểm tra tên danh mục đã tồn tại khi thêm mới
    boolean existsByNameIgnoreCase(String name);

    // Kiểm tra tên danh mục trùng với danh mục khác khi cập nhật
    boolean existsByNameIgnoreCaseAndCategoryIdNot(String name, Integer categoryId);
}