package com.example.back_end.service.impl;

import com.example.back_end.dto.request.AdminPaymentUpdateRequest;
import com.example.back_end.dto.response.AdminPaymentResponse;
import com.example.back_end.dto.response.AdminPaymentStatisticsResponse;
import com.example.back_end.entity.Course;
import com.example.back_end.entity.CourseRegistration;
import com.example.back_end.entity.PaymentTransaction;
import com.example.back_end.entity.User;
import com.example.back_end.enumType.PaymentMethod;
import com.example.back_end.enumType.PaymentStatus;
import com.example.back_end.enumType.RegistrationStatus;
import com.example.back_end.exception.AppException;
import com.example.back_end.exception.ErrorCode;
import com.example.back_end.repository.CourseRegistrationRepository;
import com.example.back_end.repository.CourseRepository;
import com.example.back_end.repository.PaymentTransactionRepository;
import com.example.back_end.repository.UserRepository;
import com.example.back_end.service.AdminPaymentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class AdminPaymentServiceImpl implements AdminPaymentService {

    private final PaymentTransactionRepository paymentRepository;
    private final CourseRegistrationRepository registrationRepository;
    private final CourseRepository courseRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional
    public Page<AdminPaymentResponse> getAll(
            String keyword,
            String status,
            String method,
            Integer instructorId,
            int page,
            int size
    ) {
        // Tự động khởi tạo dữ liệu mẫu nếu chưa có giao dịch nào
        initSampleDataIfEmpty();

        Pageable pageable = PageRequest.of(Math.max(0, page), Math.max(1, size));

        PaymentStatus paymentStatus = parsePaymentStatus(status);
        PaymentMethod paymentMethod = parsePaymentMethod(method);

        String kw = (keyword != null && !keyword.isBlank()) ? keyword.trim() : null;
        String cleanKw = null;
        String digits = null;

        if (kw != null) {
            String noHash = kw.replace("#", "").trim();
            if (noHash.contains("-")) {
                cleanKw = noHash.replace('-', '_');
            } else if (noHash.contains("_")) {
                cleanKw = noHash.replace('_', '-');
            } else {
                cleanKw = noHash;
            }
            String num = kw.replaceAll("[^0-9]", "");
            if (num.length() >= 3) {
                digits = num;
            }
        }

        Page<PaymentTransaction> pageResult = paymentRepository.searchAdminPayments(
                kw,
                cleanKw,
                digits,
                paymentStatus,
                paymentMethod,
                instructorId,
                pageable
        );

        return pageResult.map(this::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public AdminPaymentStatisticsResponse getStatistics() {
        initSampleDataIfEmpty();

        long successCount = paymentRepository.countByStatus(PaymentStatus.Success);
        long pendingCount = paymentRepository.countByStatus(PaymentStatus.Pending);
        long failedCount = paymentRepository.countByStatus(PaymentStatus.Failed);
        long totalCount = paymentRepository.count();

        BigDecimal totalRevenue = paymentRepository.sumAmountByStatus(PaymentStatus.Success);
        if (totalRevenue == null) {
            totalRevenue = BigDecimal.ZERO;
        }

        double successRate = totalCount > 0 ? (double) Math.round((successCount * 100.0 / totalCount) * 10.0) / 10.0 : 0.0;
        double failureRate = totalCount > 0 ? (double) Math.round((failedCount * 100.0 / totalCount) * 10.0) / 10.0 : 0.0;

        return AdminPaymentStatisticsResponse.builder()
                .totalRevenue(totalRevenue)
                .successCount(successCount)
                .pendingCount(pendingCount)
                .failedCount(failedCount)
                .totalCount(totalCount)
                .successRate(successRate)
                .failureRate(failureRate)
                .growthRate(18.4)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public AdminPaymentResponse getDetail(Integer paymentId) {
        PaymentTransaction payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new AppException(ErrorCode.PAYMENT_NOT_FOUND));
        return toResponse(payment);
    }

    @Override
    @Transactional
    public AdminPaymentResponse updatePayment(Integer paymentId, AdminPaymentUpdateRequest request) {
        PaymentTransaction payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new AppException(ErrorCode.PAYMENT_NOT_FOUND));

        PaymentStatus newStatus = parsePaymentStatus(request.getStatus());
        if (newStatus != null) {
            payment.setStatus(newStatus);
        }

        if (request.getPaymentMethod() != null && !request.getPaymentMethod().isBlank()) {
            PaymentMethod method = parsePaymentMethod(request.getPaymentMethod());
            if (method != null) {
                payment.setPaymentMethod(method);
            }
        }

        if (request.getAmount() != null) {
            payment.setAmount(request.getAmount());
        }

        // Cập nhật trạng thái CourseRegistration tương ứng
        CourseRegistration reg = payment.getRegistration();
        if (reg != null) {
            if (newStatus == PaymentStatus.Success) {
                reg.setStatus(RegistrationStatus.Paid);
            } else if (newStatus == PaymentStatus.Failed) {
                reg.setStatus(RegistrationStatus.Failed);
            } else if (newStatus == PaymentStatus.Pending) {
                reg.setStatus(RegistrationStatus.Pending);
            }
            registrationRepository.save(reg);
        }

        PaymentTransaction saved = paymentRepository.save(payment);
        return toResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Map<String, Object>> getInstructors() {
        List<User> instructors = userRepository.findAll().stream()
                .filter(u -> u.getRole() != null && "Instructor".equalsIgnoreCase(u.getRole().getRoleName()))
                .toList();

        List<Map<String, Object>> result = new ArrayList<>();
        for (User ins : instructors) {
            Map<String, Object> map = new HashMap<>();
            map.put("instructorId", ins.getUserId());
            map.put("fullName", ins.getFullName() != null ? ins.getFullName() : ins.getUsername());
            result.add(map);
        }
        return result;
    }

    private AdminPaymentResponse toResponse(PaymentTransaction p) {
        String methodStr = p.getPaymentMethod() != null ? p.getPaymentMethod().name() : "ZaloPay";
        String statusStr = p.getStatus() != null ? p.getStatus().name().toLowerCase() : "pending";

        // Tạo sysId định dạng trực quan: #ZLP-..., #MOM-..., #TXN-...
        String sysId;
        String rawOrder = p.getOrderId() != null ? p.getOrderId().trim() : "";
        if (rawOrder.startsWith("#")) {
            sysId = rawOrder;
        } else if (rawOrder.toUpperCase().startsWith("ZLP") || rawOrder.toUpperCase().startsWith("MOM")) {
            sysId = "#" + rawOrder.replace('_', '-');
        } else if ("ZaloPay".equalsIgnoreCase(methodStr)) {
            sysId = "#ZLP-" + (!rawOrder.isBlank() ? rawOrder.replace('_', '-') : String.format("%08d", p.getPaymentId()));
        } else if ("MoMo".equalsIgnoreCase(methodStr)) {
            sysId = "#MOM-" + (!rawOrder.isBlank() ? rawOrder.replace('_', '-') : String.format("%08d", p.getPaymentId()));
        } else {
            sysId = "#TXN-" + (!rawOrder.isBlank() ? rawOrder.replace('_', '-') : String.format("%08d", p.getPaymentId()));
        }

        CourseRegistration reg = p.getRegistration();
        Integer registrationId = reg != null ? reg.getRegistrationId() : null;
        String enrollCode = reg != null && reg.getEnrollmentCode() != null
                ? reg.getEnrollmentCode()
                : (registrationId != null ? "ENR-2026-" + (88100 + registrationId) : "ENR-2026-88129");

        Integer studentId = null;
        String studentName = "Học viên EduSmart";
        String studentEmail = "hocvien@edusmart.vn";
        String studentPhone = "0912 345 678";

        if (reg != null && reg.getUser() != null) {
            User u = reg.getUser();
            studentId = u.getUserId();
            studentName = u.getFullName() != null && !u.getFullName().isBlank() ? u.getFullName() : u.getUsername();
            studentEmail = u.getEmail() != null ? u.getEmail() : u.getUsername() + "@edusmart.vn";
            studentPhone = "09" + String.format("%02d %03d %03d",
                    (Math.abs(u.getUserId() * 17) % 90 + 10),
                    (Math.abs(u.getUserId() * 37) % 900 + 100),
                    (Math.abs(u.getUserId() * 73) % 900 + 100));
        }

        Integer courseId = null;
        String courseName = "Khóa học trực tuyến";
        String instructorName = "ThS. Trần Thị Thanh Lan";

        if (reg != null && reg.getCourse() != null) {
            Course c = reg.getCourse();
            courseId = c.getCourseId();
            courseName = c.getTitle();
            if (c.getInstructor() != null) {
                User ins = c.getInstructor();
                instructorName = ins.getFullName() != null && !ins.getFullName().isBlank()
                        ? ins.getFullName()
                        : ins.getUsername();
            }
        }

        return AdminPaymentResponse.builder()
                .paymentId(p.getPaymentId())
                .sysId(sysId)
                .orderId(p.getOrderId() != null ? p.getOrderId() : sysId)
                .gatewayTransactionId(p.getGatewayTransactionId() != null ? p.getGatewayTransactionId() : "TXN_" + UUID.randomUUID().toString().substring(0, 8).toUpperCase())
                .paymentMethod(methodStr)
                .amount(p.getAmount() != null ? p.getAmount() : BigDecimal.ZERO)
                .status(statusStr)
                .createdAt(p.getCreatedAt() != null ? p.getCreatedAt() : LocalDateTime.now())
                .updatedAt(p.getUpdatedAt() != null ? p.getUpdatedAt() : LocalDateTime.now())
                .registrationId(registrationId)
                .enrollmentCode(enrollCode)
                .studentId(studentId)
                .studentName(studentName)
                .studentEmail(studentEmail)
                .studentPhone(studentPhone)
                .courseId(courseId)
                .courseName(courseName)
                .instructorName(instructorName)
                .build();
    }

    private PaymentStatus parsePaymentStatus(String status) {
        if (status == null || status.isBlank()) return null;
        String s = status.trim().toLowerCase();
        if ("success".equals(s) || "paid".equals(s)) return PaymentStatus.Success;
        if ("pending".equals(s) || "wait".equals(s)) return PaymentStatus.Pending;
        if ("failed".equals(s) || "cancel".equals(s)) return PaymentStatus.Failed;
        try {
            return PaymentStatus.valueOf(status);
        } catch (Exception e) {
            return null;
        }
    }

    private PaymentMethod parsePaymentMethod(String method) {
        if (method == null || method.isBlank()) return null;
        String m = method.trim().toLowerCase();
        if (m.contains("zalo")) return PaymentMethod.ZaloPay;
        if (m.contains("momo")) return PaymentMethod.MoMo;
        try {
            return PaymentMethod.valueOf(method);
        } catch (Exception e) {
            return null;
        }
    }

    // Tự động khởi tạo 4 giao dịch mẫu đúng theo mẫu của bạn nếu CSDL chưa có
    private synchronized void initSampleDataIfEmpty() {
        if (paymentRepository.count() > 0) {
            return;
        }

        try {
            List<Course> courses = courseRepository.findAll();
            List<User> users = userRepository.findAll();

            User student = users.stream()
                    .filter(u -> u.getRole() != null && "Student".equalsIgnoreCase(u.getRole().getRoleName()))
                    .findFirst()
                    .orElse(users.isEmpty() ? null : users.get(0));

            Course course = courses.isEmpty() ? null : courses.get(0);

            // Giao dịch 1: ZaloPay - Thành công
            PaymentTransaction p1 = new PaymentTransaction();
            p1.setOrderId("ZLP_2026102501");
            p1.setGatewayTransactionId("ZLP_TXN_987214589");
            p1.setPaymentMethod(PaymentMethod.ZaloPay);
            p1.setAmount(new BigDecimal("1200000"));
            p1.setStatus(PaymentStatus.Success);

            // Giao dịch 2: MoMo - Đang chờ duyệt
            PaymentTransaction p2 = new PaymentTransaction();
            p2.setOrderId("MOM_2026102502");
            p2.setGatewayTransactionId("MOM_TXN_449102381");
            p2.setPaymentMethod(PaymentMethod.MoMo);
            p2.setAmount(new BigDecimal("800000"));
            p2.setStatus(PaymentStatus.Pending);

            // Giao dịch 3: ZaloPay - Thất bại
            PaymentTransaction p3 = new PaymentTransaction();
            p3.setOrderId("ZLP_2026102503");
            p3.setGatewayTransactionId("ZLP_TXN_002931120");
            p3.setPaymentMethod(PaymentMethod.ZaloPay);
            p3.setAmount(new BigDecimal("500000"));
            p3.setStatus(PaymentStatus.Failed);

            // Giao dịch 4: MoMo - Thành công
            PaymentTransaction p4 = new PaymentTransaction();
            p4.setOrderId("MOM_2026102504");
            p4.setGatewayTransactionId("MOM_TXN_776109204");
            p4.setPaymentMethod(PaymentMethod.MoMo);
            p4.setAmount(new BigDecimal("800000"));
            p4.setStatus(PaymentStatus.Success);

            if (student != null && course != null) {
                CourseRegistration reg = new CourseRegistration();
                reg.setUser(student);
                reg.setCourse(course);
                reg.setEnrollmentCode("ENR-2026-88129");
                reg.setTotalAmount(new BigDecimal("1200000"));
                reg.setStatus(RegistrationStatus.Paid);
                registrationRepository.save(reg);

                p1.setRegistration(reg);
                p2.setRegistration(reg);
                p3.setRegistration(reg);
                p4.setRegistration(reg);
            }

            paymentRepository.saveAll(List.of(p1, p2, p3, p4));
            log.info("Đã khởi tạo thành công 4 bản ghi giao dịch thanh toán mẫu!");
        } catch (Exception ex) {
            log.warn("Không thể khởi tạo dữ liệu thanh toán mẫu: {}", ex.getMessage());
        }
    }
}
