
package com.example.back_end.mapper;

import com.example.back_end.dto.request.LessonCreateRequest;
import com.example.back_end.dto.request.LessonUpdateRequest;
import com.example.back_end.dto.response.LessonResponse;
import com.example.back_end.entity.Lesson;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = "spring")
public interface LessonMapper {

    // Chuyển dữ liệu thêm bài học thành Entity, bỏ qua các trường do Backend quản lý
    @Mapping(target = "lessonId", ignore = true)
    @Mapping(target = "chapter", ignore = true)
    @Mapping(target = "orderNum", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    Lesson toEntity(LessonCreateRequest request);

    // Chuyển Lesson Entity thành Response, lấy thêm ID và tên chương học
    @Mapping(target = "chapterId", source = "chapter.chapterId")
    @Mapping(target = "chapterTitle", source = "chapter.title")
    LessonResponse toResponse(Lesson lesson);

    // Cập nhật tên và trạng thái bài học, giữ nguyên ID, chương, thứ tự và thời gian tạo
    @Mapping(target = "lessonId", ignore = true)
    @Mapping(target = "chapter", ignore = true)
    @Mapping(target = "orderNum", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    void updateEntity(LessonUpdateRequest request, @MappingTarget Lesson lesson);
}
