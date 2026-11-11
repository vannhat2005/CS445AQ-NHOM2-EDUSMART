package com.example.back_end.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CourseRequest {

    @NotBlank(message = "Tên khóa học không được để trống")
    private String title;

    private String description;

    // Có thể dùng kiểu String (chứa JSON object) hoặc List<String> tùy cách bạn xử lý
    private String learningOutcomes;

    @Min(value = 0, message = "Giá khóa học phải lớn hơn hoặc bằng 0")
    private BigDecimal price;

    private String imageUrl;

    @NotNull(message = "Vui lòng chọn danh mục khóa học")
    private Integer categoryId;

    // Lưu ý: instructorId thường được lấy từ Token của người đang đăng nhập (Giảng viên)
    // hoặc do Admin truyền vào khi phân công[cite: 2].
    private Integer instructorId;
}