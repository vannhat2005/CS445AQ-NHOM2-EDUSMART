package com.example.back_end.repository;

import com.example.back_end.entity.Course;
import com.example.back_end.enumType.CourseStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface AdminCourseRepository extends JpaRepository<Course, Integer> {

    // Tìm kiếm theo tên, giảng viên, mã khóa học và lọc danh mục
    @Query(value = """
            SELECT c FROM Course c
            LEFT JOIN c.category cat
            LEFT JOIN c.instructor ins
            WHERE (:categoryId IS NULL OR cat.categoryId = :categoryId)
            AND (:keyword IS NULL OR LOWER(c.title) LIKE LOWER(CONCAT('%', :keyword, '%'))
            OR LOWER(ins.fullName) LIKE LOWER(CONCAT('%', :keyword, '%')) OR c.courseId = :searchId)
            """,
            countQuery = """
            SELECT COUNT(c) FROM Course c
            LEFT JOIN c.category cat
            LEFT JOIN c.instructor ins
            WHERE (:categoryId IS NULL OR cat.categoryId = :categoryId)
            AND (:keyword IS NULL OR LOWER(c.title) LIKE LOWER(CONCAT('%', :keyword, '%'))
            OR LOWER(ins.fullName) LIKE LOWER(CONCAT('%', :keyword, '%')) OR c.courseId = :searchId)
            """)
    Page<Course> searchAdminCourses(@Param("keyword") String keyword, @Param("searchId") Integer searchId,
                                    @Param("categoryId") Integer categoryId, Pageable pageable);

    // Đếm khóa học theo trạng thái
    long countByStatus(CourseStatus status);
}
