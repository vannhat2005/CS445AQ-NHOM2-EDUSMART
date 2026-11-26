package com.example.back_end.repository;

import com.example.back_end.entity.Quiz;
import com.example.back_end.entity.User;
import com.example.back_end.enumType.QuizStatus;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface InstructorDraftRepository extends JpaRepository<Quiz, Integer> {

    // 1. Tìm tài khoản đang đăng nhập thông qua username
    @Query("SELECT u FROM User u WHERE u.username = :username")
    Optional<User> findUserByUsername(@Param("username") String username);

    // 2. Lấy tất cả bản nháp thuộc khóa học của giảng viên
    // Trắc nghiệm bài học: Quiz -> Lesson -> Chapter -> Course
    // Kiểm tra cuối chương: Quiz -> Chapter -> Course
    @Query("""
        SELECT q FROM Quiz q
        LEFT JOIN FETCH q.lesson l
        LEFT JOIN FETCH l.chapter lc
        LEFT JOIN FETCH lc.course lco
        LEFT JOIN FETCH q.chapter c
        LEFT JOIN FETCH c.course co
        WHERE q.status = :status
        AND ((l.lessonId IS NOT NULL AND lco.instructor.userId = :instructorId)
        OR (l.lessonId IS NULL AND co.instructor.userId = :instructorId))
        ORDER BY q.updatedAt DESC, q.quizId DESC
        """)
    List<Quiz> findDraftsByInstructorId(@Param("instructorId") Integer instructorId, @Param("status") QuizStatus status);

    // 3. Tìm bài trắc nghiệm theo ID và quyền sở hữu của giảng viên
    @Query("""
        SELECT q FROM Quiz q
        LEFT JOIN q.lesson l
        LEFT JOIN l.chapter lc
        LEFT JOIN lc.course lco
        LEFT JOIN q.chapter c
        LEFT JOIN c.course co
        WHERE q.quizId = :quizId
        AND ((l.lessonId IS NOT NULL AND lco.instructor.userId = :instructorId)
        OR (l.lessonId IS NULL AND co.instructor.userId = :instructorId))
        """)
    Optional<Quiz> findOwnedQuiz(@Param("instructorId") Integer instructorId, @Param("quizId") Integer quizId);

    // 4. Khóa bài trắc nghiệm khi thực hiện thao tác xóa
    // Hạn chế xung đột giữa thao tác xóa và xuất bản
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT q FROM Quiz q WHERE q.quizId = :quizId")
    Optional<Quiz> findByIdForUpdate(@Param("quizId") Integer quizId);
}