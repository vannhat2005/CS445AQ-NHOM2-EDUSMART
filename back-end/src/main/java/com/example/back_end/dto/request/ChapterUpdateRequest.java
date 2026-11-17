package com.example.back_end.dto.request;

import com.example.back_end.enumType.GeneralStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ChapterUpdateRequest {

    @NotBlank(message = "Tên chương không được để trống")
    @Size(max = 255, message = "Tên chương không được vượt quá 255 ký tự")
    private String title;

    @Size(max = 5000, message = "Mô tả chương không được vượt quá 5000 ký tự")
    private String description;

    @NotNull(message = "Trạng thái chương không được để trống")
    private GeneralStatus status;
}
