
package com.example.back_end.service.impl;

import com.example.back_end.dto.request.AdminCourseCreateRequest;
import com.example.back_end.dto.request.AdminCourseUpdateRequest;
import com.example.back_end.dto.response.AdminCourseResponse;
import com.example.back_end.dto.response.AdminCourseStatisticsResponse;
import com.example.back_end.entity.Category;
import com.example.back_end.entity.Course;
import com.example.back_end.entity.User;
import com.example.back_end.enumType.CourseStatus;
import com.example.back_end.mapper.AdminCourseMapper;
import com.example.back_end.repository.AdminCourseRepository;
import com.example.back_end.service.AdminCourseService;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AdminCourseServiceImpl implements AdminCourseService {

    private final AdminCourseRepository adminCourseRepository;
    private final AdminCourseMapper adminCourseMapper;
    private final EntityManager entityManager;
    private final ObjectMapper objectMapper;

    // Lấy danh sách khóa học có tìm kiếm, lọc và phân trang
    @Override
    @Transactional(readOnly = true)
    public Page<AdminCourseResponse> getAll(String keyword, Integer categoryId, int page, int size) {
        if (page < 0 || size < 1 || size > 100) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Thông tin phân trang không hợp lệ"
            );
        }

        String search = keyword == null ? "" : keyword.trim();
        Integer searchId = null;

        try {
            searchId = Integer.valueOf(search.replaceFirst("^#", ""));
        } catch (NumberFormatException ignored) {
        }

        Pageable pageable = PageRequest.of(
                page,
                size,
                Sort.by(Sort.Direction.DESC, "courseId")
        );

        return adminCourseRepository.searchAdminCourses(
                search.isEmpty() ? null : search,
                searchId,
                categoryId,
                pageable
        ).map(adminCourseMapper::toResponse);
    }

    // Xem chi tiết khóa học
    @Override
    @Transactional(readOnly = true)
    public AdminCourseResponse getById(Integer id) {
        return adminCourseMapper.toResponse(findCourse(id));
    }

    // Thêm khóa học mới, mặc định là Draft
    @Override
    @Transactional
    public AdminCourseResponse create(AdminCourseCreateRequest request) {
        Course course = adminCourseMapper.toEntity(request);

        normalizeCourse(course);
        course.setLearningOutcomes(
                validateLearningOutcomes(request.getLearningOutcomes())
        );

        assignRelations(
                course,
                request.getInstructorId(),
                request.getCategoryId()
        );

        // Khóa học mới luôn ở trạng thái Draft
        course.setStatus(CourseStatus.Draft);

        return adminCourseMapper.toResponse(
                adminCourseRepository.saveAndFlush(course)
        );
    }

    // Cập nhật thông tin khóa học
    @Override
    @Transactional
    public AdminCourseResponse update(Integer id, AdminCourseUpdateRequest request) {
        Course course = findCourse(id);

        // Kiểm tra trạng thái trước khi cập nhật
        validateStatusChange(course.getStatus(), request.getStatus());

        // Cập nhật thông tin khóa học
        adminCourseMapper.updateEntity(request, course);

        normalizeCourse(course);

        course.setLearningOutcomes(
                validateLearningOutcomes(request.getLearningOutcomes())
        );

        assignRelations(
                course,
                request.getInstructorId(),
                request.getCategoryId()
        );

        // Chỉ cập nhật trạng thái khi hợp lệ
        course.setStatus(request.getStatus());

        return adminCourseMapper.toResponse(
                adminCourseRepository.saveAndFlush(course)
        );
    }

    // Kiểm tra quy tắc thay đổi trạng thái khóa học
    private void validateStatusChange(CourseStatus currentStatus, CourseStatus newStatus) {

        if (newStatus == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Trạng thái khóa học không được để trống"
            );
        }

        if (currentStatus == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Trạng thái hiện tại của khóa học không hợp lệ"
            );
        }

        // Draft không được chuyển sang trạng thái khác
        if (currentStatus == CourseStatus.Draft && newStatus != CourseStatus.Draft) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Khóa học ở trạng thái bản nháp không được thay đổi trạng thái"
            );
        }

        // Published và Hidden không được chuyển về Draft
        if ((currentStatus == CourseStatus.Published || currentStatus == CourseStatus.Hidden)
                && newStatus == CourseStatus.Draft) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Khóa học đã xuất bản hoặc đã ẩn không được chuyển về bản nháp"
            );
        }

        // Cho phép giữ nguyên trạng thái hoặc chuyển Published <-> Hidden
    }

    // Thống kê khóa học theo trạng thái
    @Override
    @Transactional(readOnly = true)
    public AdminCourseStatisticsResponse getStatistics() {
        return new AdminCourseStatisticsResponse(
                adminCourseRepository.count(),
                adminCourseRepository.countByStatus(CourseStatus.Published),
                adminCourseRepository.countByStatus(CourseStatus.Draft),
                adminCourseRepository.countByStatus(CourseStatus.Hidden)
        );
    }

    // Lấy danh sách giảng viên
    @Override
    @Transactional(readOnly = true)
    public List<Map<String, Object>> getInstructors() {
        List<User> users = entityManager.createQuery(
                "SELECT u FROM User u JOIN u.role r " +
                        "WHERE LOWER(r.roleName) = 'instructor' " +
                        "ORDER BY u.fullName",
                User.class
        ).getResultList();

        return users.stream().map(u -> Map.<String, Object>of(
                "userId", u.getUserId(),
                "name", u.getFullName() == null ? "" : u.getFullName()
        )).toList();
    }

    // Tìm khóa học theo ID
    private Course findCourse(Integer id) {
        return adminCourseRepository.findById(id).orElseThrow(
                () -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Không tìm thấy khóa học"
                )
        );
    }

    // Chuẩn hóa dữ liệu khóa học
    private void normalizeCourse(Course course) {
        if (course.getTitle() != null) {
            course.setTitle(course.getTitle().trim());
        }

        if (course.getImageUrl() != null) {
            String imageUrl = course.getImageUrl().trim();
            course.setImageUrl(imageUrl.isEmpty() ? null : imageUrl);
        }
    }

    // Kiểm tra và chuẩn hóa JSON mục tiêu học tập
    private String validateLearningOutcomes(String value) {
        if (value == null || value.isBlank()) {
            return "[]";
        }

        try {
            JsonNode node = objectMapper.readTree(value);

            if (!node.isArray()) {
                throw new IllegalArgumentException();
            }

            for (JsonNode item : node) {
                if (!item.isTextual() || item.asText().isBlank()) {
                    throw new IllegalArgumentException();
                }
            }

            return node.toString();

        } catch (Exception e) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Mục tiêu học tập phải là mảng JSON chứa các chuỗi không rỗng"
            );
        }
    }

    // Kiểm tra và gán giảng viên, danh mục
    private void assignRelations(Course course, Integer instructorId, Integer categoryId) {
        User instructor = entityManager.find(User.class, instructorId);

        if (instructor == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Giảng viên không tồn tại"
            );
        }

        if (instructor.getRole() == null ||
                !"Instructor".equalsIgnoreCase(instructor.getRole().getRoleName())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Người dùng được chọn không phải giảng viên"
            );
        }

        Category category = entityManager.find(Category.class, categoryId);

        if (category == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Danh mục không tồn tại"
            );
        }

        course.setInstructor(instructor);
        course.setCategory(category);
    }
}
