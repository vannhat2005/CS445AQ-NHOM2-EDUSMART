
package com.example.back_end.dto.response;

import com.example.back_end.enumType.ContentType;
import com.example.back_end.enumType.GeneralStatus;
import lombok.Data;
import java.time.LocalDateTime;

@Data
public class LessonContentResponse {
    // ID nội dung bài học
    private Integer contentId;

    // ID bài học chứa nội dung
    private Integer lessonId;

    // Tiêu đề nội dung
    private String title;

    // Loại nội dung: TEXT, VIDEO hoặc PDF
    private ContentType contentType;

    // Nội dung văn bản hoặc đường dẫn file video/PDF
    private String contentData;

    // Thứ tự hiển thị nội dung
    private Integer orderNum;

    // Trạng thái hoạt động của nội dung
    private GeneralStatus status;

    // Thời gian tạo nội dung
    private LocalDateTime createdAt;

    // Thời gian cập nhật nội dung
    private LocalDateTime updatedAt;
}
