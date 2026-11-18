
package com.example.back_end.service.impl;

import com.example.back_end.dto.request.ChapterCreateRequest;
import com.example.back_end.dto.request.ChapterUpdateRequest;
import com.example.back_end.dto.response.ChapterResponse;
import com.example.back_end.dto.response.PageResponse;
import com.example.back_end.entity.Chapter;
import com.example.back_end.entity.Course;
import com.example.back_end.entity.Lesson;
import com.example.back_end.entity.LessonContent;
import com.example.back_end.enumType.CourseStatus;
import com.example.back_end.enumType.GeneralStatus;
import com.example.back_end.exception.AppException;
import com.example.back_end.exception.ErrorCode;
import com.example.back_end.mapper.ChapterMapper;
import com.example.back_end.repository.ChapterRepository;
import com.example.back_end.repository.CourseRepository;
import com.example.back_end.repository.LessonRepository;
import com.example.back_end.repository.LessonContentRepository;
import com.example.back_end.service.ChapterService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ChapterServiceImpl implements ChapterService {

    private final ChapterRepository chapterRepository;
    private final CourseRepository courseRepository;
    private final LessonRepository lessonRepository;
    private final LessonContentRepository lessonContentRepository;
    private final ChapterMapper chapterMapper;

    // Lấy danh sách chương học kèm số lượng bài học theo khóa học
    @Override
    @Transactional(readOnly = true)
    public PageResponse<ChapterResponse> getChaptersByCourseId(Integer courseId) {

        // Kiểm tra khóa học có tồn tại hay không
        if (!courseRepository.existsById(courseId)) {
            throw new AppException(ErrorCode.COURSE_NOT_FOUND);
        }

        // Lấy tất cả chương thuộc khóa học và sắp xếp theo orderNum tăng dần
        List<Chapter> chapters = chapterRepository.findByCourse_CourseIdOrderByOrderNumAscChapterIdAsc(courseId);

        // Chuyển danh sách Chapter Entity sang ChapterResponse
        List<ChapterResponse> chapterResponses = chapters.stream().map(chapter -> {

            // Chuyển Chapter Entity sang DTO
            ChapterResponse response = chapterMapper.toResponse(chapter);

            // Đếm tổng số bài học thuộc chương
            long lessonCount = lessonRepository.countByChapter_ChapterId(chapter.getChapterId());

            // Gán tổng số bài học vào ChapterResponse
            response.setLessonCount(lessonCount);

            return response;
        }).toList();

        // Đóng gói toàn bộ danh sách chương thành Page
        Page<ChapterResponse> page = new PageImpl<>(chapterResponses);

        // Chuyển Page thành PageResponse để trả về Frontend
        return PageResponse.of(page);
    }

    // Thêm chương học mới
    @Override
    @Transactional
    public ChapterResponse createChapter(Integer courseId, ChapterCreateRequest request) {
        // Kiểm tra ID khóa học hợp lệ
        if (courseId == null || courseId <= 0) {
            throw new AppException(ErrorCode.VALIDATION_ERROR);
        }

        // Lấy khóa học, nếu không tồn tại thì báo lỗi
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new AppException(ErrorCode.COURSE_NOT_FOUND));

        // Lấy số thứ tự chương lớn nhất của khóa học
        int maxOrderNum = chapterRepository
                .findFirstByCourse_CourseIdOrderByOrderNumDescChapterIdDesc(courseId)
                .map(chapter -> chapter.getOrderNum() == null ? 0 : chapter.getOrderNum())
                .orElse(0);

        // Chuyển Request thành Chapter Entity bằng Mapper
        Chapter chapter = chapterMapper.toEntity(request);

        // Gán khóa học và số thứ tự cho chương mới
        chapter.setCourse(course);
        chapter.setOrderNum(maxOrderNum + 1);

        // Lưu chương vào database
        Chapter savedChapter = chapterRepository.save(chapter);

        // Chuyển Entity thành Response
        ChapterResponse response = chapterMapper.toResponse(savedChapter);

        // Chương mới chưa có bài học
        response.setLessonCount(0L);

        return response;

    }

    // Cập nhật thông tin chương học
    @Override
    public ChapterResponse updateChapter(Integer courseId, Integer chapterId, ChapterUpdateRequest request) {
        // 1. Kiểm tra khóa học tồn tại
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() ->
                        new AppException(ErrorCode.COURSE_NOT_FOUND)
                );

        // 2. Kiểm tra chương thuộc khóa học
        Chapter chapter = chapterRepository
                .findByChapterIdAndCourse_CourseId(chapterId, courseId)
                .orElseThrow(() ->
                        new AppException(ErrorCode.CHAPTER_NOT_FOUND)
                );

        // 3. Xác định trạng thái khóa học
        boolean isPublishedOrHidden =
                course.getStatus() == CourseStatus.Published
                        || course.getStatus() == CourseStatus.Hidden;

        // 4. Xác định có đang vô hiệu hóa chương hay không
        boolean deactivate =
                chapter.getStatus() == GeneralStatus.Active
                        && request.getStatus() == GeneralStatus.Inactive;

        // 5. Kiểm tra điều kiện trước khi vô hiệu hóa chương
        if (isPublishedOrHidden && deactivate) {

            // Lấy toàn bộ chương thuộc khóa học
            List<Chapter> chapters = chapterRepository
                    .findByCourse_CourseIdOrderByOrderNumAscChapterIdAsc(
                            courseId
                    );

            // Kiểm tra sau khi vô hiệu hóa chương hiện tại
            // có còn chương nào đang hoạt động hay không
            boolean hasOtherActiveChapter = chapters.stream()
                    .anyMatch(c ->
                            !c.getChapterId().equals(chapterId)
                                    && c.getStatus() == GeneralStatus.Active
                    );

            // Không cho phép tắt chương hoạt động cuối cùng
            if (!hasOtherActiveChapter) {
                throw new AppException(
                        ErrorCode.COURSE_MUST_HAVE_ACTIVE_CHAPTER
                );
            }
        }

        // 6. Cập nhật thông tin chương
        chapterMapper.updateEntity(request, chapter);

        chapter.setTitle(request.getTitle().trim());

        chapter.setDescription(
                request.getDescription() == null
                        ? null
                        : request.getDescription().trim()
        );

        // 7. Nếu chuyển Active -> Inactive,
        // vô hiệu hóa các bài học và nội dung bài học thuộc chương
        if (deactivate) {
            List<Lesson> lessons =
                    lessonRepository.findByChapter_ChapterId(chapterId);

            for (Lesson lesson : lessons) {
                lesson.setStatus(GeneralStatus.Inactive);

                // Lấy tất cả nội dung thuộc bài học
                List<LessonContent> contents = lessonContentRepository
                        .findByLesson_LessonIdOrderByOrderNumAscContentIdAsc(lesson.getLessonId());

                // Chuyển tất cả nội dung sang Inactive
                for (LessonContent content : contents) {
                    content.setStatus(GeneralStatus.Inactive);
                }

                lessonContentRepository.saveAll(contents);
            }

            lessonRepository.saveAll(lessons);
        }

        // 8. Lưu chương
        Chapter savedChapter = chapterRepository.save(chapter);

        // 9. Chuyển Entity thành Response
        ChapterResponse response =
                chapterMapper.toResponse(savedChapter);

        // 10. Gán số lượng bài học
        response.setLessonCount(
                lessonRepository.countByChapter_ChapterId(chapterId)
        );

        return response;

    }

    @Override
    public ChapterResponse moveChapter(Integer courseId, Integer chapterId, String direction) {
        // 1. Kiểm tra khóa học tồn tại
        if (!courseRepository.existsById(courseId)) {
            throw new AppException(ErrorCode.COURSE_NOT_FOUND);
        }

        // 2. Lấy danh sách chương theo thứ tự hiện tại
        List<Chapter> chapters = chapterRepository
                .findByCourse_CourseIdOrderByOrderNumAscChapterIdAsc(
                        courseId
                );

        // 3. Xác định vị trí chương cần di chuyển
        int currentIndex = -1;

        for (int i = 0; i < chapters.size(); i++) {
            if (chapters.get(i).getChapterId().equals(chapterId)) {
                currentIndex = i;
                break;
            }
        }

        if (currentIndex == -1) {
            throw new AppException(ErrorCode.CHAPTER_NOT_FOUND);
        }

        // 4. Xác định vị trí đích
        int targetIndex = direction.equalsIgnoreCase("up")
                ? currentIndex - 1
                : currentIndex + 1;

        // Không cho phép di chuyển vượt giới hạn
        if (targetIndex < 0 || targetIndex >= chapters.size()) {
            throw new AppException(ErrorCode.VALIDATION_ERROR);
        }

        // 5. Hoán đổi vị trí trong danh sách
        Chapter currentChapter = chapters.get(currentIndex);
        Chapter targetChapter = chapters.get(targetIndex);

        chapters.set(currentIndex, targetChapter);
        chapters.set(targetIndex, currentChapter);

        // 6. Chuẩn hóa orderNum liên tục từ 1 đến N
        for (int i = 0; i < chapters.size(); i++) {
            chapters.get(i).setOrderNum(i + 1);
        }

        // 7. Lưu thứ tự mới
        chapterRepository.saveAll(chapters);

        // 8. Trả về chương vừa di chuyển
        ChapterResponse response =
                chapterMapper.toResponse(currentChapter);

        response.setLessonCount(
                lessonRepository.countByChapter_ChapterId(chapterId)
        );

        return response;
    }


}
