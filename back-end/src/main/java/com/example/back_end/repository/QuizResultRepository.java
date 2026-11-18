
package com.example.back_end.repository;

import com.example.back_end.entity.QuizResult;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface QuizResultRepository
        extends JpaRepository<QuizResult, Integer> {

    // Đếm số Quiz khác nhau mà học viên đã nộp
    // Bao gồm Quiz bài học và Quiz cuối chương
    @Query("""
        SELECT COUNT(DISTINCT q.quizId)
        FROM QuizResult qr
        JOIN qr.quiz q
        LEFT JOIN q.lesson l
        LEFT JOIN l.chapter lessonChapter
        LEFT JOIN q.chapter finalChapter
        WHERE qr.student.userId = :userId
          AND qr.submittedAt IS NOT NULL
          AND (
              lessonChapter.course.courseId = :courseId
              OR finalChapter.course.courseId = :courseId
          )
    """)
    long countCompletedQuizzes(
            @Param("userId") Integer userId,
            @Param("courseId") Integer courseId
    );
}
