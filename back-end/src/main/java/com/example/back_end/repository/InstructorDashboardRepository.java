package com.example.back_end.repository;

import com.example.back_end.entity.Course;
import com.example.back_end.enumType.QuizStatus;
import com.example.back_end.enumType.RegistrationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface InstructorDashboardRepository extends JpaRepository<Course, Integer> {

    // ==========================================
    // 1. LẤY ID GIẢNG VIÊN ĐANG ĐĂNG NHẬP
    // ==========================================

    @Query("""
        SELECT u.userId
        FROM User u
        WHERE u.username = :username
        """)
    Optional<Integer> findInstructorIdByUsername(
            @Param("username") String username
    );

    // ==========================================
    // 2. ĐẾM TỔNG SỐ HỌC VIÊN KHÔNG TRÙNG LẶP
    // ==========================================

    @Query("""
        SELECT COUNT(DISTINCT cr.user.userId)
        FROM CourseRegistration cr
        WHERE cr.course.instructor.userId = :instructorId
        AND cr.status = :status
        """)
    long countTotalStudents(
            @Param("instructorId") Integer instructorId,
            @Param("status") RegistrationStatus status
    );

    // ==========================================
    // 3. ĐẾM SỐ BÀI TRẮC NGHIỆM BÀI HỌC
    // ==========================================

    @Query("""
        SELECT COUNT(q)
        FROM Quiz q
        WHERE q.lesson.chapter.course.instructor.userId = :instructorId
        AND q.lesson IS NOT NULL
        AND q.status = :status
        """)
    long countLessonQuizzes(
            @Param("instructorId") Integer instructorId,
            @Param("status") QuizStatus status
    );

    // ==========================================
    // 4. ĐẾM SỐ BÀI KIỂM TRA CUỐI CHƯƠNG
    // ==========================================

    @Query("""
        SELECT COUNT(q)
        FROM Quiz q
        WHERE q.chapter.course.instructor.userId = :instructorId
        AND q.lesson IS NULL
        AND q.status = :status
        """)
    long countChapterQuizzes(
            @Param("instructorId") Integer instructorId,
            @Param("status") QuizStatus status
    );

    // ==========================================
    // 5. ĐẾM TỔNG SỐ BẢN NHÁP
    // ==========================================

    @Query("""
        SELECT COUNT(q)
        FROM Quiz q
        LEFT JOIN q.chapter ch
        LEFT JOIN ch.course cc
        LEFT JOIN q.lesson l
        LEFT JOIN l.chapter lc
        LEFT JOIN lc.course cl
        WHERE q.status = :status
        AND (
            (q.lesson IS NOT NULL AND cl.instructor.userId = :instructorId)
            OR
            (q.lesson IS NULL AND cc.instructor.userId = :instructorId)
        )
        """)
    long countDrafts(
            @Param("instructorId") Integer instructorId,
            @Param("status") QuizStatus status
    );

    // ==========================================
    // 6. ĐẾM SỐ HỌC VIÊN CỦA TỪNG KHÓA HỌC
    // ==========================================

    @Query("""
        SELECT COUNT(DISTINCT cr.user.userId)
        FROM CourseRegistration cr
        WHERE cr.course.courseId = :courseId
        AND cr.status = :status
        """)
    long countStudentsByCourse(
            @Param("courseId") Integer courseId,
            @Param("status") RegistrationStatus status
    );

    // ==========================================
    // 7. ĐẾM SỐ CHƯƠNG CỦA KHÓA HỌC
    // ==========================================

    @Query("""
        SELECT COUNT(ch)
        FROM Chapter ch
        WHERE ch.course.courseId = :courseId
        """)
    long countChaptersByCourse(
            @Param("courseId") Integer courseId
    );

    // ==========================================
    // 8. ĐẾM SỐ BÀI HỌC CỦA KHÓA HỌC
    // ==========================================

    @Query("""
        SELECT COUNT(l)
        FROM Lesson l
        WHERE l.chapter.course.courseId = :courseId
        """)
    long countLessonsByCourse(
            @Param("courseId") Integer courseId
    );
}