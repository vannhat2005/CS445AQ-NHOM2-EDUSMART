
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

import java.net.MalformedURLException;
import java.nio.file.*;
import java.util.List;

@RestController
@RequiredArgsConstructor
public class LessonContentController {

    // Service xử lý nghiệp vụ nội dung bài học
    private final LessonContentService contentService;

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

    // Trả file PDF hoặc video cho trình duyệt xem
    @GetMapping("/api/lesson-content/files/{fileName:.+}")
    public ResponseEntity<Resource> viewFile(
            @PathVariable String fileName) throws MalformedURLException {

        Path folder = Paths.get(uploadDir).toAbsolutePath().normalize();
        Path path = folder.resolve(fileName).normalize();

        if (!path.getParent().equals(folder) || !Files.isRegularFile(path)) {
            return ResponseEntity.notFound().build();
        }

        Resource resource = new UrlResource(path.toUri());

        if (!resource.exists() || !resource.isReadable()) {
            return ResponseEntity.notFound().build();
        }

        String name = fileName.toLowerCase();
        MediaType type;

        if (name.endsWith(".pdf")) {
            type = MediaType.APPLICATION_PDF;
        } else if (name.endsWith(".mp4")) {
            type = MediaType.parseMediaType("video/mp4");
        } else if (name.endsWith(".webm")) {
            type = MediaType.parseMediaType("video/webm");
        } else {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok()
                .contentType(type)
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline")
                .body(resource);
    }
}
