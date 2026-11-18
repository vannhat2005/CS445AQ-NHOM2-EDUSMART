
package com.example.back_end.service;

import com.example.back_end.dto.request.CourseRequest;
import com.example.back_end.dto.response.*;

public interface CourseService {

    // ==========================================
    // ADMIN: TẠO KHÓA HỌC
    // ==========================================

    void createCourse(
            CourseRequest request,
            Integer instructorId
    );

    // ==========================================
    // GIẢNG VIÊN: DANH SÁCH KHÓA HỌC
    // ==========================================

    PageResponse<CourseResponse> getAssignedCourses(
            Integer instructorId,
            int pageNo,
            int pageSize
    );

    // ==========================================
    // GIẢNG VIÊN: CHI TIẾT KHÓA HỌC
    // ==========================================

    CourseResponse getAssignedCourseDetail(
            Integer courseId,
            Integer instructorId
    );

    // ==========================================
    // GIẢNG VIÊN: XUẤT BẢN KHÓA HỌC
    // ==========================================

    void publishCourse(
            Integer courseId,
            Integer instructorId
    );

    // ==========================================
    // HỌC VIÊN: TÌM KIẾM KHÓA HỌC
    // ==========================================

    PageResponse<CourseSearchResponse> searchCourses(
            String keyword,
            int pageNo,
            int pageSize
    );

    // ==========================================
    // HỌC VIÊN: KHÓA HỌC NỔI BẬT
    // ==========================================

    PageResponse<FeaturedCourseResponse> getFeaturedCourses(
            int pageNo,
            int pageSize
    );

    // ==========================================
    // HỌC VIÊN: CHI TIẾT KHÓA HỌC
    // ==========================================
    //
    // courseId: ID khóa học
    // userId: ID học viên đang đăng nhập
    //
    // userId = null nếu khách chưa đăng nhập
    //
    // Dùng để kiểm tra:
    // - Đã mua khóa học chưa
    // - Có được phép đánh giá không
    // ==========================================

    CourseDetailResponse getCourseDetail(
            Integer courseId,
            Integer userId
    );

    // ==========================================
    // HỌC VIÊN: CHƯƠNG TRÌNH HỌC
    // ==========================================

    CourseCurriculumResponse getCourseCurriculum(
            Integer courseId
    );

    // ==========================================
    // HỌC VIÊN: DANH SÁCH ĐÁNH GIÁ
    // ==========================================

    CourseReviewsResponse getCourseReviews(
            Integer courseId,
            int pageNo,
            int pageSize
    );
}
