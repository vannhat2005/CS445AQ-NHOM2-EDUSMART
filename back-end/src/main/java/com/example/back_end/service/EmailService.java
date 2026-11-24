
package com.example.back_end.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import java.io.UnsupportedEncodingException;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;

@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String senderEmail;

    // Gửi OTP bằng Gmail với giao diện HTML
    public void sendPasswordResetOtp(String email, String otp) {

        try {
            MimeMessage message = mailSender.createMimeMessage();

            MimeMessageHelper helper = new MimeMessageHelper(
                    message,
                    false,
                    StandardCharsets.UTF_8.name()
            );
            try {
                helper.setFrom(senderEmail, "EduSmart");
            } catch (UnsupportedEncodingException e) {
                throw new IllegalStateException(
                        "Không thể tạo email OTP", e
                );
            }
            helper.setTo(email);
            helper.setSubject(
                    "EduSmart | Mã xác thực khôi phục mật khẩu"
            );

            String html = """
                    <!DOCTYPE html>
                    <html lang="vi">
                    <head>
                        <meta charset="UTF-8">
                        <meta name="viewport"
                              content="width=device-width, initial-scale=1">
                    </head>
                    <body style="
                        margin:0;
                        padding:30px 12px;
                        background:#f1f5f9;
                        font-family:Arial,Helvetica,sans-serif;
                    ">
                        <table role="presentation"
                               cellpadding="0"
                               cellspacing="0"
                               border="0"
                               width="100%%"
                               style="max-width:560px;
                                      margin:0 auto;
                                      background:#ffffff;
                                      border-radius:16px;
                                      overflow:hidden;">

                            <tr>
                                <td style="
                                    padding:30px;
                                    background:#1d4ed8;
                                    color:#ffffff;
                                ">
                                    <div style="
                                        font-size:30px;
                                        font-weight:800;
                                        letter-spacing:-1px;
                                    ">
                                        EduSmart.
                                    </div>

                                    <div style="
                                        margin-top:7px;
                                        font-size:11px;
                                        color:#dbeafe;
                                        letter-spacing:1.5px;
                                    ">
                                        NỀN TẢNG HỌC TẬP TRỰC TUYẾN
                                    </div>
                                </td>
                            </tr>

                            <tr>
                                <td style="padding:32px 30px;">

                                    <h2 style="
                                        margin:0 0 16px;
                                        color:#0f172a;
                                        font-size:23px;
                                    ">
                                        Khôi phục mật khẩu
                                    </h2>

                                    <p style="
                                        color:#475569;
                                        font-size:14px;
                                        line-height:1.8;
                                    ">
                                        Xin chào,<br>
                                        Chúng tôi nhận được yêu cầu
                                        đặt lại mật khẩu cho tài khoản
                                        EduSmart của bạn.
                                    </p>

                                    <p style="
                                        color:#475569;
                                        font-size:14px;
                                        line-height:1.7;
                                    ">
                                        Vui lòng nhập mã xác thực
                                        dưới đây để tiếp tục:
                                    </p>

                                    <div style="
                                        margin:26px 0;
                                        padding:26px 12px;
                                        background:#eff6ff;
                                        border:2px dashed #93c5fd;
                                        border-radius:12px;
                                        text-align:center;
                                    ">

                                        <div style="
                                            color:#2563eb;
                                            font-size:12px;
                                            font-weight:bold;
                                            letter-spacing:2px;
                                        ">
                                            MÃ XÁC THỰC OTP
                                        </div>

                                        <div style="
                                            margin:16px 0;
                                            font-size:38px;
                                            font-weight:800;
                                            letter-spacing:9px;
                                            color:#1e3a8a;
                                        ">
                                            %s
                                        </div>

                                        <div style="
                                            font-size:13px;
                                            color:#64748b;
                                        ">
                                            Mã có hiệu lực trong
                                            <strong>03 phút</strong>
                                        </div>
                                    </div>

                                    <div style="
                                        padding:15px;
                                        background:#f8fafc;
                                        border-left:4px solid #2563eb;
                                        border-radius:6px;
                                        color:#475569;
                                        font-size:13px;
                                        line-height:1.7;
                                    ">
                                        <strong>Lưu ý bảo mật:</strong><br>
                                        Không chia sẻ mã OTP với bất kỳ ai.
                                        Nếu bạn không yêu cầu đổi mật khẩu,
                                        hãy bỏ qua email này.
                                    </div>

                                    <p style="
                                        margin-top:30px;
                                        color:#64748b;
                                        font-size:13px;
                                        line-height:1.7;
                                    ">
                                        Trân trọng,<br>
                                        <strong style="color:#1d4ed8;">
                                            Đội ngũ EduSmart
                                        </strong>
                                    </p>
                                </td>
                            </tr>

                            <tr>
                                <td style="
                                    padding:20px;
                                    background:#f8fafc;
                                    text-align:center;
                                    color:#94a3b8;
                                    font-size:11px;
                                ">
                                    © 2026 EduSmart.<br>
                                    Đây là email tự động,
                                    vui lòng không trả lời.
                                </td>
                            </tr>
                        </table>
                    </body>
                    </html>
                    """.formatted(otp);

            helper.setText(html, true);
            mailSender.send(message);

        } catch (MessagingException e) {
            throw new IllegalStateException(
                    "Không thể tạo email OTP", e
            );
        }
    }
}
