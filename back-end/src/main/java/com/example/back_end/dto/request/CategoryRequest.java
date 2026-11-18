package com.example.back_end.dto.request;

import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class CategoryRequest {

    @NotBlank(message = "Vui lòng nhập tên danh mục")
    @Size(max = 255, message = "Tên danh mục không được vượt quá 255 ký tự")
    private String name;

    private String description;

    @NotNull(message = "Vui lòng chọn trạng thái danh mục")
    private Boolean status;
}