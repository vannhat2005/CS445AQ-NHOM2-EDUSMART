
package com.example.back_end.service;

import com.example.back_end.dto.request.LessonContentRequest;
import com.example.back_end.dto.response.LessonContentResponse;
import java.util.List;

public interface LessonContentService {
    // Lấy danh sách nội dung của bài học
    List<LessonContentResponse> getContents(Integer courseId, Integer chapterId, Integer lessonId);

    // Lấy chi tiết một nội dung bài học
    LessonContentResponse getContentById(Integer courseId, Integer chapterId, Integer lessonId, Integer contentId);

    // Thêm nội dung bài học mới
    LessonContentResponse createContent(Integer courseId, Integer chapterId, Integer lessonId, LessonContentRequest request);

    // Cập nhật nội dung bài học
    LessonContentResponse updateContent(Integer courseId, Integer chapterId, Integer lessonId, Integer contentId, LessonContentRequest request);

    // Di chuyển nội dung lên hoặc xuống
    LessonContentResponse moveContent(Integer courseId, Integer chapterId, Integer lessonId, Integer contentId, String direction);
}
