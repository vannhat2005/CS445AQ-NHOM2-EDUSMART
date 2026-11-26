package com.example.back_end.dto.response;

import lombok.*;
import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InstructorReportResponse {
    private Long totalStudents;              // Tổng số học viên khác nhau
    private Long totalRegistrations;         // Tổng lượt đăng ký khóa học hợp lệ
    private Long completedRegistrations;     // Số lượt đăng ký đã hoàn thành khóa học
    private BigDecimal completionRate;       // Tỷ lệ hoàn thành khóa học
    private BigDecimal averageScore;         // Điểm trung bình
    private Long totalSubmissions;           // Tổng lượt nộp bài kiểm tra
    private Long lessonQuizSubmissions;      // Lượt nộp trắc nghiệm bài học
    private Long chapterExamSubmissions;     // Lượt nộp kiểm tra cuối chương
    private Boolean hasCourses;              // Có khóa học được phân công hay không
    private Boolean hasStatistics;           // Có dữ liệu thống kê trước khi lọc hay không
    private Boolean hasResults;              // Có kết quả phù hợp bộ lọc hay không
    private List<InstructorScoreDistributionResponse> scoreDistribution; // Phân bố điểm
}