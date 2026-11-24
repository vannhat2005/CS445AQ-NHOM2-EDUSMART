package com.example.back_end.repository;

import com.example.back_end.entity.Answer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AnswerRepository extends JpaRepository<Answer, Integer> {

    List<Answer> findByQuestion_QuestionIdOrderByAnswerIdAsc(Integer questionId);

    List<Answer> findByQuestion_Quiz_QuizIdOrderByAnswerIdAsc(Integer quizId);
}
