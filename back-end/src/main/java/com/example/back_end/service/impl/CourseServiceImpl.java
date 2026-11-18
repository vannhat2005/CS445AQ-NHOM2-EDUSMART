 package com.example.back_end.service.impl;

import com.example.back_end.dto.request.CourseRequest;
import com.example.back_end.dto.response.*;
import com.example.back_end.entity.Chapter;
import com.example.back_end.entity.Course;
import com.example.back_end.entity.Lesson;
import com.example.back_end.entity.Review;
import com.example.back_end.enumType.CourseStatus;
import com.example.back_end.enumType.GeneralStatus;
import com.example.back_end.enumType.RegistrationStatus;
import com.example.back_end.exception.AppException;
import com.example.back_end.exception.ErrorCode;
import com.example.back_end.mapper.ChapterMapper;
import com.example.back_end.mapper.CourseMapper;
import com.example.back_end.repository.*;
import com.example.back_end.service.CourseService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CourseServiceImpl implements CourseService {

    private final CourseRepository courseRepository;
    private final CourseMapper courseMapper;
    private final ChapterMapper chapterMapper;
    private final CourseRegistrationRepository courseRegistrationRepository;


    // Inject thêm các repo cần thiết để set khóa ngoại khi tạo mới
    private final UserRepository userRepository;
    private final CategoryRepository categoryRepository;
    private final ChapterRepository chapterRepository;
    private final LessonRepository lessonRepository;
    private final LessonContentRepository lessonContentRepository;

    private final ReviewRepository reviewRepository;
    //Khóa học phân công cho giảng viên: Lấy danh sách khóa học được phân công
    @Override
    public PageResponse<CourseResponse> getAssignedCourses(Integer instructorId, int pageNo, int pageSize) {
        // Khởi tạo đối tượng phân trang (Spring Data JPA bắt đầu trang từ 0)
        System.out.println("=== ID Giảng viên truyền vào API: " + instructorId + " ===");
        Pageable pageable = PageRequest.of(pageNo - 1, pageSize);

        // Lấy danh sách khóa học theo ID giảng viên từ DB
        Page<Course> coursePage = courseRepository.findByInstructor_UserId(instructorId, pageable);

        // Chuyển Entity thành DTO, MapStruct sẽ ép NULL các trường bị ignore
        List<CourseResponse> content = coursePage.getContent().stream()
                .map(courseMapper::toCourseListResponse)
                .collect(Collectors.toList());

        // Bọc vào cấu trúc phân trang để trả về
        return PageResponse.<CourseResponse>builder()
                .content(content)
                .pageNo(coursePage.getNumber() + 1)
                .pageSize(coursePage.getSize())
                .totalElements(coursePage.getTotalElements())
                .totalPages(coursePage.getTotalPages())
                .isLast(coursePage.isLast())
                .build();
    }

    // Giảng viên: Xem chi tiết khóa học kèm danh sách chương và số bài học
    @Override
    @Transactional(readOnly = true)
    public CourseResponse getAssignedCourseDetail(Integer courseId, Integer instructorId) {
        // 1. Tìm khóa học theo ID khóa học và ID giảng viên
        Course course = courseRepository
                .findByCourseIdAndInstructor_UserId(courseId, instructorId)
                .orElseThrow(() -> new AppException(ErrorCode.COURSE_NOT_FOUND));

        // 2. Chuyển thông tin Course Entity sang CourseResponse
        CourseResponse response = courseMapper.toCourseDetailResponse(course);

        // 3. Lấy danh sách chương thuộc khóa học
        List<Chapter> chapters =
                chapterRepository.findByCourse_CourseId(courseId);

        // 4. Chuyển danh sách Chapter Entity sang ChapterResponse
        List<ChapterResponse> chapterResponses =
                chapterMapper.toResponseList(chapters);

        // 5. Bổ sung số lượng bài học cho từng chương
        chapterResponses.forEach(chapter ->
                chapter.setLessonCount(
                        lessonRepository.countByChapter_ChapterId(
                                chapter.getChapterId()
                        )
                )
        );

        // 6. Gắn danh sách chương vào CourseResponse
        response.setChapters(chapterResponses);

        // 7. Trả về kết quả
        return response;
    }

    //Xuất bản khóa học(Giảng viên)
    @Override
    @Transactional
    public void publishCourse(Integer courseId, Integer instructorId) {

        // 1. Kiểm tra khóa học có tồn tại và thuộc giảng viên này không
        Course course = courseRepository
                .findByCourseIdAndInstructor_UserId(courseId, instructorId)
                .orElseThrow(() -> new AppException(ErrorCode.COURSE_NOT_FOUND));

        // 2. Chỉ cho phép xuất bản khóa học đang ở trạng thái Draft
        if (course.getStatus() != CourseStatus.Draft) {
            throw new AppException(ErrorCode.COURSE_NOT_DRAFT);
        }

        // 3. Lấy trạng thái Active
        GeneralStatus active = GeneralStatus.Active;

        // 4. Lấy danh sách chương Active của khóa học
        List<Chapter> activeChapters = chapterRepository.findByCourse_CourseIdAndStatus(courseId, active);

        // 5. Kiểm tra khóa học phải có ít nhất một chương Active
        if (activeChapters.isEmpty()) {
            throw new AppException(ErrorCode.COURSE_NO_ACTIVE_CHAPTER);
        }

        // 6. Kiểm tra từng chương Active
        for (Chapter chapter : activeChapters) {
            // Lấy danh sách bài học Active thuộc chương
            List<Lesson> activeLessons =
                    lessonRepository.findByChapter_ChapterIdAndStatus(
                            chapter.getChapterId(), active
                    );

            // 7. Mỗi chương Active phải có ít nhất một bài học Active
            if (activeLessons.isEmpty()) {
                throw new AppException(ErrorCode.CHAPTER_NO_ACTIVE_LESSON);
            }

            // 8. Kiểm tra từng bài học Active
            for (Lesson lesson : activeLessons) {
                // 9. Kiểm tra xem bài học có nội dung Active nào không
                boolean hasContent = lessonContentRepository
                        .existsByLesson_LessonIdAndStatus(lesson.getLessonId(), active);

                if (!hasContent) {
                    throw new AppException(ErrorCode.LESSON_NO_VALID_ACTIVE_CONTENT);
                }

                // 10. Kiểm tra xem có nội dung nào bị lỗi/thiếu dữ liệu không (Dùng luôn SQL ở Repository)
                boolean hasInvalidContent = lessonContentRepository
                        .existsInvalidActiveContent(lesson.getLessonId(), active);

                // 11. Nếu có nội dung lỗi -> Báo lỗi
                if (hasInvalidContent) {
                    throw new AppException(ErrorCode.LESSON_HAS_INVALID_ACTIVE_CONTENT);
                }
            }
        }

        // 12. Tất cả điều kiện đều hợp lệ -> Chuyển trạng thái Published
        course.setStatus(CourseStatus.Published);

        // 13. Lưu thay đổi xuống Database
        courseRepository.save(course);
    }


    @Override
    public void createCourse(CourseRequest request, Integer instructorId) {
        // 1. Dùng mapper để map các field cơ bản từ Request sang Entity
        Course newCourse = courseMapper.toEntity(request);

        // 2. Thiết lập trạng thái mặc định (Theo PB33, khóa học mới tạo tự động gán trạng thái là "Draft"[cite: 2])
        newCourse.setStatus(CourseStatus.Draft);

        // 3. Truy xuất và gán các Entity liên quan (Khóa ngoại)
        // Dùng getReferenceById để tối ưu hiệu suất (chỉ tạo proxy chứa ID thay vì select full dòng từ DB)
        newCourse.setInstructor(userRepository.getReferenceById(instructorId));
        newCourse.setCategory(categoryRepository.getReferenceById(request.getCategoryId()));

        // 4. Lưu dữ liệu
        courseRepository.save(newCourse);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<CourseSearchResponse> searchCourses(
            String keyword,
            int pageNo,
            int pageSize
    ) {

        if (pageNo < 1 || pageSize < 1) {
            throw new IllegalArgumentException(
                    "pageNo and pageSize must be greater than 0"
            );
        }

        Pageable pageable = PageRequest.of(
                pageNo - 1,
                pageSize
        );

        String searchKeyword =
                keyword == null || keyword.isBlank()
                        ? null
                        : keyword.trim();

        Page<Course> coursePage =
                courseRepository.searchCourses(
                        searchKeyword,
                        CourseStatus.Published,
                        pageable
                );

        List<CourseSearchResponse> content =
                coursePage.getContent()
                        .stream()
                        .map(course -> {

                            CourseSearchResponse response =
                                    courseMapper.toCourseSearchResponse(course);

                            Integer courseId = course.getCourseId();

                            Double averageRating =
                                    reviewRepository.getAverageRating(courseId);

                            Long totalReviews =
                                    reviewRepository.countByCourse_CourseId(courseId);

                            response.setAverageRating(
                                    averageRating == null
                                            ? 0.0
                                            : Math.round(averageRating * 10.0) / 10.0
                            );

                            response.setTotalReviews(totalReviews);

                            return response;
                        })
                        .toList();

        return PageResponse.<CourseSearchResponse>builder()
                .content(content)
                .pageNo(coursePage.getNumber() + 1)
                .pageSize(coursePage.getSize())
                .totalElements(coursePage.getTotalElements())
                .totalPages(coursePage.getTotalPages())
                .isLast(coursePage.isLast())
                .build();
    }


    @Override
    @Transactional(readOnly = true)
    public PageResponse<FeaturedCourseResponse> getFeaturedCourses(
            int pageNo,
            int pageSize
    ) {

        // 1. Kiểm tra tham số phân trang
        if (pageNo < 1) {
            throw new IllegalArgumentException("pageNo must be >= 1");
        }

        if (pageSize < 1 || pageSize > 20) {
            throw new IllegalArgumentException(
                    "pageSize must be between 1 and 20"
            );
        }

        // 2. Spring Data JPA bắt đầu từ trang 0
        Pageable pageable = PageRequest.of(pageNo - 1, pageSize);

        // 3. Lấy khóa học Published,
        // ưu tiên số lượt đăng ký Paid
        Page<Course> coursePage =
                courseRepository.findFeaturedCourses(
                        CourseStatus.Published,
                        RegistrationStatus.Paid,
                        pageable
                );

        // 4. Chuyển Entity sang Response
        Page<FeaturedCourseResponse> responsePage =
                coursePage.map(course -> {

                    Integer courseId = course.getCourseId();

                    // 5. Lấy điểm đánh giá trung bình
                    Double averageRating =
                            reviewRepository.getAverageRating(courseId);

                    // 6. Đếm tổng lượt đánh giá
                    Long totalReviews =
                            reviewRepository.countByCourse_CourseId(
                                    courseId
                            );

                    // 7. Đếm học viên đăng ký thành công
                    Long totalStudents =
                            courseRegistrationRepository
                                    .countByCourse_CourseIdAndStatus(
                                            courseId,
                                            RegistrationStatus.Paid
                                    );


                    // 8. Trả về dữ liệu cho frontend
                    return FeaturedCourseResponse.builder()
                            .courseId(courseId)
                            .title(course.getTitle())
                            .description(course.getDescription())
                            .imageUrl(course.getImageUrl())
                            .price(course.getPrice())
                            .instructorName(
                                    course.getInstructor() != null
                                            ? course.getInstructor()
                                            .getFullName()
                                            : null
                            )
                            .averageRating(
                                    averageRating == null
                                            ? 0.0
                                            : Math.round(
                                            averageRating * 10.0
                                    ) / 10.0
                            )
                            .totalReviews(
                                    totalReviews == null
                                            ? 0L
                                            : totalReviews
                            )
                            .totalStudents(
                                    totalStudents == null
                                            ? 0L
                                            : totalStudents
                            )
                            .build();
                });

        // 9. Chuyển Page sang PageResponse
        return PageResponse.of(responsePage);
    }


    @Override
    @Transactional(readOnly = true)
    public CourseDetailResponse getCourseDetail(Integer courseId, Integer userId) {

        // 1. Kiểm tra courseId
        if (courseId == null || courseId <= 0) {
            throw new IllegalArgumentException(
                    "ID khóa học không hợp lệ"
            );
        }

        // 2. Tìm khóa học
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new IllegalArgumentException(
                        "Không tìm thấy khóa học với ID: " + courseId
                ));

        // 3. Chỉ cho phép xem khóa học Published
        if (course.getStatus() != CourseStatus.Published) {
            throw new IllegalArgumentException(
                    "Khóa học chưa được xuất bản"
            );
        }

        // 4. Lấy đánh giá trung bình
        Double averageRating =
                reviewRepository.getAverageRating(courseId);

        // 5. Tổng số lượt đánh giá
        Long totalReviews =
                reviewRepository.countByCourse_CourseId(courseId);

        // 6. Tổng học viên đã thanh toán
        Long totalStudents =
                courseRegistrationRepository
                        .countByCourse_CourseIdAndStatus(
                                courseId,
                                RegistrationStatus.Paid
                        );
        // Quyền sở hữu khóa học chỉ dựa trên đăng ký đã thanh toán.
        boolean isEnrolled = userId != null
                && courseRegistrationRepository.hasPurchasedCourse(userId, courseId);

        // Mỗi học viên chỉ được đánh giá một lần.
        boolean hasReviewed = userId != null
                && reviewRepository.existsByStudent_UserIdAndCourse_CourseId(userId, courseId);
        boolean canReview = isEnrolled && !hasReviewed;


        // 7. Trả về thông tin chi tiết khóa học
        return CourseDetailResponse.builder()
                .courseId(course.getCourseId())
                .title(course.getTitle())
                .description(course.getDescription())
                .learningOutcomes(course.getLearningOutcomes())
                .price(course.getPrice())
                .imageUrl(course.getImageUrl())
                .status(course.getStatus().name())

                // Giảng viên
                .instructorId(
                        course.getInstructor() != null
                                ? course.getInstructor().getUserId()
                                : null
                )
                .instructorName(
                        course.getInstructor() != null
                                ? course.getInstructor().getFullName()
                                : null
                )

                // Danh mục
                .categoryId(
                        course.getCategory() != null
                                ? course.getCategory().getCategoryId()
                                : null
                )
                .categoryName(
                        course.getCategory() != null
                                ? course.getCategory().getName()
                                : null
                )

                // Đánh giá
                .averageRating(
                        averageRating == null
                                ? 0.0
                                : Math.round(averageRating * 10.0) / 10.0
                )
                .totalReviews(
                        totalReviews == null ? 0L : totalReviews
                )
                .totalStudents(
                        totalStudents == null ? 0L : totalStudents
                )
                .isEnrolled(isEnrolled)
                .canReview(canReview)
                .build();
    }



    @Override
    @Transactional(readOnly = true)
    public CourseCurriculumResponse getCourseCurriculum(Integer courseId) {

        // 1. Kiểm tra courseId
        if (courseId == null || courseId <= 0) {
            throw new IllegalArgumentException(
                    "ID khóa học không hợp lệ"
            );
        }

        // 2. Tìm khóa học
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new IllegalArgumentException(
                        "Không tìm thấy khóa học với ID: " + courseId
                ));

        // 3. Kiểm tra trạng thái khóa học
        if (course.getStatus() != CourseStatus.Published) {
            throw new IllegalArgumentException(
                    "Khóa học chưa được xuất bản"
            );
        }

        // 4. Lấy danh sách chương, sắp xếp theo orderNum
        List<Chapter> chapters =
                chapterRepository
                        .findByCourse_CourseIdOrderByOrderNumAsc(courseId);

        // 5. Chuyển Chapter và Lesson sang Response
        List<ChapterCurriculumResponse> chapterResponses =
                chapters.stream()
                        .map(chapter -> {

                            // Lấy các bài học thuộc chương
                            List<Lesson> lessons =
                                    lessonRepository
                                            .findByChapter_ChapterIdOrderByOrderNumAsc(
                                                    chapter.getChapterId()
                                            );

                            // Chuyển Lesson sang LessonCurriculumResponse
                            List<LessonCurriculumResponse> lessonResponses =
                                    lessons.stream()
                                            .map(lesson ->
                                                    LessonCurriculumResponse.builder()
                                                            .lessonId(
                                                                    lesson.getLessonId()
                                                            )
                                                            .title(
                                                                    lesson.getTitle()
                                                            )
                                                            .orderNum(
                                                                    lesson.getOrderNum()
                                                            )
                                                            .build()
                                            )
                                            .toList();

                            // Chuyển Chapter sang ChapterCurriculumResponse
                            return ChapterCurriculumResponse.builder()
                                    .chapterId(
                                            chapter.getChapterId()
                                    )
                                    .title(
                                            chapter.getTitle()
                                    )
                                    .description(
                                            chapter.getDescription()
                                    )
                                    .orderNum(
                                            chapter.getOrderNum()
                                    )
                                    .totalLessons(
                                            lessonResponses.size()
                                    )
                                    .lessons(
                                            lessonResponses
                                    )
                                    .build();
                        })
                        .toList();

        // 6. Tính tổng số bài học
        int totalLessons = chapterResponses.stream()
                .mapToInt(ChapterCurriculumResponse::getTotalLessons)
                .sum();

        // 7. Trả về dữ liệu curriculum
        return CourseCurriculumResponse.builder()
                .courseId(courseId)
                .totalChapters(chapterResponses.size())
                .totalLessons(totalLessons)
                .chapters(chapterResponses)
                .build();
    }


    @Override
    @Transactional(readOnly = true)
    public CourseReviewsResponse getCourseReviews(
            Integer courseId,
            int pageNo,
            int pageSize
    ) {

        // 1. Kiểm tra tham số
        if (courseId == null || courseId <= 0) {
            throw new IllegalArgumentException(
                    "ID khóa học không hợp lệ"
            );
        }

        if (pageNo < 1) {
            throw new IllegalArgumentException(
                    "Số trang phải lớn hơn hoặc bằng 1"
            );
        }

        if (pageSize < 1 || pageSize > 100) {
            throw new IllegalArgumentException(
                    "Kích thước trang phải từ 1 đến 100"
            );
        }

        // 2. Kiểm tra khóa học tồn tại
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new IllegalArgumentException(
                        "Không tìm thấy khóa học với ID: " + courseId
                ));

        // 3. Chỉ cho xem đánh giá của khóa học Published
        if (course.getStatus() != CourseStatus.Published) {
            throw new IllegalArgumentException(
                    "Khóa học chưa được xuất bản"
            );
        }

        // 4. Điểm trung bình
        Double averageRating =
                reviewRepository.getAverageRating(courseId);

        // 5. Tổng lượt đánh giá
        Long totalReviews =
                reviewRepository.countByCourse_CourseId(courseId);

        // 6. Khởi tạo phân bố đánh giá từ 1 đến 5 sao
        Map<Integer, Long> ratingDistribution =
                new LinkedHashMap<>();

        for (int rating = 1; rating <= 5; rating++) {
            ratingDistribution.put(rating, 0L);
        }

        // 7. Lấy số lượng đánh giá theo từng mức sao
        List<Object[]> ratingCounts =
                reviewRepository.countReviewsByRating(courseId);

        for (Object[] row : ratingCounts) {
            if (row[0] != null && row[1] != null) {
                Integer rating = ((Number) row[0]).intValue();
                Long count = ((Number) row[1]).longValue();

                if (rating >= 1 && rating <= 5) {
                    ratingDistribution.put(rating, count);
                }
            }
        }

        // 8. Phân trang đánh giá
        Pageable pageable = PageRequest.of(
                pageNo - 1,
                pageSize
        );

        Page<Review> reviewPage =
                reviewRepository
                        .findByCourse_CourseIdOrderByCreatedAtDesc(
                                courseId,
                                pageable
                        );

        // 9. Map Review sang CourseReviewResponse
        Page<CourseReviewResponse> responsePage =
                reviewPage.map(review ->
                        CourseReviewResponse.builder()
                                .reviewId(review.getReviewId())

                                .studentId(
                                        review.getStudent() != null
                                                ? review.getStudent().getUserId()
                                                : null
                                )
                                .studentName(
                                        review.getStudent() != null
                                                ? review.getStudent().getFullName()
                                                : null
                                )

                                .rating(review.getRating())
                                .comment(review.getComment())
                                .createdAt(review.getCreatedAt())
                                .build()
                );

        // 10. Trả kết quả
        return CourseReviewsResponse.builder()
                .courseId(courseId)
                .averageRating(
                        averageRating == null
                                ? 0.0
                                : Math.round(averageRating * 10.0) / 10.0
                )
                .totalReviews(
                        totalReviews == null ? 0L : totalReviews
                )
                .ratingDistribution(ratingDistribution)
                .reviews(PageResponse.of(responsePage))
                .build();
    }


}
