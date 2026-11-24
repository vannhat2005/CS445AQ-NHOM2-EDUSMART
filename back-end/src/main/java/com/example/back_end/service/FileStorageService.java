package com.example.back_end.service;

import org.springframework.core.io.support.ResourceRegion;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Path;

public interface FileStorageService {

    /**
     * Lưu ảnh khóa học vào uploads/images/
     * @param file file ảnh tải lên (JPG, PNG, WEBP)
     * @return Đường dẫn URL lưu trong database (ví dụ: /api/images/course_xyz.jpg)
     */
    String storeCourseImage(MultipartFile file);

    /**
     * Lưu video bài học vào uploads/videos/
     * @param file file video tải lên (MP4, WEBM)
     * @return Đường dẫn URL lưu trong database (ví dụ: /api/videos/stream/video_xyz.mp4)
     */
    String storeLessonVideo(MultipartFile file);

    /**
     * Tìm đường dẫn tệp video trên đĩa
     * @param fileName tên file
     * @return Path của file
     */
    Path loadVideoPath(String fileName);

    /**
     * Tìm đường dẫn tệp ảnh trên đĩa
     * @param fileName tên file
     * @return Path của file
     */
    Path getImagePath(String fileName);

    /**
     * Phục vụ video dạng HTTP Range Request (HTTP 206 Partial Content) để tua, phát mượt mà
     */
    ResponseEntity<ResourceRegion> streamVideo(Path videoPath, HttpHeaders headers) throws IOException;
}
