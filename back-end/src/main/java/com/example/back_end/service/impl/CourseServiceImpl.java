    package com.example.back_end.service.impl;

    import com.example.back_end.dto.request.CourseRequest;
    import com.example.back_end.dto.response.CourseResponse;
    import com.example.back_end.dto.response.PageResponse;
    import com.example.back_end.entity.Course;
    import com.example.back_end.enumType.CourseStatus;
    import com.example.back_end.mapper.CourseMapper;
    import com.example.back_end.repository.CategoryRepository;
    import com.example.back_end.repository.CourseRepository;
    import com.example.back_end.repository.UserRepository;
    import com.example.back_end.service.CourseService;
    import lombok.RequiredArgsConstructor;
    import org.springframework.data.domain.Page;
    import org.springframework.data.domain.PageRequest;
    import org.springframework.data.domain.Pageable;
    import org.springframework.stereotype.Service;

    import java.util.List;
    import java.util.stream.Collectors;

    @Service
    @RequiredArgsConstructor
    public class CourseServiceImpl implements CourseService {

        private final CourseRepository courseRepository;
        private final CourseMapper courseMapper;

        // Inject thêm các repo cần thiết để set khóa ngoại khi tạo mới
        private final UserRepository userRepository;
        private final CategoryRepository categoryRepository;

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
    }