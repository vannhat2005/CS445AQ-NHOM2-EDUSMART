package com.example.back_end.repository;

import com.example.back_end.entity.Question;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface QuestionRepository extends JpaRepository<Question, Integer> {

    List<Question> findByQuiz_QuizIdOrderByQuestionIdAsc(Integer quizId);

    long countByQuiz_QuizId(Integer quizId);
}
