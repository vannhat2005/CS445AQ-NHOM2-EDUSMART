package com.example.back_end.service.impl;

import com.example.back_end.service.FileStorageService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.core.io.support.ResourceRegion;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.nio.file.*;
import java.util.*;

@Service
@Slf4j
public class FileStorageServiceImpl implements FileStorageService {

    @Value("${app.upload.images-dir:uploads/images}")
    private String imagesDir;

    @Value("${app.upload.videos-dir:uploads/videos}")
    private String videosDir;

    private static final Set<String> ALLOWED_IMAGE_EXTENSIONS = Set.of(".jpg", ".jpeg", ".png", ".webp");
    private static final Set<String> ALLOWED_VIDEO_EXTENSIONS = Set.of(".mp4", ".webm");
    private static final long CHUNK_SIZE = 2 * 1024 * 1024L; // 2MB mỗi chunk

    @Override
    public String storeCourseImage(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Vui lòng chọn file ảnh khóa học");
        }

        String original = Objects.toString(file.getOriginalFilename(), "").toLowerCase(Locale.ROOT);
        String extension = original.contains(".") ? original.substring(original.lastIndexOf('.')) : "";

        if (!ALLOWED_IMAGE_EXTENSIONS.contains(extension)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Chỉ hỗ trợ file ảnh định dạng JPG, PNG, WEBP");
        }

