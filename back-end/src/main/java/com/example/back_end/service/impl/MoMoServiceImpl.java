
package com.example.back_end.service.impl;

import com.example.back_end.config.MoMoConfig;
import com.example.back_end.dto.response.MoMoPaymentResponse;
import com.example.back_end.entity.CourseRegistration;
import com.example.back_end.entity.PaymentTransaction;
import com.example.back_end.entity.User;
import com.example.back_end.enumType.PaymentMethod;
import com.example.back_end.enumType.PaymentStatus;
import com.example.back_end.enumType.RegistrationStatus;
import com.example.back_end.repository.CourseRegistrationRepository;
import com.example.back_end.repository.PaymentTransactionRepository;
import com.example.back_end.repository.UserRepository;
import com.example.back_end.service.MoMoGateway;
import com.example.back_end.service.MoMoPaymentProcessor;
import com.example.back_end.service.MoMoService;
import com.example.back_end.service.ZaloPayPaymentProcessor;

import com.fasterxml.jackson.databind.JsonNode;

import lombok.RequiredArgsConstructor;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class MoMoServiceImpl implements MoMoService {

    private final CourseRegistrationRepository registrationRepository;
    private final PaymentTransactionRepository paymentRepository;
    private final UserRepository userRepository;
    private final MoMoGateway gateway;
    private final MoMoPaymentProcessor processor;

    // ==========================================
    // 1. LẤY USER ĐĂNG NHẬP
    // ==========================================

    private User currentUser() {
        Authentication auth = SecurityContextHolder
                .getContext()
                .getAuthentication();

        if (auth == null
                || !auth.isAuthenticated()
                || "anonymousUser".equals(auth.getPrincipal())) {
            throw new IllegalStateException("Chưa đăng nhập");
        }

        return userRepository.findByUsername(auth.getName())
                .orElseThrow(() ->
                        new IllegalStateException(
                                "Không tìm thấy học viên"
                        )
                );
    }

    // ==========================================
    // 2. TẠO ORDER ID MOMO
    // ==========================================

    private String generateOrderId() {
        return "EDUSMART_"
                + UUID.randomUUID()
                .toString()
                .replace("-", "");
    }

    // ==========================================
    // 3. TÌM ĐƠN THUỘC USER
    // ==========================================

    private CourseRegistration findOwnedRegistration(
            Integer registrationId,
            User user
    ) {
        return registrationRepository.findOwnedRegistration(
                registrationId,
                user.getUserId()
        ).orElseThrow(() ->
                new IllegalArgumentException(
                        "Không tìm thấy đơn đăng ký"
                )
        );
    }

    // ==========================================
    // 4. TÌM GIAO DỊCH MOMO MỚI NHẤT
    // ==========================================

    private PaymentTransaction latestMoMo(
            Integer registrationId
    ) {
        return paymentRepository
                .findFirstByRegistration_RegistrationIdAndPaymentMethodOrderByCreatedAtDescPaymentIdDesc(
                        registrationId,
                        PaymentMethod.MoMo
                )
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "Đơn đăng ký chưa có giao dịch MoMo"
                        )
                );
    }

    // ==========================================
    // 5. TẠO THANH TOÁN MOMO
    // ==========================================

    @Override
    @Transactional
    public MoMoPaymentResponse createPayment(
            Integer registrationId
    ) {

        User user = currentUser();

        // Khóa đơn để tránh 2 request tạo payment
        // cùng lúc cho cùng một registration.
        CourseRegistration registration =
                registrationRepository.findOwnedRegistrationForUpdate(
                        registrationId,
                        user.getUserId()
                ).orElseThrow(() ->
                        new IllegalArgumentException(
                                "Không tìm thấy đơn đăng ký"
                        )
                );

        if (registration.getStatus() == RegistrationStatus.Paid) {
            throw new IllegalStateException(
                    "Khóa học đã được thanh toán"
            );
        }

        if (registration.getStatus() != RegistrationStatus.Pending) {
            throw new IllegalStateException(
                    "Đơn đăng ký không ở trạng thái Pending"
            );
        }

        // Kiểm tra toàn bộ lịch sử giao dịch.
        List<PaymentTransaction> transactions =
                paymentRepository
                        .findByRegistration_RegistrationIdOrderByCreatedAtDescPaymentIdDesc(
                                registrationId
                        );

        for (PaymentTransaction existing : transactions) {

            // Không tạo thanh toán mới nếu đơn đã
            // ghi nhận một giao dịch thành công.
            if (existing.getStatus() == PaymentStatus.Success) {
                throw new IllegalStateException(
                        "Đơn đã có giao dịch thanh toán thành công"
                );
            }

            if (existing.getStatus() != PaymentStatus.Pending) {
                continue;
            }

            // Đã có MoMo Pending: dùng lại payment.
            if (existing.getPaymentMethod() == PaymentMethod.MoMo) {

                String payUrl = existing.getPaymentUrl();

                if (payUrl == null || payUrl.isBlank()) {
                    throw new IllegalStateException(
                            "Giao dịch MoMo Pending chưa có payUrl. "
                                    + "Cần đối soát trước khi tạo lại."
                    );
                }

                return buildResponse(
                        registration,
                        existing,
                        "Giao dịch MoMo đang chờ thanh toán"
                );
            }

            // ZaloPay Pending:
            // Cho phép học viên chọn MoMo mà không
            // xóa hoặc sửa trạng thái ZaloPay.
            //
            // QUAN TRỌNG:
            // Việc cho phép này chỉ an toàn khi
            // các callback/IPN được xử lý theo
            // cơ chế chống thanh toán trùng.
            if (existing.getPaymentMethod() == PaymentMethod.ZaloPay) {
                continue;
            }

            throw new IllegalStateException(
                    "Phương thức thanh toán chưa được hỗ trợ"
            );
        }

        if (registration.getTotalAmount() == null) {
            throw new IllegalStateException(
                    "Đơn đăng ký chưa có số tiền"
            );
        }

        long amount = registration
                .getTotalAmount()
                .longValueExact();

        if (amount <= 0) {
            throw new IllegalStateException(
                    "Số tiền thanh toán không hợp lệ"
            );
        }

        String orderId = generateOrderId();

        PaymentTransaction payment = new PaymentTransaction();

        payment.setRegistration(registration);
        payment.setOrderId(orderId);
        payment.setAmount(registration.getTotalAmount());
        payment.setPaymentMethod(PaymentMethod.MoMo);
        payment.setStatus(PaymentStatus.Pending);

        LocalDateTime now = LocalDateTime.now();

        payment.setCreatedAt(now);
        payment.setUpdatedAt(now);

        paymentRepository.saveAndFlush(payment);

        // Gọi MoMo Sandbox.
        JsonNode result = gateway.createOrder(
                orderId,
                amount
        );

        if (result == null || !result.isObject()) {
            throw new IllegalStateException(
                    "MoMo Create API trả dữ liệu không hợp lệ"
            );
        }

        int resultCode = result
                .path("resultCode")
                .asInt(-1);

        if (resultCode != 0) {
            String message = result
                    .path("message")
                    .asText("Không rõ nguyên nhân");

            throw new IllegalStateException(
                    "MoMo từ chối tạo thanh toán: " + message
            );
        }

        String responseOrderId = result
                .path("orderId")
                .asText("");

        if (!orderId.equals(responseOrderId)) {
            throw new SecurityException(
                    "MoMo trả orderId không khớp"
            );
        }

        String payUrl = result
                .path("payUrl")
                .asText(null);

        String qrCodeUrl = result
                .path("qrCodeUrl")
                .asText(null);

        String deeplink = result
                .path("deeplink")
                .asText(null);

        if (payUrl == null || payUrl.isBlank()) {
            throw new IllegalStateException(
                    "MoMo không trả về payUrl"
            );
        }

        payment.setPaymentUrl(payUrl);
        payment.setQrCode(qrCodeUrl);
        payment.setDeeplink(deeplink);
        payment.setUpdatedAt(LocalDateTime.now());

        paymentRepository.saveAndFlush(payment);

        return buildResponse(
                registration,
                payment,
                "Tạo thanh toán MoMo thành công"
        );
    }

    // ==========================================
    // 6. LẤY TRẠNG THÁI MOMO
    // ==========================================

    @Override
    @Transactional(readOnly = true)
    public MoMoPaymentResponse getPaymentStatus(
            Integer registrationId
    ) {

        User user = currentUser();

        CourseRegistration registration =
                findOwnedRegistration(registrationId, user);

        PaymentTransaction payment =
                latestMoMo(registrationId);

        return buildResponse(
                registration,
                payment,
                "Lấy trạng thái thanh toán MoMo thành công"
        );
    }

    // ==========================================
    // 7. REFRESH TRẠNG THÁI MOMO
    // ==========================================

    @Override
    public MoMoPaymentResponse refreshPaymentStatus(
            Integer registrationId
    ) {

        User user = currentUser();

        CourseRegistration registration =
                findOwnedRegistration(registrationId, user);

        PaymentTransaction payment =
                latestMoMo(registrationId);

        if (registration.getStatus() == RegistrationStatus.Pending
                && payment.getStatus() == PaymentStatus.Pending) {

            processor.refresh(payment.getOrderId());
        }

        return getPaymentStatus(registrationId);
    }

    // ==========================================
    // 8. BUILD RESPONSE
    // ==========================================

    private MoMoPaymentResponse buildResponse(
            CourseRegistration registration,
            PaymentTransaction payment,
            String message
    ) {

        if (payment.getPaymentMethod() != PaymentMethod.MoMo) {
            throw new IllegalStateException(
                    "Giao dịch không thuộc MoMo"
            );
        }

        return MoMoPaymentResponse.builder()
                .registrationId(registration.getRegistrationId())
                .courseId(registration.getCourse().getCourseId())
                .paymentId(payment.getPaymentId())
                .enrollmentCode(registration.getEnrollmentCode())
                .orderId(payment.getOrderId())
                .amount(payment.getAmount().longValueExact())
                .payUrl(payment.getPaymentUrl())
                .qrCode(payment.getQrCode())
                .deeplink(payment.getDeeplink())
                .paymentStatus(payment.getStatus().name())
                .registrationStatus(registration.getStatus().name())
                .message(message)
                .build();
    }
}
