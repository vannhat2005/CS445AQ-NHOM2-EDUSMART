
package com.example.back_end.service.impl;

import com.example.back_end.dto.response.StudentLessonDetailResponse;

import com.example.back_end.entity.Lesson;
import com.example.back_end.entity.User;

import com.example.back_end.enumType.CourseStatus;

import com.example.back_end.repository.*;

import com.example.back_end.service.StudentLessonDetailService;

import lombok.RequiredArgsConstructor;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
@RequiredArgsConstructor
public class StudentLessonDetailServiceImpl
        implements StudentLessonDetailService {

    private final LessonRepository lessonRepository;

    private final LessonContentRepository
            lessonContentRepository;

    private final QuizRepository
            lessonQuizRepository;

    private final CourseRegistrationRepository
            courseRegistrationRepository;

    private final UserRepository userRepository;

    @Override
    @Transactional(readOnly = true)
    public StudentLessonDetailResponse getLessonDetail(
            Integer courseId,
            Integer lessonId
    ) {

        // ==========================================
        // 1. KIỂM TRA ID
        // ==========================================

        if (courseId == null || courseId <= 0
                || lessonId == null || lessonId <= 0) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "ID khóa học hoặc bài học không hợp lệ"
            );
        }

        // ==========================================
        // 2. KIỂM TRA ĐĂNG NHẬP
        // ==========================================

        Authentication authentication =
                SecurityContextHolder.getContext()
                        .getAuthentication();

        if (authentication == null
                || !authentication.isAuthenticated()
                || "anonymousUser".equals(
                authentication.getPrincipal())) {

            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Vui lòng đăng nhập"
            );
        }

        // ==========================================
        // 3. LẤY USER
        // ==========================================

        User user = userRepository
                .findByUsername(authentication.getName())
                .orElseThrow(() ->
                        new ResponseStatusException(
                                HttpStatus.UNAUTHORIZED,
                                "Không tìm thấy học viên"
                        )
                );

        Integer userId = user.getUserId();

        // ==========================================
        // 4. KIỂM TRA HỌC VIÊN ĐÃ MUA
        // ==========================================

        boolean hasPurchased =
                courseRegistrationRepository
                        .hasPurchasedCourse(
                                userId,
                                courseId
                        );

        if (!hasPurchased) {

            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Bạn chưa mua khóa học này"
            );
        }

        // ==========================================
        // 5. LẤY BÀI HỌC TỪ REPOSITORY
        // ==========================================

        Lesson lesson = lessonRepository
                .findLessonForStudent(
                        courseId,
                        lessonId,
                        CourseStatus.Published
                )
                .orElseThrow(() ->
                        new ResponseStatusException(
                                HttpStatus.NOT_FOUND,
                                "Không tìm thấy bài học "
                                        + "trong khóa học đã xuất bản"
                        )
                );

        // ==========================================
        // 6. LẤY VIDEO, PDF, TEXT
        // ==========================================

        List<StudentLessonDetailResponse.LessonContentItem>
                contents = lessonContentRepository
                .findContentsByLessonId(lessonId)
                .stream()
                .map(content ->
                        StudentLessonDetailResponse
                                .LessonContentItem
                                .builder()
                                .contentId(
                                        content.getContentId()
                                )
                                .title(
                                        content.getTitle()
                                )
                                .contentType(
                                        String.valueOf(
                                                content.getContentType()
                                        )
                                )
                                .contentData(
                                        content.getContentData()
                                )
                                .orderNum(
                                        content.getOrderNum()
                                )
                                .build()
                )
                .toList();

        // ==========================================
        // 7. LẤY QUIZ
        // ==========================================

        List<StudentLessonDetailResponse.LessonQuizItem>
                quizzes = lessonQuizRepository
                .findQuizzesByLessonId(lessonId)
                .stream()
                .map(quiz ->
                        StudentLessonDetailResponse
                                .LessonQuizItem
                                .builder()
                                .quizId(
                                        quiz.getQuizId()
                                )
                                .title(
                                        quiz.getTitle()
                                )
                                .build()
                )
                .toList();

        // ==========================================
        // 8. TRẢ DỮ LIỆU
        // ==========================================

        var chapter = lesson.getChapter();
        var course = chapter.getCourse();

        return StudentLessonDetailResponse.builder()
                .courseId(course.getCourseId())
                .courseTitle(course.getTitle())

                .chapterId(chapter.getChapterId())
                .chapterTitle(chapter.getTitle())

                .lessonId(lesson.getLessonId())
                .lessonTitle(lesson.getTitle())
                .lessonOrder(lesson.getOrderNum())

                .contents(contents)
                .quizzes(quizzes)
                .build();
    }
}
