package com.example.back_end.dto.response;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StudentListResponse {
    private Integer studentId; // ID sinh viên
    private String fullName;   // Họ và tên sinh viên
    private String email;      // Email sinh viên
    private Double quizScore;  // Điểm trung bình trắc nghiệm bài học
    private Double examScore;  // Điểm trung bình kiểm tra cuối chương
}