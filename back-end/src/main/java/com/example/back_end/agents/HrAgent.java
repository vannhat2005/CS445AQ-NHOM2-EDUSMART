package com.example.back_end.agents;

import org.springframework.stereotype.Component;

/**
 * HrAgent - Tương thích cấu trúc hiển thị theo sơ đồ tham khảo.
 * Kế thừa / ủy nhiệm cho EduAgent.
 */
@Component
public class HrAgent extends EduAgent {

    public HrAgent(
            com.example.back_end.config.AIProperties aiProperties,
            com.example.back_end.tools.LessonTool lessonTool,
            com.example.back_end.tools.QuizTool quizTool,
            com.fasterxml.jackson.databind.ObjectMapper objectMapper
    ) {
        super(aiProperties, lessonTool, quizTool, objectMapper);
    }
}
