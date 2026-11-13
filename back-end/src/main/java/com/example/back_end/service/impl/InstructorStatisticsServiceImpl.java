
package com.example.back_end.service.impl;

import com.example.back_end.dto.response.InstructorStatisticsResponse;
import com.example.back_end.dto.response.RecentCourseResponse;
import com.example.back_end.entity.Course;
import com.example.back_end.enumType.CourseStatus;
import com.example.back_end.repository.*;
import com.example.back_end.service.InstructorStatisticsService;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class InstructorStatisticsServiceImpl
        implements InstructorStatisticsService {

    private final CourseRepository courseRepository;

    private final QuizRepository quizRepository;

    private final CourseRegistrationRepository courseRegistrationRepository;
    private final ChapterRepository chapterRepository;
    private final LessonRepository lessonRepository;
    @Override
    @Transactional(readOnly = true)
    public InstructorStatisticsResponse getStatistics(Integer instructorId) {

        // 1. Tổng số khóa học được phân công
        long totalCourses =
                courseRepository.countByInstructor_UserId(instructorId);

        // 2. Tổng số học viên
        long totalStudents =
                courseRegistrationRepository.countStudentsByInstructor(instructorId);

        // 3. Tổng số bài trắc nghiệm
        long totalQuizzes =
                quizRepository.countLessonQuizzes(instructorId);

        // 4. Tổng số bài kiểm tra cuối chương
        long totalChapterTests =
                quizRepository.countChapterTests(instructorId);

        // 5. Tổng số bản nháp
        long totalDrafts =
                courseRepository.countByInstructor_UserIdAndStatus(
                        instructorId,
                        CourseStatus.Draft
                );

        // 6. Trả về dữ liệu thống kê
        return new InstructorStatisticsResponse(
                totalCourses,
                totalStudents,
                totalQuizzes,
                totalChapterTests,
                totalDrafts
        );
    }
    @Override
    public List<RecentCourseResponse> getRecentCourses(
            Integer instructorId
    ) {

        List<Course> courses = courseRepository
                .findTop3ByInstructor_UserIdOrderByCreatedAtDesc(
                        instructorId
                );

        return courses.stream().map(course -> {

            Integer courseId = course.getCourseId();

            long totalStudents =
                    courseRegistrationRepository
                            .countStudentsByCourseId(courseId);

            long totalChapters =
                    chapterRepository
                            .countByCourse_CourseId(courseId);

            long totalLessons =
                    lessonRepository
                            .countByChapter_Course_CourseId(courseId);

            return new RecentCourseResponse(
                    courseId,
                    course.getTitle(),
                    course.getImageUrl(),
                    totalStudents,
                    totalChapters,
                    totalLessons
            );

        }).toList();
    }
}
