package com.example.back_end.service;

import com.example.back_end.dto.response.CourseStudentPageResponse;
import com.example.back_end.dto.response.StudentDetailResponse;

public interface InstructorStudentService {

    // 1. Lấy danh sách sinh viên, tìm kiếm và phân trang
    CourseStudentPageResponse getStudents(Integer instructorId, Integer courseId, String keyword, int pageNo, int pageSize);

    // 2. Xem chi tiết sinh viên, tiến độ bài học và lịch sử kiểm tra
    StudentDetailResponse getStudentDetail(Integer instructorId, Integer courseId, Integer studentId);

    // 3. Xuất danh sách sinh viên ra file Excel
    byte[] exportStudents(Integer instructorId, Integer courseId, String keyword);
}