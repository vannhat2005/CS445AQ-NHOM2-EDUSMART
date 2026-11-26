package com.example.back_end.tools;

import com.example.back_end.entity.Answer;
import com.example.back_end.entity.Lesson;
import com.example.back_end.entity.LessonContent;
import com.example.back_end.entity.Question;
import com.example.back_end.enumType.ContentType;
import com.example.back_end.repository.AnswerRepository;
import com.example.back_end.repository.LessonContentRepository;
import com.example.back_end.repository.LessonRepository;
import com.example.back_end.repository.QuestionRepository;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Slf4j
@Component
@RequiredArgsConstructor
public class SqlTool {

    private final LessonRepository lessonRepository;
    private final LessonContentRepository lessonContentRepository;
    private final QuestionRepository questionRepository;
    private final AnswerRepository answerRepository;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class LessonMetadata {
        private Integer lessonId;
        private String lessonTitle;
        private Integer chapterId;
        private String chapterTitle;
        private Integer courseId;
        private String courseTitle;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class QuizQuestionMetadata {
        private Integer questionId;
        private Integer quizId;
        private String quizTitle;
        private Integer lessonId;
        private String questionText;
        private String explanation;
        private List<AnswerItem> answers;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AnswerItem {
        private Integer answerId;
        private String content;
        private Boolean isCorrect;
    }

    public Optional<LessonMetadata> getLessonMetadata(Integer lessonId) {
        if (lessonId == null) return Optional.empty();
        try {
            return lessonRepository.findById(lessonId).map(lesson -> {
                String chapterTitle = null;
                Integer chapterId = null;
                Integer courseId = null;
                String courseTitle = null;

                if (lesson.getChapter() != null) {
                    chapterId = lesson.getChapter().getChapterId();
                    chapterTitle = lesson.getChapter().getTitle();
                    if (lesson.getChapter().getCourse() != null) {
                        courseId = lesson.getChapter().getCourse().getCourseId();
                        courseTitle = lesson.getChapter().getCourse().getTitle();
                    }
                }

                return LessonMetadata.builder()
                        .lessonId(lesson.getLessonId())
                        .lessonTitle(lesson.getTitle())
                        .chapterId(chapterId)
                        .chapterTitle(chapterTitle)
                        .courseId(courseId)
                        .courseTitle(courseTitle)
                        .build();
            });
        } catch (Exception e) {
            log.warn("Lỗi truy vấn metadata bài học {}: {}", lessonId, e.getMessage());
            return Optional.empty();
        }
    }

    public List<LessonContent> getLessonPdfFiles(Integer lessonId) {
        if (lessonId == null) return List.of();
        try {
            List<LessonContent> contents = lessonContentRepository.findByLesson_LessonIdOrderByOrderNumAscContentIdAsc(lessonId);
            List<LessonContent> pdfs = new ArrayList<>();
            for (LessonContent lc : contents) {
                if (lc.getContentType() == ContentType.PDF) {
                    pdfs.add(lc);
                }
            }
            return pdfs;
        } catch (Exception e) {
            log.warn("Lỗi truy vấn file PDF của bài học {}: {}", lessonId, e.getMessage());
            return List.of();
        }
    }

    public List<LessonContent> getAllPdfContents() {
        try {
            List<LessonContent> all = lessonContentRepository.findAll();
            List<LessonContent> pdfs = new ArrayList<>();
            for (LessonContent lc : all) {
                if (lc.getContentType() == ContentType.PDF) {
                    pdfs.add(lc);
                }
            }
            return pdfs;
        } catch (Exception e) {
            log.warn("Lỗi truy vấn tất cả PDF contents: {}", e.getMessage());
            return List.of();
        }
    }

    public Optional<QuizQuestionMetadata> getQuizQuestionContext(Integer questionId) {
        if (questionId == null) return Optional.empty();
        try {
            Optional<Question> optQ = questionRepository.findById(questionId);
            if (optQ.isEmpty()) return Optional.empty();
            Question q = optQ.get();

            List<Answer> answers = answerRepository.findByQuestion_QuestionIdOrderByAnswerIdAsc(questionId);
            List<AnswerItem> answerItems = new ArrayList<>();
            for (Answer a : answers) {
                answerItems.add(AnswerItem.builder()
                        .answerId(a.getAnswerId())
                        .content(a.getContent())
                        .isCorrect(a.getIsCorrect())
                        .build());
            }

            Integer quizId = null;
            String quizTitle = null;
            Integer lessonId = null;
            if (q.getQuiz() != null) {
                quizId = q.getQuiz().getQuizId();
                quizTitle = q.getQuiz().getTitle();
                if (q.getQuiz().getLesson() != null) {
                    lessonId = q.getQuiz().getLesson().getLessonId();
                }
            }

            return Optional.of(QuizQuestionMetadata.builder()
                    .questionId(q.getQuestionId())
                    .quizId(quizId)
                    .quizTitle(quizTitle)
                    .lessonId(lessonId)
                    .questionText(q.getContent())
                    .explanation(q.getExplanation())
                    .answers(answerItems)
                    .build());
        } catch (Exception e) {
            log.warn("Lỗi truy vấn câu hỏi trắc nghiệm {}: {}", questionId, e.getMessage());
            return Optional.empty();
        }
    }

    /**
     * Cập nhật lời giải thích vào MySQL DB nếu câu hỏi chưa có lời giải thích.
     * Giúp hệ thống tái sử dụng câu trả lời của AI cho các học sinh tra cứu sau này mà không tốn thêm token.
     */
    @Transactional
    public boolean updateQuestionExplanation(Integer questionId, String explanation) {
        if (questionId == null || explanation == null || explanation.isBlank()) {
            return false;
        }
        try {
            Optional<Question> optQ = questionRepository.findById(questionId);
            if (optQ.isPresent()) {
                Question q = optQ.get();
                if (q.getExplanation() == null || q.getExplanation().isBlank()) {
                    q.setExplanation(explanation.trim());
                    questionRepository.save(q);
                    log.info("[SqlTool] Đã tự động lưu lời giải thích AI vào MySQL DB cho Question ID: {}", questionId);
                    return true;
                }
            }
        } catch (Exception e) {
            log.warn("[SqlTool] Không thể lưu lời giải thích vào DB cho Question {}: {}", questionId, e.getMessage());
        }
        return false;
    }
}
