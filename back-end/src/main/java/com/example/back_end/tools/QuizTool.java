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
public class QuizTool {

    private final VectorDb vectorDb;
    private final SqlTool sqlTool;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class QuizContextResult {
        private String questionText;
        private List<String> options;
        private Integer lessonId;
        private Integer courseId;
        private String pdfEvidence;
        private List<PdfLoader.ChunkItem> rawChunks;
        private String dbExplanation;
        private String correctAnswerText;
    }

    public QuizContextResult prepareQuizContext(
            String questionText,
            List<String> options,
            Integer lessonId,
            Integer courseId,
            Integer questionId,
            int topK
    ) {
        String finalQuestion = questionText;
        List<String> finalOptions = options != null ? new ArrayList<>(options) : new ArrayList<>();
        Integer finalLessonId = lessonId;
        String dbExplanation = null;
        String correctAnswerText = null;

        if (questionId != null) {
            Optional<SqlTool.QuizQuestionMetadata> qMeta = sqlTool.getQuizQuestionContext(questionId);
            if (qMeta.isPresent()) {
                SqlTool.QuizQuestionMetadata m = qMeta.get();
                if (finalQuestion == null || finalQuestion.isBlank()) {
                    finalQuestion = m.getQuestionText();
                }
                if (finalOptions.isEmpty() && m.getAnswers() != null) {
                    for (SqlTool.AnswerItem a : m.getAnswers()) {
                        finalOptions.add(a.getContent());
                    }
                }
                if (m.getAnswers() != null) {
                    for (SqlTool.AnswerItem a : m.getAnswers()) {
                        if (Boolean.TRUE.equals(a.getIsCorrect())) {
                            correctAnswerText = a.getContent();
                        }
                    }
                }
                if (m.getExplanation() != null && !m.getExplanation().isBlank()) {
                    dbExplanation = m.getExplanation().trim();
                }
                if (finalLessonId == null) {
                    finalLessonId = m.getLessonId();
                }
            }
        }

        StringBuilder searchStr = new StringBuilder(finalQuestion != null ? finalQuestion : "");
        for (String opt : finalOptions) {
            searchStr.append(" ").append(opt);
        }

        List<PdfLoader.ChunkItem> chunks = vectorDb.searchRelevantChunks(searchStr.toString(), finalLessonId, courseId, topK);

        StringBuilder evidence = new StringBuilder();
        if (chunks != null && !chunks.isEmpty()) {
            for (PdfLoader.ChunkItem c : chunks) {
                if (VectorDb.isGarbageChunk(c.getText())) {
                    continue;
                }
                evidence.append(String.format("[Trang %d - %s]: %s\n\n",
                        c.getPageNumber() != null ? c.getPageNumber() : 1,
                        c.getSourceFile() != null ? c.getSourceFile() : "PDF bài học",
                        c.getText()));
            }
        } else {
            evidence.append("Không có trích đoạn PDF khớp trực tiếp trong bài học này.");
        }

        return QuizContextResult.builder()
                .questionText(finalQuestion)
                .options(finalOptions)
                .lessonId(finalLessonId)
                .courseId(courseId)
                .pdfEvidence(evidence.toString().trim())
                .rawChunks(chunks != null ? chunks : List.of())
                .dbExplanation(dbExplanation)
                .correctAnswerText(correctAnswerText)
                .build();
    }

    /**
     * Tự động lưu lời giải thích AI vào MySQL DB nếu câu hỏi chưa có sẵn lời giải thích.
     */
    public boolean saveExplanationIfMissing(Integer questionId, String explanation) {
        if (questionId == null || explanation == null || explanation.isBlank()) {
            return false;
        }
        return sqlTool.updateQuestionExplanation(questionId, explanation);
    }
}
