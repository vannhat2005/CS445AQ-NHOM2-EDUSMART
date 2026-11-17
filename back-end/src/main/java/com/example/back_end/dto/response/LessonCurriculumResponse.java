
package com.example.back_end.dto.response;

import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LessonCurriculumResponse {

    private Integer lessonId;

    private String title;

    private Integer orderNum;
}
