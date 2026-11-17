
package com.example.back_end.dto.request;

import com.example.back_end.enumType.GeneralStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class LessonCreateRequest {

    @NotBlank(message = "Tên bài học không được để trống")
    @Size(max = 255, message = "Tên bài học không được vượt quá 255 ký tự")
    private String title;

    @NotNull(message = "Vui lòng chọn trạng thái bài học")
    private GeneralStatus status;
}
