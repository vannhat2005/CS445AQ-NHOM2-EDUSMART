package com.example.back_end.repository;


import com.example.back_end.entity.Quiz;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface QuizRepository
        extends JpaRepository<Quiz, Integer> {

    // Trắc nghiệm thuộc bài học
    @Query("""
        SELECT COUNT(q)
        FROM Quiz q
        WHERE q.lesson.chapter.course.instructor.userId = :id
          AND q.chapter IS NULL
    """)
    long countLessonQuizzes(@Param("id") Integer id);

    // Kiểm tra cuối chương
    @Query("""
        SELECT COUNT(q)
        FROM Quiz q
        WHERE q.chapter.course.instructor.userId = :id
          AND q.lesson IS NULL
    """)
    long countChapterTests(@Param("id") Integer id);


    // Tổng Quiz thường + Quiz cuối chương của một khóa học
    @Query("""
        SELECT COUNT(DISTINCT q.quizId)
        FROM Quiz q
        LEFT JOIN q.lesson l
        LEFT JOIN l.chapter lessonChapter
        LEFT JOIN q.chapter finalChapter
        WHERE lessonChapter.course.courseId = :courseId
           OR finalChapter.course.courseId = :courseId
    """)
    long countQuizzesByCourseId(
            @Param("courseId") Integer courseId
    );

}
