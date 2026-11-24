package com.example.back_end.controller;

import com.example.back_end.entity.Course;
import com.example.back_end.entity.LessonContent;
import com.example.back_end.entity.User;
import com.example.back_end.repository.CourseRegistrationRepository;
import com.example.back_end.repository.LessonContentRepository;
import com.example.back_end.repository.UserRepository;
import com.example.back_end.service.FileStorageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.support.ResourceRegion;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.nio.file.Path;
import java.util.Optional;

@RestController
@RequiredArgsConstructor
@Slf4j
public class VideoStreamController {

    private final FileStorageService fileStorageService;
    private final LessonContentRepository lessonContentRepository;
    private final CourseRegistrationRepository courseRegistrationRepository;
    private final UserRepository userRepository;

    /**
     * API Phát trực tiếp video bài học hỗ trợ HTTP Range Request (tua, tạm dừng, tiếp tục)
     * GET /api/videos/stream/{fileName}
     */
    @GetMapping("/api/videos/stream/{fileName:.+}")
    public ResponseEntity<ResourceRegion> streamVideo(
            @PathVariable String fileName,
            @RequestHeader HttpHeaders headers
    ) throws IOException {

        Path videoPath = fileStorageService.loadVideoPath(fileName);
        if (videoPath == null) {
            log.warn("Không tìm thấy file video: {}", fileName);
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }

        // Kiểm tra quyền truy cập của người dùng
        checkVideoAccessPermission(fileName);

        // Trả về luồng video hỗ trợ Range Request
        return fileStorageService.streamVideo(videoPath, headers);
    }

    /**
     * API Phát video theo ID khóa học và bài học
     * GET /api/student/courses/{courseId}/lessons/{lessonId}/video/stream
     */
    @GetMapping("/api/student/courses/{courseId}/lessons/{lessonId}/video/stream")
    public ResponseEntity<ResourceRegion> streamLessonVideo(
            @PathVariable Integer courseId,
            @PathVariable Integer lessonId,
            @RequestHeader HttpHeaders headers
    ) throws IOException {

        User currentUser = getCurrentUser();
        if (currentUser == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Vui lòng đăng nhập để xem video");
        }

        // Kiểm tra quyền xem khóa học
        validateCourseAccess(currentUser, courseId);

        // Tìm nội dung video trong bài học
        var contents = lessonContentRepository.findContentsByLessonId(lessonId);
        LessonContent videoContent = contents.stream()
                .filter(c -> c.getContentType() != null && "Video".equalsIgnoreCase(c.getContentType().name()))
                .findFirst()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Bài học chưa có nội dung video"));

        String contentData = videoContent.getContentData();
        if (contentData == null || contentData.isBlank()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Đường dẫn video không hợp lệ");
        }

        String fileName = contentData.contains("/")
                ? contentData.substring(contentData.lastIndexOf('/') + 1)
                : contentData;

        Path videoPath = fileStorageService.loadVideoPath(fileName);
        if (videoPath == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Tệp video không tồn tại trên hệ thống");
        }

        return fileStorageService.streamVideo(videoPath, headers);
    }

    /**
     * Xác thực quyền truy cập video riêng tư
     */
    private void checkVideoAccessPermission(String fileName) {
        User currentUser = getCurrentUser();
        if (currentUser == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Vui lòng đăng nhập để truy cập video bài học");
        }

        // Tìm bài học chứa video này
        Optional<LessonContent> contentOpt = lessonContentRepository.findFirstByContentDataContaining(fileName);
        if (contentOpt.isPresent()) {
            LessonContent content = contentOpt.get();
            if (content.getLesson() != null
                    && content.getLesson().getChapter() != null
                    && content.getLesson().getChapter().getCourse() != null) {

                Course course = content.getLesson().getChapter().getCourse();
                validateCourseAccess(currentUser, course.getCourseId(), course.getInstructor() != null ? course.getInstructor().getUserId() : null);
            }
        }
    }

    private void validateCourseAccess(User currentUser, Integer courseId) {
        validateCourseAccess(currentUser, courseId, null);
    }

    private void validateCourseAccess(User currentUser, Integer courseId, Integer instructorId) {
        // 1. Quản trị viên luôn có quyền xem
        boolean isAdmin = currentUser.getRole() != null && "ADMIN".equalsIgnoreCase(currentUser.getRole().getRoleName());
        if (isAdmin) {
            return;
        }

        // 2. Giảng viên sở hữu khóa học có quyền xem
        if (instructorId != null && instructorId.equals(currentUser.getUserId())) {
            return;
        }

        // 3. Học viên đã mua khóa học có quyền xem
        boolean hasPurchased = courseRegistrationRepository.hasPurchasedCourse(currentUser.getUserId(), courseId);
        if (hasPurchased) {
            return;
        }

        log.warn("Từ chối quyền truy cập video khóa học {} của user ID {}", courseId, currentUser.getUserId());
        throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Bạn chưa đăng ký hoặc chưa hoàn tất thanh toán khóa học này");
    }

    private User getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getPrincipal())) {
            return null;
        }
        return userRepository.findByUsername(auth.getName()).orElse(null);
    }
}
