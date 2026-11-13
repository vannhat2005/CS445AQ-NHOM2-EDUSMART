package com.example.back_end.dto.response;


import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class InstructorStatisticsResponse {

    private Long totalCourses;
    private Long totalStudents;
    private Long totalQuizzes;
    private Long totalChapterTests;
    private Long totalDrafts;
}
