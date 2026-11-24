
package com.example.back_end.service;

import com.example.back_end.entity.PasswordResetToken;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.Base64;

@Service
public class PasswordResetTokenService {

    private static final long TOKEN_LIFETIME_SECONDS = 300;

    @Value("${app.password-reset.secret}")
    private String secret;

    // Tạo token sau khi xác thực OTP thành công
    public String generateToken(PasswordResetToken otpRecord) {

        long expiresAt = Instant.now().getEpochSecond()
                + TOKEN_LIFETIME_SECONDS;

        String payload = otpRecord.getTokenId()
                + ":" + expiresAt;

        String encodedPayload = Base64.getUrlEncoder()
                .withoutPadding()
                .encodeToString(
                        payload.getBytes(StandardCharsets.UTF_8)
                );

        String signature = sign(payload, otpRecord);

        return encodedPayload + "." + signature;
    }

    // Lấy ID bản ghi OTP từ reset token
    public Integer extractTokenId(String resetToken) {

        try {
            String[] parts = resetToken.split("\\.", -1);

            if (parts.length != 2) {
                return null;
            }

            String payload = new String(
                    Base64.getUrlDecoder().decode(parts[0]),
                    StandardCharsets.UTF_8
            );

            String[] values = payload.split(":", -1);

            if (values.length != 2) {
                return null;
            }

            return Integer.valueOf(values[0]);

        } catch (Exception e) {
            return null;
        }
    }

    // Kiểm tra chữ ký, hạn sử dụng và trạng thái OTP
    public boolean isValid(
            String resetToken,
            PasswordResetToken otpRecord
    ) {

        try {
            if (resetToken == null
                    || otpRecord == null
                    || otpRecord.getUsedAt() != null) {
                return false;
            }

            String[] parts = resetToken.split("\\.", -1);

            if (parts.length != 2) {
                return false;
            }

            String payload = new String(
                    Base64.getUrlDecoder().decode(parts[0]),
                    StandardCharsets.UTF_8
            );

            String[] values = payload.split(":", -1);

            if (values.length != 2) {
                return false;
            }

            int tokenId = Integer.parseInt(values[0]);
            long expiresAt = Long.parseLong(values[1]);

            if (tokenId != otpRecord.getTokenId()) {
                return false;
            }

            if (Instant.now().getEpochSecond() >= expiresAt) {
                return false;
            }

            String expectedSignature = sign(
                    payload,
                    otpRecord
            );

            byte[] actual = Base64.getUrlDecoder()
                    .decode(parts[1]);

            byte[] expected = Base64.getUrlDecoder()
                    .decode(expectedSignature);

            return MessageDigest.isEqual(actual, expected);

        } catch (Exception e) {
            return false;
        }
    }

    // Ký token bằng HMAC-SHA256
    private String sign(
            String payload,
            PasswordResetToken otpRecord
    ) {

        try {
            Mac mac = Mac.getInstance("HmacSHA256");

            SecretKeySpec key = new SecretKeySpec(
                    secret.getBytes(StandardCharsets.UTF_8),
                    "HmacSHA256"
            );

            mac.init(key);

            // Gắn chữ ký với OTP hiện tại
            String data = payload
                    + ":"
                    + otpRecord.getOtpHash();

            byte[] signature = mac.doFinal(
                    data.getBytes(StandardCharsets.UTF_8)
            );

            return Base64.getUrlEncoder()
                    .withoutPadding()
                    .encodeToString(signature);

        } catch (Exception e) {
            throw new IllegalStateException(
                    "Không thể ký reset token", e
            );
        }
    }
}
