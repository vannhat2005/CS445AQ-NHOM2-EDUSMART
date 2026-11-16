package com.example.back_end.service;

import com.example.back_end.dto.request.ChapterCreateRequest;
import com.example.back_end.dto.request.ChapterUpdateRequest;
import com.example.back_end.dto.response.ChapterResponse;
import com.example.back_end.dto.response.PageResponse;

import java.util.List;

public interface ChapterService {
    // Lấy danh sách chương học kèm thống kê số lượng bài học theo khóa học
    PageResponse<ChapterResponse> getChaptersByCourseId(Integer courseId);

    // Thêm chương học mới
    ChapterResponse createChapter(Integer courseId, ChapterCreateRequest request);

    // Cập nhật thông tin chương học
    ChapterResponse updateChapter(Integer courseId, Integer chapterId, ChapterUpdateRequest request);

    // Di chuyển chương học lên hoặc xuống
    ChapterResponse moveChapter(Integer courseId, Integer chapterId, String direction);
}