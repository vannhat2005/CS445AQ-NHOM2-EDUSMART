package com.example.back_end.service;

import com.example.back_end.dto.request.CourseRequest;
import com.example.back_end.dto.response.CourseResponse;
import com.example.back_end.dto.response.CourseSearchResponse;
import com.example.back_end.dto.response.PageResponse;

public interface CourseService {

    //////admin tạo khóa học
    void createCourse(CourseRequest request, Integer instructorId);


    /////// giang vien (danh sachs khoa hoc )
    PageResponse<CourseResponse> getAssignedCourses(Integer instructorId, int pageNo, int pageSize);

    //Xem chi tiết khóa học được phân công
    CourseResponse getAssignedCourseDetail(Integer courseId, Integer instructorId);

    ////// hoc sinh
    PageResponse<CourseSearchResponse> searchCourses(
            String keyword,
            int pageNo,
            int pageSize
    );


    void publishCourse(Integer courseId, Integer instructorId);

}
