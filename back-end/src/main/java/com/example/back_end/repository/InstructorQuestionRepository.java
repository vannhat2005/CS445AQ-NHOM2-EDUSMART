package com.example.back_end.repository;

import com.example.back_end.entity.Question;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface InstructorQuestionRepository extends JpaRepository<Question, Integer> {

    // 1. Projection chứa ID bài trắc nghiệm và tổng số câu hỏi
    interface QuestionStatistic {
        Integer getQuizId();
        Long getQuestionCount();
    }

    // 2. Đếm số câu hỏi của nhiều bài trắc nghiệm trong một truy vấn
    // Tránh phải truy vấn riêng từng bản nháp
    @Query("""
        SELECT q.quiz.quizId AS quizId, COUNT(q) AS questionCount
        FROM Question q WHERE q.quiz.quizId IN :quizIds
        GROUP BY q.quiz.quizId
        """)
    List<QuestionStatistic> countQuestionsByQuizIds(@Param("quizIds") List<Integer> quizIds);

    // 3. Lấy toàn bộ câu hỏi thuộc bài trắc nghiệm theo thứ tự ID
    List<Question> findByQuiz_QuizIdOrderByQuestionIdAsc(Integer quizId);

    // 4. Xóa toàn bộ câu hỏi thuộc bài trắc nghiệm
    @Modifying
    @Query("DELETE FROM Question q WHERE q.quiz.quizId = :quizId")
    int deleteQuestionsByQuizId(@Param("quizId") Integer quizId);

    // Lấy câu hỏi thuộc đúng bộ trắc nghiệm
    Optional<Question> findByQuestionIdAndQuiz_QuizId(Integer questionId, Integer quizId);


    // Đếm số lượng câu hỏi
    long countByQuiz_QuizId(Integer quizId);
}