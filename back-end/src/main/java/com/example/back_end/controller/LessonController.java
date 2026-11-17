
package com.example.back_end.controller;

import com.example.back_end.dto.request.LessonCreateRequest;
import com.example.back_end.dto.request.LessonUpdateRequest;
import com.example.back_end.dto.response.ApiResponse;
import com.example.back_end.dto.response.LessonResponse;
import com.example.back_end.dto.response.PageResponse;
import com.example.back_end.service.LessonService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/courses/{courseId}/chapters/{chapterId}/lessons")
@RequiredArgsConstructor
public class LessonController {

    private final LessonService lessonService;

    // GET: Lấy danh sách bài học thuộc chương
    @GetMapping
    public ApiResponse<PageResponse<LessonResponse>> getLessons(
            @PathVariable Integer courseId, @PathVariable Integer chapterId) {
        return ApiResponse.<PageResponse<LessonResponse>>builder()
                .result(lessonService.getLessonsByChapterId(courseId, chapterId)).build();
    }

    // POST: Thêm bài học mới vào chương
    @PostMapping
    public ApiResponse<LessonResponse> createLesson(
            @PathVariable Integer courseId, @PathVariable Integer chapterId,
            @Valid @RequestBody LessonCreateRequest request) {
        return ApiResponse.<LessonResponse>builder()
                .message("Thêm bài học thành công")
                .result(lessonService.createLesson(courseId, chapterId, request)).build();
    }

    // PUT: Cập nhật tên và trạng thái bài học
    @PutMapping("/{lessonId}")
    public ApiResponse<LessonResponse> updateLesson(
            @PathVariable Integer courseId, @PathVariable Integer chapterId,
            @PathVariable Integer lessonId, @Valid @RequestBody LessonUpdateRequest request) {
        return ApiResponse.<LessonResponse>builder()
                .message("Cập nhật bài học thành công")
                .result(lessonService.updateLesson(courseId, chapterId, lessonId, request)).build();
    }

    // PATCH: Di chuyển bài học lên hoặc xuống
    @PatchMapping("/{lessonId}/move")
    public ApiResponse<LessonResponse> moveLesson(
            @PathVariable Integer courseId, @PathVariable Integer chapterId,
            @PathVariable Integer lessonId, @RequestParam String direction) {
        return ApiResponse.<LessonResponse>builder()
                .message("Thay đổi thứ tự bài học thành công")
                .result(lessonService.moveLesson(courseId, chapterId, lessonId, direction)).build();
    }
}
