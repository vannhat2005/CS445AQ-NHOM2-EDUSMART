
package com.example.back_end.service.impl;

import com.example.back_end.dto.response.CourseSearchResponse;
import com.example.back_end.dto.response.PageResponse;
import com.example.back_end.entity.Course;
import com.example.back_end.enumType.CourseStatus;
import com.example.back_end.mapper.CourseMapper;
import com.example.back_end.repository.ReviewRepository;
import com.example.back_end.service.ExploreCourseService;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.TypedQuery;
import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.CriteriaQuery;
import jakarta.persistence.criteria.Order;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;

import lombok.RequiredArgsConstructor;

import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Set;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ExploreCourseServiceImpl implements ExploreCourseService {

    @PersistenceContext
    private EntityManager entityManager;

    private final CourseMapper courseMapper;
    private final ReviewRepository reviewRepository;

    @Override
    public PageResponse<CourseSearchResponse> search(
            String keyword,
            Integer categoryId,
            BigDecimal minPrice,
            BigDecimal maxPrice,
            String sort,
            int page,
            int size
    ) {

        // 1. Kiểm tra phân trang
        if (page < 1 || size < 1 || size > 50) {
            throw new IllegalArgumentException(
                    "page phải >= 1 và size phải từ 1 đến 50"
            );
        }

        // 2. Kiểm tra danh mục
        if (categoryId != null && categoryId <= 0) {
            throw new IllegalArgumentException(
                    "categoryId không hợp lệ"
            );
        }

        // 3. Kiểm tra khoảng giá
        if ((minPrice != null && minPrice.signum() < 0)
                || (maxPrice != null && maxPrice.signum() < 0)
                || (minPrice != null && maxPrice != null
                && minPrice.compareTo(maxPrice) > 0)) {

            throw new IllegalArgumentException(
                    "Khoảng giá không hợp lệ"
            );
        }

        // 4. Chuẩn hóa từ khóa
        String normalizedKeyword =
                keyword == null || keyword.isBlank()
                        ? null
                        : keyword.trim().replaceAll("\\s+", " ").toLowerCase(Locale.ROOT);

        // 5. Chuẩn hóa kiểu sắp xếp
        String sortKey =
                sort == null || sort.isBlank()
                        ? "newest"
                        : sort.trim().toLowerCase(Locale.ROOT);

        // Hỗ trợ mới nhất, cũ nhất, giá tăng và giá giảm
        Set<String> allowedSorts = Set.of(
                "newest",
                "oldest",
                "price_asc",
                "price_desc"
        );

        if (!allowedSorts.contains(sortKey)) {
            throw new IllegalArgumentException(
                    "Kiểu sắp xếp không hợp lệ: " + sort
            );
        }

        // 6. Tạo CriteriaBuilder
        CriteriaBuilder cb =
                entityManager.getCriteriaBuilder();

        CriteriaQuery<Course> query =
                cb.createQuery(Course.class);

        Root<Course> root =
                query.from(Course.class);

        // 7. Áp dụng các điều kiện lọc
        List<Predicate> filters = buildFilters(
                cb,
                root,
                normalizedKeyword,
                categoryId,
                minPrice,
                maxPrice
        );

        query.select(root)
                .where(filters.toArray(new Predicate[0]));

        // 8. Sắp xếp khóa học
        Order primaryOrder = switch (sortKey) {

            // Giá thấp đến cao
            case "price_asc" ->
                    cb.asc(root.get("price"));

            // Giá cao đến thấp
            case "price_desc" ->
                    cb.desc(root.get("price"));

            // Khóa học cũ nhất trước
            case "oldest" ->
                    cb.asc(root.get("createdAt"));

            // Khóa học mới nhất trước
            default ->
                    cb.desc(root.get("createdAt"));
        };

        // Sắp xếp phụ theo ID để phân trang ổn định
        Order secondaryOrder =
                "oldest".equals(sortKey)
                        ? cb.asc(root.get("courseId"))
                        : cb.desc(root.get("courseId"));

        query.orderBy(
                primaryOrder,
                secondaryOrder
        );

        // 9. Phân trang trực tiếp trên Database
        TypedQuery<Course> dataQuery =
                entityManager.createQuery(query);

        long offset = ((long) page - 1L) * size;

        if (offset > Integer.MAX_VALUE) {
            throw new IllegalArgumentException(
                    "Số trang vượt quá giới hạn cho phép"
            );
        }

        dataQuery.setFirstResult((int) offset);
        dataQuery.setMaxResults(size);

        List<Course> courses =
                dataQuery.getResultList();

        // 10. Đếm tổng số khóa học phù hợp
        CriteriaQuery<Long> countQuery =
                cb.createQuery(Long.class);

        Root<Course> countRoot =
                countQuery.from(Course.class);

        List<Predicate> countFilters = buildFilters(
                cb,
                countRoot,
                normalizedKeyword,
                categoryId,
                minPrice,
                maxPrice
        );

        countQuery.select(cb.count(countRoot))
                .where(countFilters.toArray(new Predicate[0]));

        long totalElements =
                entityManager.createQuery(countQuery)
                        .getSingleResult();

        // 11. Chuyển Entity sang Response DTO
        List<CourseSearchResponse> content =
                courses.stream()
                        .map(course -> {

                            CourseSearchResponse dto =
                                    courseMapper.toCourseSearchResponse(
                                            course
                                    );

                            Integer courseId =
                                    course.getCourseId();

                            Double averageRating =
                                    reviewRepository.getAverageRating(
                                            courseId
                                    );

                            Long totalReviews =
                                    reviewRepository.countByCourse_CourseId(
                                            courseId
                                    );

                            dto.setAverageRating(
                                    averageRating == null
                                            ? 0.0
                                            : Math.round(
                                            averageRating * 10.0
                                    ) / 10.0
                            );

                            dto.setTotalReviews(
                                    totalReviews == null
                                            ? 0L
                                            : totalReviews
                            );

                            return dto;
                        })
                        .toList();

        // 12. Trả về PageResponse
        PageImpl<CourseSearchResponse> resultPage =
                new PageImpl<>(
                        content,
                        PageRequest.of(page - 1, size),
                        totalElements
                );

        return PageResponse.of(resultPage);
    }

    /**
     * Tạo điều kiện lọc chung cho:
     * - Truy vấn danh sách khóa học
     * - Truy vấn đếm tổng khóa học
     */
    private List<Predicate> buildFilters(
            CriteriaBuilder cb,
            Root<Course> root,
            String keyword,
            Integer categoryId,
            BigDecimal minPrice,
            BigDecimal maxPrice
    ) {

        List<Predicate> predicates =
                new ArrayList<>();

        // 1. Chỉ lấy khóa học đã Published
        predicates.add(
                cb.equal(
                        root.get("status"),
                        CourseStatus.Published
                )
        );

        // 2. Tìm kiếm theo tiêu đề hoặc mô tả
        if (keyword != null && !keyword.isBlank()) {

            String escapedKeyword = keyword
                    .replace("\\", "\\\\")
                    .replace("%", "\\%")
                    .replace("_", "\\_");

            String pattern = "%" + escapedKeyword.replaceAll("\\s+", "%") + "%";

            Predicate titlePredicate =
                    cb.like(
                            cb.lower(root.get("title")),
                            pattern,
                            '\\'
                    );

            Predicate descriptionPredicate =
                    cb.like(
                            cb.lower(root.get("description")),
                            pattern,
                            '\\'
                    );

            predicates.add(
                    cb.or(
                            titlePredicate,
                            descriptionPredicate
                    )
            );
        }

        // 3. Lọc theo danh mục
        if (categoryId != null) {
            predicates.add(
                    cb.equal(
                            root.get("category")
                                    .get("categoryId"),
                            categoryId
                    )
            );
        }

        // 4. Lọc theo giá tối thiểu
        if (minPrice != null) {
            predicates.add(
                    cb.greaterThanOrEqualTo(
                            root.<BigDecimal>get("price"),
                            minPrice
                    )
            );
        }

        // 5. Lọc theo giá tối đa
        if (maxPrice != null) {
            predicates.add(
                    cb.lessThanOrEqualTo(
                            root.<BigDecimal>get("price"),
                            maxPrice
                    )
            );
        }

        return predicates;
    }
}
