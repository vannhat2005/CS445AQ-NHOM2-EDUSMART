package com.example.back_end.service.impl;

import com.example.back_end.dto.response.*;
import com.example.back_end.entity.Course;
import com.example.back_end.entity.User;
import com.example.back_end.entity.Lesson;
import com.example.back_end.enumType.QuizStatus;
import com.example.back_end.enumType.GeneralStatus;
import com.example.back_end.enumType.RegistrationStatus;
import com.example.back_end.exception.AppException;
import com.example.back_end.exception.ErrorCode;
import com.example.back_end.repository.InstructorStudentRepository;
import com.example.back_end.repository.InstructorStudentRepository.QuizStatistic;
import com.example.back_end.service.InstructorStudentService;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.HashSet;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class InstructorStudentServiceImpl implements InstructorStudentService {

    private final InstructorStudentRepository instructorStudentRepository;

    // Trạng thái đăng ký khóa học thành công
    private static final RegistrationStatus ENROLLED_STATUS = RegistrationStatus.Paid;

    // Trạng thái trắc nghiệm đã xuất bản
    private static final QuizStatus AVAILABLE_QUIZ_STATUS = QuizStatus.Published;

    // ==================================================
    // 1. LẤY DANH SÁCH SINH VIÊN
    // ==================================================
    @Override
    public CourseStudentPageResponse getStudents(Integer instructorId, Integer courseId, String keyword, int pageNo, int pageSize) {

        // Bước 1: Kiểm tra quyền truy cập và lấy thông tin khóa học
        Course course = validateInstructorCourse(instructorId, courseId);

        // Bước 2: Kiểm tra dữ liệu phân trang
        if (pageNo < 1 || pageSize < 1 || pageSize > 100) {
            throw new AppException(ErrorCode.INVALID_PAGINATION);
        }

        // Bước 3: Chuẩn hóa từ khóa tìm kiếm
        keyword = normalizeKeyword(keyword);

        // Bước 4: Tạo Pageable, Spring Data JPA bắt đầu từ trang 0
        Pageable pageable = PageRequest.of(pageNo - 1, pageSize);

        // Bước 5: Lấy danh sách sinh viên đã ghi danh
        Page<User> studentPage = instructorStudentRepository.findStudents(
                courseId, ENROLLED_STATUS, keyword, pageable);

        // Bước 6: Lấy kết quả kiểm tra của tất cả sinh viên trong trang hiện tại
        Map<Integer, List<QuizStatistic>> statistics = getStatistics(courseId, studentPage.getContent());

        // Bước 7: Chuyển Entity User sang StudentListResponse
        Page<StudentListResponse> responsePage = studentPage.map(student ->
                toStudentResponse(student, statistics.getOrDefault(student.getUserId(), List.of())));

        // Bước 8: Đếm tổng số sinh viên của khóa học, không phụ thuộc từ khóa
        long totalStudents = instructorStudentRepository.countStudents(courseId, ENROLLED_STATUS);

        // Bước 9: Trả về thông tin khóa học và danh sách sinh viên
        return CourseStudentPageResponse.builder()
                .courseId(course.getCourseId())
                .courseName(course.getTitle())
                .totalStudents(totalStudents)
                .students(PageResponse.of(responsePage))
                .build();
    }

    // ==================================================
    // 2. XEM CHI TIẾT SINH VIÊN VÀ TIẾN ĐỘ HỌC TẬP
    // ==================================================
    @Override
    public StudentDetailResponse getStudentDetail(Integer instructorId, Integer courseId, Integer studentId) {

        // Bước 1: Kiểm tra khóa học thuộc giảng viên đang đăng nhập
        Course course = validateInstructorCourse(instructorId, courseId);

        // Bước 2: Kiểm tra sinh viên đã ghi danh vào khóa học
        User student = instructorStudentRepository.findEnrolledStudent(courseId, studentId, ENROLLED_STATUS)
                .orElseThrow(() -> new AppException(ErrorCode.ENROLLMENT_NOT_FOUND));

        // Bước 3: Lấy kết quả các bài kiểm tra đã nộp của sinh viên
        // Bao gồm trắc nghiệm bài học và kiểm tra cuối chương
        List<QuizStatistic> statistics = instructorStudentRepository.findQuizStatistics(courseId, List.of(studentId));

        // Bước 4: Chuyển dữ liệu thống kê sang danh sách lịch sử kiểm tra
        List<ExamHistoryResponse> examHistory = statistics.stream()
                .map(statistic -> ExamHistoryResponse.builder()
                        .quizId(statistic.getQuizId())
                        .title(statistic.getTitle())
                        .type(statistic.getLessonId() != null ? "LESSON_QUIZ" : "CHAPTER_EXAM")
                        .score(statistic.getScore().doubleValue())
                        .attempts(statistic.getAttempts())
                        .submittedAt(statistic.getSubmittedAt())
                        .build())
                .toList();

        // Bước 5: Lấy danh sách tiến độ học tập của sinh viên
        List<LessonProgressResponse> lessonProgress = getLessonProgress(courseId, studentId);

        // Bước 6: Thống kê số lượng bài học

        // Tổng số bài học đang hoạt động
        int totalLessons = lessonProgress.size();

        // Tổng số bài học có trắc nghiệm đã xuất bản
        int totalQuizLessons = (int) lessonProgress.stream()
                .filter(LessonProgressResponse::isHasQuiz)
                .count();

        // Tổng số bài học đã hoàn thành
        int completedLessons = (int) lessonProgress.stream()
                .filter(LessonProgressResponse::isCompleted)
                .count();

        // Số bài học có trắc nghiệm nhưng sinh viên chưa nộp bài
        int pendingLessons = totalQuizLessons - completedLessons;

        // Số bài học chưa có trắc nghiệm đã xuất bản
        int noQuizLessons = totalLessons - totalQuizLessons;

        // Bước 7: Tính phần trăm tiến độ học tập
        // Chỉ tính những bài học có trắc nghiệm Published
        // Không đưa bài học chưa có trắc nghiệm vào mẫu số
        double progress = totalQuizLessons == 0 ? 0 :
                Math.round(completedLessons * 1000.0 / totalQuizLessons) / 10.0;

        // Bước 8: Trả về thông tin chi tiết sinh viên
        return StudentDetailResponse.builder()
                .studentId(student.getUserId())
                .fullName(student.getFullName())
                .email(student.getEmail())
                .courseName(course.getTitle())
                .quizScore(calculateAverage(statistics, true))
                .examScore(calculateAverage(statistics, false))
                .totalLessons(totalLessons)
                .totalQuizLessons(totalQuizLessons)
                .completedLessons(completedLessons)
                .pendingLessons(pendingLessons)
                .noQuizLessons(noQuizLessons)
                .progress(progress)
                .lessonProgress(lessonProgress)
                .examHistory(examHistory)
                .build();
    }

    // ==================================================
    // 3. XUẤT DANH SÁCH SINH VIÊN RA EXCEL
    // ==================================================
    @Override
    public byte[] exportStudents(Integer instructorId, Integer courseId, String keyword) {

        // Bước 1: Kiểm tra quyền truy cập khóa học
        Course course = validateInstructorCourse(instructorId, courseId);

        // Bước 2: Lấy toàn bộ sinh viên phù hợp với từ khóa, không phân trang
        List<User> students = instructorStudentRepository.findStudents(
                courseId, ENROLLED_STATUS, normalizeKeyword(keyword), Pageable.unpaged()).getContent();

        // Bước 3: Lấy kết quả kiểm tra của các sinh viên
        Map<Integer, List<QuizStatistic>> statistics = getStatistics(courseId, students);

        // Bước 4: Khởi tạo file Excel
        try (Workbook workbook = new XSSFWorkbook();
             ByteArrayOutputStream outputStream = new ByteArrayOutputStream()) {

            Sheet sheet = workbook.createSheet("Danh sách sinh viên");

            // Tạo tiêu đề khóa học
            Row titleRow = sheet.createRow(0);
            titleRow.createCell(0).setCellValue("Khóa học: " + course.getTitle());

            // Tạo dòng tổng số sinh viên được xuất
            Row totalRow = sheet.createRow(1);
            totalRow.createCell(0).setCellValue("Tổng số sinh viên: " + students.size());

            // Tạo định dạng tiêu đề bảng
            CellStyle headerStyle = workbook.createCellStyle();
            Font headerFont = workbook.createFont();
            headerFont.setBold(true);
            headerFont.setColor(IndexedColors.WHITE.getIndex());
            headerStyle.setFont(headerFont);
            headerStyle.setFillForegroundColor(IndexedColors.DARK_BLUE.getIndex());
            headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            headerStyle.setAlignment(HorizontalAlignment.CENTER);

            // Tạo định dạng điểm số có một chữ số thập phân
            CellStyle scoreStyle = workbook.createCellStyle();
            scoreStyle.setDataFormat(workbook.createDataFormat().getFormat("0.0"));

            // Khai báo các cột trong file Excel
            String[] headers = {
                    "STT", "Mã sinh viên", "Họ và tên", "Email",
                    "Điểm trắc nghiệm TB", "Điểm KT cuối chương TB"
            };

            // Tạo dòng tiêu đề bảng tại dòng thứ 4
            Row headerRow = sheet.createRow(3);
            for (int i = 0; i < headers.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerStyle);
            }

            // Bước 5: Ghi thông tin từng sinh viên vào Excel
            int rowIndex = 4;
            int stt = 1;

            for (User student : students) {
                StudentListResponse response = toStudentResponse(
                        student, statistics.getOrDefault(student.getUserId(), List.of()));

                Row row = sheet.createRow(rowIndex++);
                row.createCell(0).setCellValue(stt++);
                row.createCell(1).setCellValue(response.getStudentId());
                row.createCell(2).setCellValue(response.getFullName());
                row.createCell(3).setCellValue(response.getEmail());

                // Ghi điểm, nếu chưa làm bài thì hiển thị --
                writeScore(row.createCell(4), response.getQuizScore(), scoreStyle);
                writeScore(row.createCell(5), response.getExamScore(), scoreStyle);
            }

            // Bước 6: Điều chỉnh độ rộng các cột
            for (int i = 0; i < headers.length; i++) {
                sheet.autoSizeColumn(i);
                sheet.setColumnWidth(i, Math.min(sheet.getColumnWidth(i) + 1024, 15000));
            }

            // Cố định phần tiêu đề bảng khi cuộn xuống
            sheet.createFreezePane(0, 4);

            // Bước 7: Chuyển file Excel thành mảng byte để trả về Frontend
            workbook.write(outputStream);
            return outputStream.toByteArray();

        } catch (IOException e) {
            // GlobalExceptionHandler sẽ ghi log và trả lỗi hệ thống
            throw new IllegalStateException("Không thể tạo file Excel", e);
        }
    }

    // ==================================================
    // 4. CÁC PHƯƠNG THỨC HỖ TRỢ
    // ==================================================

    // Kiểm tra ID giảng viên và quyền sở hữu khóa học
    private Course validateInstructorCourse(Integer instructorId, Integer courseId) {

        // Lấy thông tin tài khoản đang đăng nhập từ Spring Security
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        // Kiểm tra người dùng đã đăng nhập hay chưa
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new AppException(ErrorCode.ACCESS_DENIED);
        }

        // Lấy username của tài khoản đang đăng nhập
        String username = authentication.getName();

        // Đối chiếu instructorId từ Frontend với tài khoản đang đăng nhập
        if (instructorStudentRepository.countAuthenticatedInstructor(instructorId, username) == 0) {
            throw new AppException(ErrorCode.ACCESS_DENIED);
        }

        // Kiểm tra khóa học có thuộc giảng viên này hay không
        return instructorStudentRepository.findInstructorCourse(courseId, instructorId)
                .orElseThrow(() -> new AppException(ErrorCode.COURSE_NOT_FOUND));
    }

    // Chuẩn hóa từ khóa, tránh lỗi khi Frontend gửi null
    private String normalizeKeyword(String keyword) {
        return keyword == null ? "" : keyword.trim();
    }

    // Lấy kết quả kiểm tra của nhiều sinh viên và nhóm theo ID sinh viên
    private Map<Integer, List<QuizStatistic>> getStatistics(Integer courseId, List<User> students) {

        // Không truy vấn database nếu danh sách sinh viên rỗng
        if (students.isEmpty()) return Map.of();

        // Lấy danh sách ID sinh viên
        List<Integer> studentIds = students.stream()
                .map(User::getUserId)
                .toList();

        // Truy vấn kết quả kiểm tra và nhóm dữ liệu theo ID sinh viên
        return instructorStudentRepository.findQuizStatistics(courseId, studentIds)
                .stream()
                .collect(Collectors.groupingBy(QuizStatistic::getStudentId));
    }

    // Chuyển thông tin User và điểm số sang DTO Response
    private StudentListResponse toStudentResponse(User student, List<QuizStatistic> statistics) {
        return StudentListResponse.builder()
                .studentId(student.getUserId())
                .fullName(student.getFullName())
                .email(student.getEmail())
                .quizScore(calculateAverage(statistics, true))
                .examScore(calculateAverage(statistics, false))
                .build();
    }

    // Tính điểm trung bình của từng loại bài kiểm tra
    // lessonQuiz = true: Tính điểm trung bình trắc nghiệm bài học
    // lessonQuiz = false: Tính điểm trung bình kiểm tra cuối chương
    private Double calculateAverage(List<QuizStatistic> statistics, boolean lessonQuiz) {

        var average = statistics.stream()
                .filter(statistic -> (statistic.getLessonId() != null) == lessonQuiz)
                .mapToDouble(statistic -> statistic.getScore().doubleValue())
                .average();

        // Nếu sinh viên chưa làm bài nào thì trả về null
        if (average.isEmpty()) return null;

        // Làm tròn điểm trung bình đến một chữ số thập phân
        return Math.round(average.getAsDouble() * 10.0) / 10.0;
    }

    // Ghi điểm vào ô Excel, giữ kiểu dữ liệu số để có thể tính toán
    private void writeScore(Cell cell, Double score, CellStyle scoreStyle) {
        if (score == null) {
            cell.setCellValue("--");
        } else {
            cell.setCellValue(score);
            cell.setCellStyle(scoreStyle);
        }
    }

    // ==================================================
    // 5. XÁC ĐỊNH TIẾN ĐỘ HỌC TẬP CỦA SINH VIÊN
    // ==================================================
    private List<LessonProgressResponse> getLessonProgress(Integer courseId, Integer studentId) {

        // Bước 1: Lấy tất cả bài học Active thuộc chương Active
        List<Lesson> lessons = instructorStudentRepository.findActiveLessons(
                courseId, GeneralStatus.Active);

        // Bước 2: Lấy ID các bài học có trắc nghiệm Published
        // Trắc nghiệm Draft không được tính vì sinh viên chưa thể làm bài
        Set<Integer> lessonIdsWithQuiz = new HashSet<>(
                instructorStudentRepository.findLessonIdsWithQuiz(
                        courseId, AVAILABLE_QUIZ_STATUS));

        // Bước 3: Lấy ID các bài học mà sinh viên đã nộp trắc nghiệm
        Set<Integer> completedIds = new HashSet<>(
                instructorStudentRepository.findCompletedLessonIds(
                        courseId, studentId, AVAILABLE_QUIZ_STATUS));

        // Bước 4: Xác định trạng thái của từng bài học
        return lessons.stream().map(lesson -> {

            // Kiểm tra bài học có trắc nghiệm đã xuất bản hay không
            boolean hasQuiz = lessonIdsWithQuiz.contains(lesson.getLessonId());

            // Bài học hoàn thành khi có trắc nghiệm Published và sinh viên đã nộp bài
            // Không yêu cầu đạt điểm tối thiểu
            boolean completed = hasQuiz && completedIds.contains(lesson.getLessonId());

            // Trả về thông tin và trạng thái của bài học
            return LessonProgressResponse.builder()
                    .lessonId(lesson.getLessonId())
                    .lessonTitle(lesson.getTitle())
                    .chapterId(lesson.getChapter().getChapterId())
                    .chapterTitle(lesson.getChapter().getTitle())
                    .hasQuiz(hasQuiz)
                    .completed(completed)
                    .build();
        }).toList();
    }
}