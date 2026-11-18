
package com.example.back_end.dto.response;

import lombok.*;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StudentLessonDetailResponse {

    private Integer courseId;
    private String courseTitle;

    private Integer chapterId;
    private String chapterTitle;

    private Integer lessonId;
    private String lessonTitle;
    private Integer lessonOrder;

    private List<LessonContentItem> contents;
    private List<LessonQuizItem> quizzes;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class LessonContentItem {

        private Integer contentId;
        private String title;
        private String contentType;
        private String contentData;
        private Integer orderNum;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class LessonQuizItem {

        private Integer quizId;
        private String title;
    }
}
