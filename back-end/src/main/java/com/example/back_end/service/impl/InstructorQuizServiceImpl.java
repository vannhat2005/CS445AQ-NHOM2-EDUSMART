package com.example.back_end.service.impl;

import com.example.back_end.dto.request.QuestionRequest;
import com.example.back_end.dto.request.QuizCreateRequest;
import com.example.back_end.dto.request.QuizTitleRequest;
import com.example.back_end.dto.response.DraftResponse;
import com.example.back_end.dto.response.DraftQuestionResponse;
import com.example.back_end.entity.*;
import com.example.back_end.enumType.QuizStatus;
import com.example.back_end.exception.AppException;
import com.example.back_end.exception.ErrorCode;
import com.example.back_end.repository.*;
import com.example.back_end.service.InstructorQuizService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
@Transactional
public class InstructorQuizServiceImpl implements InstructorQuizService {

    private final InstructorQuizRepository quizRepository;
    private final InstructorQuestionRepository questionRepository;
    private final InstructorAnswerRepository answerRepository;
    private final InstructorQuizLessonRepository lessonRepository;
    private final InstructorQuizChapterRepository chapterRepository;
    private final InstructorQuizResultRepository quizResultRepository;

    // Số lượng câu hỏi tối thiểu để xuất bản
    private static final int MIN_QUESTIONS = 3;

    // ==================================================
    // 1. LẤY BÀI KIỂM TRA CUỐI CHƯƠNG
    // ==================================================
    @Override
    @Transactional(readOnly = true)
    public DraftResponse getChapterQuiz(Integer instructorId, Integer chapterId) {
        // Kiểm tra chương học tồn tại và thuộc giảng viên
        Chapter chapter = chapterRepository.findById(chapterId)
                .orElseThrow(() -> new AppException(ErrorCode.QUIZ_INVALID_LOCATION));
        validateOwner(instructorId, chapter);

        // Trả về null nếu chương chưa có bài kiểm tra
        return quizRepository.findByChapter_ChapterIdAndLessonIsNull(chapterId)
                .map(this::toQuizResponse).orElse(null);
    }

    // ==================================================
    // 2. LẤY TRẮC NGHIỆM BÀI HỌC
    // ==================================================
    @Override
    @Transactional(readOnly = true)
    public DraftResponse getLessonQuiz(Integer instructorId, Integer lessonId) {
        // Kiểm tra bài học tồn tại và thuộc giảng viên
        Lesson lesson = lessonRepository.findById(lessonId)
                .orElseThrow(() -> new AppException(ErrorCode.QUIZ_INVALID_LOCATION));
        validateOwner(instructorId, lesson.getChapter());

        // Trả về null nếu bài học chưa có trắc nghiệm
        return quizRepository.findByLesson_LessonId(lessonId)
                .map(this::toQuizResponse).orElse(null);
    }

    // ==================================================
    // 3. XEM CHI TIẾT BỘ TRẮC NGHIỆM
    // ==================================================
    @Override
    @Transactional(readOnly = true)
    public DraftResponse getQuizDetail(Integer instructorId, Integer quizId) {
        Quiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new AppException(ErrorCode.QUIZ_NOT_FOUND));

