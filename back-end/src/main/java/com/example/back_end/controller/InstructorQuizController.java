package com.example.back_end.controller;

import com.example.back_end.dto.request.QuizCreateRequest;
import com.example.back_end.dto.request.QuizTitleRequest;
import com.example.back_end.dto.request.QuestionRequest;
import com.example.back_end.dto.response.ApiResponse;
import com.example.back_end.dto.response.DraftResponse;
import com.example.back_end.service.InstructorQuizService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/instructors/{instructorId}/quizzes")
@RequiredArgsConstructor
public class InstructorQuizController {

    private final InstructorQuizService instructorQuizService;

    // ==================================================
    // 1. LẤY BÀI KIỂM TRA CUỐI CHƯƠNG
    // ==================================================
    @GetMapping("/chapter/{chapterId}")
    public ApiResponse<DraftResponse> getChapterQuiz(@PathVariable Integer instructorId, @PathVariable Integer chapterId) {
        return ApiResponse.<DraftResponse>builder()
                .message("Lấy bài kiểm tra cuối chương thành công")
                .result(instructorQuizService.getChapterQuiz(instructorId, chapterId))
                .build();
    }

    // ==================================================
    // 2. LẤY TRẮC NGHIỆM BÀI HỌC
    // ==================================================
    @GetMapping("/lesson/{lessonId}")
    public ApiResponse<DraftResponse> getLessonQuiz(@PathVariable Integer instructorId, @PathVariable Integer lessonId) {
        return ApiResponse.<DraftResponse>builder()
                .message("Lấy trắc nghiệm bài học thành công")
                .result(instructorQuizService.getLessonQuiz(instructorId, lessonId))
                .build();
    }

    // ==================================================
    // 3. XEM CHI TIẾT BỘ TRẮC NGHIỆM
    // ==================================================
    @GetMapping("/{quizId}")
    public ApiResponse<DraftResponse> getQuizDetail(@PathVariable Integer instructorId, @PathVariable Integer quizId) {
        return ApiResponse.<DraftResponse>builder()
                .message("Lấy chi tiết trắc nghiệm thành công")
                .result(instructorQuizService.getQuizDetail(instructorId, quizId))
                .build();
    }

    // ==================================================
    // 4. TẠO TRẮC NGHIỆM THỦ CÔNG
    // ==================================================
    @PostMapping
    public ApiResponse<DraftResponse> createQuiz(@PathVariable Integer instructorId, @RequestBody @Valid QuizCreateRequest request) {
        return ApiResponse.<DraftResponse>builder()
                .message("Tạo bản nháp trắc nghiệm thành công")
                .result(instructorQuizService.createQuiz(instructorId, request))
                .build();
    }

    // ==================================================
    // 5. CẬP NHẬT TÊN TRẮC NGHIỆM
    // ==================================================
    @PatchMapping("/{quizId}/title")
    public ApiResponse<DraftResponse> updateTitle(@PathVariable Integer instructorId, @PathVariable Integer quizId, @RequestBody @Valid QuizTitleRequest request) {
        return ApiResponse.<DraftResponse>builder()
                .message("Cập nhật tên trắc nghiệm thành công")
                .result(instructorQuizService.updateTitle(instructorId, quizId, request))
                .build();
    }

    // ==================================================
    // 6. THÊM CÂU HỎI
    // ==================================================
    @PostMapping("/{quizId}/questions")
    public ApiResponse<DraftResponse> addQuestion(@PathVariable Integer instructorId, @PathVariable Integer quizId, @RequestBody @Valid QuestionRequest request) {
        return ApiResponse.<DraftResponse>builder()
                .message("Thêm câu hỏi thành công")
                .result(instructorQuizService.addQuestion(instructorId, quizId, request))
                .build();
    }

    // ==================================================
    // 7. CẬP NHẬT CÂU HỎI
    // ==================================================
    @PutMapping("/{quizId}/questions/{questionId}")
    public ApiResponse<DraftResponse> updateQuestion(@PathVariable Integer instructorId, @PathVariable Integer quizId, @PathVariable Integer questionId, @RequestBody @Valid QuestionRequest request) {
        return ApiResponse.<DraftResponse>builder()
                .message("Cập nhật câu hỏi thành công")
                .result(instructorQuizService.updateQuestion(instructorId, quizId, questionId, request))
                .build();
    }

    // ==================================================
    // 8. XÓA CÂU HỎI
    // ==================================================
    @DeleteMapping("/{quizId}/questions/{questionId}")
    public ApiResponse<DraftResponse> deleteQuestion(@PathVariable Integer instructorId, @PathVariable Integer quizId, @PathVariable Integer questionId) {
        return ApiResponse.<DraftResponse>builder()
                .message("Xóa câu hỏi thành công")
                .result(instructorQuizService.deleteQuestion(instructorId, quizId, questionId))
                .build();
    }

    // ==================================================
    // 9. XUẤT BẢN TRẮC NGHIỆM
    // ==================================================
    @PatchMapping("/{quizId}/publish")
    public ApiResponse<DraftResponse> publishQuiz(@PathVariable Integer instructorId, @PathVariable Integer quizId) {
        return ApiResponse.<DraftResponse>builder()
                .message("Xuất bản trắc nghiệm thành công")
                .result(instructorQuizService.publishQuiz(instructorId, quizId))
                .build();
    }
}