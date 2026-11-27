package com.example.back_end.service.impl;

import com.example.back_end.dto.request.ProfileUpdateRequest;
import com.example.back_end.dto.response.ProfileResponse;
import com.example.back_end.entity.User;
import com.example.back_end.exception.AppException;
import com.example.back_end.exception.ErrorCode;
import com.example.back_end.mapper.ProfileMapper;
import com.example.back_end.repository.UserRepository;
import com.example.back_end.service.ProfileService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.ImageIO;
import javax.imageio.ImageReader;
import javax.imageio.stream.ImageInputStream;
import java.awt.image.BufferedImage;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.Iterator;
import java.util.Locale;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class ProfileServiceImpl implements ProfileService {

    private final UserRepository userRepository;
    private final ProfileMapper profileMapper;

    // Dung lượng ảnh tối đa 2MB
    private static final long MAX_AVATAR_SIZE = 2 * 1024 * 1024;

    // Giới hạn kích thước ảnh để tránh ảnh có độ phân giải quá lớn
    private static final int MAX_IMAGE_DIMENSION = 4096;

    // Đường dẫn truy cập ảnh đại diện
    private static final String AVATAR_URL_PREFIX = "/uploads/avatars/";

    // Thư mục lưu ảnh đại diện
    @Value("${app.upload.avatar-dir:uploads/avatars}")
    private String avatarUploadDir;

    // Địa chỉ Backend dùng để tạo URL ảnh
    @Value("${app.base-url:http://localhost:8080}")
    private String baseUrl;

    // ========================================
    // 1. LẤY TÀI KHOẢN ĐANG ĐĂNG NHẬP
    // ========================================

    private User getCurrentUser() {
        var authentication = SecurityContextHolder.getContext().getAuthentication();

        // Kiểm tra trạng thái xác thực
        if (authentication == null || !authentication.isAuthenticated()
                || "anonymousUser".equals(authentication.getName())) {
            throw new AppException(ErrorCode.PROFILE_NOT_FOUND);
        }

        // Lấy tên đăng nhập từ SecurityContext
        String username = authentication.getName();

        // Tìm tài khoản tương ứng trong cơ sở dữ liệu
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new AppException(ErrorCode.PROFILE_NOT_FOUND));
    }

    // ========================================
    // 2. LẤY THÔNG TIN CÁ NHÂN
    // ========================================

    @Override
    @Transactional(readOnly = true)
    public ProfileResponse getPersonalProfile() {
        User user = getCurrentUser();
        return profileMapper.toProfileResponse(user);
    }

    // ========================================
    // 3. CẬP NHẬT THÔNG TIN CÁ NHÂN
    // ========================================

    @Override
    @Transactional
    public ProfileResponse updatePersonalProfile(ProfileUpdateRequest request) {

        // Lấy tài khoản đang đăng nhập
        User user = getCurrentUser();

        // Kiểm tra họ và tên
        String fullName = validateFullName(request.getFullName());

        // Lấy ảnh đại diện mới
        MultipartFile avatar = request.getAvatar();
        boolean hasNewAvatar = avatar != null;

        // Kiểm tra thông tin có thay đổi hay không
        if (fullName.equals(user.getFullName()) && !hasNewAvatar) {
            throw new AppException(ErrorCode.PROFILE_NO_CHANGES);
        }

        // Lưu đường dẫn ảnh đại diện cũ
        String oldAvatarUrl = user.getAvatarUrl();

        // Nếu có ảnh mới thì kiểm tra và lưu ảnh
        if (hasNewAvatar) {
            BufferedImage image = validateAvatar(avatar);

            // Lưu ảnh mới vào thư mục uploads
            String newAvatarUrl = saveAvatar(image);

            // Quản lý việc xóa ảnh theo kết quả giao dịch
            registerAvatarCleanup(oldAvatarUrl, newAvatarUrl);

            // Cập nhật đường dẫn ảnh đại diện
            user.setAvatarUrl(newAvatarUrl);
        }

        // Cập nhật họ và tên
        user.setFullName(fullName);

        // Cập nhật thời gian chỉnh sửa
        user.setUpdatedAt(LocalDateTime.now());

        // Lưu thông tin vào cơ sở dữ liệu
        User updatedUser = userRepository.saveAndFlush(user);

        // Trả về thông tin tài khoản sau cập nhật
        return profileMapper.toProfileResponse(updatedUser);
    }

    // ========================================
    // 4. KIỂM TRA HỌ VÀ TÊN
    // ========================================

    private String validateFullName(String fullName) {

        // Kiểm tra họ tên rỗng hoặc chỉ chứa khoảng trắng
        if (fullName == null || fullName.isBlank()) {
            throw new AppException(ErrorCode.PROFILE_FULL_NAME_REQUIRED);
        }

        // Loại bỏ khoảng trắng đầu và cuối
        String normalizedName = fullName.trim();

        // Kiểm tra độ dài họ và tên
        if (normalizedName.length() > 100) {
            throw new AppException(ErrorCode.PROFILE_FULL_NAME_TOO_LONG);
        }

        return normalizedName;
    }

    // ========================================
    // 5. KIỂM TRA ẢNH ĐẠI DIỆN
    // ========================================

    private BufferedImage validateAvatar(MultipartFile avatar) {

        // Kiểm tra tệp ảnh rỗng
        if (avatar.isEmpty()) {
            throw new AppException(ErrorCode.PROFILE_AVATAR_INVALID);
        }

        // Kiểm tra dung lượng ảnh
        if (avatar.getSize() > MAX_AVATAR_SIZE) {
            throw new AppException(ErrorCode.PROFILE_AVATAR_TOO_LARGE);
        }

        // Kiểm tra phần mở rộng của tệp
        String originalName = avatar.getOriginalFilename();

        if (originalName == null) {
            throw new AppException(ErrorCode.PROFILE_AVATAR_INVALID_TYPE);
        }

        String fileName = originalName.toLowerCase(Locale.ROOT);

        if (!fileName.endsWith(".jpg") && !fileName.endsWith(".jpeg")
                && !fileName.endsWith(".png")) {
            throw new AppException(ErrorCode.PROFILE_AVATAR_INVALID_TYPE);
        }

        // Kiểm tra nội dung thực tế của ảnh
        try (var inputStream = avatar.getInputStream();
             ImageInputStream imageStream = ImageIO.createImageInputStream(inputStream)) {

            if (imageStream == null) {
                throw new AppException(ErrorCode.PROFILE_AVATAR_INVALID);
            }

            Iterator<ImageReader> readers = ImageIO.getImageReaders(imageStream);

            // Không tìm được bộ đọc ảnh phù hợp
            if (!readers.hasNext()) {
                throw new AppException(ErrorCode.PROFILE_AVATAR_INVALID);
            }

            ImageReader reader = readers.next();

            try {
                reader.setInput(imageStream, true, true);

                // Kiểm tra định dạng thực tế của ảnh
                String format = reader.getFormatName().toLowerCase(Locale.ROOT);

                if (!format.equals("jpeg") && !format.equals("jpg")
                        && !format.equals("png")) {
                    throw new AppException(ErrorCode.PROFILE_AVATAR_INVALID_TYPE);
                }

                // Kiểm tra kích thước ảnh trước khi giải mã
                int width = reader.getWidth(0);
                int height = reader.getHeight(0);

                if (width <= 0 || height <= 0
                        || width > MAX_IMAGE_DIMENSION
                        || height > MAX_IMAGE_DIMENSION) {
                    throw new AppException(ErrorCode.PROFILE_AVATAR_INVALID);
                }

                // Đọc nội dung ảnh
                BufferedImage image = reader.read(0);

                if (image == null) {
                    throw new AppException(ErrorCode.PROFILE_AVATAR_INVALID);
                }

                return image;

            } finally {
                reader.dispose();
            }

        } catch (IOException | IllegalArgumentException e) {
            log.error("Không thể đọc ảnh đại diện", e);
            throw new AppException(ErrorCode.PROFILE_AVATAR_INVALID);
        }
    }

    // ========================================
    // 6. LƯU ẢNH ĐẠI DIỆN
    // ========================================

    private String saveAvatar(BufferedImage image) {

        Path targetPath = null;

        try {
            // Tạo thư mục lưu ảnh nếu chưa tồn tại
            Path uploadPath = Paths.get(avatarUploadDir)
                    .toAbsolutePath().normalize();

            Files.createDirectories(uploadPath);

            // Tạo tên ảnh duy nhất để tránh trùng lặp
            String fileName = UUID.randomUUID() + ".png";

            // Xác định đường dẫn lưu ảnh
            targetPath = uploadPath.resolve(fileName);

            // Mã hóa lại ảnh dưới định dạng PNG
            boolean saved = ImageIO.write(image, "png", targetPath.toFile());

            if (!saved) {
                throw new IOException("Không thể mã hóa ảnh PNG");
            }

            // Trả về URL truy cập ảnh đại diện
            return baseUrl.replaceAll("/+$", "")
                    + AVATAR_URL_PREFIX + fileName;

        } catch (IOException e) {

            // Xóa tệp nếu quá trình ghi ảnh thất bại
            if (targetPath != null) {
                try {
                    Files.deleteIfExists(targetPath);
                } catch (IOException cleanupError) {
                    log.warn("Không thể xóa ảnh lưu thất bại", cleanupError);
                }
            }

            log.error("Không thể lưu ảnh đại diện", e);
            throw new AppException(ErrorCode.PROFILE_AVATAR_UPLOAD_FAILED);
        }
    }

    // ========================================
    // 7. XỬ LÝ ẢNH SAU KHI GIAO DỊCH KẾT THÚC
    // ========================================

    private void registerAvatarCleanup(String oldAvatarUrl, String newAvatarUrl) {

        TransactionSynchronizationManager.registerSynchronization(
                new TransactionSynchronization() {

                    @Override
                    public void afterCompletion(int status) {

                        // Nếu lưu cơ sở dữ liệu thành công thì xóa ảnh cũ
                        if (status == STATUS_COMMITTED) {
                            deleteManagedAvatar(oldAvatarUrl);
                        }

                        // Nếu giao dịch bị rollback thì xóa ảnh mới
                        if (status == STATUS_ROLLED_BACK) {
                            deleteManagedAvatar(newAvatarUrl);
                        }
                    }
                }
        );
    }

    // ========================================
    // 8. XÓA ẢNH DO HỆ THỐNG QUẢN LÝ
    // ========================================

    private void deleteManagedAvatar(String avatarUrl) {

        if (avatarUrl == null || avatarUrl.isBlank()) {
            return;
        }

        // Chỉ xóa ảnh do hệ thống tạo ra
        String managedPrefix = baseUrl.replaceAll("/+$", "")
                + AVATAR_URL_PREFIX;

        if (!avatarUrl.startsWith(managedPrefix)) {
            return;
        }

        String fileName = avatarUrl.substring(managedPrefix.length());

        // Chỉ chấp nhận tên ảnh UUID do hệ thống tạo
        if (!fileName.matches(
                "[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}\\.png")) {
            return;
        }

        try {
            Path uploadPath = Paths.get(avatarUploadDir)
                    .toAbsolutePath().normalize();

            Path filePath = uploadPath.resolve(fileName).normalize();

            // Ngăn truy cập ra ngoài thư mục lưu ảnh
            if (filePath.startsWith(uploadPath)) {
                Files.deleteIfExists(filePath);
            }

        } catch (IOException e) {
            log.warn("Không thể xóa ảnh đại diện: {}", avatarUrl, e);
        }
    }
}