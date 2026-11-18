
package com.example.back_end.repository;

import com.example.back_end.entity.Course;
import com.example.back_end.enumType.CourseStatus;
import com.example.back_end.enumType.RegistrationStatus;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface CourseRepository
        extends JpaRepository<Course, Integer> {

    // ==========================================
    // 1. KHÓA HỌC CỦA GIẢNG VIÊN
    // ==========================================

    Page<Course> findByInstructor_UserId(
            Integer instructorId,
            Pageable pageable
    );

    long countByInstructor_UserId(
            Integer instructorId
    );

    long countByInstructor_UserIdAndStatus(
            Integer instructorId,
            CourseStatus status
    );

    List<Course>
    findTop3ByInstructor_UserIdOrderByCreatedAtDesc(
            Integer instructorId
    );


    // ==========================================
    // 2. TÌM KIẾM KHÓA HỌC CHO HỌC VIÊN
    // ==========================================

    /**
     * Tìm kiếm khóa học theo:
     *
     * - Tên khóa học
     * - Mô tả khóa học
     * - Tên danh mục
     *
     * Không phân biệt chữ hoa, chữ thường.
     * Xử lý từ khóa có khoảng trắng.
     *
     * Chỉ lấy khóa học có trạng thái
     * được truyền từ CourseService.
     *
     * Hỗ trợ phân trang Pageable.
     */
    @Query("""
        SELECT c
        FROM Course c
        LEFT JOIN c.category cat
        WHERE c.status = :status
        AND (
            :keyword IS NULL
            OR TRIM(:keyword) = ''
            OR LOWER(c.title) LIKE
                LOWER(CONCAT('%', TRIM(:keyword), '%'))
            OR LOWER(c.description) LIKE
                LOWER(CONCAT('%', TRIM(:keyword), '%'))
            OR LOWER(cat.name) LIKE
                LOWER(CONCAT('%', TRIM(:keyword), '%'))
        )
        """)
    Page<Course> searchCourses(
            @Param("keyword") String keyword,
            @Param("status") CourseStatus status,
            Pageable pageable
    );


    // ==========================================
    // 3. CHI TIẾT KHÓA HỌC GIẢNG VIÊN
    // ==========================================

    Optional<Course> findByCourseIdAndInstructor_UserId(
            Integer courseId,
            Integer instructorId
    );


    // ==========================================
    // 4. KHÓA HỌC NỔI BẬT
    // ==========================================

    @Query(
            value = """
        SELECT c
        FROM Course c
        LEFT JOIN CourseRegistration cr
            ON cr.course = c
            AND cr.status = :registrationStatus
        WHERE c.status = :courseStatus
        GROUP BY c
        ORDER BY COUNT(cr) DESC, c.courseId DESC
        """,
            countQuery = """
        SELECT COUNT(c)
        FROM Course c
        WHERE c.status = :courseStatus
        """
    )
    Page<Course> findFeaturedCourses(
            @Param("courseStatus") CourseStatus courseStatus,
            @Param("registrationStatus") RegistrationStatus registrationStatus,
            Pageable pageable
    );


    @Query("""
    SELECT c
    FROM Course c
    WHERE c.status = :courseStatus
      AND c.category.status = TRUE
      AND (
          :categoryId IS NULL
          OR c.category.categoryId = :categoryId
      )
    """)
    Page<Course> findHomeCourses(
            @Param("courseStatus") CourseStatus courseStatus,
            @Param("categoryId") Integer categoryId,
            Pageable pageable
    );

}
