package com.example.back_end.repository;

import com.example.back_end.entity.Lesson;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import java.util.Optional;

public interface InstructorQuizLessonRepository extends JpaRepository<Lesson, Integer> {

    // Khóa bài học trong quá trình tạo bộ trắc nghiệm
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT l FROM Lesson l WHERE l.lessonId = :lessonId")
    Optional<Lesson> findByIdForUpdate(@Param("lessonId") Integer lessonId);
}