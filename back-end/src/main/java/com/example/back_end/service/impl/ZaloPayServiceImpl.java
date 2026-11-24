
package com.example.back_end.service.impl;

import com.example.back_end.dto.response.ZaloPayPaymentResponse;
import com.example.back_end.entity.CourseRegistration;
import com.example.back_end.entity.PaymentTransaction;
import com.example.back_end.entity.User;
import com.example.back_end.enumType.PaymentMethod;
import com.example.back_end.enumType.PaymentStatus;
import com.example.back_end.enumType.RegistrationStatus;
import com.example.back_end.repository.CourseRegistrationRepository;
import com.example.back_end.repository.PaymentTransactionRepository;
import com.example.back_end.repository.UserRepository;
import com.example.back_end.service.ZaloPayGateway;
import com.example.back_end.service.ZaloPayPaymentProcessor;
import com.example.back_end.service.ZaloPayService;
import com.fasterxml.jackson.databind.JsonNode;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ZaloPayServiceImpl implements ZaloPayService {

    private final CourseRegistrationRepository registrationRepository;
    private final PaymentTransactionRepository paymentRepository;
    private final UserRepository userRepository;
    private final ZaloPayGateway gateway;
    private final ZaloPayPaymentProcessor processor;

    // ==========================================
    // 1. CURRENT USER
    // ==========================================

    private User currentUser() {

        Authentication auth = SecurityContextHolder
                .getContext()
                .getAuthentication();

        if (auth == null
                || !auth.isAuthenticated()
                || "anonymousUser".equals(
                String.valueOf(auth.getPrincipal())
        )) {

            throw new IllegalStateException(
                    "Chưa đăng nhập"
            );
        }

        return userRepository.findByUsername(auth.getName())
                .orElseThrow(() ->
                        new IllegalStateException(
                                "Không tìm thấy học viên"
                        )
                );
    }

    // ==========================================
    // 2. GENERATE APP TRANS ID
    // ==========================================

    private String generateAppTransId() {

        String date = LocalDate.now(
                ZoneId.of("Asia/Ho_Chi_Minh")
        ).format(
                DateTimeFormatter.ofPattern("yyMMdd")
        );

        return date + "_"
                + UUID.randomUUID()
                .toString()
                .replace("-", "")
                .substring(0, 16);
    }

    // ==========================================
    // 3. FIND OWNED REGISTRATION
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
    // 4. FIND LATEST ZALOPAY PAYMENT
    // ==========================================

    private PaymentTransaction findLatestPayment(
            Integer registrationId
    ) {

        return paymentRepository
                .findFirstByRegistration_RegistrationIdAndPaymentMethodOrderByCreatedAtDescPaymentIdDesc(
                        registrationId,
                        PaymentMethod.ZaloPay
                )
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "Đơn chưa có giao dịch ZaloPay"
                        )
                );
    }

    // ==========================================
    // 5. VALIDATE PAYMENT DATA
    // ==========================================

    private void validatePaymentData(
            PaymentTransaction payment
    ) {

        if (payment.getPaymentMethod() != PaymentMethod.ZaloPay) {
            throw new IllegalStateException(
                    "Giao dịch không thuộc ZaloPay"
            );
        }

        String appTransId = payment.getOrderId();

        if (appTransId == null || appTransId.isBlank()) {
            throw new IllegalStateException(
                    "Giao dịch ZaloPay paymentId="
                            + payment.getPaymentId()
                            + " thiếu appTransId. "
                            + "Cần khôi phục mã giao dịch gốc "
                            + "và đối soát trước khi tiếp tục."
            );
        }
    }

    // ==========================================
    // 6. SYNCHRONIZE ZALOPAY
    // ==========================================

    private void synchronizePendingPayment(
            PaymentTransaction payment
    ) {

        if (payment.getStatus() != PaymentStatus.Pending) {
            return;
        }

        validatePaymentData(payment);

        processor.confirmFromQuery(
                payment.getOrderId()
        );
    }

    // ==========================================
    // 7. CREATE ZALOPAY PAYMENT
    // ==========================================

    @Override
    @Transactional
    public ZaloPayPaymentResponse createPayment(
            Integer registrationId
    ) {

        User user = currentUser();

        CourseRegistration registration =
                registrationRepository
                        .findOwnedRegistrationForUpdate(
                                registrationId,
                                user.getUserId()
                        )
                        .orElseThrow(() ->
                                new IllegalArgumentException(
                                        "Không tìm thấy đơn đăng ký"
                                )
                        );

        // CHECK REGISTRATION STATUS

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

        // CHECK EXISTING TRANSACTIONS

        List<PaymentTransaction> transactions =
                paymentRepository
                        .findByRegistration_RegistrationIdOrderByCreatedAtDescPaymentIdDesc(
                                registrationId
                        );

        for (PaymentTransaction existing : transactions) {

            if (existing.getStatus() == PaymentStatus.Success) {
                throw new IllegalStateException(
                        "Đơn đã có giao dịch thanh toán thành công"
                );
            }

            if (existing.getStatus() != PaymentStatus.Pending) {
                continue;
            }

            // EXISTING ZALOPAY PENDING

            if (existing.getPaymentMethod() == PaymentMethod.ZaloPay) {

                validatePaymentData(existing);

                String qrCode = existing.getQrCode();

                if (qrCode == null || qrCode.isBlank()) {
                    throw new IllegalStateException(
                            "Giao dịch ZaloPay paymentId="
                                    + existing.getPaymentId()
                                    + " chưa có QR. "
                                    + "Cần đối soát trước khi tạo lại."
                    );
                }

                return buildResponse(
                        registration,
                        existing,
                        "Giao dịch ZaloPay đang chờ thanh toán"
                );
            }

            // EXISTING MOMO PENDING

            if (existing.getPaymentMethod() == PaymentMethod.MoMo) {

                // Cho phép chuyển cổng thanh toán.
                // Không tự động đổi MoMo thành Failed.
                continue;
            }

            throw new IllegalStateException(
                    "Phương thức thanh toán chưa được hỗ trợ"
            );
        }

        // VALIDATE AMOUNT

        if (registration.getTotalAmount() == null) {
            throw new IllegalStateException(
                    "Đơn đăng ký chưa có số tiền thanh toán"
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

        // GENERATE APP TRANS ID

        String appTransId = generateAppTransId();

        // CREATE PAYMENT TRANSACTION

        PaymentTransaction payment = new PaymentTransaction();

        payment.setRegistration(registration);
        payment.setOrderId(appTransId);
        payment.setAmount(registration.getTotalAmount());
        payment.setPaymentMethod(PaymentMethod.ZaloPay);
        payment.setStatus(PaymentStatus.Pending);

        LocalDateTime now = LocalDateTime.now();

        payment.setCreatedAt(now);
        payment.setUpdatedAt(now);

        paymentRepository.saveAndFlush(payment);

        // CALL ZALOPAY CREATE API

        JsonNode result = gateway.createOrder(
                appTransId,
                user.getUserId(),
                amount
        );

        if (result == null || !result.isObject()) {
            throw new IllegalStateException(
                    "ZaloPay Create API trả dữ liệu không hợp lệ"
            );
        }

        // CHECK RETURN CODE

        int returnCode = result
                .path("return_code")
                .asInt(-1);

        if (returnCode != 1) {

            int subReturnCode = result
                    .path("sub_return_code")
                    .asInt(-1);

            String returnMessage = result
                    .path("return_message")
                    .asText("Không rõ nguyên nhân");

            String subReturnMessage = result
                    .path("sub_return_message")
                    .asText("");

            throw new IllegalStateException(
                    "ZaloPay Create API thất bại"
                            + " | return_code=" + returnCode
                            + " | sub_return_code=" + subReturnCode
                            + " | return_message=" + returnMessage
                            + " | sub_return_message=" + subReturnMessage
            );
        }

        // VALIDATE QR

        String qrCode = result
                .path("qr_code")
                .asText(null);

        if (qrCode == null || qrCode.isBlank()) {
            throw new IllegalStateException(
                    "ZaloPay không trả về dữ liệu QR"
            );
        }

        // SAVE PAYMENT DATA

        payment.setQrCode(qrCode);
        payment.setUpdatedAt(LocalDateTime.now());

        paymentRepository.saveAndFlush(payment);

        return buildResponse(
                registration,
                payment,
                "Tạo thanh toán ZaloPay thành công"
        );
    }

    // ==========================================
    // 8. GET PAYMENT STATUS
    // ==========================================

    @Override
    @Transactional(readOnly = true)
    public ZaloPayPaymentResponse getPaymentStatus(
            Integer registrationId
    ) {

        User user = currentUser();

        CourseRegistration registration =
                findOwnedRegistration(
                        registrationId,
                        user
                );

        PaymentTransaction payment =
                findLatestPayment(registrationId);

        validatePaymentData(payment);

        return buildResponse(
                registration,
                payment,
                "Lấy trạng thái thanh toán ZaloPay thành công"
        );
    }

    // ==========================================
    // 9. REFRESH PAYMENT STATUS
    // ==========================================

    @Override
    public ZaloPayPaymentResponse refreshPaymentStatus(
            Integer registrationId
    ) {

        User user = currentUser();

        CourseRegistration registration =
                findOwnedRegistration(
                        registrationId,
                        user
                );

        PaymentTransaction payment =
                findLatestPayment(registrationId);

        validatePaymentData(payment);

        if (payment.getStatus() == PaymentStatus.Pending) {
            synchronizePendingPayment(payment);
        }

        return getPaymentStatus(registrationId);
    }

    // ==========================================
    // 10. BUILD RESPONSE
    // ==========================================

    private ZaloPayPaymentResponse buildResponse(
            CourseRegistration registration,
            PaymentTransaction payment,
            String message
    ) {

        validatePaymentData(payment);

        return ZaloPayPaymentResponse.builder()
                .registrationId(
                        registration.getRegistrationId()
                )
                .courseId(
                        registration.getCourse().getCourseId()
                )
                .paymentId(
                        payment.getPaymentId()
                )
                .enrollmentCode(
                        registration.getEnrollmentCode()
                )
                .appTransId(
                        payment.getOrderId()
                )
                .amount(
                        payment.getAmount().longValueExact()
                )
                .qrCode(
                        payment.getQrCode()
                )
                .paymentStatus(
                        payment.getStatus().name()
                )
                .registrationStatus(
                        registration.getStatus().name()
                )
                .message(message)
                .build();
    }
}
