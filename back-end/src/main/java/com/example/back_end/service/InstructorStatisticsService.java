package com.example.back_end.service;


import com.example.back_end.dto.response.InstructorStatisticsResponse;
import com.example.back_end.dto.response.RecentCourseResponse;

import java.util.List;

public interface InstructorStatisticsService {

    InstructorStatisticsResponse getStatistics(Integer instructorId);
    List<RecentCourseResponse> getRecentCourses(
            Integer instructorId
    );
}
