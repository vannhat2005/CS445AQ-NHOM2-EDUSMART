package com.example.back_end.repository;



import com.example.back_end.entity.Lesson;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface LessonRepository
        extends JpaRepository<Lesson, Integer> {

    // Đếm tổng số bài học thuộc một khóa học
    long countByChapter_Course_CourseId(Integer courseId);
}
