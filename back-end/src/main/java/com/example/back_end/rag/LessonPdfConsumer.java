package com.example.back_end.rag;

import com.example.back_end.config.AIProperties;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;

import java.io.File;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
@ConditionalOnProperty(name = "ai.kafka.enabled", havingValue = "true", matchIfMissing = true)
public class LessonPdfConsumer {

    private final AIProperties aiProperties;
    private final PdfLoader pdfLoader;
    private final VectorDb vectorDb;
    private final ObjectMapper objectMapper;

    @KafkaListener(
            topics = "${ai.kafka.topic:lesson-pdf-topic}",
            groupId = "${spring.kafka.consumer.group-id:edusmart-ai-rag-group}"
    )
    public void consumePdfUploadedEvent(String message) {
        log.info("[Kafka Consumer] Nhận được thông điệp từ topic: {}", message);
        try {
            LessonPdfEvent event = objectMapper.readValue(message, LessonPdfEvent.class);
            if (event.getFileName() == null || event.getFileName().isBlank()) {
                log.warn("[Kafka Consumer] Bỏ qua vì tên file rỗng.");
                return;
            }

            File pdfFile = new File(aiProperties.getRag().getUploadDir(), event.getFileName());
            if (!pdfFile.exists()) {
                // Thử tìm trong thư mục uploads/pdfs
                File alt = new File("uploads/pdfs", event.getFileName());
                if (alt.exists()) {
                    pdfFile = alt;
                } else {
                    log.warn("[Kafka Consumer] Không tìm thấy file PDF tại '{}' hoặc 'uploads/pdfs/{}'",
                            pdfFile.getAbsolutePath(), event.getFileName());
                    return;
                }
            }

            log.info("[Kafka Consumer] Bắt đầu băm nhỏ và sinh vector embedding cho file '{}' (Bài học: {}, Khóa học: {})...",
                    event.getFileName(), event.getLessonId(), event.getCourseId());

            List<PdfLoader.ChunkItem> chunks = pdfLoader.loadAndChunkPdf(
                    pdfFile,
                    event.getLessonId(),
                    event.getCourseId(),
                    aiProperties.getRag().getChunkSize(),
                    aiProperties.getRag().getChunkOverlap()
            );

            int saved = vectorDb.upsertChunks(chunks);
            log.info("[Kafka Consumer] HOÀN TẤT: Đã băm {} chunks và lưu thành công vào MongoDB cho file '{}'.",
                    saved, event.getFileName());

        } catch (Exception e) {
            log.error("[Kafka Consumer] Lỗi khi xử lý message từ Kafka: {}", e.getMessage(), e);
        }
    }
}
