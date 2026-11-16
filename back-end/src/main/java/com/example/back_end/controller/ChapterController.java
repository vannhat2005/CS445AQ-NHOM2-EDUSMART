
package com.example.back_end.controller;

import com.example.back_end.dto.request.ChapterCreateRequest;
import com.example.back_end.dto.request.ChapterUpdateRequest;
import com.example.back_end.dto.response.ApiResponse;
import com.example.back_end.dto.response.ChapterResponse;
import com.example.back_end.dto.response.PageResponse;
import com.example.back_end.service.ChapterService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/courses")
public class ChapterController {

    private final ChapterService chapterService;

    // Lấy danh sách chương học theo ID khóa học
    @GetMapping("/{courseId}/chapters")
    public ApiResponse<PageResponse<ChapterResponse>> getChaptersByCourseId(@PathVariable Integer courseId) {

        // Gọi Service để lấy danh sách chương kèm số lượng bài học
        PageResponse<ChapterResponse> result = chapterService.getChaptersByCourseId(courseId);

        // Trả kết quả về Frontend thông qua ApiResponse
        return ApiResponse.<PageResponse<ChapterResponse>>builder()
                .message("Lấy danh sách chương học thành công")
                .result(result)
                .build();
    }

    // Thêm chương học vào khóa học
    @PostMapping("/{courseId}/chapters")
    public ApiResponse<ChapterResponse> createChapter(
            @PathVariable Integer courseId,
            @Valid @RequestBody ChapterCreateRequest request) {

        return ApiResponse.<ChapterResponse>builder()
                .message("Thêm chương học thành công")
                .result(chapterService.createChapter(courseId, request))
                .build();
    }

    // Cập nhật thông tin chương học
    @PutMapping("/{courseId}/chapters/{chapterId}")
    public ApiResponse<ChapterResponse> updateChapter(
            @PathVariable Integer courseId,
            @PathVariable Integer chapterId,
            @Valid @RequestBody ChapterUpdateRequest request
    ) {
        return ApiResponse.<ChapterResponse>builder()
                .message("Cập nhật chương học thành công")
                .result(
                        chapterService.updateChapter(
                                courseId,
                                chapterId,
                                request
                        )
                )
                .build();
    }


    // Di chuyển chương học lên hoặc xuống
    @PatchMapping("/{courseId}/chapters/{chapterId}/move")
    public ApiResponse<ChapterResponse> moveChapter(
            @PathVariable Integer courseId,
            @PathVariable Integer chapterId,
            @RequestParam String direction
    ) {
        return ApiResponse.<ChapterResponse>builder()
                .message("Thay đổi thứ tự chương học thành công")
                .result(
                        chapterService.moveChapter(
                                courseId,
                                chapterId,
                                direction
                        )
                )
                .build();
    }



}
