
package com.example.back_end.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class CourseDetailResponse {

    private Integer courseId;
    private String title;
    private String description;
    private String learningOutcomes;

    private BigDecimal price;
    private String imageUrl;
    private String status;

    private Integer instructorId;
    private String instructorName;

    private Integer categoryId;
    private String categoryName;

    private Double averageRating;
    private Long totalReviews;
    private Long totalStudents;
}
