package com.example.back_end.service;

import com.example.back_end.dto.request.AiQuizGenerateRequest;
import com.example.back_end.dto.request.QuizCreateRequest;
import com.example.back_end.dto.request.QuizTitleRequest;
import com.example.back_end.dto.request.QuestionRequest;
import com.example.back_end.dto.response.DraftResponse;

public interface InstructorQuizService {

    // Lấy bài kiểm tra cuối chương
    DraftResponse getChapterQuiz(Integer instructorId, Integer chapterId);

    // Lấy trắc nghiệm bài học
    DraftResponse getLessonQuiz(Integer instructorId, Integer lessonId);

    // Xem chi tiết bộ trắc nghiệm
    DraftResponse getQuizDetail(Integer instructorId, Integer quizId);

    // Tạo trắc nghiệm thủ công
    DraftResponse createQuiz(Integer instructorId, QuizCreateRequest request);

    // Tạo bản nháp trắc nghiệm và câu hỏi từ tài liệu PDF bằng AI
    DraftResponse generateQuizWithAi(Integer instructorId, AiQuizGenerateRequest request);

    // Cập nhật tên bộ trắc nghiệm
    DraftResponse updateTitle(Integer instructorId, Integer quizId, QuizTitleRequest request);

    // Thêm câu hỏi
    DraftResponse addQuestion(Integer instructorId, Integer quizId, QuestionRequest request);

    // Cập nhật câu hỏi
    DraftResponse updateQuestion(Integer instructorId, Integer quizId, Integer questionId, QuestionRequest request);

    // Xóa câu hỏi
    DraftResponse deleteQuestion(Integer instructorId, Integer quizId, Integer questionId);

    // Xuất bản bộ trắc nghiệm
    DraftResponse publishQuiz(Integer instructorId, Integer quizId);
}