
package com.example.back_end.controller;

import com.example.back_end.dto.response.InstructorStatisticsResponse;
import com.example.back_end.dto.response.RecentCourseResponse;
import com.example.back_end.service.InstructorStatisticsService;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/instructor/dashboard")
@RequiredArgsConstructor
public class InstructorStatisticsController {

    private final InstructorStatisticsService instructorStatisticsService;

    /**
     * API: Lấy thống kê tổng quan của giảng viên.
     *
     * Phương thức: GET
     * URL: /api/instructor/dashboard/statistics/{instructorId}
     *
     * Chức năng:
     * - Thống kê tổng số khóa học được phân công cho giảng viên.
     * - Thống kê tổng số học viên của giảng viên.
     * - Thống kê tổng số bài trắc nghiệm thuộc các bài học.
     * - Thống kê tổng số bài kiểm tra cuối chương.
     * - Thống kê tổng số khóa học đang ở trạng thái Draft (bản nháp).
     *
     * Dữ liệu được lấy từ:
     * - CourseRepository: Đếm khóa học và bản nháp.
     * - CourseRegistrationRepository: Đếm học viên.
     * - QuizRepository: Đếm bài trắc nghiệm và bài kiểm tra cuối chương.
     *
     * @param instructorId ID của giảng viên cần thống kê.
     * @return ResponseEntity chứa InstructorStatisticsResponse
     *         với 5 chỉ số thống kê tổng quan và HTTP 200 OK.
     */
    @GetMapping("/statistics/{instructorId}")
    public ResponseEntity<InstructorStatisticsResponse> getStatistics(
            @PathVariable Integer instructorId
    ) {

        // Gọi Service để tính toán các chỉ số thống kê của giảng viên
        InstructorStatisticsResponse response =
                instructorStatisticsService.getStatistics(instructorId);

        // Trả về kết quả thống kê cho Dashboard giảng viên
        return ResponseEntity.ok(response);
    }

    /**
     * API: Lấy danh sách 3 khóa học gần đây nhất của giảng viên.
     *
     * Phương thức: GET
     * URL: /api/instructor/dashboard/recent-courses/{instructorId}
     *
     * Chức năng:
     * - Lấy tối đa 3 khóa học được tạo gần đây nhất của giảng viên.
     * - Sắp xếp khóa học theo thời gian tạo giảm dần.
     * - Lấy ID, tên và hình ảnh của từng khóa học.
     * - Thống kê tổng số học viên đăng ký của từng khóa học.
     * - Thống kê tổng số chương của từng khóa học.
     * - Thống kê tổng số bài học thuộc từng khóa học.
     *
     * Dữ liệu được lấy từ:
     * - CourseRepository: Lấy 3 khóa học mới nhất.
     * - CourseRegistrationRepository: Đếm học viên từng khóa học.
     * - ChapterRepository: Đếm số chương của từng khóa học.
     * - LessonRepository: Đếm số bài học của từng khóa học.
     *
     * @param instructorId ID của giảng viên cần lấy khóa học.
     * @return ResponseEntity chứa List<RecentCourseResponse>
     *         gồm tối đa 3 khóa học với các thông tin:
     *         courseId, title, imageUrl, totalStudents,
     *         totalChapters, totalLessons và HTTP 200 OK.
     */
    @GetMapping("/recent-courses/{instructorId}")
    public ResponseEntity<List<RecentCourseResponse>> getRecentCourses(
            @PathVariable Integer instructorId
    ) {

        // Gọi Service lấy 3 khóa học mới nhất và thống kê từng khóa
        List<RecentCourseResponse> recentCourses =
                instructorStatisticsService.getRecentCourses(instructorId);

        // Trả về danh sách khóa học gần đây cho Dashboard giảng viên
        return ResponseEntity.ok(recentCourses);
    }
}
