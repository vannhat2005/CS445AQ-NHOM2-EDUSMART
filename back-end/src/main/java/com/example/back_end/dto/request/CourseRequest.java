
package com.example.back_end.dto.request;

import jakarta.validation.constraints.*;
import lombok.*;
import java.math.BigDecimal;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CourseRequest {

    // Tên khóa học
    @NotBlank(message = "Tên khóa học không được để trống")
    @Size(max = 255, message = "Tên khóa học không được vượt quá 255 ký tự")
    private String title;

    // Mô tả khóa học
    private String description;

    // Mục tiêu học tập lưu dưới dạng chuỗi JSON
    private String learningOutcomes;

    // Học phí khóa học
    @NotNull(message = "Vui lòng nhập học phí")
    @DecimalMin(value = "0.0", message = "Học phí phải lớn hơn hoặc bằng 0")
    @Digits(integer = 8, fraction = 2, message = "Học phí không hợp lệ")
    private BigDecimal price;

    // Danh mục khóa học
    @NotNull(message = "Vui lòng chọn danh mục khóa học")
    private Integer categoryId;

    // Giảng viên phụ trách do Admin phân công
    @NotNull(message = "Vui lòng chọn giảng viên phụ trách")
    private Integer instructorId;
}