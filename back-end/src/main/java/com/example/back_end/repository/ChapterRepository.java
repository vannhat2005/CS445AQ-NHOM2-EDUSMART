package com.example.back_end.repository;



import com.example.back_end.entity.Chapter;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ChapterRepository
        extends JpaRepository<Chapter, Integer> {

    // Đếm tổng số chương của một khóa học
    long countByCourse_CourseId(Integer courseId);
}
