package com.example.back_end.dto.request;

import lombok.Data;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;

@Data
public class AiQuizGenerateRequest {
    private String title;
    private Integer chapterId;
    private Integer lessonId;
    private Integer timeLimit;
    private BigDecimal passingScore;
    private Integer questionCount;
    private String difficulty;
    private MultipartFile file;
}
