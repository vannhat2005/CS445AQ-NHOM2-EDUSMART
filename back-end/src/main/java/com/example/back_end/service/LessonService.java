
package com.example.back_end.service;

import com.example.back_end.dto.request.LessonCreateRequest;
import com.example.back_end.dto.request.LessonUpdateRequest;
import com.example.back_end.dto.response.LessonResponse;
import com.example.back_end.dto.response.PageResponse;

public interface LessonService {

    // Lấy danh sách bài học của một chương theo thứ tự
    PageResponse<LessonResponse> getLessonsByChapterId(Integer courseId, Integer chapterId);

    // Thêm bài học mới vào chương
    LessonResponse createLesson(Integer courseId, Integer chapterId, LessonCreateRequest request);

    // Cập nhật tên và trạng thái bài học
    LessonResponse updateLesson(Integer courseId, Integer chapterId, Integer lessonId, LessonUpdateRequest request);

    // Di chuyển bài học lên hoặc xuống một vị trí
    LessonResponse moveLesson(Integer courseId, Integer chapterId, Integer lessonId, String direction);
}
