package com.example.back_end.service.impl;

import com.example.back_end.dto.request.CategoryRequest;
import com.example.back_end.dto.response.CategoryResponse;
import com.example.back_end.entity.Category;
import com.example.back_end.exception.AppException;
import com.example.back_end.exception.ErrorCode;
import com.example.back_end.mapper.CategoryMapper;
import com.example.back_end.repository.CategoryRepository;
import com.example.back_end.service.CategoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CategoryServiceImpl implements CategoryService {

    // Repository thao tác với bảng Categories
    private final CategoryRepository categoryRepository;

    // Mapper chuyển đổi giữa Entity và DTO
    private final CategoryMapper categoryMapper;

    // Lấy danh sách danh mục, tìm kiếm và lọc trạng thái
    @Override
    @Transactional(readOnly = true)
    public List<CategoryResponse> getCategories(String keyword, Boolean status) {

        // Chuẩn hóa từ khóa tìm kiếm
        String search = keyword == null ? "" : keyword.trim().toLowerCase();

        // Lấy danh sách và lọc theo điều kiện
        return categoryRepository.findAll().stream()
                .filter(c -> status == null || status.equals(c.getStatus()))
                .filter(c -> search.isEmpty()
                        || (c.getName() != null && c.getName().toLowerCase().contains(search))
                        || (c.getDescription() != null && c.getDescription().toLowerCase().contains(search))
                        || (c.getCategoryId() != null
                        && String.valueOf(c.getCategoryId()).equals(search.replace("#", ""))))
                .sorted(Comparator.comparing(Category::getCategoryId))
                .map(categoryMapper::toResponse)
                .toList();
    }

    // Lấy thông tin chi tiết danh mục
    @Override
    @Transactional(readOnly = true)
    public CategoryResponse getCategory(Integer categoryId) {

        // Tìm danh mục và chuyển thành Response
        return categoryMapper.toResponse(findCategory(categoryId));
    }

    // Thêm danh mục khóa học mới
    @Override
    @Transactional
    public CategoryResponse createCategory(CategoryRequest request) {

        // Chuẩn hóa tên danh mục
        String name = request.getName().trim();

        // Kiểm tra tên danh mục đã tồn tại
        if (categoryRepository.existsByNameIgnoreCase(name))
            throw new AppException(ErrorCode.CATEGORY_NAME_EXISTS);

        // Chuyển Request thành Entity
        Category category = categoryMapper.toEntity(request);
        category.setName(name);

        // Lưu vào Database và trả về Response
        return categoryMapper.toResponse(categoryRepository.save(category));
    }

    // Cập nhật thông tin danh mục
    @Override
    @Transactional
    public CategoryResponse updateCategory(Integer categoryId, CategoryRequest request) {

        // Kiểm tra danh mục có tồn tại không
        Category category = findCategory(categoryId);

        // Chuẩn hóa tên danh mục
        String name = request.getName().trim();

        // Kiểm tra tên có trùng với danh mục khác không
        if (categoryRepository.existsByNameIgnoreCaseAndCategoryIdNot(name, categoryId))
            throw new AppException(ErrorCode.CATEGORY_NAME_EXISTS);

        // Cập nhật thông tin từ Request vào Entity
        categoryMapper.updateCategory(request, category);
        category.setName(name);

        // Lưu thay đổi và trả về Response
        return categoryMapper.toResponse(categoryRepository.save(category));
    }

    // Hàm dùng chung để tìm danh mục theo ID
    private Category findCategory(Integer categoryId) {

        // Không tìm thấy thì trả về lỗi nghiệp vụ
        return categoryRepository.findById(categoryId)
                .orElseThrow(() -> new AppException(ErrorCode.CATEGORY_NOT_FOUND));
    }
}