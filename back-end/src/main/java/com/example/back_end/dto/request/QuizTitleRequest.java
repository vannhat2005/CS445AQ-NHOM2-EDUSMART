package com.example.back_end.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class QuizTitleRequest {
    // Tên mới của bộ trắc nghiệm
    @NotBlank(message = "Tên trắc nghiệm không được để trống")
    @Size(max = 255, message = "Tên trắc nghiệm không được vượt quá 255 ký tự")
    private String title;
}