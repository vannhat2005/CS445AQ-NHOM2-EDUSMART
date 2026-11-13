
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
public class CourseSearchResponse {

    private Integer courseId;
    private String title;
    private String imageUrl;

    private Integer categoryId;
    private String categoryName;

    private Integer instructorId;
    private String instructorName;

    private BigDecimal price;
    private BigDecimal originalPrice;
    private Integer discountPercent;

    private Double averageRating;
    private Long totalReviews;

    private Long totalLessons;
}