        // Cho phép xem cả Draft và Published nếu thuộc giảng viên
        validateOwner(instructorId, getQuizChapter(quiz));
        return toQuizResponse(quiz);
    }

    // ==================================================
    // 4. TẠO TRẮC NGHIỆM THỦ CÔNG
    // ==================================================
    @Override
    public DraftResponse createQuiz(Integer instructorId, QuizCreateRequest request) {
        validateTitle(request.getTitle());

        Quiz quiz = new Quiz();
        quiz.setTitle(request.getTitle().trim());
        quiz.setStatus(QuizStatus.Draft);

        // Trường hợp tạo trắc nghiệm bài học
        if (request.getLessonId() != null) {
            Lesson lesson = lessonRepository.findByIdForUpdate(request.getLessonId())
                    .orElseThrow(() -> new AppException(ErrorCode.QUIZ_INVALID_LOCATION));

            Chapter chapter = lesson.getChapter();
            validateOwner(instructorId, chapter);

            // Kiểm tra bài học có thuộc đúng chương được truyền lên không
            if (request.getChapterId() != null &&
                    !Objects.equals(chapter.getChapterId(), request.getChapterId())) {
                throw new AppException(ErrorCode.QUIZ_INVALID_LOCATION);
            }

            // Mỗi bài học chỉ được có một bộ trắc nghiệm
            if (quizRepository.existsByLesson_LessonId(lesson.getLessonId())) {
                throw new AppException(ErrorCode.QUIZ_ALREADY_EXISTS);
            }

            // Trắc nghiệm bài học không giới hạn thời gian và điểm đạt
            quiz.setLesson(lesson);
            quiz.setChapter(chapter);
            quiz.setTimeLimit(null);
            quiz.setPassingScore(null);

        } else {
            // Trường hợp tạo bài kiểm tra cuối chương
            if (request.getChapterId() == null) {
                throw new AppException(ErrorCode.QUIZ_INVALID_LOCATION);
            }

            Chapter chapter = chapterRepository.findByIdForUpdate(request.getChapterId())
                    .orElseThrow(() -> new AppException(ErrorCode.QUIZ_INVALID_LOCATION));
            validateOwner(instructorId, chapter);

            // Mỗi chương chỉ được có một bài kiểm tra cuối chương
            if (quizRepository.existsByChapter_ChapterIdAndLessonIsNull(chapter.getChapterId())) {
                throw new AppException(ErrorCode.QUIZ_ALREADY_EXISTS);
            }

            // Kiểm tra cấu hình thời gian và điểm đạt
            validateConfig(request.getTimeLimit(), request.getPassingScore());

            quiz.setLesson(null);
            quiz.setChapter(chapter);
            quiz.setTimeLimit(request.getTimeLimit());
            quiz.setPassingScore(request.getPassingScore());
        }

        // Lưu bản nháp và trả về thông tin vừa tạo
        return toQuizResponse(quizRepository.saveAndFlush(quiz));
    }

    // ==================================================
    // 5. CẬP NHẬT TÊN TRẮC NGHIỆM
    // ==================================================
    @Override
    public DraftResponse updateTitle(Integer instructorId, Integer quizId, QuizTitleRequest request) {
        Quiz quiz = getEditableQuiz(instructorId, quizId);
        validateTitle(request.getTitle());

        quiz.setTitle(request.getTitle().trim());

        // Lưu tiêu đề mới vào database
        return toQuizResponse(quizRepository.saveAndFlush(quiz));
    }

    // ==================================================
    // 6. THÊM CÂU HỎI
    // ==================================================
    @Override
    public DraftResponse addQuestion(Integer instructorId, Integer quizId, QuestionRequest request) {
        Quiz quiz = getEditableQuiz(instructorId, quizId);
        validateQuestion(request);

        // Khởi tạo câu hỏi thủ công
        Question question = new Question();
        question.setQuiz(quiz);
        question.setContent(request.getContent().trim());
        question.setExplanation(normalizeExplanation(request.getExplanation()));
        question.setIsAiGenerated(false);
        question.setStatus(QuizStatus.Draft);

        // Lưu câu hỏi trước để lấy questionId
        questionRepository.saveAndFlush(question);

        // Lưu danh sách phương án trả lời
        saveAnswers(question, request);

        // Cập nhật thời gian chỉnh sửa bộ trắc nghiệm
        touchQuiz(quiz);
        return toQuizResponse(quiz);
    }

    // ==================================================
    // 7. CẬP NHẬT CÂU HỎI
    // ==================================================
    @Override
    public DraftResponse updateQuestion(Integer instructorId, Integer quizId, Integer questionId, QuestionRequest request) {
        Quiz quiz = getEditableQuiz(instructorId, quizId);
        validateQuestion(request);

        // Kiểm tra câu hỏi thuộc đúng bộ trắc nghiệm
        Question question = getQuestion(quizId, questionId);

        // Cập nhật nội dung và giải thích
        question.setContent(request.getContent().trim());
        question.setExplanation(normalizeExplanation(request.getExplanation()));
        questionRepository.saveAndFlush(question);

        // Xóa phương án cũ và lưu danh sách phương án mới
        answerRepository.deleteByQuestionId(questionId);
        saveAnswers(question, request);

        touchQuiz(quiz);
        return toQuizResponse(quiz);
    }

    // ==================================================
    // 8. XÓA CÂU HỎI
    // ==================================================
    @Override
    public DraftResponse deleteQuestion(Integer instructorId, Integer quizId, Integer questionId) {
        Quiz quiz = getEditableQuiz(instructorId, quizId);
        Question question = getQuestion(quizId, questionId);

        // Xóa phương án trả lời trước để tránh lỗi khóa ngoại
        answerRepository.deleteByQuestionId(questionId);

        // Xóa câu hỏi khỏi database
        questionRepository.delete(question);
        questionRepository.flush();

        touchQuiz(quiz);
        return toQuizResponse(quiz);
    }

    // ==================================================
    // 9. XUẤT BẢN TRẮC NGHIỆM
    // ==================================================
    @Override
    public DraftResponse publishQuiz(Integer instructorId, Integer quizId) {
        Quiz quiz = getEditableQuiz(instructorId, quizId);
        validateTitle(quiz.getTitle());

        List<Question> questions = questionRepository
                .findByQuiz_QuizIdOrderByQuestionIdAsc(quizId);

        // Phải có ít nhất 3 câu hỏi mới được xuất bản
        if (questions.size() < MIN_QUESTIONS) {
            throw new AppException(ErrorCode.QUIZ_MIN_QUESTIONS);
        }

        // Kiểm tra cấu hình nếu là bài kiểm tra cuối chương
        if (quiz.getLesson() == null) {
            validateConfig(quiz.getTimeLimit(), quiz.getPassingScore());
        }

        // Kiểm tra tính hợp lệ của toàn bộ câu hỏi
        for (Question question : questions) {
            validateSavedQuestion(question);
        }

        // Chuyển trạng thái toàn bộ câu hỏi sang Published
        for (Question question : questions) {
            question.setStatus(QuizStatus.Published);
        }

        questionRepository.saveAllAndFlush(questions);

        // Chuyển trạng thái bộ trắc nghiệm sang Published
        quiz.setStatus(QuizStatus.Published);

        return toQuizResponse(quizRepository.saveAndFlush(quiz));
    }

    // ==================================================
    // 10. CÁC HÀM KIỂM TRA NGHIỆP VỤ
    // ==================================================

    // Lấy chương học tương ứng với bộ trắc nghiệm
    private Chapter getQuizChapter(Quiz quiz) {
        return quiz.getLesson() != null
                ? quiz.getLesson().getChapter() : quiz.getChapter();
    }

    // Kiểm tra giảng viên đăng nhập và quyền sở hữu khóa học
    private void validateOwner(Integer instructorId, Chapter chapter) {
        if (chapter == null || chapter.getCourse() == null ||
                chapter.getCourse().getInstructor() == null) {
            throw new AppException(ErrorCode.QUIZ_ACCESS_DENIED);
        }

        User instructor = chapter.getCourse().getInstructor();
        var authentication = SecurityContextHolder.getContext().getAuthentication();

        // Không cho phép thay đổi instructorId trên URL để truy cập dữ liệu người khác
        if (!Objects.equals(instructor.getUserId(), instructorId) ||
                authentication == null || !authentication.isAuthenticated() ||
                !Objects.equals(instructor.getUsername(), authentication.getName())) {
            throw new AppException(ErrorCode.QUIZ_ACCESS_DENIED);
        }
    }

    // Lấy và khóa bản nháp trước khi thực hiện thay đổi dữ liệu
    private Quiz getEditableQuiz(Integer instructorId, Integer quizId) {
        Quiz quiz = quizRepository.findByIdForUpdate(quizId)
                .orElseThrow(() -> new AppException(ErrorCode.QUIZ_NOT_FOUND));

        validateOwner(instructorId, getQuizChapter(quiz));

        // Chỉ cho phép chỉnh sửa bản nháp
        if (quiz.getStatus() != QuizStatus.Draft) {
            throw new AppException(ErrorCode.QUIZ_NOT_DRAFT);
        }

        // Không thay đổi câu hỏi nếu đã tồn tại kết quả làm bài
        if (quizResultRepository.existsByQuiz_QuizId(quizId)) {
            throw new AppException(ErrorCode.QUIZ_HAS_RESULTS);
        }

        return quiz;
    }

    // Lấy câu hỏi thuộc bộ trắc nghiệm
    private Question getQuestion(Integer quizId, Integer questionId) {
        return questionRepository.findByQuestionIdAndQuiz_QuizId(questionId, quizId)
                .orElseThrow(() -> new AppException(ErrorCode.QUESTION_NOT_FOUND));
    }

    // Kiểm tra tên bộ trắc nghiệm
    private void validateTitle(String title) {
        if (title == null || title.isBlank() || title.trim().length() > 255) {
            throw new AppException(ErrorCode.QUIZ_INVALID_TITLE);
        }
    }

    // Kiểm tra cấu hình bài kiểm tra cuối chương
    private void validateConfig(Integer timeLimit, BigDecimal passingScore) {
        if (timeLimit == null || timeLimit < 1 || timeLimit > 180 ||
                passingScore == null ||
                passingScore.compareTo(BigDecimal.ZERO) < 0 ||
                passingScore.compareTo(BigDecimal.TEN) > 0 ||
                passingScore.stripTrailingZeros().scale() > 2) {
            throw new AppException(ErrorCode.QUIZ_INVALID_CONFIG);
        }
    }

    // Kiểm tra nội dung và phương án trả lời
    private void validateQuestion(QuestionRequest request) {
        if (request.getContent() == null || request.getContent().isBlank() ||
                request.getOptions() == null ||
                request.getOptions().size() < 2 || request.getOptions().size() > 6) {
            throw new AppException(ErrorCode.QUESTION_INVALID);
        }

        Set<String> normalizedOptions = new HashSet<>();

        for (String option : request.getOptions()) {
            if (option == null || option.isBlank()) {
                throw new AppException(ErrorCode.QUESTION_INVALID);
            }

            // Không cho phép phương án trả lời bị trùng
            if (!normalizedOptions.add(option.trim().toLowerCase(Locale.ROOT))) {
                throw new AppException(ErrorCode.QUESTION_DUPLICATE_OPTIONS);
            }
        }

        // Kiểm tra vị trí đáp án đúng
        if (request.getCorrectAnswer() == null ||
                request.getCorrectAnswer() < 0 ||
                request.getCorrectAnswer() >= request.getOptions().size()) {
            throw new AppException(ErrorCode.QUESTION_INVALID_CORRECT_ANSWER);
        }
    }

    // Kiểm tra câu hỏi đã lưu trong database trước khi xuất bản
    private void validateSavedQuestion(Question question) {
        List<Answer> answers = answerRepository
                .findByQuestion_QuestionIdOrderByAnswerIdAsc(question.getQuestionId());

        // Mỗi câu hỏi phải có duy nhất một đáp án đúng
        long correctCount = answers.stream()
                .filter(answer -> Boolean.TRUE.equals(answer.getIsCorrect())).count();

        if (correctCount != 1) {
            throw new AppException(ErrorCode.QUESTION_INVALID_CORRECT_ANSWER);
        }

        List<String> options = new ArrayList<>();
        int correctAnswer = -1;

        for (int i = 0; i < answers.size(); i++) {
            options.add(answers.get(i).getContent());

            if (Boolean.TRUE.equals(answers.get(i).getIsCorrect())) {
                correctAnswer = i;
            }
        }

        // Tái sử dụng hàm kiểm tra dữ liệu câu hỏi
        QuestionRequest request = new QuestionRequest();
        request.setContent(question.getContent());
        request.setOptions(options);
        request.setCorrectAnswer(correctAnswer);
        validateQuestion(request);
    }

    // ==================================================
    // 11. CÁC HÀM LƯU DỮ LIỆU
    // ==================================================

    // Lưu phương án trả lời theo đúng thứ tự từ frontend
    private void saveAnswers(Question question, QuestionRequest request) {
        for (int i = 0; i < request.getOptions().size(); i++) {
            Answer answer = new Answer();
            answer.setQuestion(question);
            answer.setContent(request.getOptions().get(i).trim());
            answer.setIsCorrect(i == request.getCorrectAnswer());

            answerRepository.save(answer);
        }

        answerRepository.flush();
    }

    // Chuẩn hóa nội dung giải thích
    private String normalizeExplanation(String explanation) {
        return explanation == null ? "" : explanation.trim();
    }

    // Cập nhật thời gian chỉnh sửa để sắp xếp danh sách bản nháp
    private void touchQuiz(Quiz quiz) {
        quiz.setUpdatedAt(LocalDateTime.now());
        quizRepository.saveAndFlush(quiz);
    }

    // ==================================================
    // 12. CHUYỂN ENTITY SANG DTO RESPONSE
    // ==================================================

    // Chuyển thông tin bộ trắc nghiệm sang DraftResponse
    private DraftResponse toQuizResponse(Quiz quiz) {
        Lesson lesson = quiz.getLesson();
        Chapter chapter = getQuizChapter(quiz);
        Course course = chapter.getCourse();

        List<DraftQuestionResponse> questions = questionRepository
                .findByQuiz_QuizIdOrderByQuestionIdAsc(quiz.getQuizId())
                .stream().map(this::toQuestionResponse).toList();

        return DraftResponse.builder()
                .quizId(quiz.getQuizId())
                .title(quiz.getTitle())
                .courseId(course.getCourseId())
                .courseName(course.getTitle())
                .chapterId(chapter.getChapterId())
                .chapterTitle(chapter.getTitle())
                .chapterOrder(chapter.getOrderNum())
                .lessonId(lesson != null ? lesson.getLessonId() : null)
                .lessonTitle(lesson != null ? lesson.getTitle() : null)
                .lessonOrder(lesson != null ? lesson.getOrderNum() : null)
                .questionCount((long) questions.size())
                .timeLimit(lesson == null ? quiz.getTimeLimit() : null)
                .passingScore(lesson == null ? quiz.getPassingScore() : null)
                .status(quiz.getStatus().name())
                .questions(questions)
                .build();
    }

    // Chuyển câu hỏi và phương án trả lời sang DTO
    private DraftQuestionResponse toQuestionResponse(Question question) {
        List<Answer> answers = answerRepository
                .findByQuestion_QuestionIdOrderByAnswerIdAsc(question.getQuestionId());

        List<String> options = new ArrayList<>();
        int correctAnswer = -1;

        for (int i = 0; i < answers.size(); i++) {
            options.add(answers.get(i).getContent());

            if (Boolean.TRUE.equals(answers.get(i).getIsCorrect())) {
                correctAnswer = i;
            }
        }

        return DraftQuestionResponse.builder()
                .id(question.getQuestionId())
                .content(question.getContent())
                .options(options)
                .correctAnswer(correctAnswer)
                .explanation(normalizeExplanation(question.getExplanation()))
                .build();
    }
}