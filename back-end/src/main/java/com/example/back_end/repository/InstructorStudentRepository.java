package com.example.back_end.repository;

import com.example.back_end.entity.Course;
import com.example.back_end.entity.CourseRegistration;
import com.example.back_end.entity.User;
import com.example.back_end.entity.Lesson;
import com.example.back_end.enumType.RegistrationStatus;
import com.example.back_end.enumType.GeneralStatus;
import com.example.back_end.enumType.QuizStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface InstructorStudentRepository extends JpaRepository<CourseRegistration, Integer> {

    // 1. Tìm khóa học theo ID và kiểm tra khóa học thuộc giảng viên
    @Query("""
        SELECT c FROM Course c
        WHERE c.courseId = :courseId AND c.instructor.userId = :instructorId
    """)
    Optional<Course> findInstructorCourse(@Param("courseId") Integer courseId,
                                          @Param("instructorId") Integer instructorId);

    // 2. Kiểm tra ID giảng viên gửi từ Frontend có khớp với tài khoản đăng nhập
    @Query("""
        SELECT COUNT(u) FROM User u
        WHERE u.userId = :instructorId AND u.username = :username
        AND LOWER(u.role.roleName) = 'instructor'
    """)
    long countAuthenticatedInstructor(@Param("instructorId") Integer instructorId,
                                      @Param("username") String username);

    // 3. Lấy danh sách sinh viên đã ghi danh, hỗ trợ tìm kiếm và phân trang
    // DISTINCT giúp tránh trùng sinh viên nếu có nhiều bản ghi đăng ký
    @Query(value = """
        SELECT DISTINCT u FROM CourseRegistration cr JOIN cr.user u
        WHERE cr.course.courseId = :courseId AND cr.status = :status
        AND (
            :keyword = ''
            OR CAST(u.userId AS string) LIKE CONCAT('%', :keyword, '%')
            OR LOWER(u.fullName) LIKE LOWER(CONCAT('%', :keyword, '%'))
            OR LOWER(u.email) LIKE LOWER(CONCAT('%', :keyword, '%'))
        )
        ORDER BY u.userId ASC
    """, countQuery = """
        SELECT COUNT(DISTINCT u.userId) FROM CourseRegistration cr JOIN cr.user u
        WHERE cr.course.courseId = :courseId AND cr.status = :status
        AND (
            :keyword = ''
            OR CAST(u.userId AS string) LIKE CONCAT('%', :keyword, '%')
            OR LOWER(u.fullName) LIKE LOWER(CONCAT('%', :keyword, '%'))
            OR LOWER(u.email) LIKE LOWER(CONCAT('%', :keyword, '%'))
        )
    """)
    Page<User> findStudents(@Param("courseId") Integer courseId,
                            @Param("status") RegistrationStatus status,
                            @Param("keyword") String keyword,
                            Pageable pageable);

    // 4. Đếm tổng số sinh viên đã ghi danh thành công vào khóa học
    @Query("""
        SELECT COUNT(DISTINCT cr.user.userId) FROM CourseRegistration cr
        WHERE cr.course.courseId = :courseId AND cr.status = :status
    """)
    long countStudents(@Param("courseId") Integer courseId,
                       @Param("status") RegistrationStatus status);

    // 5. Tìm sinh viên và kiểm tra sinh viên đã ghi danh vào khóa học
    @Query("""
        SELECT DISTINCT cr.user FROM CourseRegistration cr
        WHERE cr.course.courseId = :courseId
        AND cr.user.userId = :studentId AND cr.status = :status
    """)
    Optional<User> findEnrolledStudent(@Param("courseId") Integer courseId,
                                       @Param("studentId") Integer studentId,
                                       @Param("status") RegistrationStatus status);

    // 6. Projection dùng để nhận kết quả thống kê từ câu truy vấn
    interface QuizStatistic {
        Integer getStudentId();         // ID sinh viên
        Integer getQuizId();            // ID bài kiểm tra
        String getTitle();              // Tên bài kiểm tra
        Integer getLessonId();          // ID bài học, null nếu là kiểm tra cuối chương
        BigDecimal getScore();          // Điểm số cao nhất
        Long getAttempts();             // Tổng số lần nộp bài
        LocalDateTime getSubmittedAt(); // Ngày nộp gần nhất
    }

    // 7. Thống kê kết quả kiểm tra của nhiều sinh viên trong cùng khóa học
    // MAX(score): Lấy điểm cao nhất của mỗi bài kiểm tra
    // COUNT(resultId): Đếm số lần đã nộp bài
    // MAX(submittedAt): Lấy thời gian nộp gần nhất
    // LEFT JOIN: Hỗ trợ cả trắc nghiệm bài học và kiểm tra cuối chương
    @Query("""
        SELECT r.student.userId AS studentId, q.quizId AS quizId,
               q.title AS title, l.lessonId AS lessonId,
               MAX(r.score) AS score, COUNT(r.resultId) AS attempts,
               MAX(r.submittedAt) AS submittedAt
        FROM QuizResult r
        JOIN r.quiz q
        LEFT JOIN q.lesson l
        LEFT JOIN l.chapter lc
        LEFT JOIN q.chapter qc
        WHERE r.student.userId IN :studentIds
        AND r.submittedAt IS NOT NULL AND r.score IS NOT NULL
        AND (
            (l.lessonId IS NOT NULL AND lc.course.courseId = :courseId)
            OR (l.lessonId IS NULL AND qc.course.courseId = :courseId)
        )
        GROUP BY r.student.userId, q.quizId, q.title, l.lessonId
        ORDER BY MAX(r.submittedAt) DESC
    """)
    List<QuizStatistic> findQuizStatistics(@Param("courseId") Integer courseId,
                                           @Param("studentIds") List<Integer> studentIds);

    // 8. Lấy tất cả bài học đang hoạt động thuộc khóa học
    // Chỉ lấy bài học thuộc chương đang hoạt động
    // Sắp xếp theo thứ tự chương và thứ tự bài học
    @Query("""
        SELECT l FROM Lesson l JOIN FETCH l.chapter c
        WHERE c.course.courseId = :courseId
        AND l.status = :status AND c.status = :status
        ORDER BY c.orderNum ASC, l.orderNum ASC, l.lessonId ASC
    """)
    List<Lesson> findActiveLessons(@Param("courseId") Integer courseId,
                                   @Param("status") GeneralStatus status);

    // 9. Lấy danh sách ID bài học có trắc nghiệm đang hoạt động
    // DISTINCT giúp tránh trùng ID nếu một bài học có nhiều trắc nghiệm
    // Không lấy bài kiểm tra cuối chương vì không thuộc Lesson
    @Query("""
        SELECT DISTINCT l.lessonId
        FROM Quiz q
        JOIN q.lesson l
        JOIN l.chapter c
        WHERE c.course.courseId = :courseId
        AND q.status = :quizStatus
    """)
    List<Integer> findLessonIdsWithQuiz(@Param("courseId") Integer courseId,
                                        @Param("quizStatus") QuizStatus quizStatus);

    // 10. Lấy ID các bài học mà sinh viên đã nộp bài trắc nghiệm
    // Chỉ tính những bài trắc nghiệm đang hoạt động
    // Không yêu cầu đạt điểm tối thiểu, chỉ cần đã nộp bài
    // DISTINCT giúp tránh tính trùng bài học đã hoàn thành
    @Query("""
        SELECT DISTINCT l.lessonId
        FROM QuizResult r
        JOIN r.quiz q
        JOIN q.lesson l
        JOIN l.chapter c
        WHERE r.student.userId = :studentId
        AND c.course.courseId = :courseId
        AND q.status = :quizStatus
        AND r.submittedAt IS NOT NULL
    """)
    List<Integer> findCompletedLessonIds(@Param("courseId") Integer courseId,
                                         @Param("studentId") Integer studentId,
                                         @Param("quizStatus") QuizStatus quizStatus);
}