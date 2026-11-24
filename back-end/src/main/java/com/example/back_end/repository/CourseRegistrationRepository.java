
package com.example.back_end.repository;

import com.example.back_end.entity.Course;
import com.example.back_end.entity.CourseRegistration;
import com.example.back_end.enumType.CourseStatus;
import com.example.back_end.enumType.RegistrationStatus;

import jakarta.persistence.LockModeType;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

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
    // 4. KIỂM TRA ĐÃ MUA KHÓA HỌC
    // ==========================================

    boolean existsByUser_UserIdAndCourse_CourseIdAndStatus(
            Integer userId,
            Integer courseId,
            RegistrationStatus status
    );

    // ==========================================
    // 5. KIỂM TRA ĐÃ THANH TOÁN
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
    // 6. ĐẾM HỌC VIÊN ĐÃ THANH TOÁN
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
    // 7. KHÓA HỌC CỦA TÔI
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
    // 7.1. TẤT CẢ KHÓA HỌC CỦA TÔI
    // ==========================================

    @Query("""
        SELECT cr
        FROM CourseRegistration cr
        JOIN FETCH cr.course c
        WHERE cr.user.userId = :userId
          AND cr.status = :status
          AND c.status = :publishedStatus
    """)
    List<CourseRegistration> findAllMyCourses(
            @Param("userId") Integer userId,
            @Param("status") RegistrationStatus status,
            @Param("publishedStatus") CourseStatus publishedStatus
    );

    // ==========================================
    // 8. TÌM KIẾM + LỌC + PHÂN TRANG
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

    // ==========================================
    // 9. ZALOPAY: TÌM ĐƠN CỦA HỌC VIÊN
    // ==========================================

    @Query("""
        SELECT cr
        FROM CourseRegistration cr
        JOIN FETCH cr.course c
        JOIN FETCH cr.user u
        WHERE cr.registrationId = :registrationId
          AND u.userId = :userId
    """)
    Optional<CourseRegistration> findOwnedRegistration(
            @Param("registrationId") Integer registrationId,
            @Param("userId") Integer userId
    );

    // ==========================================
    // 10. ZALOPAY: KHÓA ĐƠN
    // ==========================================

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
        SELECT cr
        FROM CourseRegistration cr
        WHERE cr.registrationId = :registrationId
          AND cr.user.userId = :userId
    """)
    Optional<CourseRegistration> findOwnedRegistrationForUpdate(
            @Param("registrationId") Integer registrationId,
            @Param("userId") Integer userId
    );

    // ==========================================
    // 11. TÌM ĐƠN THEO TRẠNG THÁI
    // ==========================================

    Optional<CourseRegistration> findByRegistrationIdAndStatus(
            Integer registrationId,
            RegistrationStatus status
    );

    // ==========================================
    // 12. TÌM ĐƠN ĐỂ THANH TOÁN
    // ==========================================

    @Query("""
        SELECT cr
        FROM CourseRegistration cr
        JOIN FETCH cr.course c
        WHERE cr.registrationId = :registrationId
          AND cr.user.userId = :userId
          AND cr.status = :status
    """)
    Optional<CourseRegistration> findRegistrationForPayment(
            @Param("registrationId") Integer registrationId,
            @Param("userId") Integer userId,
            @Param("status") RegistrationStatus status
    );

    // ==========================================
    // 13. KIỂM TRA QUYỀN SỞ HỮU ĐƠN
    // ==========================================

    boolean existsByRegistrationIdAndUser_UserId(
            Integer registrationId,
            Integer userId
    );

    // ==========================================
    // 14. KIỂM TRA TRẠNG THÁI ĐƠN
    // ==========================================

    boolean existsByRegistrationIdAndUser_UserIdAndStatus(
            Integer registrationId,
            Integer userId,
            RegistrationStatus status
    );

    // ==========================================
    // 15. TÌM ĐƠN MỚI NHẤT THEO TRẠNG THÁI
    // ==========================================

    Optional<CourseRegistration>
    findFirstByUser_UserIdAndCourse_CourseIdAndStatusOrderByCreatedAtDesc(
            Integer userId,
            Integer courseId,
            RegistrationStatus status
    );

    // ==========================================
    // 16. KHÓA KHÓA HỌC KHI TẠO ĐƠN
    // ==========================================

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
        SELECT c
        FROM Course c
        WHERE c.courseId = :courseId
    """)
    Optional<Course> lockCourseForRegistration(
            @Param("courseId") Integer courseId
    );
}
