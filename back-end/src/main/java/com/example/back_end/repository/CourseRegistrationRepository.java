package com.example.back_end.repository;


import com.example.back_end.entity.CourseRegistration;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface CourseRegistrationRepository
        extends JpaRepository<CourseRegistration, Integer> {

    // Đếm tổng số học viên không trùng lặp
    // đã đăng ký các khóa học của giảng viên
    @Query("""
        SELECT COUNT(DISTINCT cr.user.userId)
        FROM CourseRegistration cr
        WHERE cr.course.instructor.userId = :instructorId
    """)
    long countStudentsByInstructor(
            @Param("instructorId") Integer instructorId
    );

    @Query("""
    SELECT COUNT(DISTINCT cr.user.userId)
    FROM CourseRegistration cr
    WHERE cr.course.courseId = :courseId
""")
    long countStudentsByCourseId(
            @Param("courseId") Integer courseId
    );

}

