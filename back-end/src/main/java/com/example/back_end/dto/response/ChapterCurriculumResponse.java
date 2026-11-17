
package com.example.back_end.dto.response;

import lombok.*;

import java.util.List;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChapterCurriculumResponse {

    private Integer chapterId;

    private String title;

    private String description;

    private Integer orderNum;

    private Integer totalLessons;

    private List<LessonCurriculumResponse> lessons;
}
