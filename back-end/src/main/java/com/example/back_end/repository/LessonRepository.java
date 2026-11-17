package com.example.back_end.repository;



import com.example.back_end.entity.Lesson;
import com.example.back_end.enumType.GeneralStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface LessonRepository
        extends JpaRepository<Lesson, Integer> {

    // Đếm tổng số bài học thuộc một khóa học
    long countByChapter_Course_CourseId(Integer courseId);

    // Đếm tổng số bài học thuộc một chương
    long countByChapter_ChapterId(Integer chapterId);

    // Đếm số lượng bài học có trạng thái ACTIVE trong một chương
    long countByChapter_ChapterIdAndStatus(Integer chapterId, GeneralStatus status);

    // Lấy danh sách bài học Active trong một chương
    List<Lesson> findByChapter_ChapterIdAndStatus(
            Integer chapterId,
            GeneralStatus status
    );

    List<Lesson> findByChapter_ChapterIdOrderByOrderNumAsc(
            Integer chapterId
    );
    // Lấy danh sách bài học trong một chương
    List<Lesson> findByChapter_ChapterId(Integer chapterId);

    // Lấy danh sách bài học theo thứ tự tăng dần, dùng cho GET và di chuyển bài học
    List<Lesson> findByChapter_ChapterIdOrderByOrderNumAscLessonIdAsc(Integer chapterId);

    // Lấy bài học có thứ tự lớn nhất để xác định orderNum cho bài học mới
    Optional<Lesson> findFirstByChapter_ChapterIdOrderByOrderNumDescLessonIdDesc(Integer chapterId);

    // Tìm bài học theo ID và kiểm tra bài học thuộc đúng chương
    Optional<Lesson> findByLessonIdAndChapter_ChapterId(Integer lessonId, Integer chapterId);

    // Đếm số bài học theo trạng thái trong toàn bộ khóa học
    long countByChapter_Course_CourseIdAndStatus(Integer courseId, GeneralStatus status);
}
