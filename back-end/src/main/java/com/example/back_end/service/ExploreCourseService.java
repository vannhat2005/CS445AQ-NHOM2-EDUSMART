
package com.example.back_end.service;

import com.example.back_end.dto.response.CourseSearchResponse;
import com.example.back_end.dto.response.PageResponse;
import java.math.BigDecimal;

public interface ExploreCourseService {

    PageResponse<CourseSearchResponse> search(
            String keyword,
            Integer categoryId,
            BigDecimal minPrice,
            BigDecimal maxPrice,
            String sort,
            int page,
            int size
    );
}
