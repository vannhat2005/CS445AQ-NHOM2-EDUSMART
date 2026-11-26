package com.example.back_end.agents;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

public class QueryModels {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class HistoryMessage {
        private String role;
        private String content;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ChatLessonRequest {
        private String message;
        private Integer lessonId;
        private Integer courseId;
        private List<HistoryMessage> history = new ArrayList<>();
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ChatQuizRequest {
        private String questionText;
        private List<String> options = new ArrayList<>();
        private String selectedOption;
        private Integer lessonId;
        private Integer courseId;
        private Integer questionId;
        private String userQuery;
        private Integer resultId;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class IngestPdfRequest {
        private String pdfFilename;
        private String pdfPath;
        private Integer lessonId;
        private Integer courseId;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CitationItem {
        private String source;
        private Object page;
        private Double score;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ChatResponse {
        @Builder.Default
        private boolean success = true;
        private String reply;
        @Builder.Default
        private List<CitationItem> citations = new ArrayList<>();
        private Integer lessonId;
        private String reasoning;
    }
}
