package com.example.back_end.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InstructorDashboardResponse {

    private Long totalCourses;         // Tổng số khóa học được phân công
    private Long totalStudents;        // Tổng số học viên không trùng lặp
    private Long totalLessonQuizzes;   // Tổng số trắc nghiệm bài học đã xuất bản
    private Long totalChapterQuizzes;  // Tổng số bài kiểm tra cuối chương đã xuất bản
    private Long totalDrafts;          // Tổng số bài trắc nghiệm đang ở bản nháp

    // Danh sách tối đa 3 khóa học gần đây
    private List<RecentCourseResponse> recentCourses;
}