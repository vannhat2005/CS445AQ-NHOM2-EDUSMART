
package com.example.back_end.dto.response;

import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CourseReviewResponse {

    private Integer reviewId;

    private Integer studentId;
    private String studentName;

    private Integer rating;
    private String comment;

    private LocalDateTime createdAt;
}
