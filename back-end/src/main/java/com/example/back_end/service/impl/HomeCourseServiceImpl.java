
package com.example.back_end.service.impl;

import com.example.back_end.dto.response.FeaturedCourseResponse;
import com.example.back_end.dto.response.PageResponse;
import com.example.back_end.dto.response.TopCategoryResponse;

import com.example.back_end.entity.Course;
import com.example.back_end.enumType.CourseStatus;

import com.example.back_end.repository.CategoryRepository;
import com.example.back_end.repository.CourseRepository;

import com.example.back_end.service.HomeCourseService;

import lombok.RequiredArgsConstructor;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Arrays;
import java.util.List;
import java.util.Locale;
import java.util.Set;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class HomeCourseServiceImpl implements HomeCourseService {

    private final CategoryRepository categoryRepository;
    private final CourseRepository courseRepository;

    // ==========================================
    // 1. TOP 3 DANH MỤC NHIỀU HỌC VIÊN NHẤT
    // ==========================================

    @Override
    public List<TopCategoryResponse> getTop3Categories() {

        List<Object[]> results =
                categoryRepository.findTop3CategoriesByStudents();

        return results.stream()
                .map(row -> TopCategoryResponse.builder()
                        .categoryId(((Number) row[0]).intValue())
                        .name((String) row[1])
                        .build()
                )
                .toList();
    }

    // ==========================================
    // 2. KHÓA HỌC + LỌC + SẮP XẾP + PHÂN TRANG
    // ==========================================

    @Override
    public PageResponse<FeaturedCourseResponse> getCourses(
            Integer categoryId,
            String sort,
            int page,
            int size
    ) {

        if (categoryId != null && categoryId <= 0) {
            throw new IllegalArgumentException(
                    "Danh mục không hợp lệ"
            );
        }

        if (page < 1) {
            throw new IllegalArgumentException(
                    "Số trang phải lớn hơn hoặc bằng 1"
            );
        }

        if (size < 1 || size > 50) {
            throw new IllegalArgumentException(
                    "Kích thước trang phải từ 1 đến 50"
            );
        }

        String normalizedSort =
                (sort == null || sort.isBlank())
                        ? "newest"
                        : sort.trim().toLowerCase(Locale.ROOT);

        Set<String> validSorts = Set.of(
                "newest",
                "price_asc",
                "price_desc"
        );

        if (!validSorts.contains(normalizedSort)) {
            throw new IllegalArgumentException(
                    "Kiểu sắp xếp không hợp lệ: " + sort
            );
        }

        // ======================================
        // XỬ LÝ SẮP XẾP
        // ======================================

        Sort sortOrder;

        switch (normalizedSort) {

            case "price_asc":
                sortOrder = Sort.by(
                        Sort.Direction.ASC,
                        "price"
                );
                break;

            case "price_desc":
                sortOrder = Sort.by(
                        Sort.Direction.DESC,
                        "price"
                );
                break;

            default:
                sortOrder = Sort.by(
                        Sort.Direction.DESC,
                        "createdAt"
                );
                break;
        }

        sortOrder = sortOrder.and(
                Sort.by(
                        Sort.Direction.DESC,
                        "courseId"
                )
        );

        // UI bắt đầu từ trang 1
        // Spring Data JPA bắt đầu từ trang 0
        Pageable pageable = PageRequest.of(
                page - 1,
                size,
                sortOrder
        );

        CourseStatus publishedStatus =
                getCourseStatusIgnoreCase("Published");

        // ======================================
        // LẤY DỮ LIỆU TỪ DATABASE
        // ======================================

        Page<Course> coursePage =
                courseRepository.findHomeCourses(
                        publishedStatus,
                        categoryId,
                        pageable
                );

        // ======================================
        // CHUYỂN ENTITY SANG DTO
        // ======================================

        Page<FeaturedCourseResponse> responsePage =
                coursePage.map(this::mapToFeaturedCourseResponse);

        // Giữ đầy đủ metadata phân trang
        return PageResponse.of(responsePage);
    }

    // ==========================================
    // 3. TÌM ENUM KHÔNG PHÂN BIỆT HOA THƯỜNG
    // ==========================================

    private CourseStatus getCourseStatusIgnoreCase(
            String value
    ) {

        return Arrays.stream(CourseStatus.values())
                .filter(status ->
                        status.name().equalsIgnoreCase(value)
                )
                .findFirst()
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "Không tìm thấy trạng thái: " + value
                        )
                );
    }

    // ==========================================
    // 4. CHUYỂN ENTITY SANG RESPONSE
    // ==========================================

    private FeaturedCourseResponse mapToFeaturedCourseResponse(
            Course course
    ) {

        Integer categoryId = null;
        String categoryName = null;
        String instructorName = null;

        if (course.getCategory() != null) {
            categoryId = course.getCategory().getCategoryId();
            categoryName = course.getCategory().getName();
        }

        if (course.getInstructor() != null) {
            instructorName = course.getInstructor().getFullName();
        }

        return FeaturedCourseResponse.builder()
                .courseId(course.getCourseId())
                .title(course.getTitle())
                .description(course.getDescription())
                .imageUrl(course.getImageUrl())
                .price(course.getPrice())
                .categoryId(categoryId)
                .categoryName(categoryName)
                .instructorName(instructorName)

                // Chưa tích hợp thống kê thực tế
                .averageRating(0.0)
                .totalReviews(0L)
                .totalStudents(0L)

                .build();
    }
}
