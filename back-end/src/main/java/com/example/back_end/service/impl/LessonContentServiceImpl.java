
package com.example.back_end.service.impl;

import com.example.back_end.dto.request.LessonContentRequest;
import com.example.back_end.dto.response.LessonContentResponse;
import com.example.back_end.entity.Lesson;
import com.example.back_end.entity.LessonContent;
import com.example.back_end.enumType.ContentType;
import com.example.back_end.enumType.GeneralStatus;
import com.example.back_end.exception.AppException;
import com.example.back_end.exception.ErrorCode;
import com.example.back_end.repository.LessonContentRepository;
import com.example.back_end.repository.LessonRepository;
import com.example.back_end.service.LessonContentService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.*;
import java.util.*;

@Service
@RequiredArgsConstructor
public class LessonContentServiceImpl implements LessonContentService {

    // Repository truy vấn nội dung và bài học
    private final LessonContentRepository contentRepository;
    private final LessonRepository lessonRepository;
    private final com.example.back_end.service.FileStorageService fileStorageService;

    // Thư mục lưu video và PDF
    @Value("${app.upload-dir:uploads/lesson-contents}")
    private String uploadDir;

    // Kiểm tra bài học thuộc đúng chương và khóa học
    private Lesson getLesson(Integer courseId, Integer chapterId, Integer lessonId) {
        Lesson lesson = lessonRepository.findById(lessonId)
                .orElseThrow(() -> new IllegalArgumentException("Bài học không tồn tại"));

        if (lesson.getChapter() == null || lesson.getChapter().getCourse() == null
                || !chapterId.equals(lesson.getChapter().getChapterId())
                || !courseId.equals(lesson.getChapter().getCourse().getCourseId())) {
            throw new IllegalArgumentException("Bài học không thuộc chương hoặc khóa học này");
        }

        return lesson;
    }

    // Kiểm tra trạng thái cấp cha trước khi kích hoạt nội dung
    private void validateActiveStatus(Lesson lesson, GeneralStatus status) {
        if (status == GeneralStatus.Active) {
            if (lesson.getStatus() != GeneralStatus.Active
                    || lesson.getChapter().getStatus() != GeneralStatus.Active) {
                throw new AppException(
                        ErrorCode.LESSON_CONTENT_PARENT_INACTIVE
                );
            }
        }
    }

    // Tìm nội dung thuộc bài học
    private LessonContent getContent(Integer lessonId, Integer contentId) {
        return contentRepository.findByContentIdAndLesson_LessonId(contentId, lessonId)
                .orElseThrow(() -> new IllegalArgumentException("Nội dung bài học không tồn tại"));
    }

    // Chuyển Entity thành DTO Response
    private LessonContentResponse toResponse(LessonContent content) {
        LessonContentResponse response = new LessonContentResponse();
        response.setContentId(content.getContentId());
        response.setLessonId(content.getLesson().getLessonId());
        response.setTitle(content.getTitle());
        response.setContentType(content.getContentType());
        response.setContentData(content.getContentData());
        response.setOrderNum(content.getOrderNum());
        response.setStatus(content.getStatus());
        response.setCreatedAt(content.getCreatedAt());
        response.setUpdatedAt(content.getUpdatedAt());
        return response;
    }

    // Kiểm tra file PDF, MP4 hoặc WebM dựa trên phần mở rộng và chữ ký file
    private String saveFile(MultipartFile file, ContentType type) {
        if (file == null || file.isEmpty())
            throw new IllegalArgumentException("Vui lòng chọn file tải lên");

        // Nếu là VIDEO: lưu vào uploads/videos/ và trả về URL stream hỗ trợ Range Request
        if (type == ContentType.Video) {
            return fileStorageService.storeLessonVideo(file);
        }

        // Nếu là PDF
        String original = Objects.toString(file.getOriginalFilename(), "").toLowerCase(Locale.ROOT);
        String extension = original.contains(".") ? original.substring(original.lastIndexOf('.')) : "";

        if (type == ContentType.PDF && !extension.equals(".pdf"))
            throw new IllegalArgumentException("Chỉ hỗ trợ file PDF");

        try {
            byte[] header;

            try (var input = file.getInputStream()) {
                header = input.readNBytes(16);
            }

            boolean valid = header.length >= 5
                    && new String(header, 0, 5, java.nio.charset.StandardCharsets.US_ASCII).equals("%PDF-");

            if (!valid)
                throw new IllegalArgumentException("Định dạng file PDF không hợp lệ");

            Path folder = Paths.get("uploads/pdfs").toAbsolutePath().normalize();
            Files.createDirectories(folder);

            String fileName = "pdf_" + UUID.randomUUID() + extension;

            try (var input = file.getInputStream()) {
                Files.copy(input, folder.resolve(fileName), StandardCopyOption.REPLACE_EXISTING);
            }

            return "/api/lesson-content/files/" + fileName;

        } catch (IOException e) {
            throw new IllegalStateException("Không thể lưu file tải lên", e);
        }
    }

