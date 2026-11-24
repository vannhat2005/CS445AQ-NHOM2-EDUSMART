
package com.example.back_end.repository;

import com.example.back_end.entity.PasswordResetToken;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface PasswordResetTokenRepository
        extends JpaRepository<PasswordResetToken, Integer> {

    // Lấy mã OTP mới nhất của người dùng
    Optional<PasswordResetToken>
    findTopByUser_UserIdOrderByTokenIdDesc(Integer userId);

    // Khóa bản ghi OTP khi cập nhật để tránh xử lý đồng thời
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
            SELECT p
            FROM PasswordResetToken p
            WHERE p.tokenId = :tokenId
            """)
    Optional<PasswordResetToken> findByIdForUpdate(
            @Param("tokenId") Integer tokenId
    );
}
