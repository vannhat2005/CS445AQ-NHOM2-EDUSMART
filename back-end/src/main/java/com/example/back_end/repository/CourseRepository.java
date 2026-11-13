package com.example.back_end.repository;

import com.example.back_end.entity.Course;
import com.example.back_end.enumType.CourseStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

import java.util.Optional;

public interface CourseRepository extends JpaRepository<Course, Integer> {
    // Lấy danh sách khóa học dựa theo ID của giảng viên (instructor)
    Page<Course> findByInstructor_UserId(Integer instructorId, Pageable pageable);
    // Đếm tổng số khóa học của giảng viên
    long countByInstructor_UserId(Integer instructorId);

    // Đếm số khóa học theo trạng thái (ví dụ: DRAFT)
    long countByInstructor_UserIdAndStatus(
            Integer instructorId,
            CourseStatus status
    );

    List<Course> findTop3ByInstructor_UserIdOrderByCreatedAtDesc(
            Integer instructorId
    );


    @Query("""
    SELECT c
    FROM Course c
    WHERE c.status = :status
    AND (
        :keyword IS NULL
        OR LOWER(c.title) LIKE
            LOWER(CONCAT('%', :keyword, '%'))
    )
""")
    Page<Course> searchCourses(
            @Param("keyword") String keyword,
            @Param("status") CourseStatus status,
            Pageable pageable
    );

    Optional<Course> findByCourseIdAndInstructor_UserId(
            Integer courseId, Integer instructorId
    );
}