        try {
            Path targetFolder = resolveFolder(imagesDir);
            Files.createDirectories(targetFolder);

            String fileName = "course_img_" + UUID.randomUUID() + extension;
            Path destination = targetFolder.resolve(fileName).normalize();

            try (var input = file.getInputStream()) {
                Files.copy(input, destination, StandardCopyOption.REPLACE_EXISTING);
            }

            log.info("Đã lưu ảnh khóa học thành công: {}", destination);
            return "/api/images/" + fileName;

        } catch (IOException e) {
            log.error("Lỗi khi lưu ảnh khóa học", e);
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Không thể lưu file ảnh tải lên");
        }
    }

    @Override
    public String storeLessonVideo(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Vui lòng chọn file video bài học");
        }

        String original = Objects.toString(file.getOriginalFilename(), "").toLowerCase(Locale.ROOT);
        String extension = original.contains(".") ? original.substring(original.lastIndexOf('.')) : "";

        if (!ALLOWED_VIDEO_EXTENSIONS.contains(extension)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Chỉ hỗ trợ file video định dạng MP4 hoặc WebM");
        }

        try {
            // Kiểm tra magic header của file để đảm bảo tính an toàn
            byte[] header;
            try (var input = file.getInputStream()) {
                header = input.readNBytes(16);
            }

            boolean valid = false;
            if (extension.equals(".mp4")) {
                valid = header.length >= 8
                        && new String(header, 4, 4, java.nio.charset.StandardCharsets.US_ASCII).equals("ftyp");
            } else if (extension.equals(".webm")) {
                valid = header.length >= 4
                        && (header[0] & 255) == 0x1A
                        && (header[1] & 255) == 0x45
                        && (header[2] & 255) == 0xDF
                        && (header[3] & 255) == 0xA3;
            }

            if (!valid) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Định dạng chữ ký video không hợp lệ");
            }

            Path targetFolder = resolveFolder(videosDir);
            Files.createDirectories(targetFolder);

            String fileName = "video_" + UUID.randomUUID() + extension;
            Path destination = targetFolder.resolve(fileName).normalize();

            try (var input = file.getInputStream()) {
                Files.copy(input, destination, StandardCopyOption.REPLACE_EXISTING);
            }

            log.info("Đã lưu video bài học thành công: {}", destination);
            return "/api/videos/stream/" + fileName;

        } catch (IOException e) {
            log.error("Lỗi khi lưu video bài học", e);
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Không thể lưu video tải lên");
        }
    }

    @Override
    public Path loadVideoPath(String fileName) {
        if (fileName == null || fileName.isBlank() || fileName.contains("..")) {
            return null;
        }

        // Tìm trong uploads/videos, back-end/uploads/videos, và fallback uploads/lesson-contents
        List<Path> candidateFolders = List.of(
                resolveFolder(videosDir),
                Paths.get("uploads/videos").toAbsolutePath().normalize(),
                Paths.get("back-end/uploads/videos").toAbsolutePath().normalize(),
                Paths.get("uploads/lesson-contents").toAbsolutePath().normalize(),
                Paths.get("back-end/uploads/lesson-contents").toAbsolutePath().normalize()
        );

        for (Path folder : candidateFolders) {
            Path file = folder.resolve(fileName).normalize();
            if (Files.exists(file) && Files.isRegularFile(file)) {
                return file;
            }
        }

        return null;
    }

    @Override
    public Path getImagePath(String fileName) {
        if (fileName == null || fileName.isBlank() || fileName.contains("..")) {
            return null;
        }

        List<Path> candidateFolders = List.of(
                resolveFolder(imagesDir),
                Paths.get("uploads/images").toAbsolutePath().normalize(),
                Paths.get("back-end/uploads/images").toAbsolutePath().normalize(),
                Paths.get("uploads").toAbsolutePath().normalize(),
                Paths.get("back-end/uploads").toAbsolutePath().normalize()
        );

        for (Path folder : candidateFolders) {
            Path file = folder.resolve(fileName).normalize();
            if (Files.exists(file) && Files.isRegularFile(file)) {
                return file;
            }
        }

        return null;
    }

    @Override
    public ResponseEntity<ResourceRegion> streamVideo(Path videoPath, HttpHeaders headers) throws IOException {
        if (videoPath == null || !Files.exists(videoPath) || !Files.isRegularFile(videoPath)) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }

        Resource videoResource = new UrlResource(videoPath.toUri());
        if (!videoResource.exists() || !videoResource.isReadable()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }

        long contentLength = videoResource.contentLength();
        List<HttpRange> ranges = headers.getRange();

        String filenameLower = videoPath.getFileName().toString().toLowerCase(Locale.ROOT);
        MediaType mediaType = filenameLower.endsWith(".webm")
                ? MediaType.parseMediaType("video/webm")
                : MediaType.parseMediaType("video/mp4");

        // Hỗ trợ HTTP Range Request
        if (ranges != null && !ranges.isEmpty()) {
            HttpRange range = ranges.get(0);
            long start = range.getRangeStart(contentLength);
            long end = range.getRangeEnd(contentLength);
            long rangeLength = Math.min(CHUNK_SIZE, end - start + 1);

            ResourceRegion region = new ResourceRegion(videoResource, start, rangeLength);

            return ResponseEntity.status(HttpStatus.PARTIAL_CONTENT)
                    .contentType(mediaType)
                    .header(HttpHeaders.ACCEPT_RANGES, "bytes")
                    .header(HttpHeaders.CACHE_CONTROL, "no-cache")
                    .body(region);
        } else {
            // Khi client chưa gửi Range header, phục vụ khối đầu tiên để video bắt đầu phát ngay
            long rangeLength = Math.min(CHUNK_SIZE, contentLength);
            ResourceRegion region = new ResourceRegion(videoResource, 0, rangeLength);

            return ResponseEntity.status(HttpStatus.PARTIAL_CONTENT)
                    .contentType(mediaType)
                    .header(HttpHeaders.ACCEPT_RANGES, "bytes")
                    .header(HttpHeaders.CACHE_CONTROL, "no-cache")
                    .body(region);
        }
    }

    private Path resolveFolder(String configuredDir) {
        Path p = Paths.get(configuredDir).toAbsolutePath().normalize();
        if (!Files.exists(p)) {
            try {
                Files.createDirectories(p);
            } catch (IOException e) {
                log.warn("Không thể tạo thư mục cấu hình: {}", p);
            }
        }
        return p;
    }
}
