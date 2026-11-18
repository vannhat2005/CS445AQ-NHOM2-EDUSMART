
package com.example.back_end.dto.response;

import com.example.back_end.enumType.CourseStatus;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class AdminCourseResponse {
    private Integer courseId; // Mã khóa học
    private String title; // Tên khóa học
    private String description; // Mô tả khóa học
    private String learningOutcomes; // Mục tiêu học tập JSON
    private BigDecimal price; // Học phí
    private String imageUrl; // URL ảnh
    private Integer instructorId; // Mã giảng viên
    private String instructorName; // Tên giảng viên
    private Integer categoryId; // Mã danh mục
    private String categoryName; // Tên danh mục
    private CourseStatus status; // Trạng thái khóa học
    private LocalDateTime createdAt; // Ngày tạo
    private LocalDateTime updatedAt; // Ngày cập nhật
}
