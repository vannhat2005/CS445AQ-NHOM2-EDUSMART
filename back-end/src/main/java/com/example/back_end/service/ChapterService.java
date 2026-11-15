package com.example.back_end.service;

import com.example.back_end.dto.response.ChapterResponse;
import java.util.List;

public interface ChapterService {
    // Lấy danh sách chương học kèm thống kê số lượng bài học theo khóa học
    List<ChapterResponse> getChaptersByCourseId(Integer courseId);
}