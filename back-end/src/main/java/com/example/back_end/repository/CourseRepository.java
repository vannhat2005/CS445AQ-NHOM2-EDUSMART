package com.example.back_end.repository;

import com.example.back_end.entity.Course;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CourseRepository extends JpaRepository<Course, Integer> {
    // Lấy danh sách khóa học dựa theo ID của giảng viên (instructor)
    Page<Course> findByInstructor_UserId(Integer instructorId, Pageable pageable);
}