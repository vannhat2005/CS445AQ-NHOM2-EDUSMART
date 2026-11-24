
package com.example.back_end.service;

import com.example.back_end.config.ZaloPayConfig;
import com.example.back_end.entity.CourseRegistration;
import com.example.back_end.entity.PaymentTransaction;

import com.example.back_end.enumType.PaymentMethod;
import com.example.back_end.enumType.PaymentStatus;
import com.example.back_end.enumType.RegistrationStatus;

import com.example.back_end.repository.CourseRegistrationRepository;
import com.example.back_end.repository.PaymentTransactionRepository;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import lombok.RequiredArgsConstructor;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class ZaloPayPaymentProcessor {

    private final PaymentTransactionRepository paymentRepository;
    private final CourseRegistrationRepository registrationRepository;

    private final ZaloPayGateway gateway;
    private final ZaloPayConfig config;
    private final ObjectMapper mapper;

    // ==========================================
    // 1. XỬ LÝ CALLBACK ZALOPAY
    // ==========================================

    @Transactional
    public void confirmFromCallback(
            String data,
            String mac,
            Integer type
    ) throws Exception {

        // Kiểm tra loại callback và chữ ký.
        if (!Integer.valueOf(1).equals(type)
                || !gateway.verifyCallback(data, mac)) {

            throw new SecurityException(
                    "Chữ ký Callback ZaloPay không hợp lệ"
            );
        }

        JsonNode json = mapper.readTree(data);

        String appTransId = json
                .path("app_trans_id")
                .asText(null);

        JsonNode amountNode = json.path("amount");

        int appId = json
                .path("app_id")
                .asInt(-1);

        // Kiểm tra App ID.
        if (appId != config.getAppId()) {
            throw new SecurityException(
                    "App ID ZaloPay không hợp lệ"
            );
        }

        if (appTransId == null || appTransId.isBlank()) {
            throw new IllegalArgumentException(
                    "Thiếu app_trans_id ZaloPay"
            );
        }

        if (!amountNode.isNumber()) {
            throw new IllegalArgumentException(
                    "Số tiền ZaloPay không hợp lệ"
            );
        }

        BigDecimal amount = amountNode.decimalValue();

        if (amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException(
                    "Số tiền phải lớn hơn 0"
            );
        }

        String zpTransId = json
                .path("zp_trans_id")
                .asText(null);

        confirmPayment(
                appTransId,
                amount,
                zpTransId
        );
    }

    // ==========================================
    // 2. QUERY TRẠNG THÁI ZALOPAY
    // ==========================================

    @Transactional
    public void confirmFromQuery(String appTransId) {

        if (appTransId == null || appTransId.isBlank()) {
            throw new IllegalArgumentException(
                    "Thiếu app_trans_id ZaloPay"
            );
        }

        // ==========================================
        // TÌM GIAO DỊCH ZALOPAY
        // ==========================================

        PaymentTransaction payment = paymentRepository
                .findByOrderIdAndMethodForUpdate(
                        appTransId,
                        PaymentMethod.ZaloPay
                )
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "Không tìm thấy giao dịch ZaloPay"
                        )
                );

        if (payment.getStatus() == PaymentStatus.Success) {
            return;
        }

        if (payment.getStatus() != PaymentStatus.Pending) {
            return;
        }

        // ==========================================
        // GỌI ZALOPAY QUERY API
        // ==========================================

        JsonNode result = gateway.queryOrder(appTransId);

        if (result == null || !result.isObject()) {
            throw new IllegalStateException(
                    "ZaloPay Query API trả dữ liệu không hợp lệ"
            );
        }

        int returnCode = result
                .path("return_code")
                .asInt(-1);

        int subReturnCode = result
                .path("sub_return_code")
                .asInt(0);

        // ==========================================
        // ZALOPAY XÁC NHẬN THÀNH CÔNG
        // ==========================================

        if (returnCode == 1) {

            JsonNode amountNode = result.path("amount");

            if (!amountNode.isNumber()) {
                throw new SecurityException(
                        "ZaloPay không trả số tiền hợp lệ"
                );
            }

            BigDecimal receivedAmount =
                    amountNode.decimalValue();

            String zpTransId = result
                    .path("zp_trans_id")
                    .asText(null);

            if (zpTransId == null
                    || zpTransId.isBlank()
                    || "0".equals(zpTransId)) {

                throw new SecurityException(
                        "Thiếu mã giao dịch ZaloPay"
                );
            }

            confirmPayment(
                    appTransId,
                    receivedAmount,
                    zpTransId
            );

            return;
        }

        // ==========================================
        // ZALOPAY XÁC NHẬN QR HẾT HẠN
        // ==========================================

        if (returnCode == 2 && subReturnCode == -54) {

            CourseRegistration registration =
                    payment.getRegistration();

            // Không được ghi đè đơn đã Paid.
            if (registration.getStatus() == RegistrationStatus.Paid) {
                return;
            }

            payment.setStatus(PaymentStatus.Failed);
            payment.setUpdatedAt(LocalDateTime.now());

            paymentRepository.saveAndFlush(payment);

            return;
        }

        // Các mã khác chưa xác định chắc chắn.
        // Giữ Pending để tiếp tục đối soát.
    }

    // ==========================================
    // 3. CẬP NHẬT THANH TOÁN THÀNH CÔNG
    // ==========================================

    private void confirmPayment(
            String appTransId,
            BigDecimal receivedAmount,
            String zpTransId
    ) {

        // ==========================================
        // TÌM GIAO DỊCH VÀ KHÓA BẢN GHI
        // ==========================================

        PaymentTransaction payment = paymentRepository
                .findByOrderIdAndMethodForUpdate(
                        appTransId,
                        PaymentMethod.ZaloPay
                )
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "Không tìm thấy giao dịch ZaloPay"
                        )
                );

        // ==========================================
        // KIỂM TRA PHƯƠNG THỨC
        // ==========================================

        if (payment.getPaymentMethod() != PaymentMethod.ZaloPay) {
            throw new SecurityException(
                    "Sai phương thức thanh toán"
            );
        }

        if (!appTransId.equals(payment.getOrderId())) {
            throw new SecurityException(
                    "Mã giao dịch ZaloPay không khớp"
            );
        }

        // ==========================================
        // KIỂM TRA SỐ TIỀN
        // ==========================================

        CourseRegistration registration =
                payment.getRegistration();

        if (registration == null) {
            throw new IllegalStateException(
                    "Giao dịch không có đơn đăng ký"
            );
        }

        if (payment.getAmount() == null
                || registration.getTotalAmount() == null
                || receivedAmount == null) {

            throw new IllegalStateException(
                    "Thiếu số tiền thanh toán"
            );
        }

        if (payment.getAmount().compareTo(receivedAmount) != 0
                || registration.getTotalAmount()
                .compareTo(receivedAmount) != 0) {

            throw new SecurityException(
                    "Số tiền ZaloPay không khớp"
            );
        }

        // ==========================================
        // KIỂM TRA MÃ GIAO DỊCH ZALOPAY
        // ==========================================

        if (zpTransId == null
                || zpTransId.isBlank()
                || "0".equals(zpTransId)) {

            throw new SecurityException(
                    "Mã giao dịch ZaloPay không hợp lệ"
            );
        }

        // ==========================================
        // XỬ LÝ CALLBACK / QUERY LẶP
        // ==========================================

        if (payment.getStatus() == PaymentStatus.Success) {

            if (registration.getStatus() != RegistrationStatus.Paid) {
                throw new IllegalStateException(
                        "Payment Success nhưng Registration chưa Paid"
                );
            }

            return;
        }

        if (payment.getStatus() != PaymentStatus.Pending) {
            throw new IllegalStateException(
                    "Giao dịch không còn Pending; cần đối soát"
            );
        }

        if (registration.getStatus() != RegistrationStatus.Pending) {
            throw new IllegalStateException(
                    "Đơn đăng ký không còn Pending"
            );
        }

        // ==========================================
        // THANH TOÁN THÀNH CÔNG
        // ==========================================

        payment.setGatewayTransactionId(zpTransId);
        payment.setStatus(PaymentStatus.Success);
        payment.setUpdatedAt(LocalDateTime.now());

        registration.setStatus(RegistrationStatus.Paid);
        registration.setUpdatedAt(LocalDateTime.now());

        paymentRepository.save(payment);
        registrationRepository.save(registration);
    }
}
