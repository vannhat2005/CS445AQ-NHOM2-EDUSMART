
package com.example.back_end.entity;

import com.example.back_end.enumType.PaymentMethod;
import com.example.back_end.enumType.PaymentStatus;

import jakarta.persistence.*;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(
        name = "PaymentTransactions",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uk_payment_method_order",
                        columnNames = {"payment_method", "order_id"}
                )
        }
)
@Data
@NoArgsConstructor
@AllArgsConstructor
public class PaymentTransaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "payment_id")
    private Integer paymentId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "registration_id")
    private CourseRegistration registration;

    // Mã đơn hàng của cổng thanh toán
    @Column(name = "order_id", length = 100)
    private String orderId;

    // Mã giao dịch do cổng thanh toán trả về
    @Column(name = "gateway_transaction_id", length = 100)
    private String gatewayTransactionId;

    // ZaloPay hoặc MoMo
    @Enumerated(EnumType.STRING)
    @Column(name = "payment_method")
    private PaymentMethod paymentMethod;

    @Column(precision = 10, scale = 2)
    private BigDecimal amount;

    // URL thanh toán
    @Column(name = "payment_url", columnDefinition = "TEXT")
    private String paymentUrl;

    // Nội dung QR hoặc URL QR
    @Column(name = "qr_code", columnDefinition = "TEXT")
    private String qrCode;

    // Deep link nếu cổng thanh toán hỗ trợ
    @Column(name = "deeplink", columnDefinition = "TEXT")
    private String deeplink;

    @Enumerated(EnumType.STRING)
    private PaymentStatus status;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
