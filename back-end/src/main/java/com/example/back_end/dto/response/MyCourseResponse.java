
package com.example.back_end.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class MyCourseResponse {

    private Integer courseId;

    private String title;

    private String description;

    private String imageUrl;

    private BigDecimal price;

    private String instructorName;

    private String categoryName;

    private String enrollmentStatus;

    private LocalDateTime enrolledAt;

    // Tiến trình học tập
    private Long totalQuizzes;

    private Long completedQuizzes;

    private Integer progressPercent;

    private String learningStatus;
}
