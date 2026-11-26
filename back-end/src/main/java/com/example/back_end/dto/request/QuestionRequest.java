package com.example.back_end.dto.request;

import jakarta.validation.constraints.*;
import lombok.Data;
import java.util.List;

@Data
public class QuestionRequest {
    // Nội dung câu hỏi
    @NotBlank(message = "Nội dung câu hỏi không được để trống")
    private String content;

    // Danh sách 4 phương án trả lời
    @NotNull(message = "Danh sách phương án không được để trống")
    @Size(min = 4, max = 4, message = "Câu hỏi phải có đúng 4 phương án")
    private List<@NotBlank(message = "Phương án không được để trống") String> options;

    // Vị trí đáp án đúng, từ 0 đến 3
    @NotNull(message = "Vui lòng chọn đáp án đúng")
    @Min(value = 0, message = "Đáp án đúng không hợp lệ")
    @Max(value = 3, message = "Đáp án đúng không hợp lệ")
    private Integer correctAnswer;

    // Giải thích đáp án
    private String explanation;
}