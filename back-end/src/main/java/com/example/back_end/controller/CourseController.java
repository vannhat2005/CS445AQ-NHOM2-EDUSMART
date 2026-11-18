
package com.example.back_end.controller;

import com.example.back_end.dto.request.CourseRequest;
import com.example.back_end.dto.request.CreateReviewRequest;
import com.example.back_end.dto.response.*;

import com.example.back_end.entity.User;
import com.example.back_end.repository.UserRepository;

import com.example.back_end.service.CourseService;
import com.example.back_end.service.ReviewService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationCredentialsNotFoundException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/courses")
@RequiredArgsConstructor
public class CourseController {

    private final CourseService courseService;
    private final ReviewService reviewService;
    private final UserRepository userRepository;

    // ==========================================
    // LẤY USER ID TỪ TÀI KHOẢN ĐÃ XÁC THỰC
    // ==========================================
    //
    // JWT Filter xác thực token và lưu
    // Authentication vào SecurityContext.
    //
    // Giả định authentication.getName()
    // là email của người đăng nhập.
    // ==========================================


    private Integer getCurrentUserId() {

        Authentication authentication =
                SecurityContextHolder.getContext()
                        .getAuthentication();

        // Chưa đăng nhập
        if (authentication == null
                || !authentication.isAuthenticated()
                || "anonymousUser".equals(
                authentication.getPrincipal()
        )) {
            return null;
        }

        // Lấy username từ Authentication
        // đã được JWT Filter xác thực
        String username = authentication.getName();

        // Tìm user theo username
        User user = userRepository
                .findByUsername(username)
                .orElseThrow(() ->
                        new AuthenticationCredentialsNotFoundException(
                                "Không tìm thấy người dùng"
                        )
                );

        // Trả về ID của người đang đăng nhập
        return user.getUserId();
    }

    // ==========================================
    // GIẢNG VIÊN: DANH SÁCH KHÓA HỌC
    // ==========================================
    // GET /api/courses/assigned/{instructorId}

    @GetMapping("/assigned/{instructorId}")
    public ApiResponse<PageResponse<CourseResponse>>
    getAssignedCourses(
            @PathVariable Integer instructorId,
            @RequestParam(defaultValue = "1") int pageNo,
            @RequestParam(defaultValue = "10") int pageSize
    ) {

        PageResponse<CourseResponse> pageData =
                courseService.getAssignedCourses(
                        instructorId,
                        pageNo,
                        pageSize
                );

        return ApiResponse
                .<PageResponse<CourseResponse>>builder()
                .message(
                        "Lấy danh sách khóa học phân công thành công"
                )
                .result(pageData)
                .build();
    }

    // ==========================================
    // GIẢNG VIÊN: CHI TIẾT KHÓA HỌC
    // ==========================================
    // GET /api/courses/assigned/{instructorId}/{courseId}

    @GetMapping("/assigned/{instructorId}/{courseId}")
    public ApiResponse<CourseResponse>
    getAssignedCourseDetail(
            @PathVariable Integer instructorId,
            @PathVariable Integer courseId
    ) {

        CourseResponse response =
                courseService.getAssignedCourseDetail(
                        courseId,
                        instructorId
                );

        return ApiResponse
                .<CourseResponse>builder()
                .message(
                        "Lấy chi tiết khóa học thành công"
                )
                .result(response)
                .build();
    }

    // ==========================================
    // ADMIN: TẠO KHÓA HỌC
    // ==========================================
    // POST /api/courses

    @PostMapping
    public ApiResponse<Void> createCourse(
            @Valid @RequestBody CourseRequest request
    ) {

        courseService.createCourse(
                request,
                request.getInstructorId()
        );

        return ApiResponse
                .<Void>builder()
                .message("Tạo khóa học thành công")
                .build();
    }

    // ==========================================
    // GIẢNG VIÊN: XUẤT BẢN KHÓA HỌC
    // ==========================================
    // PUT /api/courses/assigned/{instructorId}/{courseId}/publish

    @PutMapping(
            "/assigned/{instructorId}/{courseId}/publish"
    )
    public ApiResponse<Void> publishCourse(
            @PathVariable Integer instructorId,
            @PathVariable Integer courseId
    ) {

        courseService.publishCourse(
                courseId,
                instructorId
        );

        return ApiResponse
                .<Void>builder()
                .message("Xuất bản khóa học thành công")
                .build();
    }

