
package com.example.back_end.service.impl;

import com.example.back_end.dto.request.LessonCreateRequest;
import com.example.back_end.dto.request.LessonUpdateRequest;
import com.example.back_end.dto.response.LessonResponse;
import com.example.back_end.dto.response.PageResponse;
import com.example.back_end.entity.Chapter;
import com.example.back_end.entity.Course;
import com.example.back_end.entity.Lesson;
import com.example.back_end.enumType.CourseStatus;
import com.example.back_end.enumType.GeneralStatus;
import com.example.back_end.exception.AppException;
import com.example.back_end.exception.ErrorCode;
import com.example.back_end.mapper.LessonMapper;
import com.example.back_end.repository.ChapterRepository;
import com.example.back_end.repository.CourseRepository;
import com.example.back_end.repository.LessonRepository;
import com.example.back_end.service.LessonService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
@RequiredArgsConstructor
public class LessonServiceImpl implements LessonService {

    private final LessonRepository lessonRepository;
    private final ChapterRepository chapterRepository;
    private final CourseRepository courseRepository;
    private final LessonMapper lessonMapper;

    // Kiểm tra khóa học tồn tại và chương thuộc đúng khóa học
    private Chapter getChapter(Integer courseId, Integer chapterId) {
        if (courseId == null || courseId <= 0 || chapterId == null || chapterId <= 0)
            throw new AppException(ErrorCode.VALIDATION_ERROR);

        if (!courseRepository.existsById(courseId))
            throw new AppException(ErrorCode.COURSE_NOT_FOUND);

        return chapterRepository.findByChapterIdAndCourse_CourseId(chapterId, courseId)
                .orElseThrow(() -> new AppException(ErrorCode.CHAPTER_NOT_FOUND));
    }

    // Kiểm tra bài học tồn tại và thuộc đúng chương
    private Lesson getLesson(Integer chapterId, Integer lessonId) {
        if (lessonId == null || lessonId <= 0)
            throw new AppException(ErrorCode.LESSON_NOT_FOUND);

        return lessonRepository.findByLessonIdAndChapter_ChapterId(lessonId, chapterId)
                .orElseThrow(() -> new AppException(ErrorCode.LESSON_NOT_FOUND));
    }

    // Kiểm tra khóa học đã xuất bản hoặc đang ẩn
    private boolean isPublishedOrHidden(Course course) {
        return course.getStatus() == CourseStatus.Published || course.getStatus() == CourseStatus.Hidden;
    }

    // Kiểm tra còn bài học Active khác trong các chương Active của khóa học
    private boolean hasOtherActiveLesson(Integer courseId, Integer excludedLessonId) {
        List<Chapter> chapters = chapterRepository.findByCourse_CourseIdOrderByOrderNumAsc(courseId);

        for (Chapter chapter : chapters) {
            if (chapter.getStatus() != GeneralStatus.Active) continue;

            List<Lesson> lessons = lessonRepository
                    .findByChapter_ChapterIdAndStatus(chapter.getChapterId(), GeneralStatus.Active);

            for (Lesson lesson : lessons) {
                if (!lesson.getLessonId().equals(excludedLessonId)) return true;
            }
        }
        return false;
    }

    // GET: Lấy danh sách bài học theo thứ tự trong chương
    @Override
    @Transactional(readOnly = true)
    public PageResponse<LessonResponse> getLessonsByChapterId(Integer courseId, Integer chapterId) {
        getChapter(courseId, chapterId);

        List<LessonResponse> responses = lessonRepository
                .findByChapter_ChapterIdOrderByOrderNumAscLessonIdAsc(chapterId)
                .stream().map(lessonMapper::toResponse).toList();

        Page<LessonResponse> page = new PageImpl<>(responses);
        return PageResponse.of(page);
    }

