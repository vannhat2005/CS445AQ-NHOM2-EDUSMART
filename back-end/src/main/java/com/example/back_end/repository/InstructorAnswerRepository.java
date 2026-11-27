package com.example.back_end.repository;

import com.example.back_end.entity.Answer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface InstructorAnswerRepository extends JpaRepository<Answer, Integer> {

    // 1. Lấy tất cả phương án trả lời thuộc bài trắc nghiệm
    // Sắp xếp theo ID câu hỏi và ID phương án trả lời
    @Query("""
        SELECT a FROM Answer a JOIN FETCH a.question q
        WHERE q.quiz.quizId = :quizId
        ORDER BY q.questionId ASC, a.answerId ASC
        """)
    List<Answer> findAnswersByQuizId(@Param("quizId") Integer quizId);

    // 2. Xóa tất cả phương án trả lời thuộc bài trắc nghiệm
    @Modifying
    @Query("""
        DELETE FROM Answer a WHERE a.question.questionId IN
        (SELECT q.questionId FROM Question q WHERE q.quiz.quizId = :quizId)
        """)
    int deleteAnswersByQuizId(@Param("quizId") Integer quizId);

    // Lấy danh sách phương án trả lời của câu hỏi
    List<Answer> findByQuestion_QuestionIdOrderByAnswerIdAsc(Integer questionId);

    // Xóa phương án trả lời khi sửa hoặc xóa câu hỏi
    @Modifying
    @Query("DELETE FROM Answer a WHERE a.question.questionId = :questionId")
    void deleteByQuestionId(@Param("questionId") Integer questionId);
}