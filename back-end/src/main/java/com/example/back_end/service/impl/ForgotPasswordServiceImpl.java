
package com.example.back_end.service.impl;

import com.example.back_end.dto.request.ForgotPasswordRequest;
import com.example.back_end.dto.request.ResetPasswordRequest;
import com.example.back_end.dto.request.VerifyOtpRequest;
import com.example.back_end.dto.response.VerifyOtpResponse;
import com.example.back_end.entity.PasswordResetToken;
import com.example.back_end.entity.User;
import com.example.back_end.exception.AppException;
import com.example.back_end.exception.ErrorCode;
import com.example.back_end.repository.PasswordResetTokenRepository;
import com.example.back_end.service.EmailService;
import com.example.back_end.service.ForgotPasswordService;
import com.example.back_end.service.PasswordResetTokenService;

import jakarta.persistence.EntityManager;
import jakarta.persistence.LockModeType;
import lombok.RequiredArgsConstructor;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

@Service
@RequiredArgsConstructor
public class ForgotPasswordServiceImpl
        implements ForgotPasswordService {

    private static final int OTP_EXPIRY_MINUTES = 3;
    private static final int RESEND_COOLDOWN_SECONDS = 60;
    private static final int MAX_OTP_ATTEMPTS = 5;

    private final EntityManager entityManager;
    private final PasswordResetTokenRepository tokenRepository;
    private final EmailService emailService;
    private final PasswordResetTokenService resetTokenService;
    private final PasswordEncoder passwordEncoder;

    private final SecureRandom secureRandom = new SecureRandom();

    // Lưu số lần nhập sai OTP theo ID bản ghi.
    // Đây là giới hạn tạm thời trong bộ nhớ của một server.
    private final ConcurrentHashMap<Integer, AtomicInteger>
            otpAttempts = new ConcurrentHashMap<>();

    // Tìm User theo Email và khóa bản ghi khi cập nhật
    private User findUserByEmailForUpdate(String email) {

        return entityManager.createQuery("""
                        SELECT u
                        FROM User u
                        WHERE LOWER(u.email) = LOWER(:email)
                        """, User.class)
                .setParameter("email", email)
                .setLockMode(LockModeType.PESSIMISTIC_WRITE)
                .getResultStream()
                .findFirst()
                .orElse(null);
    }

    // Tạo mã OTP ngẫu nhiên gồm 6 chữ số
    private String generateOtp() {

        int number = secureRandom.nextInt(1_000_000);

        return String.format("%06d", number);
    }

    // BƯỚC 1: GỬI OTP
    @Override
    @Transactional
    public void sendOtp(ForgotPasswordRequest request) {

        String email = request.email().trim();

        User user = findUserByEmailForUpdate(email);

        // Email chưa đăng ký thì thông báo lỗi
        if (user == null) {
            throw new AppException(ErrorCode.EMAIL_NOT_REGISTERED);
        }

        LocalDateTime now = LocalDateTime.now();

        PasswordResetToken latest = tokenRepository
                .findTopByUser_UserIdOrderByTokenIdDesc(
                        user.getUserId()
                )
                .orElse(null);

        if (latest != null) {

            // Chặn gửi OTP liên tục trong 60 giây
            if (latest.getCreatedAt() != null
                    && latest.getCreatedAt().plusSeconds(
                    RESEND_COOLDOWN_SECONDS
            ).isAfter(now)) {
                return;
            }

            // Vô hiệu hóa OTP cũ
            if (latest.getUsedAt() == null) {
                latest.setUsedAt(now);
                tokenRepository.save(latest);
            }

            otpAttempts.remove(latest.getTokenId());
        }

        String otp = generateOtp();

        PasswordResetToken newToken = new PasswordResetToken();

        newToken.setUser(user);
        newToken.setOtpHash(passwordEncoder.encode(otp));
        newToken.setExpiresAt(
                now.plusMinutes(OTP_EXPIRY_MINUTES)
        );
        newToken.setUsedAt(null);

        tokenRepository.saveAndFlush(newToken);

        // Gửi OTP thật đến Gmail
        emailService.sendPasswordResetOtp(
                user.getEmail(),
                otp
        );
    }

    // BƯỚC 2: XÁC THỰC OTP
    @Override
    @Transactional
    public VerifyOtpResponse verifyOtp(VerifyOtpRequest request) {
        // Tìm User theo Email và khóa bản ghi khi cập nhật
        User user = findUserByEmailForUpdate(
                request.email().trim()
        );

        if (user == null) {
            throw new AppException(
                    ErrorCode.PASSWORD_RESET_OTP_INVALID
            );
        }
        // Lấy OTP mới nhất của User và khóa bản ghi khi cập nhật
        PasswordResetToken token = tokenRepository
                .findTopByUser_UserIdOrderByTokenIdDesc(
                        user.getUserId()
                )
                .orElseThrow(() -> new AppException(
                        ErrorCode.PASSWORD_RESET_OTP_INVALID
                ));

        // OTP đã sử dụng thì không được xác thực lại
        if (token.getUsedAt() != null) {
            throw new AppException(
                    ErrorCode.PASSWORD_RESET_OTP_INVALID
            );
        }

        // Kiểm tra OTP hết hạn
        if (token.getExpiresAt() == null
                || !token.getExpiresAt().isAfter(
                LocalDateTime.now()
        )) {
            throw new AppException(
                    ErrorCode.PASSWORD_RESET_OTP_EXPIRED
            );
        }
        // Kiểm tra số lần nhập sai OTP
        AtomicInteger attempts = otpAttempts
                .computeIfAbsent(
                        token.getTokenId(),
                        id -> new AtomicInteger(0)
                );

        // Đã nhập sai quá số lần cho phép
        if (attempts.get() >= MAX_OTP_ATTEMPTS) {
            throw new AppException(
                    ErrorCode.PASSWORD_RESET_OTP_ATTEMPTS_EXCEEDED
            );
        }

        // Kiểm tra OTP bằng BCrypt
        if (!passwordEncoder.matches(
                request.otp(),
                token.getOtpHash()
        )) {

            int count = attempts.incrementAndGet();

            if (count >= MAX_OTP_ATTEMPTS) {
                throw new AppException(
                        ErrorCode.PASSWORD_RESET_OTP_ATTEMPTS_EXCEEDED
                );
            }

            throw new AppException(
                    ErrorCode.PASSWORD_RESET_OTP_INVALID
            );
        }

        // Xác thực thành công, xóa bộ đếm sai
        otpAttempts.remove(token.getTokenId());

        // Tạo token cho bước đặt lại mật khẩu
        String resetToken = resetTokenService
                .generateToken(token);

        return new VerifyOtpResponse(resetToken);
    }

    // BƯỚC 3: ĐẶT LẠI MẬT KHẨU
    @Override
    @Transactional
    public void resetPassword(ResetPasswordRequest request) {

        String newPassword = request.newPassword();

        // Chỉ yêu cầu tối thiểu 8 ký tự
        if (newPassword == null
                || newPassword.length() < 8) {
            throw new AppException(
                    ErrorCode.PASSWORD_RESET_PASSWORD_INVALID
            );
        }

        // Kiểm tra mật khẩu xác nhận
        if (!newPassword.equals(request.confirmPassword())) {
            throw new AppException(
                    ErrorCode.PASSWORD_RESET_PASSWORD_MISMATCH
            );
        }

        // Lấy ID OTP từ reset token
        Integer tokenId = resetTokenService
                .extractTokenId(request.resetToken());

        if (tokenId == null) {
            throw new AppException(
                    ErrorCode.PASSWORD_RESET_TOKEN_INVALID
            );
        }


        // Đọc OTP để xác định User
        PasswordResetToken initialToken = tokenRepository
                .findById(tokenId)
                .orElseThrow(() -> new AppException(
                        ErrorCode.PASSWORD_RESET_TOKEN_INVALID
                ));

        Integer userId = initialToken.getUser().getUserId();

        // Khóa User để tránh cập nhật mật khẩu đồng thời
        User user = entityManager.find(
                User.class,
                userId,
                LockModeType.PESSIMISTIC_WRITE
        );

        if (user == null) {
            throw new AppException(
                    ErrorCode.PASSWORD_RESET_TOKEN_INVALID
            );
        }

        // Khóa bản ghi OTP trước khi sử dụng
        PasswordResetToken token = tokenRepository
                .findByIdForUpdate(tokenId)
                .orElseThrow(() -> new AppException(
                        ErrorCode.PASSWORD_RESET_TOKEN_INVALID
                ));

        // Đảm bảo OTP thuộc đúng User
        if (!token.getUser().getUserId().equals(
                user.getUserId()
        )) {
            throw new AppException(
                    ErrorCode.PASSWORD_RESET_TOKEN_INVALID
            );
        }

        // Chỉ OTP mới nhất mới có thể đặt lại mật khẩu
        PasswordResetToken latest = tokenRepository
                .findTopByUser_UserIdOrderByTokenIdDesc(
                        user.getUserId()
                )
                .orElseThrow(() -> new AppException(
                        ErrorCode.PASSWORD_RESET_TOKEN_INVALID
                ));

        if (!latest.getTokenId().equals(tokenId)) {
            throw new AppException(
                    ErrorCode.PASSWORD_RESET_TOKEN_INVALID
            );
        }

        // Kiểm tra chữ ký, thời hạn và trạng thái sử dụng
        if (!resetTokenService.isValid(
                request.resetToken(),
                token
        )) {
            throw new AppException(
                    ErrorCode.PASSWORD_RESET_TOKEN_INVALID
            );
        }

        // Kiểm tra mật khẩu mới không trùng với mật khẩu cũ
        if (passwordEncoder.matches(request.newPassword(), user.getPasswordHash())) {
            throw new AppException(ErrorCode.PASSWORD_RESET_SAME_AS_OLD);
        }
        // Mã hóa mật khẩu bằng PasswordEncoder
        user.setPasswordHash(
                passwordEncoder.encode(newPassword)
        );

        entityManager.flush();

        // Đánh dấu OTP đã sử dụng
        token.setUsedAt(LocalDateTime.now());
        tokenRepository.save(token);

        otpAttempts.remove(tokenId);
    }
}
