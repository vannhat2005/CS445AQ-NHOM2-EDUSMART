package com.example.back_end.repository;



import com.example.back_end.entity.Lesson;
import com.example.back_end.enumType.GeneralStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

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
}
