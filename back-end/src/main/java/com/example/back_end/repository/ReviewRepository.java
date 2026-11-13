
package com.example.back_end.repository;

import com.example.back_end.entity.Review;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ReviewRepository
        extends JpaRepository<Review, Integer> {

    @Query("""
        SELECT AVG(r.rating)
        FROM Review r
        WHERE r.course.courseId = :courseId
    """)
    Double getAverageRating(
            @Param("courseId") Integer courseId
    );

    Long countByCourse_CourseId(Integer courseId);
}
