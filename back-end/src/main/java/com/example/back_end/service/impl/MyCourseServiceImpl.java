
package com.example.back_end.service.impl;

import com.example.back_end.dto.response.MyCourseResponse;
import com.example.back_end.dto.response.PageResponse;
import com.example.back_end.entity.CourseRegistration;
import com.example.back_end.entity.User;
import com.example.back_end.enumType.RegistrationStatus;
import com.example.back_end.repository.CourseRegistrationRepository;
import com.example.back_end.repository.QuizRepository;
import com.example.back_end.repository.QuizResultRepository;
import com.example.back_end.repository.UserRepository;
import com.example.back_end.service.MyCourseService;

import lombok.RequiredArgsConstructor;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

import org.springframework.security.authentication.AuthenticationCredentialsNotFoundException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;

@Service
@RequiredArgsConstructor
public class MyCourseServiceImpl implements MyCourseService {

    private final UserRepository userRepository;
    private final CourseRegistrationRepository courseRegistrationRepository;
    private final QuizRepository quizRepository;
    private final QuizResultRepository quizResultRepository;

    // API cũ vẫn hoạt động
    @Override
    @Transactional(readOnly = true)
    public PageResponse<MyCourseResponse> getMyCourses(
            int pageNo,
            int pageSize
    ) {
        return getMyCourses(
                pageNo,
                pageSize,
                "ALL",
                "",
                "ALL_NEWEST"
        );
    }

    // API mới: lọc, tìm kiếm, sắp xếp
    @Override
    @Transactional(readOnly = true)
    public PageResponse<MyCourseResponse> getMyCourses(
            int pageNo,
            int pageSize,
            String status,
            String keyword,
            String sortBy
    ) {

        // 1. Xác thực người dùng
        Authentication authentication =
                SecurityContextHolder.getContext()
                        .getAuthentication();

        if (authentication == null
                || !authentication.isAuthenticated()
                || "anonymousUser".equals(
                authentication.getPrincipal())) {

            throw new AuthenticationCredentialsNotFoundException(
                    "Bạn cần đăng nhập để xem khóa học"
            );
        }

        User user = userRepository
                .findByUsername(authentication.getName())
                .orElseThrow(() ->
                        new AuthenticationCredentialsNotFoundException(
                                "Không tìm thấy người dùng"
                        )
                );

        Integer userId = user.getUserId();

        // 2. Chuẩn hóa tham số
        int validPageNo = Math.max(1, pageNo);
        int validPageSize = Math.max(
                1,
                Math.min(pageSize, 100)
        );

        String normalizedStatus = status == null
                ? "ALL"
                : status.trim().toUpperCase(Locale.ROOT);

        String normalizedSort = sortBy == null
                ? "ALL_NEWEST"
                : sortBy.trim().toUpperCase(Locale.ROOT);

        String searchKeyword =
                keyword == null || keyword.isBlank()
                        ? null
                        : keyword.trim();

        // 3. Mới đăng ký: trong 30 ngày gần nhất
        LocalDateTime fromDate = null;

        if ("NEWEST".equals(normalizedSort)
                || "RECENT_30_DAYS".equals(normalizedSort)) {
            fromDate = LocalDateTime.now().minusDays(30);
        }

        // 4. Sắp xếp trong Repository
        Sort sort;

        if ("TITLE_ASC".equals(normalizedSort)) {
            sort = Sort.by(
                    Sort.Direction.ASC,
                    "course.title"
            );
        } else {
            sort = Sort.by(
                    Sort.Direction.DESC,
                    "createdAt"
            );
        }

        // 5. Nếu chỉ tìm kiếm / lọc ngày / sắp xếp tên,
        // Repository có thể phân trang trực tiếp.
        boolean needsProgressFiltering =
                "IN_PROGRESS".equals(normalizedStatus)
                        || "COMPLETED".equals(normalizedStatus)
                        || "NOT_STARTED".equals(normalizedStatus);

        boolean needsProgressSorting =
                "PROGRESS_DESC".equals(normalizedSort);

        if (!needsProgressFiltering && !needsProgressSorting) {

            Pageable pageable = PageRequest.of(
                    validPageNo - 1,
                    validPageSize,
                    sort
            );

            Page<CourseRegistration> registrationPage =
                    courseRegistrationRepository.findMyCoursesFiltered(
                            userId,
                            RegistrationStatus.Paid,
                            searchKeyword,
                            fromDate,
                            pageable
                    );

            Page<MyCourseResponse> responsePage =
                    registrationPage.map(registration ->
                            mapToResponse(registration, userId)
                    );

            return PageResponse.of(responsePage);
        }

        // 6. Khi cần lọc tiến độ:
        // Lấy các đăng ký đã lọc tên/ngày từ Repository
        // theo từng đợt để bảo đảm phân trang cuối đúng.
        List<MyCourseResponse> filteredCourses =
                new ArrayList<>();

        int batchNumber = 0;
        int batchSize = 200;

        Page<CourseRegistration> batch;

        do {
            Pageable batchPageable = PageRequest.of(
                    batchNumber,
                    batchSize,
                    sort
            );

            batch = courseRegistrationRepository.findMyCoursesFiltered(
                    userId,
                    RegistrationStatus.Paid,
                    searchKeyword,
                    fromDate,
                    batchPageable
            );

            for (CourseRegistration registration : batch.getContent()) {

                MyCourseResponse course =
                        mapToResponse(registration, userId);

                if (matchesLearningStatus(
                        course,
                        normalizedStatus
                )) {
                    filteredCourses.add(course);
                }
            }

            batchNumber++;

        } while (batch.hasNext());

        // 7. Sắp xếp theo tiến độ cao nhất
        if (needsProgressSorting) {
            filteredCourses.sort(
                    Comparator.comparingInt(
                            MyCourseResponse::getProgressPercent
                    ).reversed()
            );
        }

        // 8. Phân trang sau khi lọc tiến độ
        int totalElements = filteredCourses.size();

        long offset =
                (long) (validPageNo - 1) * validPageSize;

        int fromIndex = (int) Math.min(
                offset,
                totalElements
        );

        int toIndex = (int) Math.min(
                (long) fromIndex + validPageSize,
                totalElements
        );

        List<MyCourseResponse> pageContent =
                filteredCourses.subList(
                        fromIndex,
                        toIndex
                );

        Pageable resultPageable = PageRequest.of(
                validPageNo - 1,
                validPageSize
        );

        Page<MyCourseResponse> responsePage =
                new PageImpl<>(
                        pageContent,
                        resultPageable,
                        totalElements
                );

        return PageResponse.of(responsePage);
    }

