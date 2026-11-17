
package com.example.back_end.dto.response;

import com.example.back_end.enumType.GeneralStatus;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class LessonResponse {

    private Integer lessonId;
    private String title;
    private Integer orderNum;
    private GeneralStatus status;

    private Integer chapterId;
    private String chapterTitle;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
