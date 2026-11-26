package com.example.back_end.dto.response;

import lombok.*;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DraftQuestionResponse {
    private Integer id; // ID câu hỏi
    private String content; // Nội dung câu hỏi
    private List<String> options; // Danh sách phương án trả lời
    private Integer correctAnswer; // Vị trí đáp án đúng, bắt đầu từ 0
    private String explanation; // Lời giải thích đáp án
}