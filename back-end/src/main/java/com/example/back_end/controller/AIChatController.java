package com.example.back_end.controller;

import com.example.back_end.agents.EduAgent;
import com.example.back_end.agents.QueryModels;
import com.example.back_end.config.AIProperties;
import com.example.back_end.entity.LessonContent;
import com.example.back_end.rag.PdfLoader;
import com.example.back_end.rag.VectorDb;
import com.example.back_end.service.AIChatMongoService;
import com.example.back_end.tools.SqlTool;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.File;
import java.util.*;

@Slf4j
@RestController
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class AIChatController {

    private final EduAgent eduAgent;
    private final PdfLoader pdfLoader;
    private final VectorDb vectorDb;
    private final SqlTool sqlTool;
    private final AIProperties aiProperties;
    private final AIChatMongoService aiChatMongoService;

    @GetMapping("/api/chat/health")
    public ResponseEntity<Map<String, Object>> healthCheck() {
        Map<String, Object> res = new HashMap<>();
        res.put("status", "healthy");
        res.put("service", "EduSmart Java AI ChatBox & RAG Service");
        res.put("llm_provider", aiProperties.getLlm().getProvider());
        res.put("llm_model", aiProperties.getLlm().getModelName());
        res.put("embeddings_provider", aiProperties.getEmbeddings().getProvider());
        res.put("cached_chunks_count", vectorDb.getCachedCount());
        return ResponseEntity.ok(res);
    }

    @PostMapping("/api/chat/lesson")
    public ResponseEntity<QueryModels.ChatResponse> chatLesson(@RequestBody QueryModels.ChatLessonRequest request) {
        try {
            // 1. Lưu câu hỏi của học sinh vào MongoDB
            aiChatMongoService.saveMessage(request.getLessonId(), null, "User", request.getMessage());

            // 2. Gọi Agent AI xử lý
            QueryModels.ChatResponse response = eduAgent.chatLesson(request);

            // 3. Lưu câu trả lời của AI vào MongoDB
            if (response != null && response.getReply() != null) {
                aiChatMongoService.saveMessage(request.getLessonId(), null, "AI", response.getReply());
            }

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Lỗi khi xử lý chatLesson: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body(QueryModels.ChatResponse.builder()
                    .success(false)
                    .reply("Đã xảy ra lỗi khi xử lý câu hỏi: " + e.getMessage())
                    .lessonId(request.getLessonId())
                    .build());
        }
    }

    @PostMapping("/api/chat/quiz")
    public ResponseEntity<QueryModels.ChatResponse> chatQuiz(@RequestBody QueryModels.ChatQuizRequest request) {
        try {
            // Giải đáp câu hỏi trắc nghiệm dựa trên bài giảng PDF và lưu lời giải thích vào MySQL Questions.explanation
            // Tuyệt đối không lưu vào MongoDB (chỉ có Lesson AI mới lưu MongoDB)
            QueryModels.ChatResponse response = eduAgent.explainQuiz(request);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Lỗi khi xử lý chatQuiz: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body(QueryModels.ChatResponse.builder()
                    .success(false)
                    .reply("Đã xảy ra lỗi khi giải đáp câu hỏi trắc nghiệm: " + e.getMessage())
                    .lessonId(request.getLessonId())
                    .build());
        }
    }

    /**
     * Lấy lịch sử trò chuyện AI trong bài học từ MongoDB (chỉ lấy hỏi đáp bài học, không lấy quiz)
     */
    @GetMapping("/api/chat/history/lesson/{lessonId}")
    public ResponseEntity<List<Map<String, Object>>> getLessonChatHistory(@PathVariable Integer lessonId) {
        List<Map<String, Object>> history = aiChatMongoService.getLessonHistory(lessonId);
        return ResponseEntity.ok(history);
    }

    /**
     * Xóa / làm mới lịch sử trò chuyện bài học
     */
    @DeleteMapping("/api/chat/history/lesson/{lessonId}")
    public ResponseEntity<Map<String, Object>> clearLessonChatHistory(@PathVariable Integer lessonId) {
        aiChatMongoService.clearLessonHistory(lessonId);
        return ResponseEntity.ok(Map.of("success", true, "message", "Đã xóa lịch sử trò chuyện bài học"));
    }

    /**
     * Lấy lịch sử trò chuyện AI khi làm quiz từ MongoDB
     */
    @GetMapping("/api/chat/history/quiz")
    public ResponseEntity<List<Map<String, Object>>> getQuizChatHistory(
            @RequestParam(required = false) Integer resultId,
            @RequestParam(required = false) Integer lessonId
    ) {
        List<Map<String, Object>> history = aiChatMongoService.getQuizHistory(resultId, lessonId);
        return ResponseEntity.ok(history);
    }

    @PostMapping("/api/rag/ingest")
    public ResponseEntity<Map<String, Object>> ingestPdf(@RequestBody QueryModels.IngestPdfRequest request) {
        Map<String, Object> result = new HashMap<>();
        File targetFile = null;

        if (request.getPdfPath() != null && !request.getPdfPath().isBlank()) {
            File f = new File(request.getPdfPath());
            if (f.exists()) targetFile = f;
        } else if (request.getPdfFilename() != null && !request.getPdfFilename().isBlank()) {
            File f = new File(aiProperties.getRag().getUploadDir(), request.getPdfFilename());
            if (f.exists()) {
                targetFile = f;
            } else {
                File alt = new File("uploads/pdfs", request.getPdfFilename());
                if (alt.exists()) targetFile = alt;
            }
        }

        if (targetFile == null || !targetFile.exists()) {
            result.put("success", false);
            result.put("message", "Không tìm thấy file PDF. Thư mục tra cứu: " + aiProperties.getRag().getUploadDir());
            return ResponseEntity.badRequest().body(result);
        }

        try {
            List<PdfLoader.ChunkItem> chunks = pdfLoader.loadAndChunkPdf(
                    targetFile,
                    request.getLessonId(),
                    request.getCourseId(),
                    aiProperties.getRag().getChunkSize(),
                    aiProperties.getRag().getChunkOverlap()
            );

            int saved = vectorDb.upsertChunks(chunks);
            result.put("success", true);
            result.put("filename", targetFile.getName());
            result.put("lesson_id", request.getLessonId());
            result.put("chunks_extracted", chunks.size());
            result.put("chunks_saved", saved);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("Lỗi khi băm file PDF: {}", e.getMessage(), e);
            result.put("success", false);
            result.put("message", e.getMessage());
            return ResponseEntity.internalServerError().body(result);
        }
    }

    @PostMapping("/api/rag/sync-all")
    public ResponseEntity<Map<String, Object>> syncAllPdfs() {
        Map<String, Object> result = new HashMap<>();
        List<File> files = new ArrayList<>();

        File dir1 = new File(aiProperties.getRag().getUploadDir());
        if (dir1.exists() && dir1.isDirectory()) {
            File[] f1 = dir1.listFiles((d, name) -> name.toLowerCase().endsWith(".pdf"));
            if (f1 != null) files.addAll(Arrays.asList(f1));
        }
        File dir2 = new File("uploads/pdfs");
        if (dir2.exists() && dir2.isDirectory()) {
            File[] f2 = dir2.listFiles((d, name) -> name.toLowerCase().endsWith(".pdf"));
            if (f2 != null) {
                for (File f : f2) {
                    if (files.stream().noneMatch(existing -> existing.getName().equals(f.getName()))) {
                        files.add(f);
                    }
                }
            }
        }

        if (files.isEmpty()) {
            result.put("success", true);
            result.put("message", "Không có file PDF nào trong thư mục tải lên.");
            result.put("files_processed_count", 0);
            return ResponseEntity.ok(result);
        }

        List<LessonContent> dbLessons = sqlTool.getAllPdfContents();
        Map<String, LessonContent> fileMap = new HashMap<>();
        for (LessonContent lc : dbLessons) {
            if (lc.getContentData() != null) {
                fileMap.put(lc.getContentData().trim(), lc);
            }
        }

        int totalSaved = 0;
        List<Map<String, Object>> processed = new ArrayList<>();

        for (File pdf : files) {
            LessonContent lc = fileMap.get(pdf.getName());
            Integer lessonId = null;
            Integer courseId = null;

            if (lc != null && lc.getLesson() != null) {
                lessonId = lc.getLesson().getLessonId();
                if (lc.getLesson().getChapter() != null && lc.getLesson().getChapter().getCourse() != null) {
                    courseId = lc.getLesson().getChapter().getCourse().getCourseId();
                }
            }

            try {
                List<PdfLoader.ChunkItem> chunks = pdfLoader.loadAndChunkPdf(
                        pdf,
                        lessonId,
                        courseId,
                        aiProperties.getRag().getChunkSize(),
                        aiProperties.getRag().getChunkOverlap()
                );
                int saved = vectorDb.upsertChunks(chunks);
                totalSaved += saved;

                Map<String, Object> item = new HashMap<>();
                item.put("filename", pdf.getName());
                item.put("lesson_id", lessonId);
                item.put("chunks", saved);
                processed.add(item);
            } catch (Exception e) {
                log.error("Lỗi khi đồng bộ file {}: {}", pdf.getName(), e.getMessage());
            }
        }

        result.put("success", true);
        result.put("files_processed_count", processed.size());
        result.put("total_chunks_saved", totalSaved);
        result.put("files", processed);
        return ResponseEntity.ok(result);
    }
}
