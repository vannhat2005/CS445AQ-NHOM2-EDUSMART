
package com.example.back_end.service;

import com.example.back_end.dto.response.MyCourseResponse;
import com.example.back_end.dto.response.PageResponse;

public interface MyCourseService {

    PageResponse<MyCourseResponse> getMyCourses(
            int pageNo,
            int pageSize
    );

    PageResponse<MyCourseResponse> getMyCourses(
            int pageNo,
            int pageSize,
            String status,
            String keyword,
            String sortBy
    );
}
