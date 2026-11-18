
package com.example.back_end.controller;

import com.example.back_end.dto.response.ApiResponse;
import com.example.back_end.dto.response.StudentLessonDetailResponse;

import com.example.back_end.service.StudentLessonDetailService;

import lombok.RequiredArgsConstructor;

import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/student/courses")
@RequiredArgsConstructor
public class StudentLessonDetailController {

    private final StudentLessonDetailService studentLessonDetailService;

    @GetMapping("/{courseId}/lessons/{lessonId}")
    public ApiResponse<StudentLessonDetailResponse> getLessonDetail(
            @PathVariable Integer courseId,
            @PathVariable Integer lessonId
    ) {

        StudentLessonDetailResponse result =
                studentLessonDetailService.getLessonDetail(
                        courseId,
                        lessonId
                );

        return ApiResponse
                .<StudentLessonDetailResponse>builder()
                .code(1000)
                .message("Lấy nội dung bài học thành công")
                .result(result)
                .build();
    }
}
