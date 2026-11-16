package com.example.back_end.repository;



import com.example.back_end.entity.Chapter;
import com.example.back_end.enumType.GeneralStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ChapterRepository
        extends JpaRepository<Chapter, Integer> {

    // Đếm tổng số chương của một khóa học
    long countByCourse_CourseId(Integer courseId);

    //Lấy danh sách chương dựa theo ID của khóa học
    List<Chapter> findByCourse_CourseId(Integer courseId);

    // Đếm số lượng bài học có trạng thái ACTIVE trong một chương
    long countByCourse_CourseIdAndStatus(Integer courseId, GeneralStatus status);

    // Lấy danh sách chương theo ID khóa học và trạng thái(active/inactive)
    List<Chapter> findByCourse_CourseIdAndStatus(Integer courseId, GeneralStatus status);

    // Lấy danh sách chương theo ID khóa học và sắp xếp theo orderNumber tăng dần
    List<Chapter> findByCourse_CourseIdOrderByOrderNumAscChapterIdAsc(Integer courseId);

    // Lấy chương có thứ tự lớn nhất trong khóa học
    Optional<Chapter> findFirstByCourse_CourseIdOrderByOrderNumDescChapterIdDesc(Integer courseId);

    // Tìm chương theo chapterId và courseId
    Optional<Chapter> findByChapterIdAndCourse_CourseId(Integer chapterId, Integer courseId);

}
