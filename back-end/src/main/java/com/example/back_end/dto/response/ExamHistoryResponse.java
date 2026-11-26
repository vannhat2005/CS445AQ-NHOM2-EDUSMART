package com.example.back_end.dto.response;

import lombok.*;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExamHistoryResponse {
    private Integer quizId;            // ID bài kiểm tra
    private String title;              // Tên bài kiểm tra
    private String type;               // LESSON_QUIZ hoặc CHAPTER_EXAM
    private Double score;              // Điểm cao nhất đạt được
    private Long attempts;             // Tổng số lần đã nộp bài
    private LocalDateTime submittedAt; // Thời gian nộp bài gần nhất
}