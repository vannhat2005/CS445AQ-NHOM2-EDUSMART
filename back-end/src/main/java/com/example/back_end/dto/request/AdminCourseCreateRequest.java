
package com.example.back_end.dto.request;

import jakarta.validation.constraints.*;
import lombok.Data;
import java.math.BigDecimal;

@Data
public class AdminCourseCreateRequest {

    @NotBlank(message = "Tên khóa học không được để trống")
    @Size(max = 255, message = "Tên khóa học không được vượt quá 255 ký tự")
    private String title; // Tên khóa học

    private String description; // Mô tả khóa học

    private String learningOutcomes; // Mục tiêu học tập dạng JSON

    @NotNull(message = "Học phí không được để trống")
    @DecimalMin(value = "0.0", message = "Học phí phải lớn hơn hoặc bằng 0")
    @Digits(integer = 8, fraction = 2, message = "Học phí không đúng định dạng")
    private BigDecimal price; // Học phí khóa học

    @Size(max = 255, message = "URL ảnh không được vượt quá 255 ký tự")
    private String imageUrl; // Đường dẫn ảnh khóa học

    @NotNull(message = "Vui lòng chọn giảng viên")
    @Positive(message = "ID giảng viên không hợp lệ")
    private Integer instructorId; // ID giảng viên

    @NotNull(message = "Vui lòng chọn danh mục")
    @Positive(message = "ID danh mục không hợp lệ")
    private Integer categoryId; // ID danh mục
}
