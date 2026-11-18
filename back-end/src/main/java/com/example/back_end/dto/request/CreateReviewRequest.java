
package com.example.back_end.dto.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateReviewRequest {

    // Đánh giá từ 1 đến 5 sao
    @NotNull(message = "Vui lòng chọn số sao đánh giá")
    @Min(value = 1, message = "Đánh giá tối thiểu 1 sao")
    @Max(value = 5, message = "Đánh giá tối đa 5 sao")
    private Integer rating;

    // Nội dung đánh giá
    @Size(
            max = 5000,
            message = "Nội dung đánh giá không được vượt quá 5000 ký tự"
    )
    private String comment;
}
