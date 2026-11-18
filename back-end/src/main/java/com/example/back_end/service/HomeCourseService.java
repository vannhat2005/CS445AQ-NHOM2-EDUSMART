
package com.example.back_end.service;

import com.example.back_end.dto.response.FeaturedCourseResponse;
import com.example.back_end.dto.response.PageResponse;
import com.example.back_end.dto.response.TopCategoryResponse;

import java.util.List;

public interface HomeCourseService {

    List<TopCategoryResponse> getTop3Categories();

    PageResponse<FeaturedCourseResponse> getCourses(
            Integer categoryId,
            String sort,
            int page,
            int size
    );
}
