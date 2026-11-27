package com.example.back_end.service;

import com.example.back_end.dto.response.InstructorReportResponse;
import com.example.back_end.dto.response.InstructorReportFilterResponse;

import java.time.LocalDate;
import java.util.List;

public interface InstructorReportService {

    // Lấy danh sách khóa học được phân công cho giảng viên
    List<InstructorReportFilterResponse> getCourses(Integer instructorId);

    // Lấy danh sách chương học thuộc khóa học được chọn
    List<InstructorReportFilterResponse> getChapters(Integer instructorId, Integer courseId);

    // Lấy báo cáo thống kê theo các điều kiện lọc
    InstructorReportResponse getReport(Integer instructorId, Integer courseId,
                                       Integer chapterId, String assessmentType,
                                       String timeRange, LocalDate fromDate, LocalDate toDate);
}