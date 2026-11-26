package com.example.back_end.dto.response;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InstructorReportFilterResponse {
    private Integer courseId;    // ID khóa học
    private Integer chapterId;   // ID chương học
    private String title;        // Tên khóa học hoặc chương học
}