    // POST: Thêm bài học mới, tự động tăng số thứ tự
    @Override
    @Transactional
    public LessonResponse createLesson(Integer courseId, Integer chapterId, LessonCreateRequest request) {
        Chapter chapter = getChapter(courseId, chapterId);

        // Kiểm tra dữ liệu request (Controller sử dụng @Valid)
        if (request == null) throw new AppException(ErrorCode.VALIDATION_ERROR);

        // Không cho phép tạo bài học Active trong chương Inactive
        if (chapter.getStatus() != GeneralStatus.Active && request.getStatus() == GeneralStatus.Active)
            throw new AppException(ErrorCode.LESSON_CHAPTER_INACTIVE);

        // Lấy số thứ tự lớn nhất hiện tại trong chương
        int maxOrderNum = lessonRepository
                .findFirstByChapter_ChapterIdOrderByOrderNumDescLessonIdDesc(chapterId)
                .map(lesson -> lesson.getOrderNum() == null ? 0 : lesson.getOrderNum())
                .orElse(0);

        // Chuyển Request thành Entity và gán thông tin chương
        Lesson lesson = lessonMapper.toEntity(request);
        lesson.setChapter(chapter);
        lesson.setTitle(request.getTitle().trim());
        lesson.setOrderNum(maxOrderNum + 1);

        // Lưu và trả về bài học vừa tạo
        return lessonMapper.toResponse(lessonRepository.save(lesson));
    }

    // PUT: Cập nhật tên và trạng thái bài học
    @Override
    @Transactional
    public LessonResponse updateLesson(Integer courseId, Integer chapterId, Integer lessonId, LessonUpdateRequest request) {
        Chapter chapter = getChapter(courseId, chapterId);
        Lesson lesson = getLesson(chapterId, lessonId);

        // Kiểm tra dữ liệu request (Controller sử dụng @Valid)
        if (request == null) throw new AppException(ErrorCode.VALIDATION_ERROR);

        // Không cho phép kích hoạt bài học khi chương đang Inactive
        if (chapter.getStatus() != GeneralStatus.Active && request.getStatus() == GeneralStatus.Active)
            throw new AppException(ErrorCode.LESSON_CHAPTER_INACTIVE);

        // Kiểm tra có đang chuyển bài học từ Active sang Inactive hay không
        boolean deactivate = lesson.getStatus() == GeneralStatus.Active
                && request.getStatus() == GeneralStatus.Inactive;

        // Khóa học Published/Hidden phải còn ít nhất một bài học Active khác
        if (deactivate && isPublishedOrHidden(chapter.getCourse()) && !hasOtherActiveLesson(courseId, lessonId))
            throw new AppException(ErrorCode.LESSON_LAST_ACTIVE);

        // Cập nhật thông tin bằng Mapper, giữ nguyên ID, chương và thứ tự
        lessonMapper.updateEntity(request, lesson);
        lesson.setTitle(request.getTitle().trim());

        // Lưu và trả về bài học đã cập nhật
        return lessonMapper.toResponse(lessonRepository.save(lesson));
    }

    // PATCH: Thay đổi thứ tự bài học lên hoặc xuống một vị trí
    @Override
    @Transactional
    public LessonResponse moveLesson(Integer courseId, Integer chapterId, Integer lessonId, String direction) {
        getChapter(courseId, chapterId);

        // Kiểm tra hướng di chuyển hợp lệ
        if (lessonId == null || lessonId <= 0 || direction == null ||
                (!direction.equalsIgnoreCase("up") && !direction.equalsIgnoreCase("down")))
            throw new AppException(ErrorCode.VALIDATION_ERROR);

        // Lấy danh sách bài học theo thứ tự hiện tại
        List<Lesson> lessons = lessonRepository.findByChapter_ChapterIdOrderByOrderNumAscLessonIdAsc(chapterId);

        // Tìm vị trí bài học cần di chuyển
        int currentIndex = -1;
        for (int i = 0; i < lessons.size(); i++) {
            if (lessons.get(i).getLessonId().equals(lessonId)) {
                currentIndex = i;
                break;
            }
        }

        if (currentIndex == -1) throw new AppException(ErrorCode.LESSON_NOT_FOUND);

        // Xác định vị trí đích và kiểm tra giới hạn
        int targetIndex = direction.equalsIgnoreCase("up") ? currentIndex - 1 : currentIndex + 1;
        if (targetIndex < 0 || targetIndex >= lessons.size())
            throw new AppException(ErrorCode.LESSON_MOVE_INVALID);

        // Hoán đổi vị trí hai bài học
        Lesson currentLesson = lessons.get(currentIndex);
        Lesson targetLesson = lessons.get(targetIndex);
        lessons.set(currentIndex, targetLesson);
        lessons.set(targetIndex, currentLesson);

        // Chuẩn hóa thứ tự từ 1 đến N và lưu vào database
        for (int i = 0; i < lessons.size(); i++) lessons.get(i).setOrderNum(i + 1);
        lessonRepository.saveAll(lessons);

        // Trả về bài học vừa được di chuyển
        return lessonMapper.toResponse(currentLesson);
    }
}
