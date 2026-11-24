package com.example.back_end.controller;

import com.example.back_end.dto.request.StudentQuizSubmitRequest;
import com.example.back_end.dto.response.ApiResponse;
import com.example.back_end.dto.response.StudentQuizDetailResponse;
import com.example.back_end.dto.response.StudentQuizSubmitResponse;
import com.example.back_end.service.StudentQuizService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/student/quizzes")
@RequiredArgsConstructor
public class StudentQuizController {

    private final StudentQuizService studentQuizService;

    @GetMapping("/{quizId}")
    public ApiResponse<StudentQuizDetailResponse> getQuizDetail(@PathVariable Integer quizId) {
        StudentQuizDetailResponse result = studentQuizService.getQuizDetail(quizId);
        return ApiResponse.<StudentQuizDetailResponse>builder()
                .code(1000)
                .message("Lấy thông tin đề thi trắc nghiệm thành công")
                .result(result)
                .build();
    }

    @PostMapping("/{quizId}/submit")
    public ApiResponse<StudentQuizSubmitResponse> submitQuiz(
            @PathVariable Integer quizId,
            @RequestBody StudentQuizSubmitRequest request
    ) {
        StudentQuizSubmitResponse result = studentQuizService.submitQuiz(quizId, request);
        return ApiResponse.<StudentQuizSubmitResponse>builder()
                .code(1000)
                .message("Nộp bài kiểm tra thành công")
                .result(result)
                .build();
    }
}
