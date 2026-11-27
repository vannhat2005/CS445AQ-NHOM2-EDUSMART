package com.example.back_end.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;
import java.math.BigDecimal;

@Data
public class QuizCreateRequest {
    // Tên bộ trắc nghiệm
    @NotBlank(message = "Tên trắc nghiệm không được để trống")
    @Size(max = 255, message = "Tên trắc nghiệm không được vượt quá 255 ký tự")
    private String title;

    // ID chương học
    private Integer chapterId;

    // ID bài học, null nếu là kiểm tra cuối chương
    private Integer lessonId;

    // Thời gian làm bài kiểm tra cuối chương
    private Integer timeLimit;

    // Điểm tối thiểu để vượt qua bài kiểm tra
    private BigDecimal passingScore;
}