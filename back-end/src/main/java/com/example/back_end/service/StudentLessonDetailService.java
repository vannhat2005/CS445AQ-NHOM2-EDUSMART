
package com.example.back_end.service;

import com.example.back_end.dto.response.StudentLessonDetailResponse;

public interface StudentLessonDetailService {

    StudentLessonDetailResponse getLessonDetail(
            Integer courseId,
            Integer lessonId
    );
}
