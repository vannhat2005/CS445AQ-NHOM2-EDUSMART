package com.example.back_end.controller;

import com.example.back_end.dto.response.ApiResponse;
import com.example.back_end.entity.Course;
import com.example.back_end.repository.CourseRepository;
import com.example.back_end.service.FileStorageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Map;

@RestController
@RequiredArgsConstructor
@Slf4j
public class CourseImageController {

    private final FileStorageService fileStorageService;
    private final CourseRepository courseRepository;

    /**
     * Upload ảnh khóa học và cập nhật trực tiếp vào bảng Courses (cột image_url)
     * POST /api/courses/{courseId}/image
     */
    @PostMapping(value = "/api/courses/{courseId}/image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<Map<String, String>> uploadCourseImage(
            @PathVariable Integer courseId,
            @RequestParam("file") MultipartFile file
    ) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy khóa học"));

        String imageUrl = fileStorageService.storeCourseImage(file);
        course.setImageUrl(imageUrl);
        courseRepository.save(course);

        log.info("Cập nhật ảnh cho khóa học {}: {}", courseId, imageUrl);

        return ApiResponse.<Map<String, String>>builder()
                .code(1000)
                .message("Tải lên ảnh khóa học thành công")
                .result(Map.of("imageUrl", imageUrl))
                .build();
    }

    /**
     * Upload ảnh độc lập (dành cho form tạo khóa học khi chưa có courseId)
     * POST /api/upload/image
     */
    @PostMapping(value = "/api/upload/image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<Map<String, String>> uploadStandaloneImage(
            @RequestParam("file") MultipartFile file
    ) {
        String imageUrl = fileStorageService.storeCourseImage(file);

        return ApiResponse.<Map<String, String>>builder()
                .code(1000)
                .message("Tải lên ảnh thành công")
                .result(Map.of("imageUrl", imageUrl))
                .build();
    }

    /**
     * Phục vụ file ảnh công khai cho giao diện hiển thị khóa học
     * GET /api/images/{fileName}
     * GET /api/courses/images/{fileName}
     */
    @GetMapping({"/api/images/{fileName:.+}", "/api/courses/images/{fileName:.+}"})
    public ResponseEntity<Resource> viewImage(@PathVariable String fileName) throws IOException {
        Path path = fileStorageService.getImagePath(fileName);
        if (path == null || !Files.exists(path) || !Files.isRegularFile(path)) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }

        Resource resource = new UrlResource(path.toUri());
        if (!resource.exists() || !resource.isReadable()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }

        String lower = fileName.toLowerCase();
        MediaType type = MediaType.IMAGE_JPEG;
        if (lower.endsWith(".png")) {
            type = MediaType.IMAGE_PNG;
        } else if (lower.endsWith(".webp")) {
            type = MediaType.parseMediaType("image/webp");
        } else if (lower.endsWith(".gif")) {
            type = MediaType.IMAGE_GIF;
        }

        return ResponseEntity.ok()
                .contentType(type)
                .header(HttpHeaders.CACHE_CONTROL, "public, max-age=86400")
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline")
                .body(resource);
    }
}
