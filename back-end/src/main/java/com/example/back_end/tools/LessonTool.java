package com.example.back_end.tools;

import com.example.back_end.rag.PdfLoader;
import com.example.back_end.rag.VectorDb;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Slf4j
@Component
@RequiredArgsConstructor
public class LessonTool {

    private final VectorDb vectorDb;
    private final SqlTool sqlTool;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class KnowledgeResult {
        private String query;
        private Integer lessonId;
        private String lessonTitle;
        private String courseTitle;
        private String context;
        private int chunksCount;
        private List<Citation> citations;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Citation {
        private String source;
        private Integer page;
        private Double score;
    }

    public KnowledgeResult retrieveLessonKnowledge(String query, Integer lessonId, Integer courseId, int topK) {
        String lessonTitle = null;
        String courseTitle = null;

        if (lessonId != null) {
            Optional<SqlTool.LessonMetadata> meta = sqlTool.getLessonMetadata(lessonId);
            if (meta.isPresent()) {
                lessonTitle = meta.get().getLessonTitle();
                courseTitle = meta.get().getCourseTitle();
            }
        }

        List<PdfLoader.ChunkItem> chunks = vectorDb.searchRelevantChunks(query, lessonId, courseId, topK);

        StringBuilder sb = new StringBuilder();
        List<Citation> citations = new ArrayList<>();

        if (chunks != null && !chunks.isEmpty()) {
            int idx = 1;
            for (PdfLoader.ChunkItem c : chunks) {
                if (VectorDb.isGarbageChunk(c.getText())) {
                    continue;
                }
                String src = c.getSourceFile() != null ? c.getSourceFile() : "Tài liệu bài học";
                int page = c.getPageNumber() != null ? c.getPageNumber() : 1;
                double score = c.getScore() != null ? c.getScore() : 0.0;

                sb.append(String.format("--- [Trích dẫn %d: %s (Trang %d)] ---\n%s\n\n", idx, src, page, c.getText()));
                citations.add(Citation.builder()
                        .source(src)
                        .page(page)
                        .score(score)
                        .build());
                idx++;
            }
        } else {
            sb.append("Không tìm thấy nội dung PDF trực tiếp trùng khớp trong bài học này.");
        }

        return KnowledgeResult.builder()
                .query(query)
                .lessonId(lessonId)
                .lessonTitle(lessonTitle)
                .courseTitle(courseTitle)
                .context(sb.toString().trim())
                .chunksCount(chunks != null ? chunks.size() : 0)
                .citations(citations)
                .build();
    }
}
