package com.example.back_end.service.impl;

import com.example.back_end.dto.response.InstructorReportResponse;
import com.example.back_end.dto.response.InstructorReportFilterResponse;
import com.example.back_end.dto.response.InstructorScoreDistributionResponse;
import com.example.back_end.exception.AppException;
import com.example.back_end.exception.ErrorCode;
import com.example.back_end.repository.InstructorReportRepository;
import com.example.back_end.service.InstructorReportService;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class InstructorReportServiceImpl implements InstructorReportService {

    private final InstructorReportRepository instructorReportRepository;

    // Múi giờ sử dụng khi thống kê theo ngày tại Việt Nam
    private static final ZoneId REPORT_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");

    // Danh sách loại đánh giá hợp lệ
    private static final Set<String> ASSESSMENT_TYPES = Set.of("all", "quiz", "final");

    // Danh sách bộ lọc thời gian hợp lệ
    private static final Set<String> TIME_RANGES = Set.of("all", "7d", "30d", "90d", "custom");

    // ==================== 1. LẤY DANH SÁCH KHÓA HỌC ====================

    @Override
    public List<InstructorReportFilterResponse> getCourses(Integer instructorId) {
        return instructorReportRepository.findInstructorCourses(instructorId)
                .stream()
                .map(row -> InstructorReportFilterResponse.builder()
                        .courseId(toInteger(row[0]))
                        .title((String) row[1])
                        .build())
                .toList();
    }

    // ==================== 2. LẤY DANH SÁCH CHƯƠNG HỌC ====================

    @Override
    public List<InstructorReportFilterResponse> getChapters(Integer instructorId, Integer courseId) {

        // Bắt buộc chọn khóa học trước khi lọc chương học
        if (courseId == null) {
            throw new AppException(ErrorCode.REPORT_COURSE_REQUIRED);
        }

        // Kiểm tra khóa học thuộc giảng viên
        validateCourse(instructorId, courseId);

        // Lấy danh sách chương học thuộc khóa học được chọn
        return instructorReportRepository.findInstructorChapters(instructorId, courseId)
                .stream()
                .map(row -> InstructorReportFilterResponse.builder()
                        .courseId(courseId)
                        .chapterId(toInteger(row[0]))
                        .title((String) row[1])
                        .build())
                .toList();
    }

    // ==================== 3. LẤY BÁO CÁO THỐNG KÊ ====================

    @Override
    public InstructorReportResponse getReport(Integer instructorId, Integer courseId,
                                              Integer chapterId, String assessmentType,
                                              String timeRange, LocalDate fromDate, LocalDate toDate) {

        // Thiết lập giá trị mặc định của bộ lọc
        assessmentType = assessmentType == null ? "all" : assessmentType;
        timeRange = timeRange == null ? "all" : timeRange;

        // Kiểm tra tính hợp lệ của bộ lọc
        validateFilters(instructorId, courseId, chapterId, assessmentType, timeRange);

        // Xác định khoảng thời gian cần thống kê
        ReportDateRange dateRange = resolveDateRange(timeRange, fromDate, toDate);

        // Kiểm tra giảng viên có khóa học được phân công hay không
        boolean hasCourses = instructorReportRepository.countInstructorCourses(instructorId) > 0;

        // Trả về báo cáo rỗng nếu chưa có khóa học
        if (!hasCourses) {
            return createEmptyReport();
        }

        // ==================== 3.1. THỐNG KÊ HỌC VIÊN ====================

        // Tổng số học viên khác nhau đã thanh toán thành công
        long totalStudents = instructorReportRepository.countTotalStudents(instructorId, courseId);

        // Tổng số cặp học viên - khóa học đăng ký hợp lệ
        long totalRegistrations = instructorReportRepository.countTotalRegistrations(instructorId, courseId);

        // Số lượt đăng ký đã hoàn thành toàn bộ bài kiểm tra Published
        // Bao gồm cả trắc nghiệm bài học và kiểm tra cuối chương
        // Không yêu cầu học viên phải đạt điểm tối thiểu
        long completedRegistrations = instructorReportRepository.countCompletedRegistrations(instructorId, courseId);

        // Tính tỷ lệ hoàn thành khóa học
        BigDecimal completionRate = calculatePercentage(completedRegistrations, totalRegistrations);

        // ==================== 3.2. THỐNG KÊ KẾT QUẢ ĐÁNH GIÁ ====================

        // Kiểm tra có dữ liệu thống kê trước khi áp dụng bộ lọc hay không
        boolean hasStatistics = instructorReportRepository.countAllAssessmentResults(instructorId) > 0;

        // Lấy kết quả đánh giá theo khóa học, chương học, loại đánh giá và thời gian
        List<Object[]> assessmentStatistics = instructorReportRepository.findAssessmentStatistics(
                instructorId, courseId, chapterId, assessmentType,
                dateRange.fromDate(), dateRange.toDate());

        // Khởi tạo các giá trị thống kê mặc định
        long totalSubmissions = 0;
        long lessonQuizSubmissions = 0;
        long chapterExamSubmissions = 0;
        BigDecimal averageScore = BigDecimal.ZERO.setScale(1);

        // Đọc dữ liệu thống kê trả về từ Repository
        if (!assessmentStatistics.isEmpty()) {
            Object[] row = assessmentStatistics.get(0);
            totalSubmissions = toLong(row[0]);
            averageScore = toBigDecimal(row[1]).setScale(1, RoundingMode.HALF_UP);
            lessonQuizSubmissions = toLong(row[2]);
            chapterExamSubmissions = toLong(row[3]);
        }

        // ==================== 3.3. THỐNG KÊ PHÂN BỐ ĐIỂM ====================

        // Khởi tạo đầy đủ 11 mức điểm từ 0 đến 10
        List<InstructorScoreDistributionResponse> scoreDistribution = createEmptyScoreDistribution();

        // Lấy dữ liệu phân bố điểm theo bộ lọc
        List<Object[]> scoreRows = instructorReportRepository.findScoreDistribution(
                instructorId, courseId, chapterId, assessmentType,
                dateRange.fromDate(), dateRange.toDate());

        // Gán số lượt nộp bài vào từng mức điểm tương ứng
        for (Object[] row : scoreRows) {
            int score = toInteger(row[0]);

            // Bỏ qua mức điểm không hợp lệ
            if (score < 0 || score > 10) continue;

            scoreDistribution.set(score, InstructorScoreDistributionResponse.builder()
                    .score(score)
                    .lessonQuiz(toLong(row[1]))
                    .chapterExam(toLong(row[2]))
                    .count(toLong(row[3]))
                    .build());
        }

        // ==================== 3.4. TRẢ VỀ KẾT QUẢ ====================

        return InstructorReportResponse.builder()
                .totalStudents(totalStudents)
                .totalRegistrations(totalRegistrations)
                .completedRegistrations(completedRegistrations)
                .completionRate(completionRate)
                .averageScore(averageScore)
                .totalSubmissions(totalSubmissions)
                .lessonQuizSubmissions(lessonQuizSubmissions)
                .chapterExamSubmissions(chapterExamSubmissions)
                .hasCourses(true)
                .hasStatistics(hasStatistics)
                .hasResults(totalSubmissions > 0)
                .scoreDistribution(scoreDistribution)
                .build();
    }

    // ==================== 4. KIỂM TRA BỘ LỌC ====================

    private void validateFilters(Integer instructorId, Integer courseId, Integer chapterId,
                                 String assessmentType, String timeRange) {

        // Không cho phép lọc chương khi chưa chọn khóa học
        if (chapterId != null && courseId == null) {
            throw new AppException(ErrorCode.REPORT_COURSE_REQUIRED);
        }

        // Kiểm tra khóa học có thuộc giảng viên hay không
        if (courseId != null) {
            validateCourse(instructorId, courseId);
        }

        // Kiểm tra chương học thuộc đúng khóa học được chọn
        if (chapterId != null && instructorReportRepository
                .countOwnedChapter(instructorId, courseId, chapterId) == 0) {
            throw new AppException(ErrorCode.REPORT_CHAPTER_NOT_FOUND);
        }

        // Kiểm tra loại đánh giá hợp lệ
        if (!ASSESSMENT_TYPES.contains(assessmentType)) {
            throw new AppException(ErrorCode.REPORT_INVALID_ASSESSMENT_TYPE);
        }

        // Kiểm tra loại thời gian hợp lệ
        if (!TIME_RANGES.contains(timeRange)) {
            throw new AppException(ErrorCode.REPORT_INVALID_TIME_RANGE);
        }
    }

    // Kiểm tra quyền sở hữu khóa học của giảng viên
    private void validateCourse(Integer instructorId, Integer courseId) {
        if (instructorReportRepository.countOwnedCourse(instructorId, courseId) == 0) {
            throw new AppException(ErrorCode.REPORT_COURSE_NOT_FOUND);
        }
    }

    // ==================== 5. XỬ LÝ BỘ LỌC THỜI GIAN ====================

    private ReportDateRange resolveDateRange(String timeRange, LocalDate fromDate, LocalDate toDate) {

        // Lấy ngày hiện tại theo múi giờ Việt Nam
        LocalDate today = LocalDate.now(REPORT_ZONE);

        return switch (timeRange) {

            // Thống kê toàn thời gian
            case "all" -> new ReportDateRange(null, null);

            // Thống kê 7 ngày gần nhất, bao gồm ngày hiện tại
            case "7d" -> new ReportDateRange(
                    today.minusDays(6).atStartOfDay(),
                    today.plusDays(1).atStartOfDay());

            // Thống kê 30 ngày gần nhất
            case "30d" -> new ReportDateRange(
                    today.minusDays(29).atStartOfDay(),
                    today.plusDays(1).atStartOfDay());

            // Thống kê 90 ngày gần nhất
            case "90d" -> new ReportDateRange(
                    today.minusDays(89).atStartOfDay(),
                    today.plusDays(1).atStartOfDay());

            // Thống kê theo khoảng ngày tùy chỉnh
            case "custom" -> {

                // Kiểm tra đã chọn đầy đủ ngày bắt đầu và ngày kết thúc
                if (fromDate == null || toDate == null) {
                    throw new AppException(ErrorCode.REPORT_DATE_REQUIRED);
                }

                // Kiểm tra ngày bắt đầu không lớn hơn ngày kết thúc
                if (fromDate.isAfter(toDate)) {
                    throw new AppException(ErrorCode.REPORT_INVALID_DATE_RANGE);
                }

                // Không cho phép chọn ngày trong tương lai
                if (fromDate.isAfter(today) || toDate.isAfter(today)) {
                    throw new AppException(ErrorCode.REPORT_FUTURE_DATE);
                }

                // Cộng thêm một ngày để lấy toàn bộ dữ liệu của ngày kết thúc
                yield new ReportDateRange(
                        fromDate.atStartOfDay(),
                        toDate.plusDays(1).atStartOfDay());
            }

            default -> throw new AppException(ErrorCode.REPORT_INVALID_TIME_RANGE);
        };
    }

    // Đối tượng lưu khoảng thời gian bắt đầu và kết thúc
    private record ReportDateRange(LocalDateTime fromDate, LocalDateTime toDate) {}

    // ==================== 6. KHỞI TẠO DỮ LIỆU RỖNG ====================

    // Khởi tạo đầy đủ các mức điểm từ 0 đến 10
    private List<InstructorScoreDistributionResponse> createEmptyScoreDistribution() {
        List<InstructorScoreDistributionResponse> result = new ArrayList<>();

        for (int score = 0; score <= 10; score++) {
            result.add(InstructorScoreDistributionResponse.builder()
                    .score(score)
                    .lessonQuiz(0L)
                    .chapterExam(0L)
                    .count(0L)
                    .build());
        }

        return result;
    }

    // Khởi tạo báo cáo rỗng khi giảng viên chưa có khóa học
    private InstructorReportResponse createEmptyReport() {
        return InstructorReportResponse.builder()
                .totalStudents(0L)
                .totalRegistrations(0L)
                .completedRegistrations(0L)
                .completionRate(BigDecimal.ZERO.setScale(1))
                .averageScore(BigDecimal.ZERO.setScale(1))
                .totalSubmissions(0L)
                .lessonQuizSubmissions(0L)
                .chapterExamSubmissions(0L)
                .hasCourses(false)
                .hasStatistics(false)
                .hasResults(false)
                .scoreDistribution(createEmptyScoreDistribution())
                .build();
    }

    // ==================== 7. CÁC HÀM HỖ TRỢ ====================

    // Tính tỷ lệ phần trăm và làm tròn một chữ số thập phân
    private BigDecimal calculatePercentage(long value, long total) {
        if (total == 0) return BigDecimal.ZERO.setScale(1);

        return BigDecimal.valueOf(value)
                .multiply(BigDecimal.valueOf(100))
                .divide(BigDecimal.valueOf(total), 1, RoundingMode.HALF_UP);
    }

    // Chuyển kết quả truy vấn sang Integer
    private Integer toInteger(Object value) {
        return value == null ? 0 : ((Number) value).intValue();
    }

    // Chuyển kết quả truy vấn sang Long
    private Long toLong(Object value) {
        return value == null ? 0L : ((Number) value).longValue();
    }

    // Chuyển kết quả truy vấn sang BigDecimal
    private BigDecimal toBigDecimal(Object value) {
        return value == null ? BigDecimal.ZERO : new BigDecimal(value.toString());
    }
}