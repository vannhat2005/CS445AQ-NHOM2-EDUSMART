
package com.example.back_end.dto.response;

import lombok.*;

import java.util.List;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CourseCurriculumResponse {

    private Integer courseId;
    private Integer totalChapters;
    private Integer totalLessons;
    private Long totalDurationSeconds;

    private List<ChapterCurriculumResponse> chapters;
}
