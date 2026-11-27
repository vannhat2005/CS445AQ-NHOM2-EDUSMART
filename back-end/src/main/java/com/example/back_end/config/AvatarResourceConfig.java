package com.example.back_end.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Paths;

@Configuration
public class AvatarResourceConfig implements WebMvcConfigurer {

    // Thư mục lưu trữ ảnh đại diện
    @Value("${app.upload.avatar-dir:uploads/avatars}")
    private String avatarUploadDir;

    // ==========================================
    // CẤU HÌNH TRUY CẬP ẢNH ĐẠI DIỆN
    // ==========================================
    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {

        // Lấy đường dẫn tuyệt đối của thư mục lưu ảnh
        String resourceLocation = Paths.get(avatarUploadDir)
                .toAbsolutePath()
                .normalize()
                .toUri()
                .toString();

        // Đảm bảo đường dẫn kết thúc bằng dấu /
        if (!resourceLocation.endsWith("/")) {
            resourceLocation += "/";
        }

        // Ánh xạ URL truy cập đến thư mục lưu ảnh
        registry.addResourceHandler("/uploads/avatars/**")
                .addResourceLocations(resourceLocation);
    }
}