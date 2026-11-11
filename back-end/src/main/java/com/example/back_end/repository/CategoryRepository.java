package com.example.back_end.repository;

import com.example.back_end.entity.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CategoryRepository extends JpaRepository<Category, Integer> {

    // Ví dụ một hàm kiểm tra xem danh mục có tồn tại hay không
    // boolean existsByName(String name);
}