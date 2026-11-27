package com.example.back_end.dto.response;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CourseStudentPageResponse {
    private Integer courseId;   // ID khóa học
    private String courseName;  // Tên khóa học
    private Long totalStudents; // Tổng số sinh viên đã ghi danh

    // Danh sách sinh viên sau khi tìm kiếm và phân trang
    private PageResponse<StudentListResponse> students;
}