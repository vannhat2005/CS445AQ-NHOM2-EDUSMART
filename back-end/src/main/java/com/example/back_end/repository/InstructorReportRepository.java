package com.example.back_end.repository;

import com.example.back_end.entity.Course;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface InstructorReportRepository extends JpaRepository<Course, Integer> {

    // ==================== 1. QUẢN LÝ BỘ LỌC ====================

    // Lấy danh sách khóa học được phân công cho giảng viên
    @Query(value = """
        SELECT c.course_id, c.title
        FROM Courses c
        WHERE c.instructor_id = :instructorId
        ORDER BY c.title ASC
        """, nativeQuery = true)
    List<Object[]> findInstructorCourses(@Param("instructorId") Integer instructorId);

    // Lấy danh sách chương học thuộc khóa học được chọn
    @Query(value = """
        SELECT ch.chapter_id, ch.title
        FROM Chapters ch
        JOIN Courses c ON c.course_id = ch.course_id
        WHERE c.instructor_id = :instructorId
          AND c.course_id = :courseId
        ORDER BY ch.order_num ASC
        """, nativeQuery = true)
    List<Object[]> findInstructorChapters(@Param("instructorId") Integer instructorId,
                                          @Param("courseId") Integer courseId);

    // Kiểm tra giảng viên có khóa học được phân công hay không
    @Query(value = """
        SELECT COUNT(*)
        FROM Courses c
        WHERE c.instructor_id = :instructorId
        """, nativeQuery = true)
    long countInstructorCourses(@Param("instructorId") Integer instructorId);

    // Kiểm tra khóa học có thuộc giảng viên hay không
    @Query(value = """
        SELECT COUNT(*)
        FROM Courses c
        WHERE c.course_id = :courseId
          AND c.instructor_id = :instructorId
        """, nativeQuery = true)
    long countOwnedCourse(@Param("instructorId") Integer instructorId,
                          @Param("courseId") Integer courseId);

    // Kiểm tra chương học thuộc đúng khóa học của giảng viên
    @Query(value = """
        SELECT COUNT(*)
        FROM Chapters ch
        JOIN Courses c ON c.course_id = ch.course_id
        WHERE ch.chapter_id = :chapterId
          AND ch.course_id = :courseId
          AND c.instructor_id = :instructorId
        """, nativeQuery = true)
    long countOwnedChapter(@Param("instructorId") Integer instructorId,
                           @Param("courseId") Integer courseId,
                           @Param("chapterId") Integer chapterId);

    // ==================== 2. THỐNG KÊ HỌC VIÊN ====================

    // Đếm tổng số học viên khác nhau đã thanh toán thành công
    @Query(value = """
        SELECT COUNT(DISTINCT cr.user_id)
        FROM CourseRegistrations cr
        JOIN Courses c ON c.course_id = cr.course_id
        WHERE c.instructor_id = :instructorId
          AND cr.status = 'Paid'
          AND (:courseId IS NULL OR c.course_id = :courseId)
        """, nativeQuery = true)
    long countTotalStudents(@Param("instructorId") Integer instructorId,
                            @Param("courseId") Integer courseId);

    // Đếm tổng số cặp học viên - khóa học đã thanh toán thành công
    // DISTINCT giúp tránh tính trùng khi học viên đăng ký lại cùng khóa học
    @Query(value = """
        SELECT COUNT(DISTINCT cr.user_id, cr.course_id)
        FROM CourseRegistrations cr
        JOIN Courses c ON c.course_id = cr.course_id
        WHERE c.instructor_id = :instructorId
          AND cr.status = 'Paid'
          AND (:courseId IS NULL OR c.course_id = :courseId)
        """, nativeQuery = true)
    long countTotalRegistrations(@Param("instructorId") Integer instructorId,
                                 @Param("courseId") Integer courseId);

    // ==================== 3. THỐNG KÊ HOÀN THÀNH KHÓA HỌC ====================

    // Học viên hoàn thành khóa học khi đã nộp tất cả bài kiểm tra Published
    // Bao gồm trắc nghiệm bài học và kiểm tra cuối chương
    // Không yêu cầu đạt điểm tối thiểu, không tính trùng lượt làm lại
    // Khóa học phải có ít nhất một bài kiểm tra Published
    @Query(value = """
        SELECT COUNT(DISTINCT cr.user_id, cr.course_id)
        FROM CourseRegistrations cr
        JOIN Courses c ON c.course_id = cr.course_id
        WHERE c.instructor_id = :instructorId
          AND cr.status = 'Paid'
          AND (:courseId IS NULL OR c.course_id = :courseId)

          AND EXISTS (
              SELECT 1
              FROM Quizzes q
              LEFT JOIN Lessons l ON l.lesson_id = q.lesson_id
              JOIN Chapters ch ON ch.chapter_id =
                  CASE WHEN q.lesson_id IS NOT NULL
                       THEN l.chapter_id ELSE q.chapter_id END
              WHERE ch.course_id = c.course_id
                AND q.status = 'Published'
          )

          AND NOT EXISTS (
              SELECT 1
              FROM Quizzes q
              LEFT JOIN Lessons l ON l.lesson_id = q.lesson_id
              JOIN Chapters ch ON ch.chapter_id =
                  CASE WHEN q.lesson_id IS NOT NULL
                       THEN l.chapter_id ELSE q.chapter_id END
              WHERE ch.course_id = c.course_id
                AND q.status = 'Published'

                AND NOT EXISTS (
                    SELECT 1
                    FROM QuizResults qr
                    WHERE qr.quiz_id = q.quiz_id
                      AND qr.student_id = cr.user_id
                      AND qr.submitted_at IS NOT NULL
                )
          )
        """, nativeQuery = true)
    long countCompletedRegistrations(@Param("instructorId") Integer instructorId,
                                     @Param("courseId") Integer courseId);

    // ==================== 4. ĐIỀU KIỆN THỐNG KÊ CHUNG ====================

    // Điều kiện chung dùng cho thống kê điểm và lượt nộp bài
    // Xác định chương học thông qua bài học hoặc trực tiếp từ bài kiểm tra cuối chương
    // Chỉ lấy bài kiểm tra Published và kết quả đã nộp của học viên đăng ký hợp lệ
    String RESULT_FILTER = """
        FROM QuizResults qr
        JOIN Quizzes q ON q.quiz_id = qr.quiz_id
        LEFT JOIN Lessons l ON l.lesson_id = q.lesson_id
        JOIN Chapters ch ON ch.chapter_id =
            CASE WHEN q.lesson_id IS NOT NULL
                 THEN l.chapter_id ELSE q.chapter_id END
        JOIN Courses c ON c.course_id = ch.course_id
        WHERE c.instructor_id = :instructorId
          AND q.status = 'Published'
          AND qr.submitted_at IS NOT NULL
          AND qr.score BETWEEN 0 AND 10
          AND (:courseId IS NULL OR c.course_id = :courseId)
          AND (:chapterId IS NULL OR ch.chapter_id = :chapterId)
          AND (
              :assessmentType = 'all'
              OR (:assessmentType = 'quiz' AND q.lesson_id IS NOT NULL)
              OR (:assessmentType = 'final'
                  AND q.lesson_id IS NULL
                  AND q.chapter_id IS NOT NULL)
          )
          AND (:fromDate IS NULL OR qr.submitted_at >= :fromDate)
          AND (:toDate IS NULL OR qr.submitted_at < :toDate)
          AND EXISTS (
              SELECT 1
              FROM CourseRegistrations cr
              WHERE cr.user_id = qr.student_id
                AND cr.course_id = c.course_id
                AND cr.status = 'Paid'
          )
        """;

    // ==================== 5. THỐNG KÊ KẾT QUẢ ĐÁNH GIÁ ====================

    // Kiểm tra giảng viên có dữ liệu đánh giá hợp lệ trước khi lọc hay không
    @Query(value = """
        SELECT COUNT(*)
        FROM QuizResults qr
        JOIN Quizzes q ON q.quiz_id = qr.quiz_id
        LEFT JOIN Lessons l ON l.lesson_id = q.lesson_id
        JOIN Chapters ch ON ch.chapter_id =
            CASE WHEN q.lesson_id IS NOT NULL
                 THEN l.chapter_id ELSE q.chapter_id END
        JOIN Courses c ON c.course_id = ch.course_id
        WHERE c.instructor_id = :instructorId
          AND q.status = 'Published'
          AND qr.submitted_at IS NOT NULL
          AND qr.score BETWEEN 0 AND 10
          AND EXISTS (
              SELECT 1
              FROM CourseRegistrations cr
              WHERE cr.user_id = qr.student_id
                AND cr.course_id = c.course_id
                AND cr.status = 'Paid'
          )
        """, nativeQuery = true)
    long countAllAssessmentResults(@Param("instructorId") Integer instructorId);

    // Tính tổng lượt nộp bài, điểm trung bình và số lượt nộp theo từng loại
    @Query(value = """
        SELECT COUNT(*),
               COALESCE(AVG(qr.score), 0),
               COALESCE(SUM(CASE WHEN q.lesson_id IS NOT NULL
                                 THEN 1 ELSE 0 END), 0),
               COALESCE(SUM(CASE WHEN q.lesson_id IS NULL
                                 THEN 1 ELSE 0 END), 0)
        """ + RESULT_FILTER, nativeQuery = true)
    List<Object[]> findAssessmentStatistics(
            @Param("instructorId") Integer instructorId,
            @Param("courseId") Integer courseId,
            @Param("chapterId") Integer chapterId,
            @Param("assessmentType") String assessmentType,
            @Param("fromDate") LocalDateTime fromDate,
            @Param("toDate") LocalDateTime toDate);

    // ==================== 6. THỐNG KÊ PHÂN BỐ ĐIỂM ====================

    // Phân nhóm điểm từ 0 đến 10 bằng FLOOR
    // Ví dụ: 7.5 thuộc nhóm điểm 7, điểm 10 thuộc nhóm điểm 10
    @Query(value = """
        SELECT FLOOR(qr.score) AS score_group,
               SUM(CASE WHEN q.lesson_id IS NOT NULL
                        THEN 1 ELSE 0 END) AS lesson_quiz,
               SUM(CASE WHEN q.lesson_id IS NULL
                        THEN 1 ELSE 0 END) AS chapter_exam,
               COUNT(*) AS total_count
        """ + RESULT_FILTER + """
        GROUP BY FLOOR(qr.score)
        ORDER BY score_group ASC
        """, nativeQuery = true)
    List<Object[]> findScoreDistribution(
            @Param("instructorId") Integer instructorId,
            @Param("courseId") Integer courseId,
            @Param("chapterId") Integer chapterId,
            @Param("assessmentType") String assessmentType,
            @Param("fromDate") LocalDateTime fromDate,
            @Param("toDate") LocalDateTime toDate);
}