package com.example.back_end.service.impl;

import com.example.back_end.dto.response.InstructorDashboardResponse;
import com.example.back_end.dto.response.RecentCourseResponse;
import com.example.back_end.entity.Course;
import com.example.back_end.enumType.QuizStatus;
import com.example.back_end.enumType.RegistrationStatus;
import com.example.back_end.repository.CourseRepository;
import com.example.back_end.repository.InstructorDashboardRepository;
import com.example.back_end.service.InstructorDashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class InstructorDashboardServiceImpl implements InstructorDashboardService {

    private final CourseRepository courseRepository;
    private final InstructorDashboardRepository dashboardRepository;

    // ==========================================
    // 1. LẤY THÔNG TIN DASHBOARD GIẢNG VIÊN
    // ==========================================

    @Override
    public InstructorDashboardResponse getDashboard() {

        // Lấy ID giảng viên đang đăng nhập
        Integer instructorId = getCurrentInstructorId();

        // Tổng số khóa học được phân công
        long totalCourses = courseRepository.countByInstructor_UserId(instructorId);

        // Tổng số học viên đã thanh toán thành công, không đếm trùng
        long totalStudents = dashboardRepository.countTotalStudents(
                instructorId, RegistrationStatus.Paid
        );

        // Tổng số bài trắc nghiệm bài học đã xuất bản
        long totalLessonQuizzes = dashboardRepository.countLessonQuizzes(
                instructorId, QuizStatus.Published
        );

        // Tổng số bài kiểm tra cuối chương đã xuất bản
        long totalChapterQuizzes = dashboardRepository.countChapterQuizzes(
                instructorId, QuizStatus.Published
        );

        // Tổng số bài trắc nghiệm và bài kiểm tra đang ở bản nháp
        long totalDrafts = dashboardRepository.countDrafts(
                instructorId, QuizStatus.Draft
        );

        // Lấy tối đa 3 khóa học gần đây nhất theo thời gian tạo giảm dần
        List<RecentCourseResponse> recentCourses = courseRepository
                .findTop3ByInstructor_UserIdOrderByCreatedAtDesc(instructorId)
                .stream()
                .map(this::toRecentCourseResponse)
                .toList();

        // Trả về toàn bộ thông tin thống kê trang chủ giảng viên
        return InstructorDashboardResponse.builder()
                .totalCourses(totalCourses)
                .totalStudents(totalStudents)
                .totalLessonQuizzes(totalLessonQuizzes)
                .totalChapterQuizzes(totalChapterQuizzes)
                .totalDrafts(totalDrafts)
                .recentCourses(recentCourses)
                .build();
    }

    // ==========================================
    // 2. LẤY ID GIẢNG VIÊN ĐANG ĐĂNG NHẬP
    // ==========================================

    private Integer getCurrentInstructorId() {

        // Lấy thông tin xác thực từ SecurityContext
        Authentication authentication = SecurityContextHolder
                .getContext().getAuthentication();

        // Kiểm tra người dùng đã đăng nhập hay chưa
        if (authentication == null || !authentication.isAuthenticated()
                || "anonymousUser".equals(authentication.getName())) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED, "Bạn chưa đăng nhập"
            );
        }

        // Lấy tên đăng nhập của tài khoản hiện tại
        String username = authentication.getName();

        // Tìm ID giảng viên thông qua tên đăng nhập
        return dashboardRepository.findInstructorIdByUsername(username)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Không tìm thấy tài khoản giảng viên"
                ));
    }

    // ==========================================
    // 3. CHUYỂN COURSE SANG RECENT COURSE RESPONSE
    // ==========================================

    private RecentCourseResponse toRecentCourseResponse(Course course) {

        // Lấy ID khóa học
        Integer courseId = course.getCourseId();

        // Tổng số học viên đã đăng ký và thanh toán thành công
        long totalStudents = dashboardRepository.countStudentsByCourse(
                courseId, RegistrationStatus.Paid
        );

        // Tổng số chương thuộc khóa học
        long totalChapters = dashboardRepository.countChaptersByCourse(courseId);

        // Tổng số bài học thuộc các chương của khóa học
        long totalLessons = dashboardRepository.countLessonsByCourse(courseId);

        // Sử dụng constructor của RecentCourseResponse có sẵn
        return new RecentCourseResponse(
                courseId,
                course.getTitle(),
                course.getImageUrl(),
                totalStudents,
                totalChapters,
                totalLessons
        );
    }
}