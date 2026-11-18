
package com.example.back_end.repository;

import com.example.back_end.entity.CourseRegistration;
import com.example.back_end.enumType.CourseStatus;
import com.example.back_end.enumType.RegistrationStatus;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;

@Repository
public interface CourseRegistrationRepository
        extends JpaRepository<CourseRegistration, Integer> {

    // ==========================================
    // 1. ĐẾM HỌC VIÊN CỦA GIẢNG VIÊN
    // ==========================================

    @Query("""
        SELECT COUNT(DISTINCT cr.user.userId)
        FROM CourseRegistration cr
        WHERE cr.course.instructor.userId = :instructorId
    """)
    long countStudentsByInstructor(
            @Param("instructorId") Integer instructorId
    );

    // ==========================================
    // 2. ĐẾM HỌC VIÊN CỦA KHÓA HỌC
    // ==========================================

    @Query("""
        SELECT COUNT(DISTINCT cr.user.userId)
        FROM CourseRegistration cr
        WHERE cr.course.courseId = :courseId
    """)
    long countStudentsByCourseId(
            @Param("courseId") Integer courseId
    );

    // ==========================================
    // 3. ĐẾM ĐĂNG KÝ THEO TRẠNG THÁI
    // ==========================================

    long countByCourse_CourseIdAndStatus(
            Integer courseId,
            RegistrationStatus status
    );

    // ==========================================
    // 4. KIỂM TRA HỌC VIÊN ĐÃ MUA KHÓA HỌC
    // ==========================================

    boolean existsByUser_UserIdAndCourse_CourseIdAndStatus(
            Integer userId,
            Integer courseId,
            RegistrationStatus status
    );

    // ==========================================
    // 5. KIỂM TRA ĐÃ MUA KHÓA HỌC
    // ==========================================

    default boolean hasPurchasedCourse(
            Integer userId,
            Integer courseId
    ) {

        if (userId == null || courseId == null) {
            return false;
        }

        return existsByUser_UserIdAndCourse_CourseIdAndStatus(
                userId,
                courseId,
                RegistrationStatus.Paid
        );
    }

    // ==========================================
    // 6. ĐẾM SỐ HỌC VIÊN ĐÃ THANH TOÁN
    // ==========================================

    @Query("""
        SELECT COUNT(DISTINCT cr.user.userId)
        FROM CourseRegistration cr
        WHERE cr.course.courseId = :courseId
          AND cr.status = :status
    """)
    long countDistinctPaidStudentsByCourse(
            @Param("courseId") Integer courseId,
            @Param("status") RegistrationStatus status
    );

    // ==========================================
    // 7. API CŨ: KHÓA HỌC CỦA TÔI
    // ==========================================

    @Query(
            value = """
            SELECT cr
            FROM CourseRegistration cr
            JOIN FETCH cr.course c
            LEFT JOIN FETCH c.instructor
            LEFT JOIN FETCH c.category
            WHERE cr.user.userId = :userId
              AND cr.status = :status
              AND c.status = :publishedStatus
        """,
            countQuery = """
            SELECT COUNT(cr)
            FROM CourseRegistration cr
            JOIN cr.course c
            WHERE cr.user.userId = :userId
              AND cr.status = :status
              AND c.status = :publishedStatus
        """
    )
    Page<CourseRegistration> findMyCourses(
            @Param("userId") Integer userId,
            @Param("status") RegistrationStatus status,
            @Param("publishedStatus") CourseStatus publishedStatus,
            Pageable pageable
    );

    // ==========================================
    // 8. API MỚI: TÌM KIẾM + LỌC + PHÂN TRANG
    // ==========================================
    //
    // Chỉ lấy khóa học:
    // - Thuộc học viên đang đăng nhập
    // - Đã thanh toán (Paid)
    // - Đã xuất bản (Published)
    //
    // Hỗ trợ:
    // - Tìm kiếm theo tên khóa học
    // - Lọc theo ngày đăng ký
    // - Phân trang
    // - Sắp xếp qua Pageable
    // ==========================================

    @Query(
            value = """
            SELECT cr
            FROM CourseRegistration cr
            JOIN FETCH cr.course c
            LEFT JOIN FETCH c.instructor
            LEFT JOIN FETCH c.category
            WHERE cr.user.userId = :userId
              AND cr.status = :status
              AND c.status = :publishedStatus

              AND (
                  :keyword IS NULL
                  OR LOWER(c.title) LIKE
                     LOWER(CONCAT('%', :keyword, '%'))
              )

              AND (
                  :fromDate IS NULL
                  OR cr.createdAt >= :fromDate
              )
        """,
            countQuery = """
            SELECT COUNT(cr)
            FROM CourseRegistration cr
            JOIN cr.course c
            WHERE cr.user.userId = :userId
              AND cr.status = :status
              AND c.status = :publishedStatus

              AND (
                  :keyword IS NULL
                  OR LOWER(c.title) LIKE
                     LOWER(CONCAT('%', :keyword, '%'))
              )

              AND (
                  :fromDate IS NULL
                  OR cr.createdAt >= :fromDate
              )
        """
    )
    Page<CourseRegistration> findMyCoursesFiltered(
            @Param("userId") Integer userId,
            @Param("status") RegistrationStatus status,
            @Param("publishedStatus") CourseStatus publishedStatus,
            @Param("keyword") String keyword,
            @Param("fromDate") LocalDateTime fromDate,
            Pageable pageable
    );
}
