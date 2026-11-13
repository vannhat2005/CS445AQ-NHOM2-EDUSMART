package com.example.back_end.dto.response;


import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RecentCourseResponse {

    private Integer courseId;
    private String title;
    private String imageUrl;
    private Long totalStudents;
    private Long totalChapters;
    private Long totalLessons;
}
