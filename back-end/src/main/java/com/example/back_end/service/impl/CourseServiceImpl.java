    package com.example.back_end.service.impl;

    import com.example.back_end.dto.request.CourseRequest;
    import com.example.back_end.dto.response.ChapterResponse;
    import com.example.back_end.dto.response.CourseResponse;
    import com.example.back_end.dto.response.CourseSearchResponse;
    import com.example.back_end.dto.response.PageResponse;
    import com.example.back_end.entity.Chapter;
    import com.example.back_end.entity.Course;
    import com.example.back_end.entity.Lesson;
    import com.example.back_end.enumType.CourseStatus;
    import com.example.back_end.enumType.GeneralStatus;
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

    import java.util.List;
    import java.util.stream.Collectors;

    @Service
    @RequiredArgsConstructor
    public class CourseServiceImpl implements CourseService {

        private final CourseRepository courseRepository;
        private final CourseMapper courseMapper;
        private final ChapterMapper chapterMapper;


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

    }