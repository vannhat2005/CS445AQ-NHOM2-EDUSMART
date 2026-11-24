
package com.example.back_end.repository;

import com.example.back_end.entity.LessonContent;
import com.example.back_end.enumType.GeneralStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

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

    // Lấy danh sách nội dung theo thứ tự tăng dần
    List<LessonContent> findByLesson_LessonIdOrderByOrderNumAscContentIdAsc(Integer lessonId);

    // Lấy nội dung có thứ tự lớn nhất để thêm nội dung mới
    Optional<LessonContent> findFirstByLesson_LessonIdOrderByOrderNumDescContentIdDesc(Integer lessonId);

    // Tìm nội dung theo ID và kiểm tra nội dung thuộc bài học
    Optional<LessonContent> findByContentIdAndLesson_LessonId(Integer contentId, Integer lessonId);

    // Tìm nội dung video theo tên file trong URL contentData
    Optional<LessonContent> findFirstByContentDataContaining(String fileName);

    @Query("""
        SELECT lc
        FROM LessonContent lc
        WHERE lc.lesson.lessonId = :lessonId
        ORDER BY lc.orderNum ASC, lc.contentId ASC
    """)
    List<LessonContent> findContentsByLessonId(
            @Param("lessonId") Integer lessonId
    );
}
