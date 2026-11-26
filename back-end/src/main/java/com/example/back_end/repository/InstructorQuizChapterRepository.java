package com.example.back_end.repository;

import com.example.back_end.entity.Chapter;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import java.util.Optional;

public interface InstructorQuizChapterRepository extends JpaRepository<Chapter, Integer> {

    // Khóa chương học trong quá trình tạo bài kiểm tra cuối chương
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT c FROM Chapter c WHERE c.chapterId = :chapterId")
    Optional<Chapter> findByIdForUpdate(@Param("chapterId") Integer chapterId);
}