
package com.example.back_end.mapper;

import com.example.back_end.dto.request.AdminCourseCreateRequest;
import com.example.back_end.dto.request.AdminCourseUpdateRequest;
import com.example.back_end.dto.response.AdminCourseResponse;
import com.example.back_end.entity.Course;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = "spring")
public interface AdminCourseMapper {

    // Chuyển Entity thành Response
    @Mapping(target = "instructorId", source = "instructor.userId")
    @Mapping(target = "instructorName", source = "instructor.fullName")
    @Mapping(target = "categoryId", source = "category.categoryId")
    @Mapping(target = "categoryName", source = "category.name")
    AdminCourseResponse toResponse(Course course);

    // Chuyển dữ liệu thêm mới thành Entity
    @Mapping(target = "courseId", ignore = true)
    @Mapping(target = "instructor", ignore = true)
    @Mapping(target = "category", ignore = true)
    @Mapping(target = "status", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    Course toEntity(AdminCourseCreateRequest request);

    // Cập nhật thông tin Entity hiện tại
    @Mapping(target = "courseId", ignore = true)
    @Mapping(target = "instructor", ignore = true)
    @Mapping(target = "category", ignore = true)
    @Mapping(target = "status", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    void updateEntity(AdminCourseUpdateRequest request, @MappingTarget Course course);
}
