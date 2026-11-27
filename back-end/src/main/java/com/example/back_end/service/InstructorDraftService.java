package com.example.back_end.service;

import com.example.back_end.dto.response.DraftResponse;
import java.util.List;

public interface InstructorDraftService {

    // 1. Lấy danh sách bản nháp của giảng viên
    List<DraftResponse> getDrafts(Integer instructorId);

    // 2. Lấy chi tiết bản nháp và danh sách câu hỏi
    DraftResponse getDraftDetail(Integer instructorId, Integer quizId);

    // 3. Xóa bản nháp cùng toàn bộ câu hỏi và phương án trả lời
    void deleteDraft(Integer instructorId, Integer quizId);
}