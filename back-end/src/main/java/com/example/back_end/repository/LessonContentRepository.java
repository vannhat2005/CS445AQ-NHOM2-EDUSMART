
package com.example.back_end.repository;

import com.example.back_end.entity.LessonContent;
import com.example.back_end.enumType.GeneralStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface LessonContentRepository
        extends JpaRepository<LessonContent, Integer> {

    // 1. Kiểm tra có nội dung bài học có Active nào không
    boolean existsByLesson_LessonIdAndStatus(Integer lessonId, GeneralStatus status);

    // 2. Kiểm tra có nội dung Active nào thiếu dữ liệu không
    @Query("""
        SELECT COUNT(lc) > 0
        FROM LessonContent lc
        WHERE lc.lesson.lessonId = :lessonId
        AND lc.status = :status
        AND (
            lc.title IS NULL OR TRIM(lc.title) = ''
            OR lc.contentType IS NULL
            OR lc.contentData IS NULL OR TRIM(lc.contentData) = ''
        )
    """)
    boolean existsInvalidActiveContent(
            @Param("lessonId") Integer lessonId,
            @Param("status") GeneralStatus status
    );
}
