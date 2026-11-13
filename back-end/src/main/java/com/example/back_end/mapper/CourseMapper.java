
package com.example.back_end.mapper;

import com.example.back_end.dto.request.CourseRequest;
import com.example.back_end.dto.response.CourseResponse;
import com.example.back_end.dto.response.CourseSearchResponse;
import com.example.back_end.entity.Course;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface CourseMapper {

    // API xem chi tiết khóa học
    CourseResponse toCourseDetailResponse(Course course);

    // API xem danh sách phân công
    @Mapping(target = "description", ignore = true)
    @Mapping(target = "learningOutcomes", ignore = true)
    @Mapping(target = "imageUrl", ignore = true)
    @Mapping(target = "instructorId", ignore = true)
    @Mapping(target = "instructorName", ignore = true)
    @Mapping(target = "categoryId", ignore = true)
    @Mapping(target = "categoryName", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    CourseResponse toCourseListResponse(Course course);

    // 2. Map Request -> Entity (Dùng khi tạo mới)
    @Mapping(target = "courseId", ignore = true)
    @Mapping(target = "status", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "instructor", ignore = true)
    @Mapping(target = "category", ignore = true)
    Course toEntity(CourseRequest request);


    @Mapping(target = "instructorId",
            source = "instructor.userId")
    @Mapping(target = "instructorName", ignore = true)

    @Mapping(target = "categoryId",
            source = "category.categoryId")
    @Mapping(target = "categoryName", ignore = true)

    @Mapping(target = "originalPrice", ignore = true)
    @Mapping(target = "discountPercent", ignore = true)
    @Mapping(target = "averageRating", ignore = true)
    @Mapping(target = "totalReviews", ignore = true)
    @Mapping(target = "totalLessons", ignore = true)
    CourseSearchResponse toCourseSearchResponse(Course course);

}
