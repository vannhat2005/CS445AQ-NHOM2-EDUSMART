
package com.example.back_end.repository;

import com.example.back_end.entity.Review;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

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


    Page<Review> findByCourse_CourseIdOrderByCreatedAtDesc(
            Integer courseId,
            Pageable pageable
    );

    @Query("""
    SELECT r.rating, COUNT(r)
    FROM Review r
    WHERE r.course.courseId = :courseId
    GROUP BY r.rating
    """)
    List<Object[]> countReviewsByRating(
            @Param("courseId") Integer courseId
    );

    boolean existsByStudent_UserIdAndCourse_CourseId(
            Integer studentId,
            Integer courseId
    );

}
