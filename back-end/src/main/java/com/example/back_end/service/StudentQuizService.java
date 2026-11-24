package com.example.back_end.service;

import com.example.back_end.dto.request.StudentQuizSubmitRequest;
import com.example.back_end.dto.response.StudentQuizDetailResponse;
import com.example.back_end.dto.response.StudentQuizSubmitResponse;

public interface StudentQuizService {

    StudentQuizDetailResponse getQuizDetail(Integer quizId);

    StudentQuizSubmitResponse submitQuiz(Integer quizId, StudentQuizSubmitRequest request);
}
