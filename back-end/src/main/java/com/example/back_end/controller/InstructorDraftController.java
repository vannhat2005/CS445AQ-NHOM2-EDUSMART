package com.example.back_end.controller;

import com.example.back_end.dto.response.ApiResponse;
import com.example.back_end.dto.response.DraftResponse;
import com.example.back_end.service.InstructorDraftService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/instructors/{instructorId}/drafts")
@RequiredArgsConstructor
public class InstructorDraftController {

    private final InstructorDraftService instructorDraftService;

    // ==================================================
    // 1. API LẤY DANH SÁCH BẢN NHÁP
    // ==================================================
    @GetMapping
    public ApiResponse<List<DraftResponse>> getDrafts(@PathVariable Integer instructorId) {
        // Lấy danh sách bản nháp và trả về kết quả
        return ApiResponse.<List<DraftResponse>>builder()
                .message("Lấy danh sách bản nháp thành công")
                .result(instructorDraftService.getDrafts(instructorId))
                .build();
    }

    // ==================================================
    // 2. API XEM CHI TIẾT BẢN NHÁP
    // ==================================================
    @GetMapping("/{quizId}")
    public ApiResponse<DraftResponse> getDraftDetail(@PathVariable Integer instructorId, @PathVariable Integer quizId) {
        // Lấy thông tin bản nháp và danh sách câu hỏi
        return ApiResponse.<DraftResponse>builder()
                .message("Lấy thông tin bản nháp thành công")
                .result(instructorDraftService.getDraftDetail(instructorId, quizId))
                .build();
    }

    // ==================================================
    // 3. API XÓA BẢN NHÁP
    // ==================================================
    @DeleteMapping("/{quizId}")
    public ApiResponse<Void> deleteDraft(@PathVariable Integer instructorId, @PathVariable Integer quizId) {
        // Thực hiện xóa bản nháp và dữ liệu liên quan
        instructorDraftService.deleteDraft(instructorId, quizId);

        // Trả về thông báo sau khi xóa thành công
        return ApiResponse.<Void>builder()
                .message("Xóa bản nháp thành công")
                .build();
    }
}