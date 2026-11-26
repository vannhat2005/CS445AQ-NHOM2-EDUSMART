package com.example.back_end.dto.response;

import lombok.*;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StudentDetailResponse {

    // Thông tin cơ bản của sinh viên
    private Integer studentId;
    private String fullName;
    private String email;
    private String courseName;

    // Điểm trung bình
    private Double quizScore;
    private Double examScore;

    // Thống kê tiến độ học tập
    private int totalLessons;      // Tổng số bài học đang hoạt động
    private int totalQuizLessons;  // Tổng số bài học có trắc nghiệm hoạt động
    private int completedLessons;  // Số bài học đã hoàn thành
    private int pendingLessons;    // Số bài học có trắc nghiệm nhưng chưa hoàn thành
    private int noQuizLessons;     // Số bài học chưa có trắc nghiệm hoạt động
    private double progress;       // Phần trăm tiến độ học tập

    // Danh sách trạng thái từng bài học
    private List<LessonProgressResponse> lessonProgress;

    // Lịch sử trắc nghiệm và kiểm tra cuối chương
    private List<ExamHistoryResponse> examHistory;
}