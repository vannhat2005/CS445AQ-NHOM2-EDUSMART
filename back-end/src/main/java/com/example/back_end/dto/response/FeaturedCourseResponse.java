
package com.example.back_end.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FeaturedCourseResponse {

    private Integer courseId;

    private String title;

    private String description;

    private String imageUrl;

    private BigDecimal price;

    // Thêm 2 thuộc tính này
    private Integer categoryId;

    private String categoryName;

    private String instructorName;

    private Double averageRating;

    private Long totalReviews;

    private Long totalStudents;
}
