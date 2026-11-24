package com.example.back_end.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StudentQuizSubmitRequest {

    private Integer timeSpentSeconds;

    // questionId -> selectedAnswerId
    private Map<Integer, Integer> answers;

    private List<AnswerItem> selectedAnswers;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AnswerItem {
        private Integer questionId;
        private Integer answerId;
    }
}
