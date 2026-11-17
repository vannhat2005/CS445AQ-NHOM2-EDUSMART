
package com.example.back_end.dto.response;

import lombok.*;

import java.util.Map;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CourseReviewsResponse {

    private Integer courseId;

    private Double averageRating;
    private Long totalReviews;

    // Số lượng đánh giá theo từng mức sao
    private Map<Integer, Long> ratingDistribution;

    // Danh sách đánh giá có phân trang
    private PageResponse<CourseReviewResponse> reviews;
}
