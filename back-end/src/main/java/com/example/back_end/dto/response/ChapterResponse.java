
package com.example.back_end.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ChapterResponse {

    // 1. Thông tin cơ bản của chương
    private Integer chapterId;
    private String title;
    private String description;

    // 2. Thông tin liên kết với khóa học
    private Integer courseId;
    private String courseTitle;

    // 3. Thông tin thống kê số bài học
    private Long lessonCount;

    // 4. Thông tin thứ tự và trạng thái chương
    private Integer orderNum;
    private String status;

    // 5. Thông tin thời gian
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
