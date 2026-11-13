package com.example.back_end.service;

import com.example.back_end.dto.request.CourseRequest;
import com.example.back_end.dto.response.CourseResponse;
import com.example.back_end.dto.response.PageResponse;

public interface CourseService {

    //admin
    void createCourse(CourseRequest request, Integer instructorId);


    // giang vien
    PageResponse<CourseResponse> getAssignedCourses(Integer instructorId, int pageNo, int pageSize);
    //Xem chi tiết khóa học được phân công
    CourseResponse getAssignedCourseDetail(Integer courseId, Integer instructorId);
    // hoc sinh


}
