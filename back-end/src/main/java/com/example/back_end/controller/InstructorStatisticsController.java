package com.example.back_end.controller;

import com.example.back_end.dto.response.InstructorStatisticsResponse;
import com.example.back_end.dto.response.RecentCourseResponse;
import com.example.back_end.service.InstructorStatisticsService;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/instructor/dashboard")
@RequiredArgsConstructor
public class InstructorStatisticsController {

    private final InstructorStatisticsService instructorStatisticsService;

    // Lấy thống kê tổng quan của giảng viên
    @GetMapping("/statistics/{instructorId}")
    public ResponseEntity<InstructorStatisticsResponse> getStatistics(
            @PathVariable Integer instructorId
    ) {

        InstructorStatisticsResponse response =
                instructorStatisticsService.getStatistics(instructorId);

        return ResponseEntity.ok(response);
    }

    @GetMapping("/recent-courses/{instructorId}")
    public ResponseEntity<List<RecentCourseResponse>>
    getRecentCourses(@PathVariable Integer instructorId) {

        return ResponseEntity.ok(
                instructorStatisticsService
                        .getRecentCourses(instructorId)
        );
    }
}
