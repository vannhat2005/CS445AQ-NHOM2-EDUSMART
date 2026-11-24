package com.example.back_end.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StudentQuizSubmitResponse {

    private Integer resultId;
    private Integer quizId;
    private String quizTitle;

    private Integer courseId;
    private String courseTitle;
    private Integer chapterId;
    private String chapterTitle;
    private Integer lessonId;
    private String lessonTitle;

    private Boolean isTimed;
    private Integer timeLimit;
    private Integer timeSpentSeconds;

    private BigDecimal score; // Thang điểm 10.0
    private Integer totalQuestions;
    private Integer correctCount;
    private Integer incorrectCount;
    private Integer unansweredCount;

    private Boolean passed;
    private BigDecimal percentage; // Ví dụ: 85.0%

    private String message;
    private LocalDateTime submittedAt;

    private List<QuestionFeedback> feedback;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class QuestionFeedback {
        private Integer questionId;
        private Integer selectedAnswerId;
        private Integer correctAnswerId;
        private Boolean isCorrect;
        private String explanation;
        private String topic;
    }
}