    // Kiểm tra trạng thái học tập
    private boolean matchesLearningStatus(
            MyCourseResponse course,
            String status
    ) {
        if ("ALL".equals(status)) {
            return true;
        }

        return status.equals(course.getLearningStatus());
    }

    // Mapping khóa học và tính tiến độ
    private MyCourseResponse mapToResponse(
            CourseRegistration registration,
            Integer userId
    ) {

        var course = registration.getCourse();

        Integer courseId = course.getCourseId();

        // Tổng số Quiz của khóa học
        long totalQuizzes =
                quizRepository.countQuizzesByCourseId(
                        courseId
                );

        // Tổng Quiz người học đã nộp
        long completedQuizzes =
                quizResultRepository.countCompletedQuizzes(
                        userId,
                        courseId
                );

        completedQuizzes = Math.max(
                0,
                Math.min(completedQuizzes, totalQuizzes)
        );

        // Tiến độ phần trăm
        int progressPercent = 0;

        if (totalQuizzes > 0) {
            progressPercent = (int) Math.round(
                    completedQuizzes * 100.0 / totalQuizzes
            );
        }

        progressPercent = Math.max(
                0,
                Math.min(progressPercent, 100)
        );

        // Trạng thái học tập
        String learningStatus;

        if (totalQuizzes == 0 || completedQuizzes == 0) {
            learningStatus = "NOT_STARTED";
        } else if (completedQuizzes >= totalQuizzes) {
            learningStatus = "COMPLETED";
        } else {
            learningStatus = "IN_PROGRESS";
        }

        return MyCourseResponse.builder()
                .courseId(courseId)
                .title(course.getTitle())
                .description(course.getDescription())
                .imageUrl(course.getImageUrl())
                .price(course.getPrice())

                .instructorName(
                        course.getInstructor() != null
                                ? course.getInstructor().getFullName()
                                : null
                )

                .categoryName(
                        course.getCategory() != null
                                ? course.getCategory().getName()
                                : null
                )

                .enrollmentStatus(
                        registration.getStatus() != null
                                ? registration.getStatus().name()
                                : null
                )

                .enrolledAt(registration.getCreatedAt())
                .totalQuizzes(totalQuizzes)
                .completedQuizzes(completedQuizzes)
                .progressPercent(progressPercent)
                .learningStatus(learningStatus)
                .build();
    }
}
