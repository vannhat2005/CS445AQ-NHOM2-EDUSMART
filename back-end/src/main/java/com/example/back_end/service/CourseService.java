package com.example.back_end.service;

import com.example.back_end.dto.request.CourseRequest;
import com.example.back_end.dto.response.CourseResponse;
import com.example.back_end.dto.response.CourseSearchResponse;
import com.example.back_end.dto.response.PageResponse;

public interface CourseService {

    //admin
    void createCourse(CourseRequest request, Integer instructorId);


    // giang vien
    PageResponse<CourseResponse> getAssignedCourses(Integer instructorId, int pageNo, int pageSize);

    // hoc sinh
    PageResponse<CourseSearchResponse> searchCourses(
            String keyword,
            int pageNo,
            int pageSize
    );

}
