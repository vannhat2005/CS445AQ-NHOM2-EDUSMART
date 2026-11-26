package com.example.back_end.dto.response;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LessonProgressResponse {
    private Integer lessonId;    // ID bài học
    private String lessonTitle;  // Tên bài học
    private Integer chapterId;   // ID chương học
    private String chapterTitle; // Tên chương học
    private boolean hasQuiz;     // Có bài trắc nghiệm đang hoạt động hay không
    private boolean completed;   // Đã hoàn thành bài học hay chưa
}