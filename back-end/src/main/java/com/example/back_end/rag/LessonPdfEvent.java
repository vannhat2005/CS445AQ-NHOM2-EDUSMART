package com.example.back_end.rag;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LessonPdfEvent {
    private String fileName;
    private Integer lessonId;
    private Integer courseId;
    private String eventType; // "UPLOADED", "UPDATED", "SYNC"
    private Long timestamp;
}
