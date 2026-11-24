
package com.example.back_end.repository;

import com.example.back_end.entity.PaymentTransaction;
import com.example.back_end.enumType.PaymentMethod;
import com.example.back_end.enumType.PaymentStatus;

import jakarta.persistence.LockModeType;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface PaymentTransactionRepository
        extends JpaRepository<PaymentTransaction, Integer> {

    // ==========================================
    // 1. TÌM GIAO DỊCH THEO ORDER ID
    // VÀ KHÓA BẢN GHI KHI CẬP NHẬT
    // DÙNG CHUNG CHO ZALOPAY VÀ MOMO
    // ==========================================

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
        SELECT p
        FROM PaymentTransaction p
        JOIN FETCH p.registration r
        JOIN FETCH r.course
        WHERE p.orderId = :orderId
          AND p.paymentMethod = :method
    """)
    Optional<PaymentTransaction> findByOrderIdAndMethodForUpdate(
            @Param("orderId") String orderId,
            @Param("method") PaymentMethod method
    );

    // ==========================================
    // 2. TÌM GIAO DỊCH THEO ORDER ID
    // VÀ PHƯƠNG THỨC THANH TOÁN
    // ==========================================

    Optional<PaymentTransaction> findByOrderIdAndPaymentMethod(
            String orderId,
            PaymentMethod paymentMethod
    );

    // ==========================================
    // 3. TÌM GIAO DỊCH THEO ORDER ID
    // ==========================================

    List<PaymentTransaction> findByOrderId(
            String orderId
    );

    // ==========================================
    // 4. LẤY GIAO DỊCH MỚI NHẤT CỦA ĐƠN
    // DÙNG CHUNG CHO ZALOPAY VÀ MOMO
    // ==========================================

    Optional<PaymentTransaction>
    findFirstByRegistration_RegistrationIdOrderByCreatedAtDescPaymentIdDesc(
            Integer registrationId
    );

    // ==========================================
    // 5. LẤY GIAO DỊCH MỚI NHẤT
    // THEO PHƯƠNG THỨC THANH TOÁN
    // ==========================================

    Optional<PaymentTransaction>
    findFirstByRegistration_RegistrationIdAndPaymentMethodOrderByCreatedAtDescPaymentIdDesc(
            Integer registrationId,
            PaymentMethod paymentMethod
    );

    // ==========================================
    // 6. TÌM GIAO DỊCH THEO ĐƠN
    // VÀ TRẠNG THÁI
    // ==========================================

    List<PaymentTransaction>
    findByRegistration_RegistrationIdAndStatus(
            Integer registrationId,
            PaymentStatus status
    );

    // ==========================================
    // 7. KIỂM TRA ĐƠN ĐÃ THANH TOÁN
    // THÀNH CÔNG HAY CHƯA
    // ==========================================

    boolean existsByRegistration_RegistrationIdAndStatus(
            Integer registrationId,
            PaymentStatus status
    );

    // ==========================================
    // 8. KIỂM TRA ORDER ID ĐÃ TỒN TẠI
    // THEO PHƯƠNG THỨC THANH TOÁN
    // ==========================================

    boolean existsByOrderIdAndPaymentMethod(
            String orderId,
            PaymentMethod paymentMethod
    );

    // ==========================================
    // 9. TÌM GIAO DỊCH THEO
    // MÃ GIAO DỊCH CỔNG THANH TOÁN
    // ==========================================

    Optional<PaymentTransaction>
    findByGatewayTransactionIdAndPaymentMethod(
            String gatewayTransactionId,
            PaymentMethod paymentMethod
    );

    // ==========================================
    // 10. KIỂM TRA MÃ GIAO DỊCH
    // CỔNG THANH TOÁN ĐÃ TỒN TẠI
    // ==========================================

    boolean existsByGatewayTransactionIdAndPaymentMethod(
            String gatewayTransactionId,
            PaymentMethod paymentMethod
    );

    // ==========================================
    // 11. LẤY TẤT CẢ GIAO DỊCH CỦA ĐƠN
    // ==========================================

    List<PaymentTransaction>
    findByRegistration_RegistrationIdOrderByCreatedAtDescPaymentIdDesc(
            Integer registrationId
    );

    // ==========================================
    // 12. TÌM KIẾM, LỌC VÀ PHÂN TRANG GIAO DỊCH (ADMIN)
    // ==========================================
    @Query(value = """
        SELECT p
        FROM PaymentTransaction p
        LEFT JOIN p.registration r
        LEFT JOIN r.user u
        LEFT JOIN r.course c
        LEFT JOIN c.instructor i
        WHERE (:status IS NULL OR p.status = :status)
          AND (:method IS NULL OR p.paymentMethod = :method)
          AND (:instructorId IS NULL OR (c.instructor IS NOT NULL AND c.instructor.userId = :instructorId))
          AND (:keyword IS NULL OR :keyword = '' OR
               LOWER(p.orderId) LIKE LOWER(CONCAT('%', :keyword, '%')) OR
               (:cleanKeyword IS NOT NULL AND :cleanKeyword <> '' AND LOWER(p.orderId) LIKE LOWER(CONCAT('%', :cleanKeyword, '%'))) OR
               (:digits IS NOT NULL AND :digits <> '' AND LOWER(p.orderId) LIKE LOWER(CONCAT('%', :digits, '%'))) OR
               (p.gatewayTransactionId IS NOT NULL AND (
                   LOWER(p.gatewayTransactionId) LIKE LOWER(CONCAT('%', :keyword, '%')) OR
                   (:cleanKeyword IS NOT NULL AND :cleanKeyword <> '' AND LOWER(p.gatewayTransactionId) LIKE LOWER(CONCAT('%', :cleanKeyword, '%'))) OR
                   (:digits IS NOT NULL AND :digits <> '' AND LOWER(p.gatewayTransactionId) LIKE LOWER(CONCAT('%', :digits, '%')))
               )) OR
               (r.enrollmentCode IS NOT NULL AND (
                   LOWER(r.enrollmentCode) LIKE LOWER(CONCAT('%', :keyword, '%')) OR
                   (:cleanKeyword IS NOT NULL AND :cleanKeyword <> '' AND LOWER(r.enrollmentCode) LIKE LOWER(CONCAT('%', :cleanKeyword, '%'))) OR
                   (:digits IS NOT NULL AND :digits <> '' AND LOWER(r.enrollmentCode) LIKE LOWER(CONCAT('%', :digits, '%')))
               )) OR
               (u.fullName IS NOT NULL AND LOWER(u.fullName) LIKE LOWER(CONCAT('%', :keyword, '%'))) OR
               (u.email IS NOT NULL AND LOWER(u.email) LIKE LOWER(CONCAT('%', :keyword, '%'))) OR
               (c.title IS NOT NULL AND LOWER(c.title) LIKE LOWER(CONCAT('%', :keyword, '%'))))
        ORDER BY p.createdAt DESC, p.paymentId DESC
        """,
        countQuery = """
        SELECT COUNT(p)
        FROM PaymentTransaction p
        LEFT JOIN p.registration r
        LEFT JOIN r.user u
        LEFT JOIN r.course c
        LEFT JOIN c.instructor i
        WHERE (:status IS NULL OR p.status = :status)
          AND (:method IS NULL OR p.paymentMethod = :method)
          AND (:instructorId IS NULL OR (c.instructor IS NOT NULL AND c.instructor.userId = :instructorId))
          AND (:keyword IS NULL OR :keyword = '' OR
               LOWER(p.orderId) LIKE LOWER(CONCAT('%', :keyword, '%')) OR
               (:cleanKeyword IS NOT NULL AND :cleanKeyword <> '' AND LOWER(p.orderId) LIKE LOWER(CONCAT('%', :cleanKeyword, '%'))) OR
               (:digits IS NOT NULL AND :digits <> '' AND LOWER(p.orderId) LIKE LOWER(CONCAT('%', :digits, '%'))) OR
               (p.gatewayTransactionId IS NOT NULL AND (
                   LOWER(p.gatewayTransactionId) LIKE LOWER(CONCAT('%', :keyword, '%')) OR
                   (:cleanKeyword IS NOT NULL AND :cleanKeyword <> '' AND LOWER(p.gatewayTransactionId) LIKE LOWER(CONCAT('%', :cleanKeyword, '%'))) OR
                   (:digits IS NOT NULL AND :digits <> '' AND LOWER(p.gatewayTransactionId) LIKE LOWER(CONCAT('%', :digits, '%')))
               )) OR
               (r.enrollmentCode IS NOT NULL AND (
                   LOWER(r.enrollmentCode) LIKE LOWER(CONCAT('%', :keyword, '%')) OR
                   (:cleanKeyword IS NOT NULL AND :cleanKeyword <> '' AND LOWER(r.enrollmentCode) LIKE LOWER(CONCAT('%', :cleanKeyword, '%'))) OR
                   (:digits IS NOT NULL AND :digits <> '' AND LOWER(r.enrollmentCode) LIKE LOWER(CONCAT('%', :digits, '%')))
               )) OR
               (u.fullName IS NOT NULL AND LOWER(u.fullName) LIKE LOWER(CONCAT('%', :keyword, '%'))) OR
               (u.email IS NOT NULL AND LOWER(u.email) LIKE LOWER(CONCAT('%', :keyword, '%'))) OR
               (c.title IS NOT NULL AND LOWER(c.title) LIKE LOWER(CONCAT('%', :keyword, '%'))))
        """)
    org.springframework.data.domain.Page<PaymentTransaction> searchAdminPayments(
            @Param("keyword") String keyword,
            @Param("cleanKeyword") String cleanKeyword,
            @Param("digits") String digits,
            @Param("status") PaymentStatus status,
            @Param("method") PaymentMethod method,
            @Param("instructorId") Integer instructorId,
            org.springframework.data.domain.Pageable pageable
    );

    // ==========================================
    // 13. THỐNG KÊ GIAO DỊCH THEO TRẠNG THÁI
    // ==========================================
    long countByStatus(PaymentStatus status);

    @Query("SELECT COALESCE(SUM(p.amount), 0) FROM PaymentTransaction p WHERE p.status = :status")
    java.math.BigDecimal sumAmountByStatus(@Param("status") PaymentStatus status);
}
