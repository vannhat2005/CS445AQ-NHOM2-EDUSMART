
package com.example.back_end.service;

import com.example.back_end.dto.request.AdminCourseCreateRequest;
import com.example.back_end.dto.request.AdminCourseUpdateRequest;
import com.example.back_end.dto.response.AdminCourseResponse;
import com.example.back_end.dto.response.AdminCourseStatisticsResponse;
import org.springframework.data.domain.Page;
import java.util.List;
import java.util.Map;

public interface AdminCourseService {

    // Lấy danh sách khóa học, tìm kiếm, lọc danh mục và phân trang
    Page<AdminCourseResponse> getAll(String keyword, Integer categoryId, int page, int size);

    // Xem thông tin chi tiết khóa học
    AdminCourseResponse getById(Integer id);

    // Thêm khóa học mới
    AdminCourseResponse create(AdminCourseCreateRequest request);

    // Cập nhật thông tin và trạng thái khóa học
    AdminCourseResponse update(Integer id, AdminCourseUpdateRequest request);

    // Thống kê số lượng khóa học theo trạng thái
    AdminCourseStatisticsResponse getStatistics();

    // Lấy danh sách giảng viên để phân công khóa học
    List<Map<String, Object>> getInstructors();
}
