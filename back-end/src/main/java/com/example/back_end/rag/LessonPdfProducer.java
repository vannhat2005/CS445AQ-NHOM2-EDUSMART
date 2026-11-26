package com.example.back_end.rag;

import com.example.back_end.config.AIProperties;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

import java.io.File;
import java.util.List;
import java.util.concurrent.CompletableFuture;

@Slf4j
@Service
@RequiredArgsConstructor
public class LessonPdfProducer {

    private final AIProperties aiProperties;
    private final ObjectMapper objectMapper;
    private final org.springframework.beans.factory.ObjectProvider<KafkaTemplate<String, String>> kafkaTemplateProvider;
    private final PdfLoader pdfLoader;
    private final VectorDb vectorDb;

    public void publishPdfUploadedEvent(String fileName, Integer lessonId, Integer courseId) {
        if (fileName == null || !fileName.toLowerCase().endsWith(".pdf")) {
            return;
        }

        LessonPdfEvent event = LessonPdfEvent.builder()
                .fileName(fileName)
                .lessonId(lessonId)
                .courseId(courseId)
                .eventType("UPLOADED")
                .timestamp(System.currentTimeMillis())
                .build();

        boolean kafkaSent = false;
        Boolean kafkaEnabled = aiProperties.getKafka().getEnabled();

        if (Boolean.TRUE.equals(kafkaEnabled)) {
            KafkaTemplate<String, String> kafkaTemplate = kafkaTemplateProvider.getIfAvailable();
            if (kafkaTemplate != null) {
                try {
                    String topic = aiProperties.getKafka().getTopic();
                    String json = objectMapper.writeValueAsString(event);
                    log.info("[Kafka Producer] Đang gửi sự kiện upload PDF tới topic '{}': {}", topic, json);

                    kafkaTemplate.send(topic, String.valueOf(lessonId), json)
                            .whenComplete((result, ex) -> {
                                if (ex != null) {
                                    log.warn("[Kafka Producer] Gửi sự kiện Kafka thất bại ({}). Kích hoạt băm trực tiếp dự phòng.", ex.getMessage());
                                    triggerDirectIngest(fileName, lessonId, courseId);
                                } else {
                                    log.info("[Kafka Producer] Gửi sự kiện thành công tới partition {} offset {}",
                                            result.getRecordMetadata().partition(),
                                            result.getRecordMetadata().offset());
                                }
                            });
                    kafkaSent = true;
                } catch (Exception e) {
                    log.warn("[Kafka Producer] Không thể gửi message tới Kafka broker: {}. Kích hoạt xử lý ngầm dự phòng.", e.getMessage());
                }
            } else {
                log.info("[Kafka Producer] KafkaTemplate chưa khởi tạo. Kích hoạt xử lý ngầm dự phòng.");
            }
        }

        // Nếu Kafka chưa bật hoặc broker chưa sẵn sàng, xử lý bất đồng bộ ngầm dự phòng
        if (!kafkaSent) {
            triggerDirectIngest(fileName, lessonId, courseId);
        }
    }

    private void triggerDirectIngest(String fileName, Integer lessonId, Integer courseId) {
        CompletableFuture.runAsync(() -> {
            try {
                File pdfFile = new File(aiProperties.getRag().getUploadDir(), fileName);
                if (!pdfFile.exists()) {
                    File alt = new File("uploads/pdfs", fileName);
                    if (alt.exists()) {
                        pdfFile = alt;
                    } else {
                        log.warn("[Direct Ingest Fallback] Không tìm thấy file: {}", pdfFile.getAbsolutePath());
                        return;
                    }
                }
                List<PdfLoader.ChunkItem> chunks = pdfLoader.loadAndChunkPdf(
                        pdfFile,
                        lessonId,
                        courseId,
                        aiProperties.getRag().getChunkSize(),
                        aiProperties.getRag().getChunkOverlap()
                );
                int saved = vectorDb.upsertChunks(chunks);
                log.info("[Direct Ingest Fallback] Đã tự động băm {} chunks từ file {} và lưu vào MongoDB.", saved, fileName);
            } catch (Exception e) {
                log.error("[Direct Ingest Fallback] Lỗi khi xử lý file {}: {}", fileName, e.getMessage(), e);
            }
        });
    }
}
