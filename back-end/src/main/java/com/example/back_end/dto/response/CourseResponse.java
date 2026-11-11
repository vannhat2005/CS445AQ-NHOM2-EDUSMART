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
@JsonInclude(JsonInclude.Include.NON_NULL) // Chặn trả về các field bị null
public class CourseResponse {

    private Integer courseId;

    private String title;

    private String description;

    private String learningOutcomes;

    private BigDecimal price;

    private String imageUrl;

    private String status;

    // Thay vì trả về toàn bộ Object User/Category, chỉ nên trả về ID và Tên để tối ưu
    private Integer instructorId;
    private String instructorName;

    private Integer categoryId;
    private String categoryName;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
}