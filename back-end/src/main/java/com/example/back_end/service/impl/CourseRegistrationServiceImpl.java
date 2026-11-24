
package com.example.back_end.service.impl;

import com.example.back_end.dto.response.CourseRegisterResponse;

import com.example.back_end.entity.Course;
import com.example.back_end.entity.CourseRegistration;
import com.example.back_end.entity.User;

import com.example.back_end.enumType.CourseStatus;
import com.example.back_end.enumType.PaymentStatus;
import com.example.back_end.enumType.RegistrationStatus;

import com.example.back_end.repository.CourseRegistrationRepository;
import com.example.back_end.repository.PaymentTransactionRepository;
import com.example.back_end.repository.UserRepository;

import com.example.back_end.service.CourseRegistrationService;

import lombok.RequiredArgsConstructor;

import org.springframework.security.authentication
        .AuthenticationCredentialsNotFoundException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CourseRegistrationServiceImpl
        implements CourseRegistrationService {

    private final CourseRegistrationRepository registrationRepository;
    private final UserRepository userRepository;
    private final PaymentTransactionRepository paymentRepository;

    // ==========================================
    // SINH VIÊN BẤM "ĐĂNG KÝ NGAY"
    // ==========================================

    @Override
    @Transactional
    public CourseRegisterResponse registerCourse(Integer courseId) {

        // ==========================================
        // 1. KIỂM TRA COURSE ID
        // ==========================================

        if (courseId == null || courseId <= 0) {
            throw new IllegalArgumentException(
                    "ID khóa học không hợp lệ"
            );
        }

        // ==========================================
        // 2. LẤY SINH VIÊN ĐANG ĐĂNG NHẬP
        // ==========================================

        Authentication authentication =
                SecurityContextHolder.getContext()
                        .getAuthentication();

        if (authentication == null
                || !authentication.isAuthenticated()
                || "anonymousUser".equals(
                authentication.getPrincipal()
        )) {

            throw new AuthenticationCredentialsNotFoundException(
                    "Bạn cần đăng nhập để đăng ký khóa học"
            );
        }

        User student = userRepository
                .findByUsername(authentication.getName())
                .orElseThrow(() ->
                        new AuthenticationCredentialsNotFoundException(
                                "Không tìm thấy người dùng"
                        )
                );

        Integer userId = student.getUserId();

        // ==========================================
        // 3. LẤY KHÓA HỌC TỪ MYSQL
        // ==========================================
        // Khóa bản ghi để hạn chế tạo đơn trùng.

        Course course = registrationRepository
                .lockCourseForRegistration(courseId)
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "Không tìm thấy khóa học với ID: "
                                        + courseId
                        )
                );

        // ==========================================
        // 4. KIỂM TRA KHÓA HỌC PUBLISHED
        // ==========================================

        if (course.getStatus() != CourseStatus.Published) {
            throw new IllegalStateException(
                    "Khóa học chưa được xuất bản"
            );
        }

        // ==========================================
        // 5. KIỂM TRA ĐÃ MUA KHÓA HỌC CHƯA
        // ==========================================

        boolean alreadyPurchased =
                registrationRepository.hasPurchasedCourse(
                        userId,
                        courseId
                );

        if (alreadyPurchased) {

            CourseRegistration paidRegistration =
                    registrationRepository
                            .findFirstByUser_UserIdAndCourse_CourseIdAndStatusOrderByCreatedAtDesc(
                                    userId,
                                    courseId,
                                    RegistrationStatus.Paid
                            )
                            .orElseThrow(() ->
                                    new IllegalStateException(
                                            "Không tìm thấy đơn đã thanh toán"
                                    )
                            );

            return buildResponse(
                    paidRegistration,
                    true,
                    "Bạn đã mua khóa học này"
            );
        }

        // ==========================================
        // 6. KIỂM TRA ĐƠN PENDING CŨ
        // ==========================================

        var pendingRegistration =
                registrationRepository
                        .findFirstByUser_UserIdAndCourse_CourseIdAndStatusOrderByCreatedAtDesc(
                                userId,
                                courseId,
                                RegistrationStatus.Pending
                        );

        if (pendingRegistration.isPresent()) {

            return buildResponse(
                    pendingRegistration.get(),
                    false,
                    "Bạn đã có đơn đăng ký, tiếp tục thanh toán"
            );
        }

        // ==========================================
        // 7. LẤY GIÁ KHÓA HỌC TỪ DATABASE
        // ==========================================

        BigDecimal price = course.getPrice();

        if (price == null || price.signum() < 0) {
            throw new IllegalStateException(
                    "Giá khóa học không hợp lệ"
            );
        }

        // ==========================================
        // 8. TẠO MÃ ĐĂNG KÝ
        // ==========================================

        String enrollmentCode =
                "ENR-"
                        + UUID.randomUUID()
                        .toString()
                        .replace("-", "")
                        .substring(0, 12)
                        .toUpperCase();

        // ==========================================
        // 9. TẠO ĐƠN PENDING
        // ==========================================

        CourseRegistration registration =
                new CourseRegistration();

        registration.setUser(student);
        registration.setCourse(course);

        registration.setEnrollmentCode(enrollmentCode);

        registration.setTotalAmount(price);

        registration.setStatus(RegistrationStatus.Pending);

        LocalDateTime now = LocalDateTime.now();

        registration.setCreatedAt(now);
        registration.setUpdatedAt(now);

        // ==========================================
        // 10. LƯU ĐƠN VÀO MYSQL
        // ==========================================

        CourseRegistration savedRegistration =
                registrationRepository.saveAndFlush(registration);

        // ==========================================
        // 11. TRẢ RESPONSE
        // ==========================================

        return buildResponse(
                savedRegistration,
                false,
                "Tạo đơn đăng ký khóa học thành công"
        );
    }

    // ==========================================
    // SINH VIÊN XÁC NHẬN THANH TOÁN
    // ==========================================

    @Override
    @Transactional
    public CourseRegisterResponse confirmPayment(Integer registrationId) {
        if (registrationId == null || registrationId <= 0) {
            throw new IllegalArgumentException("Mã đăng ký không hợp lệ");
        }

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            throw new AuthenticationCredentialsNotFoundException("Chưa đăng nhập");
        }

        User user = userRepository.findByUsername(auth.getName())
                .orElseThrow(() -> new IllegalStateException("Không tìm thấy học viên"));

        CourseRegistration registration = registrationRepository.findOwnedRegistration(
                registrationId,
                user.getUserId()
        ).orElseThrow(() -> new IllegalArgumentException("Không tìm thấy đơn đăng ký của bạn"));

        // Người dùng yêu cầu: KHÔNG được chuyển thành Paid khi bấm xác nhận thanh toán.
        // Giữ nguyên trạng thái Pending (Đang chờ kích hoạt khóa học).
        registration.setStatus(RegistrationStatus.Pending);
        registration.setUpdatedAt(LocalDateTime.now());
        registrationRepository.save(registration);

        paymentRepository.findFirstByRegistration_RegistrationIdOrderByCreatedAtDescPaymentIdDesc(registrationId)
                .ifPresent(payment -> {
                    payment.setStatus(PaymentStatus.Pending);
                    if (payment.getGatewayTransactionId() == null || payment.getGatewayTransactionId().isBlank()) {
                        payment.setGatewayTransactionId("PENDING_" + System.currentTimeMillis());
                    }
                    payment.setUpdatedAt(LocalDateTime.now());
                    paymentRepository.save(payment);
                });

        return buildResponse(
                registration,
                false,
                "Đã xác nhận thanh toán, đang chờ kích hoạt khóa học"
        );
    }

    // ==========================================
    // CHUYỂN ENTITY SANG DTO
    // ==========================================

    private CourseRegisterResponse buildResponse(
            CourseRegistration registration,
            boolean alreadyPurchased,
            String message
    ) {

        Course course = registration.getCourse();

        return CourseRegisterResponse.builder()
                .registrationId(registration.getRegistrationId())
                .courseId(course.getCourseId())
                .courseTitle(course.getTitle())
                .amount(registration.getTotalAmount())
                .enrollmentCode(registration.getEnrollmentCode())
                .registrationStatus(registration.getStatus().name())
                .alreadyPurchased(alreadyPurchased)
                .message(message)
                .build();
    }
}