    // Xử lý TEXT hoặc file VIDEO/PDF, giữ file cũ nếu sửa mà không chọn file mới
    private String resolveContentData(LessonContentRequest request, LessonContent oldContent) {
        ContentType type = request.getContentType();

        if (type == ContentType.Text) {
            if (request.getContentData() == null || request.getContentData().isBlank())
                throw new AppException(ErrorCode.LESSON_CONTENT_TEXT_REQUIRED);

            return request.getContentData().trim();
        }

        if (type == ContentType.Video || type == ContentType.PDF) {
            if (request.getFile() != null && !request.getFile().isEmpty())
                return saveFile(request.getFile(), type);

            if (oldContent != null && oldContent.getContentType() == type)
                return oldContent.getContentData();

            throw new AppException(ErrorCode.LESSON_CONTENT_FILE_REQUIRED);
        }

        throw new AppException(ErrorCode.LESSON_CONTENT_TYPE_INVALID);
    }

    // Lấy danh sách nội dung theo thứ tự
    @Override
    @Transactional(readOnly = true)
    public List<LessonContentResponse> getContents(
            Integer courseId, Integer chapterId, Integer lessonId) {

        getLesson(courseId, chapterId, lessonId);

        return contentRepository
                .findByLesson_LessonIdOrderByOrderNumAscContentIdAsc(lessonId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    // Xem chi tiết nội dung
    @Override
    @Transactional(readOnly = true)
    public LessonContentResponse getContentById(
            Integer courseId, Integer chapterId, Integer lessonId, Integer contentId) {

        getLesson(courseId, chapterId, lessonId);
        return toResponse(getContent(lessonId, contentId));
    }

    // Thêm nội dung và tự động gán thứ tự cuối cùng
    @Override
    @Transactional
    public LessonContentResponse createContent(
            Integer courseId, Integer chapterId, Integer lessonId,
            LessonContentRequest request) {

        Lesson lesson = getLesson(courseId, chapterId, lessonId);

        // Kiểm tra trạng thái cấp cha
        validateActiveStatus(lesson, request.getStatus());

        if (request.getTitle() == null || request.getTitle().isBlank())
            throw new IllegalArgumentException("Tiêu đề không được để trống");

        String data = resolveContentData(request, null);

        int maxOrder = contentRepository
                .findFirstByLesson_LessonIdOrderByOrderNumDescContentIdDesc(lessonId)
                .map(item -> item.getOrderNum() == null ? 0 : item.getOrderNum())
                .orElse(0);

        LessonContent content = new LessonContent();
        content.setLesson(lesson);
        content.setTitle(request.getTitle().trim());
        content.setContentType(request.getContentType());
        content.setContentData(data);
        content.setOrderNum(maxOrder + 1);
        content.setStatus(request.getStatus());

        return toResponse(contentRepository.saveAndFlush(content));
    }

    // Cập nhật tiêu đề, loại nội dung, file và trạng thái
    @Override
    @Transactional
    public LessonContentResponse updateContent(
            Integer courseId, Integer chapterId, Integer lessonId,
            Integer contentId, LessonContentRequest request) {

        Lesson lesson = getLesson(courseId, chapterId, lessonId);

        // Kiểm tra trạng thái cấp cha
        validateActiveStatus(lesson, request.getStatus());

        LessonContent content = getContent(lessonId, contentId);

        if (request.getTitle() == null || request.getTitle().isBlank())
            throw new IllegalArgumentException("Tiêu đề không được để trống");

        String data = resolveContentData(request, content);

        content.setTitle(request.getTitle().trim());
        content.setContentType(request.getContentType());
        content.setContentData(data);
        content.setStatus(request.getStatus());

        return toResponse(contentRepository.saveAndFlush(content));
    }

    // Đổi thứ tự nội dung lên hoặc xuống
    @Override
    @Transactional
    public LessonContentResponse moveContent(
            Integer courseId, Integer chapterId, Integer lessonId,
            Integer contentId, String direction) {

        // 1. Kiểm tra bài học thuộc đúng chương và khóa học
        getLesson(courseId, chapterId, lessonId);

        // 2. Lấy danh sách nội dung theo thứ tự hiện tại
        List<LessonContent> contents = contentRepository
                .findByLesson_LessonIdOrderByOrderNumAscContentIdAsc(lessonId);

        // 3. Xác định vị trí nội dung cần di chuyển
        int currentIndex = -1;

        for (int i = 0; i < contents.size(); i++) {
            if (contents.get(i).getContentId().equals(contentId)) {
                currentIndex = i;
                break;
            }
        }

        if (currentIndex == -1) {
            throw new AppException(ErrorCode.VALIDATION_ERROR);
        }

        // 4. Xác định vị trí đích
        int targetIndex = "up".equalsIgnoreCase(direction)
                ? currentIndex - 1
                : currentIndex + 1;

        // Không cho phép di chuyển vượt giới hạn
        if (targetIndex < 0 || targetIndex >= contents.size()) {
            throw new AppException(ErrorCode.VALIDATION_ERROR);
        }

        // 5. Hoán đổi vị trí
        LessonContent currentContent = contents.get(currentIndex);
        LessonContent targetContent = contents.get(targetIndex);

        contents.set(currentIndex, targetContent);
        contents.set(targetIndex, currentContent);

        // 6. Chuẩn hóa orderNum liên tục từ 1 đến N
        for (int i = 0; i < contents.size(); i++) {
            contents.get(i).setOrderNum(i + 1);
        }

        // 7. Lưu thứ tự mới
        contentRepository.saveAllAndFlush(contents);

        // 8. Trả về nội dung vừa di chuyển
        return toResponse(currentContent);
    }
}
