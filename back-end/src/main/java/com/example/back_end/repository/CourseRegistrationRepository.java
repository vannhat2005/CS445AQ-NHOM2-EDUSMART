
package com.example.back_end.repository;

import com.example.back_end.entity.CourseRegistration;
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
    // ĐẾM HỌC VIÊN CỦA GIẢNG VIÊN
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
    // ĐẾM HỌC VIÊN CỦA KHÓA HỌC
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
    // ĐẾM ĐĂNG KÝ THEO TRẠNG THÁI
    // ==========================================

    long countByCourse_CourseIdAndStatus(
            Integer courseId,
            RegistrationStatus status
    );

    // ==========================================
    // KIỂM TRA HỌC VIÊN ĐÃ ĐĂNG KÝ
    // ==========================================

    boolean existsByUser_UserIdAndCourse_CourseIdAndStatus(
            Integer userId,
            Integer courseId,
            RegistrationStatus status
    );

    // ==========================================
    // API CŨ: KHÓA HỌC CỦA TÔI
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
        """,
            countQuery = """
            SELECT COUNT(cr)
            FROM CourseRegistration cr
            WHERE cr.user.userId = :userId
              AND cr.status = :status
        """
    )
    Page<CourseRegistration> findMyCourses(
            @Param("userId") Integer userId,
            @Param("status") RegistrationStatus status,
            Pageable pageable
    );

    // ==========================================
    // API MỚI: TÌM KIẾM + LỌC + PHÂN TRANG
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
            @Param("keyword") String keyword,
            @Param("fromDate") LocalDateTime fromDate,
            Pageable pageable
    );

}
