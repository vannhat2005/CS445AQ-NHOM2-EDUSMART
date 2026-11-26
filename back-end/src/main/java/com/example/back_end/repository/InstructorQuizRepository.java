package com.example.back_end.repository;

import com.example.back_end.entity.Quiz;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import java.util.Optional;

public interface InstructorQuizRepository extends JpaRepository<Quiz, Integer> {

    // Lấy bộ trắc nghiệm của bài học
    Optional<Quiz> findByLesson_LessonId(Integer lessonId);

    // Lấy bài kiểm tra cuối chương, không lấy trắc nghiệm bài học
    Optional<Quiz> findByChapter_ChapterIdAndLessonIsNull(Integer chapterId);

    // Kiểm tra bài học đã có bộ trắc nghiệm hay chưa
    boolean existsByLesson_LessonId(Integer lessonId);

    // Kiểm tra chương đã có bài kiểm tra cuối chương hay chưa
    boolean existsByChapter_ChapterIdAndLessonIsNull(Integer chapterId);

    // Khóa bộ trắc nghiệm khi thực hiện thao tác thay đổi dữ liệu
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT q FROM Quiz q WHERE q.quizId = :quizId")
    Optional<Quiz> findByIdForUpdate(@Param("quizId") Integer quizId);
}