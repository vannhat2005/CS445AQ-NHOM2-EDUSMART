
package com.example.back_end.controller;

import com.example.back_end.dto.request.LessonContentRequest;
import com.example.back_end.dto.response.ApiResponse;
import com.example.back_end.dto.response.LessonContentResponse;
import com.example.back_end.service.LessonContentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.*;
import java.util.List;

@RestController
@RequiredArgsConstructor
public class LessonContentController {

    // Service xử lý nghiệp vụ nội dung bài học
    private final LessonContentService contentService;
    private final com.example.back_end.service.FileStorageService fileStorageService;

    // Thư mục lưu file video và PDF
    @Value("${app.upload-dir:uploads/lesson-contents}")
    private String uploadDir;

    // Lấy danh sách nội dung của bài học
    @GetMapping("/api/courses/{courseId}/chapters/{chapterId}/lessons/{lessonId}/contents")
    public List<LessonContentResponse> getContents(
            @PathVariable Integer courseId,
            @PathVariable Integer chapterId,
            @PathVariable Integer lessonId) {

        return contentService.getContents(courseId, chapterId, lessonId);
    }

    // Xem chi tiết nội dung
    @GetMapping("/api/courses/{courseId}/chapters/{chapterId}/lessons/{lessonId}/contents/{contentId}")
    public LessonContentResponse getContent(
            @PathVariable Integer courseId,
            @PathVariable Integer chapterId,
            @PathVariable Integer lessonId,
            @PathVariable Integer contentId) {

        return contentService.getContentById(
                courseId, chapterId, lessonId, contentId
        );
    }

    // Thêm nội dung mới, hỗ trợ upload file
    @PostMapping(
            value = "/api/courses/{courseId}/chapters/{chapterId}/lessons/{lessonId}/contents",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE
    )
    public ApiResponse<LessonContentResponse> createContent(
            @PathVariable Integer courseId,
            @PathVariable Integer chapterId,
            @PathVariable Integer lessonId,
            @Valid @ModelAttribute LessonContentRequest request) {

        LessonContentResponse response = contentService.createContent(
                courseId, chapterId, lessonId, request
        );

        return ApiResponse.<LessonContentResponse>builder()
                .code(200)
                .message("Thêm nội dung bài học thành công")
                .result(response)
                .build();
    }

    // Cập nhật nội dung, có thể thay file cũ
    @PutMapping(
            value = "/api/courses/{courseId}/chapters/{chapterId}/lessons/{lessonId}/contents/{contentId}",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE
    )
    public ApiResponse<LessonContentResponse> updateContent(
            @PathVariable Integer courseId,
            @PathVariable Integer chapterId,
            @PathVariable Integer lessonId,
            @PathVariable Integer contentId,
            @Valid @ModelAttribute LessonContentRequest request) {

        LessonContentResponse response = contentService.updateContent(
                courseId, chapterId, lessonId, contentId, request
        );

        return ApiResponse.<LessonContentResponse>builder()
                .code(200)
                .message("Cập nhật nội dung bài học thành công")
                .result(response)
                .build();
    }

    // Di chuyển nội dung lên hoặc xuống
    @PatchMapping("/api/courses/{courseId}/chapters/{chapterId}/lessons/{lessonId}/contents/{contentId}/move")
    public ApiResponse<LessonContentResponse> moveContent(
            @PathVariable Integer courseId,
            @PathVariable Integer chapterId,
            @PathVariable Integer lessonId,
            @PathVariable Integer contentId,
            @RequestParam String direction) {

        LessonContentResponse response = contentService.moveContent(
                courseId, chapterId, lessonId, contentId, direction
        );

        return ApiResponse.<LessonContentResponse>builder()
                .code(200)
                .message("Thay đổi thứ tự nội dung thành công")
                .result(response)
                .build();
    }

    // Trả file PDF hoặc video (hỗ trợ HTTP Range Request cho video)
    @GetMapping("/api/lesson-content/files/{fileName:.+}")
    public ResponseEntity<?> viewFile(
            @PathVariable String fileName,
            @RequestHeader HttpHeaders headers) throws IOException {

        // Kiểm tra xem có phải file video không
        String name = fileName.toLowerCase();
        if (name.endsWith(".mp4") || name.endsWith(".webm")) {
            Path videoPath = fileStorageService.loadVideoPath(fileName);
            if (videoPath != null && Files.exists(videoPath)) {
                return fileStorageService.streamVideo(videoPath, headers);
            }
        }

        // Xử lý các file khác như PDF
        Path folder = Paths.get(uploadDir).toAbsolutePath().normalize();
        Path path = folder.resolve(fileName).normalize();

        if (!Files.exists(path) || !Files.isRegularFile(path)) {
            // Thử tìm trong uploads/pdfs
            path = Paths.get("uploads/pdfs").toAbsolutePath().normalize().resolve(fileName).normalize();
            if (!Files.exists(path) || !Files.isRegularFile(path)) {
                path = Paths.get("back-end/uploads/pdfs").toAbsolutePath().normalize().resolve(fileName).normalize();
            }
        }

        if (!Files.exists(path) || !Files.isRegularFile(path)) {
            return ResponseEntity.notFound().build();
        }

        Resource resource = new UrlResource(path.toUri());
        if (!resource.exists() || !resource.isReadable()) {
            return ResponseEntity.notFound().build();
        }

        MediaType type = name.endsWith(".pdf") ? MediaType.APPLICATION_PDF : MediaType.APPLICATION_OCTET_STREAM;

        return ResponseEntity.ok()
                .contentType(type)
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline")
                .body(resource);
    }
}
