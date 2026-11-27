package com.example.back_end.dto.response;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InstructorScoreDistributionResponse {
    private Integer score;       // Mức điểm từ 0 đến 10
    private Long lessonQuiz;     // Số lượt nộp trắc nghiệm bài học
    private Long chapterExam;    // Số lượt nộp kiểm tra cuối chương
    private Long count;          // Tổng số lượt nộp tại mức điểm
}