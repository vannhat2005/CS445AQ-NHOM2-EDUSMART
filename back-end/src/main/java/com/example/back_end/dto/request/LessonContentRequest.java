
package com.example.back_end.dto.request;

import com.example.back_end.enumType.ContentType;
import com.example.back_end.enumType.GeneralStatus;
import jakarta.validation.constraints.*;
import lombok.Data;
import org.springframework.web.multipart.MultipartFile;

@Data
public class LessonContentRequest {
    // Tiêu đề nội dung bài học
    @NotBlank(message = "Vui lòng nhập tên nội dung")
    @Size(max = 255, message = "Tiêu đề nội dung không được vượt quá 255 ký tự")
    private String title;

    // Loại nội dung: TEXT, VIDEO hoặc PDF
    @NotNull(message = "Vui lòng chọn loại nội dung")
    private ContentType contentType;


    private String contentData;

    // Trạng thái nội dung: Active hoặc Inactive
    @NotNull(message = "Trạng thái nội dung bài học không được để trống")
    private GeneralStatus status;

    // File video hoặc PDF được chọn từ máy tính
    private MultipartFile file;
}
