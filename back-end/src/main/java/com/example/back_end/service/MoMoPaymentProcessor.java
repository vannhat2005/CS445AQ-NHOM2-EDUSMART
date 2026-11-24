
package com.example.back_end.service;

import com.example.back_end.config.MoMoConfig;

import com.example.back_end.entity.CourseRegistration;
import com.example.back_end.entity.PaymentTransaction;

import com.example.back_end.enumType.PaymentMethod;
import com.example.back_end.enumType.PaymentStatus;
import com.example.back_end.enumType.RegistrationStatus;

import com.example.back_end.repository.CourseRegistrationRepository;
import com.example.back_end.repository.PaymentTransactionRepository;

import com.fasterxml.jackson.databind.JsonNode;

import lombok.RequiredArgsConstructor;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class MoMoPaymentProcessor {

    private final MoMoGateway gateway;
    private final MoMoConfig config;

    private final PaymentTransactionRepository payments;
    private final CourseRegistrationRepository registrations;

    // ==========================================
    // 1. XỬ LÝ IPN TỪ MOMO
    // ==========================================

    @Transactional
    public void processIpn(JsonNode payload) {

        if (payload == null || !payload.isObject()) {
            throw new IllegalArgumentException(
                    "Dữ liệu IPN MoMo không hợp lệ"
            );
        }

        // Xác minh chữ ký IPN trước khi xử lý.
        gateway.verifyIpn(payload);

        apply(payload);
    }

    // ==========================================
    // 2. REFRESH TRẠNG THÁI TỪ MOMO
    // ==========================================

    @Transactional
    public void refresh(String orderId) {

        if (orderId == null || orderId.isBlank()) {
            throw new IllegalArgumentException(
                    "MoMo orderId không hợp lệ"
            );
        }

        // Query trực tiếp đến MoMo Sandbox.
        JsonNode result = gateway.queryOrder(orderId);

        if (result == null || !result.isObject()) {
            throw new IllegalStateException(
                    "MoMo Query API trả dữ liệu không hợp lệ"
            );
        }

        // Kiểm tra orderId.
        if (!orderId.equals(
                result.path("orderId").asText("")
        )) {
            throw new SecurityException(
                    "MoMo trả orderId không khớp"
            );
        }

        // Kiểm tra partnerCode.
        String partnerCode = result
                .path("partnerCode")
                .asText("");

        if (!config.getPartnerCode().equals(partnerCode)) {
            throw new SecurityException(
                    "MoMo trả partnerCode không hợp lệ"
            );
        }

        apply(result);
    }

    // ==========================================
    // 3. XỬ LÝ KẾT QUẢ THANH TOÁN
    // ==========================================

    private void apply(JsonNode json) {

        String orderId = json
                .path("orderId")
                .asText("");

        if (orderId.isBlank()) {
            throw new SecurityException(
                    "Thiếu orderId MoMo"
            );
        }

        // ==========================================
        // TÌM GIAO DỊCH VÀ KHÓA BẢN GHI
        // ==========================================

        PaymentTransaction payment = payments
                .findByOrderIdAndMethodForUpdate(
                        orderId,
                        PaymentMethod.MoMo
                )
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "Không tìm thấy giao dịch MoMo"
                        )
                );

        // ==========================================
        // KIỂM TRA PHƯƠNG THỨC THANH TOÁN
        // ==========================================

        if (payment.getPaymentMethod() != PaymentMethod.MoMo) {
            throw new SecurityException(
                    "Sai phương thức thanh toán"
            );
        }

        if (!orderId.equals(payment.getOrderId())) {
            throw new SecurityException(
                    "Mã đơn hàng MoMo không khớp"
            );
        }

        // ==========================================
        // KIỂM TRA PARTNER CODE
        // ==========================================

        String receivedPartnerCode = json
                .path("partnerCode")
                .asText("");

        if (!config.getPartnerCode().equals(receivedPartnerCode)) {
            throw new SecurityException(
                    "MoMo partnerCode không khớp"
            );
        }

        // ==========================================
        // KIỂM TRA SỐ TIỀN
        // ==========================================

        JsonNode amountNode = json.path("amount");

        if (!amountNode.isNumber()) {
            throw new SecurityException(
                    "Số tiền MoMo không hợp lệ"
            );
        }

        BigDecimal receivedAmount = amountNode.decimalValue();

        CourseRegistration registration =
                payment.getRegistration();

        if (registration == null) {
            throw new IllegalStateException(
                    "Giao dịch không có đơn đăng ký"
            );
        }

        if (payment.getAmount() == null
                || registration.getTotalAmount() == null) {
            throw new IllegalStateException(
                    "Thiếu số tiền giao dịch"
            );
        }

        if (receivedAmount.compareTo(payment.getAmount()) != 0
                || receivedAmount.compareTo(
                registration.getTotalAmount()
        ) != 0) {

            throw new SecurityException(
                    "Số tiền MoMo không khớp"
            );
        }

        // ==========================================
        // KIỂM TRA RESULT CODE
        // ==========================================

        JsonNode resultCodeNode = json.path("resultCode");

        if (!resultCodeNode.isIntegralNumber()) {
            throw new SecurityException(
                    "MoMo resultCode không hợp lệ"
            );
        }

        int resultCode = resultCodeNode.asInt();

        // ==========================================
        // CALLBACK LẶP LẠI
        // ==========================================

        if (payment.getStatus() == PaymentStatus.Success) {

            if (registration.getStatus()
                    != RegistrationStatus.Paid) {

                throw new IllegalStateException(
                        "Payment Success nhưng Registration chưa Paid"
                );
            }

            return;
        }

        // ==========================================
        // THANH TOÁN THÀNH CÔNG
        // ==========================================

        if (resultCode == 0) {

            String transId = json
                    .path("transId")
                    .asText("");

            if (transId.isBlank() || "0".equals(transId)) {
                throw new SecurityException(
                        "Thiếu mã giao dịch MoMo"
                );
            }

            if (payment.getStatus() != PaymentStatus.Pending) {
                throw new IllegalStateException(
                        "Giao dịch không còn Pending; cần đối soát"
                );
            }

            if (registration.getStatus()
                    != RegistrationStatus.Pending) {

                throw new IllegalStateException(
                        "Đơn đăng ký không còn Pending"
                );
            }

            // Lưu mã giao dịch dùng chung.
            payment.setGatewayTransactionId(transId);

            payment.setStatus(PaymentStatus.Success);
            payment.setUpdatedAt(LocalDateTime.now());

            // Mở khóa học sau khi MoMo xác nhận.
            registration.setStatus(RegistrationStatus.Paid);
            registration.setUpdatedAt(LocalDateTime.now());

            payments.save(payment);
            registrations.save(registration);

            return;
        }

        // ==========================================
        // GIAO DỊCH ĐÃ KẾT THÚC
        // ==========================================

        if (payment.getStatus() != PaymentStatus.Pending) {
            return;
        }

        // ==========================================
        // MOMO ĐANG XỬ LÝ
        // ==========================================

        if (resultCode == 1000) {
            // Giữ Pending để tiếp tục đối soát.
            return;
        }

        // ==========================================
        // MOMO THẤT BẠI / BỊ HỦY
        // ==========================================

        if (resultCode == 1003
                || resultCode == 1005
                || resultCode == 1006) {

            if (registration.getStatus()
                    == RegistrationStatus.Paid) {
                return;
            }

            payment.setStatus(PaymentStatus.Failed);
            payment.setUpdatedAt(LocalDateTime.now());

            payments.save(payment);

            return;
        }

        // Các mã khác giữ Pending cho đến khi
        // đối soát được trạng thái cuối cùng.
    }
}
