package com.example.back_end.mapper;

import com.example.back_end.dto.request.ChapterCreateRequest;
import com.example.back_end.dto.request.ChapterUpdateRequest;
import com.example.back_end.dto.response.ChapterResponse;
import com.example.back_end.entity.Chapter;
import org.mapstruct.*;

import java.util.List;

@Mapper(componentModel = "spring")
public interface ChapterMapper {

    // Chuyển Chapter Entity sang ChapterResponse
    // lessonCount sẽ được Service bổ sung từ LessonRepository
    @Mapping(target = "courseId", source = "course.courseId")
    @Mapping(target = "courseTitle", source = "course.title")
    @Mapping(target = "lessonCount", ignore = true)
    ChapterResponse toResponse(Chapter chapter);

    // Chuyển danh sách Chapter Entity sang danh sách ChapterResponse
    List<ChapterResponse> toResponseList(List<Chapter> chapters);

    // Chuyển ChapterCreateRequest thành Chapter Entity
    @Mapping(target = "chapterId", ignore = true)
    @Mapping(target = "course", ignore = true)
    @Mapping(target = "orderNum", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    Chapter toEntity(ChapterCreateRequest request);

    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    @Mapping(target = "chapterId", ignore = true)
    @Mapping(target = "course", ignore = true)
    @Mapping(target = "orderNum", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    void updateEntity(
            ChapterUpdateRequest request,
            @MappingTarget Chapter chapter
    );
}
