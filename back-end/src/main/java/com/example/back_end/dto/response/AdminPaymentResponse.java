package com.example.back_end.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminPaymentResponse {
    private Integer paymentId;
    private String sysId;               // #ZLP-2026102501
    private String orderId;             // ZLP_TXN_...
    private String gatewayTransactionId; // Mã đối tác cổng
    private String paymentMethod;       // ZaloPay, MoMo, VNPay, BankTransfer
    private BigDecimal amount;
    private String status;              // success, pending, failed
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // Thông tin đăng ký & học viên
    private Integer registrationId;
    private String enrollmentCode;      // ENR-2026-88129
    private Integer studentId;
    private String studentName;         // Phan Văn Nhật
    private String studentEmail;        // st.bread3rd@gmail.com
    private String studentPhone;        // 0912 345 678

    // Thông tin khóa học & giảng viên
    private Integer courseId;
    private String courseName;          // Lập trình Java Spring Boot Microservices
    private String instructorName;      // ThS. Trần Thị Thanh Lan
}
