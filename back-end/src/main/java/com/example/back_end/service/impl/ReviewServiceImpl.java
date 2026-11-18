
package com.example.back_end.service.impl;

import com.example.back_end.dto.request.CreateReviewRequest;

import com.example.back_end.entity.Course;
import com.example.back_end.entity.Review;
import com.example.back_end.entity.User;

import com.example.back_end.enumType.CourseStatus;
import com.example.back_end.enumType.RegistrationStatus;

import com.example.back_end.repository.CourseRepository;
import com.example.back_end.repository.CourseRegistrationRepository;
import com.example.back_end.repository.ReviewRepository;
import com.example.back_end.repository.UserRepository;

import com.example.back_end.service.ReviewService;

import lombok.RequiredArgsConstructor;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class ReviewServiceImpl implements ReviewService {

    private final ReviewRepository reviewRepository;

    private final CourseRepository courseRepository;

    private final CourseRegistrationRepository
            courseRegistrationRepository;

    private final UserRepository userRepository;

    // ==========================================
    // HỌC VIÊN GỬI ĐÁNH GIÁ KHÓA HỌC
    // ==========================================
    //
    // Điều kiện:
    // 1. Đã đăng nhập
    // 2. Khóa học tồn tại
    // 3. Khóa học đã Published
    // 4. Đã thanh toán khóa học (Paid)
    // 5. Chưa đánh giá khóa học này
    // 6. Rating từ 1 đến 5 sao
    //
    // userId lấy từ JWT ở Controller.
    // Frontend không truyền userId.
    // ==========================================

    @Override
    @Transactional
    public void createReview(
            Integer courseId,
            Integer userId,
            CreateReviewRequest request
    ) {

        // ======================================
        // 1. KIỂM TRA COURSE ID
        // ======================================

        if (courseId == null || courseId <= 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "ID khóa học không hợp lệ"
            );
        }

        // ======================================
        // 2. KIỂM TRA USER ID
        // ======================================

        if (userId == null || userId <= 0) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Bạn cần đăng nhập để đánh giá khóa học"
            );
        }

        // ======================================
        // 3. KIỂM TRA REQUEST
        // ======================================

        if (request == null || request.getRating() == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Vui lòng chọn số sao đánh giá"
            );
        }

        Integer rating = request.getRating();

        if (rating < 1 || rating > 5) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Số sao đánh giá phải từ 1 đến 5"
            );
        }

        // ======================================
        // 4. XỬ LÝ NỘI DUNG ĐÁNH GIÁ
        // ======================================

        String comment = request.getComment();

        if (comment != null) {
            comment = comment.trim();

            if (comment.length() > 5000) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Nội dung đánh giá không được vượt quá 5000 ký tự"
                );
            }

            if (comment.isEmpty()) {
                comment = null;
            }
        }

        // ======================================
        // 5. KIỂM TRA KHÓA HỌC TỒN TẠI
        // ======================================

        Course course = courseRepository
                .findById(courseId)
                .orElseThrow(() ->
                        new ResponseStatusException(
                                HttpStatus.NOT_FOUND,
                                "Không tìm thấy khóa học"
                        )
                );

        // ======================================
        // 6. KIỂM TRA KHÓA HỌC PUBLISHED
        // ======================================

        if (course.getStatus() != CourseStatus.Published) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Khóa học chưa được xuất bản"
            );
        }

        // ======================================
        // 7. KIỂM TRA HỌC VIÊN ĐÃ MUA CHƯA
        // ======================================
        //
        // CourseRegistration sử dụng quan hệ user.
        // Chỉ chấp nhận trạng thái Paid.
        // ======================================

        boolean hasPurchased =
                courseRegistrationRepository
                        .existsByUser_UserIdAndCourse_CourseIdAndStatus(
                                userId,
                                courseId,
                                RegistrationStatus.Paid
                        );

        if (!hasPurchased) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Bạn phải mua và thanh toán khóa học "
                            + "thành công mới được đánh giá"
            );
        }

        // ======================================
        // 8. KIỂM TRA ĐÃ ĐÁNH GIÁ CHƯA
        // ======================================

        boolean hasReviewed =
                reviewRepository
                        .existsByStudent_UserIdAndCourse_CourseId(
                                userId,
                                courseId
                        );

        if (hasReviewed) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Bạn đã đánh giá khóa học này rồi"
            );
        }

        // ======================================
        // 9. LẤY THÔNG TIN HỌC VIÊN
        // ======================================

        User student = userRepository
                .findById(userId)
                .orElseThrow(() ->
                        new ResponseStatusException(
                                HttpStatus.NOT_FOUND,
                                "Không tìm thấy học viên"
                        )
                );

        // ======================================
        // 10. TẠO ĐÁNH GIÁ
        // ======================================

        Review review = new Review();

        review.setCourse(course);
        review.setStudent(student);
        review.setRating(rating);
        review.setComment(comment);

        // createdAt và updatedAt
        // được Hibernate tự động cập nhật.

        // ======================================
        // 11. LƯU ĐÁNH GIÁ VÀO DATABASE
        // ======================================

        reviewRepository.save(review);
    }
}
