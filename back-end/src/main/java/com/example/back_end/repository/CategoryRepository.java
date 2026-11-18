
package com.example.back_end.repository;

import com.example.back_end.entity.Category;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CategoryRepository
        extends JpaRepository<Category, Integer> {

    // ==========================================
    // TOP 3 DANH MỤC NHIỀU HỌC VIÊN NHẤT
    // ==========================================

    @Query(value = """
        SELECT
            cat.category_id,
            cat.name,
            COUNT(DISTINCT cr.user_id) AS total_students

        FROM Categories cat

        INNER JOIN Courses c
            ON c.category_id = cat.category_id
            AND LOWER(c.status) = 'published'

        LEFT JOIN CourseRegistrations cr
            ON cr.course_id = c.course_id
            AND LOWER(cr.status) = 'paid'

        WHERE cat.status = TRUE

        GROUP BY
            cat.category_id,
            cat.name

        ORDER BY
            total_students DESC,
            cat.category_id ASC

        LIMIT 3
        """, nativeQuery = true)
    List<Object[]> findTop3CategoriesByStudents();
}
