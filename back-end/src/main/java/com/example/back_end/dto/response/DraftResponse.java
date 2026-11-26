package com.example.back_end.dto.response;

import lombok.*;
import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DraftResponse {
    private Integer quizId; // ID bài trắc nghiệm
    private String title; // Tên bài trắc nghiệm
    private Integer courseId; // ID khóa học
    private String courseName; // Tên khóa học
    private Integer chapterId; // ID chương học
    private String chapterTitle; // Tên chương học
    private Integer chapterOrder; // Thứ tự chương học
    private Integer lessonId; // ID bài học, null nếu là kiểm tra cuối chương
    private String lessonTitle; // Tên bài học
    private Integer lessonOrder; // Thứ tự bài học
    private Long questionCount; // Tổng số câu hỏi
    private Integer timeLimit; // Thời gian làm bài, tính bằng phút
    private BigDecimal passingScore; // Điểm đạt yêu cầu
    private String status; // Trạng thái bài trắc nghiệm
    private List<DraftQuestionResponse> questions; // Danh sách câu hỏi khi xem chi tiết
}