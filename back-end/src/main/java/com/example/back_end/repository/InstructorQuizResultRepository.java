package com.example.back_end.repository;

import com.example.back_end.entity.QuizResult;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface InstructorQuizResultRepository extends JpaRepository<QuizResult, Integer> {

    // Kiểm tra bài trắc nghiệm đã phát sinh kết quả làm bài hay chưa
    boolean existsByQuiz_QuizId(Integer quizId);
}