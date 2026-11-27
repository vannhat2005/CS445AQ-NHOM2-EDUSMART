package com.example.back_end.service;

import com.example.back_end.dto.response.InstructorDashboardResponse;

public interface InstructorDashboardService {

    // Lấy thông tin thống kê trang chủ giảng viên đang đăng nhập
    InstructorDashboardResponse getDashboard();
}