    // ==========================================
    // HỌC VIÊN: TÌM KIẾM KHÓA HỌC
    // ==========================================
    // GET /api/courses/search

    @GetMapping("/search")
    public PageResponse<CourseSearchResponse>
    searchCourses(
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "1") int pageNo,
            @RequestParam(defaultValue = "8") int pageSize
    ) {

        return courseService.searchCourses(
                keyword,
                pageNo,
                pageSize
        );
    }

    // ==========================================
    // HỌC VIÊN: KHÓA HỌC NỔI BẬT
    // ==========================================
    // GET /api/courses/featured

    @GetMapping("/featured")
    public ApiResponse<PageResponse<FeaturedCourseResponse>>
    getFeaturedCourses(
            @RequestParam(defaultValue = "1") int pageNo,
            @RequestParam(defaultValue = "8") int pageSize
    ) {

        PageResponse<FeaturedCourseResponse> response =
                courseService.getFeaturedCourses(
                        pageNo,
                        pageSize
                );

        return ApiResponse
                .<PageResponse<FeaturedCourseResponse>>builder()
                .message(
                        "Lấy danh sách khóa học thành công"
                )
                .result(response)
                .build();
    }

    // ==========================================
    // HỌC VIÊN: CHI TIẾT KHÓA HỌC
    // ==========================================
    // GET /api/courses/{courseId}/detail
    //
    // Tự lấy userId từ JWT đã xác thực.
    // Chưa đăng nhập => userId = null.
    // ==========================================

    @GetMapping("/{courseId}/detail")
    public ApiResponse<CourseDetailResponse>
    getCourseDetail(
            @PathVariable Integer courseId
    ) {

        Integer userId = getCurrentUserId();

        CourseDetailResponse response =
                courseService.getCourseDetail(
                        courseId,
                        userId
                );

        return ApiResponse
                .<CourseDetailResponse>builder()
                .message(
                        "Lấy thông tin chi tiết khóa học thành công"
                )
                .result(response)
                .build();
    }

    // ==========================================
    // HỌC VIÊN: CHƯƠNG TRÌNH HỌC
    // ==========================================
    // GET /api/courses/{courseId}/curriculum

    @GetMapping("/{courseId}/curriculum")
    public ApiResponse<CourseCurriculumResponse>
    getCourseCurriculum(
            @PathVariable Integer courseId
    ) {

        return ApiResponse
                .<CourseCurriculumResponse>builder()
                .message(
                        "Lấy nội dung khóa học thành công"
                )
                .result(
                        courseService.getCourseCurriculum(
                                courseId
                        )
                )
                .build();
    }

    // ==========================================
    // DANH SÁCH ĐÁNH GIÁ KHÓA HỌC
    // ==========================================
    // GET /api/courses/{courseId}/reviews

    @GetMapping("/{courseId}/reviews")
    public ApiResponse<CourseReviewsResponse>
    getCourseReviews(
            @PathVariable Integer courseId,
            @RequestParam(defaultValue = "1") int pageNo,
            @RequestParam(defaultValue = "5") int pageSize
    ) {

        return ApiResponse
                .<CourseReviewsResponse>builder()
                .message(
                        "Lấy đánh giá khóa học thành công"
                )
                .result(
                        courseService.getCourseReviews(
                                courseId,
                                pageNo,
                                pageSize
                        )
                )
                .build();
    }

    // ==========================================
    // HỌC VIÊN: GỬI ĐÁNH GIÁ KHÓA HỌC
    // ==========================================
    // POST /api/courses/{courseId}/reviews
    //
    // Chỉ cho phép:
    // - Đã đăng nhập
    // - Đã thanh toán (Paid)
    // - Chưa đánh giá khóa học
    // ==========================================

    @PostMapping("/{courseId}/reviews")
    public ApiResponse<Void> createReview(
            @PathVariable Integer courseId,
            @Valid @RequestBody CreateReviewRequest request
    ) {

        Integer userId = getCurrentUserId();

        if (userId == null) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Bạn cần đăng nhập để đánh giá"
            );
        }

        reviewService.createReview(
                courseId,
                userId,
                request
        );

        return ApiResponse
                .<Void>builder()
                .message(
                        "Đánh giá khóa học thành công"
                )
                .build();
    }
}
