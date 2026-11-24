package com.example.back_end.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StudentQuizDetailResponse {

    private Integer quizId;
    private String title;

    private Integer courseId;
    private String courseTitle;

    private Integer chapterId;
    private String chapterTitle;

    private Integer lessonId;
    private String lessonTitle;

    private Boolean isTimed; // true nếu là bài kiểm tra cuối chương, false nếu là bài thường
    private Integer timeLimit; // Thời lượng phút, ví dụ: 45
    private Integer totalQuestions;
    private Integer passPercentage; // Mặc định 70%

    private List<QuestionItem> questions;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class QuestionItem {
        private Integer questionId;
        private Integer questionNumber;
        private String content;
        private String codeSnippet;
        private String codeLanguage;
        private BigDecimal points;
        private String explanation;
        private List<OptionItem> options;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class OptionItem {
        private Integer answerId;
        private String label; // "A", "B", "C", "D"
        private String title;
        private String description;
    }
}
