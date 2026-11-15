package com.example.back_end.mapper;

import com.example.back_end.dto.response.ChapterResponse;
import com.example.back_end.entity.Chapter;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;

@Mapper(componentModel = "spring")
public interface ChapterMapper {

    // Chuyển Chapter Entity sang ChapterResponse
    // lessonCount sẽ được Service bổ sung từ LessonRepository

    @Mapping(target = "lessonCount", ignore = true)
    @Mapping(target = "status", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    ChapterResponse toResponse(Chapter chapter);

    // Chuyển danh sách Chapter Entity sang danh sách ChapterResponse
    List<ChapterResponse> toResponseList(List<Chapter> chapters);
}
