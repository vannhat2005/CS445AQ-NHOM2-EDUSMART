
package com.example.back_end.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class AdminCourseStatisticsResponse {
    private long total; // Tổng khóa học
    private long published; // Đã xuất bản
    private long draft; // Bản nháp
    private long hidden; // Đã ẩn
}
