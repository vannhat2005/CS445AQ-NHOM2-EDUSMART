package com.example.back_end.service.impl;

import com.example.back_end.dto.response.DraftResponse;
import com.example.back_end.dto.response.DraftQuestionResponse;
import com.example.back_end.entity.*;
import com.example.back_end.enumType.QuizStatus;
import com.example.back_end.exception.AppException;
import com.example.back_end.exception.ErrorCode;
import com.example.back_end.repository.*;
import com.example.back_end.service.InstructorDraftService;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class InstructorDraftServiceImpl implements InstructorDraftService {

    private final InstructorDraftRepository instructorDraftRepository; // Quản lý bài trắc nghiệm
    private final InstructorQuestionRepository instructorQuestionRepository; // Quản lý câu hỏi
    private final InstructorAnswerRepository instructorAnswerRepository; // Quản lý phương án trả lời
    private final InstructorQuizResultRepository instructorQuizResultRepository; // Kiểm tra kết quả làm bài

    // ==================================================
    // 1. LẤY DANH SÁCH BẢN NHÁP
    // ==================================================
    @Override
    public List<DraftResponse> getDrafts(Integer instructorId) {
        // Bước 1: Kiểm tra quyền truy cập của giảng viên
        validateInstructor(instructorId);

        // Bước 2: Lấy danh sách bài trắc nghiệm có trạng thái Draft
        List<Quiz> drafts = instructorDraftRepository.findDraftsByInstructorId(instructorId, QuizStatus.Draft);

        // Bước 3: Trả về danh sách rỗng nếu giảng viên chưa có bản nháp
        if (drafts.isEmpty()) return List.of();

        // Bước 4: Lấy danh sách ID của tất cả bản nháp
        List<Integer> quizIds = drafts.stream().map(Quiz::getQuizId).toList();

        // Bước 5: Đếm số lượng câu hỏi của tất cả bản nháp trong một truy vấn
        Map<Integer, Long> questionCounts = instructorQuestionRepository.countQuestionsByQuizIds(quizIds)
                .stream().collect(Collectors.toMap(
                        InstructorQuestionRepository.QuestionStatistic::getQuizId,
                        InstructorQuestionRepository.QuestionStatistic::getQuestionCount));

        // Bước 6: Chuyển đổi Entity sang DTO, không lấy nội dung câu hỏi ở trang danh sách
        return drafts.stream().map(quiz -> toDraftResponse(quiz,
                questionCounts.getOrDefault(quiz.getQuizId(), 0L), null)).toList();
    }

    // ==================================================
    // 2. XEM CHI TIẾT BẢN NHÁP
    // ==================================================
    @Override
    public DraftResponse getDraftDetail(Integer instructorId, Integer quizId) {
        // Bước 1: Kiểm tra quyền truy cập của giảng viên
        validateInstructor(instructorId);

        // Bước 2: Kiểm tra bài trắc nghiệm tồn tại và thuộc giảng viên
        Quiz quiz = instructorDraftRepository.findOwnedQuiz(instructorId, quizId)
                .orElseThrow(() -> new AppException(ErrorCode.QUIZ_NOT_FOUND));

        // Bước 3: Kiểm tra bài trắc nghiệm vẫn đang ở trạng thái Draft
        validateDraftStatus(quiz);

        // Bước 4: Lấy danh sách câu hỏi và phương án trả lời
        List<DraftQuestionResponse> questions = getDraftQuestions(quizId);

        // Bước 5: Trả về thông tin chi tiết để xem hoặc tiếp tục chỉnh sửa
        return toDraftResponse(quiz, questions.size(), questions);
    }

    // ==================================================
    // 3. XÓA BẢN NHÁP
    // ==================================================
    @Override
    @Transactional
    public void deleteDraft(Integer instructorId, Integer quizId) {
        // Bước 1: Kiểm tra quyền truy cập của giảng viên
        validateInstructor(instructorId);

        // Bước 2: Khóa bài trắc nghiệm để tránh xung đột khi thực hiện xóa
        Quiz quiz = instructorDraftRepository.findByIdForUpdate(quizId)
                .orElseThrow(() -> new AppException(ErrorCode.QUIZ_NOT_FOUND));

        // Bước 3: Kiểm tra bài trắc nghiệm thuộc quyền sở hữu của giảng viên
        validateQuizOwnership(quiz, instructorId);

        // Bước 4: Chỉ cho phép xóa bài trắc nghiệm ở trạng thái Draft
        validateDraftStatus(quiz);

        // Bước 5: Không cho phép xóa nếu đã có kết quả làm bài của sinh viên
        if (instructorQuizResultRepository.existsByQuiz_QuizId(quizId)) {
            throw new AppException(ErrorCode.QUIZ_HAS_RESULTS);
        }

        try {
            // Bước 6: Xóa toàn bộ phương án trả lời trước
            instructorAnswerRepository.deleteAnswersByQuizId(quizId);

            // Bước 7: Xóa toàn bộ câu hỏi sau khi đã xóa phương án trả lời
            instructorQuestionRepository.deleteQuestionsByQuizId(quizId);

            // Bước 8: Xóa bài trắc nghiệm bản nháp
            instructorDraftRepository.delete(quiz);

            // Bước 9: Thực thi thao tác xóa để kiểm tra ràng buộc khóa ngoại
            instructorDraftRepository.flush();
        } catch (DataIntegrityViolationException exception) {
            // Nếu còn dữ liệu tham chiếu thì báo lỗi và rollback toàn bộ giao dịch
            throw new AppException(ErrorCode.QUIZ_DELETE_CONFLICT);
        }
    }

    // ==================================================
    // 4. KIỂM TRA QUYỀN TRUY CẬP
    // ==================================================

    // Kiểm tra tài khoản đang đăng nhập có đúng là giảng viên thực hiện yêu cầu
    private void validateInstructor(Integer instructorId) {
        // Bước 1: Lấy thông tin xác thực từ Spring Security
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        // Bước 2: Kiểm tra người dùng đã đăng nhập hay chưa
        if (authentication == null || !authentication.isAuthenticated()
                || authentication instanceof AnonymousAuthenticationToken) {
            throw new AppException(ErrorCode.QUIZ_ACCESS_DENIED);
        }

        // Bước 3: Tìm tài khoản đang đăng nhập thông qua username
        User user = instructorDraftRepository.findUserByUsername(authentication.getName())
                .orElseThrow(() -> new AppException(ErrorCode.QUIZ_ACCESS_DENIED));

        // Bước 4: Không cho phép sử dụng ID của tài khoản khác
        if (!Objects.equals(user.getUserId(), instructorId)) {
            throw new AppException(ErrorCode.QUIZ_ACCESS_DENIED);
        }

        // Bước 5: Chỉ cho phép tài khoản có vai trò Instructor
        if (user.getRole() == null || !"Instructor".equalsIgnoreCase(user.getRole().getRoleName())) {
            throw new AppException(ErrorCode.QUIZ_ACCESS_DENIED);
        }
    }

    // Kiểm tra bài trắc nghiệm thuộc khóa học của giảng viên
    private void validateQuizOwnership(Quiz quiz, Integer instructorId) {
        Chapter chapter = getQuizChapter(quiz);

        // Kiểm tra chương học, khóa học và giảng viên sở hữu
        if (chapter == null || chapter.getCourse() == null
                || chapter.getCourse().getInstructor() == null
                || !Objects.equals(chapter.getCourse().getInstructor().getUserId(), instructorId)) {
            throw new AppException(ErrorCode.QUIZ_NOT_FOUND);
        }
    }

    // Kiểm tra trạng thái bài trắc nghiệm
    private void validateDraftStatus(Quiz quiz) {
        if (quiz.getStatus() != QuizStatus.Draft) {
            throw new AppException(ErrorCode.QUIZ_NOT_DRAFT);
        }
    }

    // Xác định chương học của bài trắc nghiệm
    private Chapter getQuizChapter(Quiz quiz) {
        // Trắc nghiệm bài học lấy chương thông qua Lesson
        // Kiểm tra cuối chương lấy trực tiếp Chapter
        return quiz.getLesson() != null ? quiz.getLesson().getChapter() : quiz.getChapter();
    }

    // ==================================================
    // 5. CHUYỂN ĐỔI QUIZ ENTITY SANG DTO
    // ==================================================

    // Chuyển thông tin bài trắc nghiệm sang DraftResponse
    private DraftResponse toDraftResponse(Quiz quiz, long questionCount, List<DraftQuestionResponse> questions) {
        // Bước 1: Xác định bài học, chương học và khóa học
        Lesson lesson = quiz.getLesson();
        Chapter chapter = getQuizChapter(quiz);
        Course course = chapter.getCourse();

        // Bước 2: Chuyển đổi thông tin sang DTO tương thích với Frontend
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
                .questionCount(questionCount)
                .timeLimit(lesson == null ? quiz.getTimeLimit() : null)
                .passingScore(lesson == null ? quiz.getPassingScore() : null)
                .status(quiz.getStatus().name())
                .questions(questions)
                .build();
    }

    // ==================================================
    // 6. LẤY DANH SÁCH CÂU HỎI VÀ PHƯƠNG ÁN TRẢ LỜI
    // ==================================================

    // Lấy toàn bộ câu hỏi của bài trắc nghiệm
    private List<DraftQuestionResponse> getDraftQuestions(Integer quizId) {
        // Bước 1: Lấy danh sách câu hỏi thuộc bài trắc nghiệm
        List<Question> questions = instructorQuestionRepository.findByQuiz_QuizIdOrderByQuestionIdAsc(quizId);

        // Bước 2: Trả về danh sách rỗng nếu bản nháp chưa có câu hỏi
        if (questions.isEmpty()) return List.of();

        // Bước 3: Lấy toàn bộ phương án trả lời trong một truy vấn
        List<Answer> answers = instructorAnswerRepository.findAnswersByQuizId(quizId);

        // Bước 4: Gom nhóm phương án trả lời theo ID câu hỏi
        Map<Integer, List<Answer>> answerMap = answers.stream()
                .collect(Collectors.groupingBy(answer -> answer.getQuestion().getQuestionId()));

        // Bước 5: Chuyển đổi từng câu hỏi sang DTO
        return questions.stream().map(question -> toQuestionResponse(question,
                answerMap.getOrDefault(question.getQuestionId(), List.of()))).toList();
    }

    // Chuyển đổi câu hỏi và phương án trả lời sang cấu trúc của QuizEditor
    private DraftQuestionResponse toQuestionResponse(Question question, List<Answer> answers) {
        List<String> options = new ArrayList<>(); // Danh sách phương án trả lời
        int correctAnswer = -1; // Chưa xác định phương án đúng

        // Bước 1: Duyệt danh sách phương án trả lời
        for (int i = 0; i < answers.size(); i++) {
            Answer answer = answers.get(i);

            // Thêm nội dung phương án trả lời vào danh sách
            options.add(answer.getContent());

            // Xác định vị trí phương án trả lời đúng
            if (Boolean.TRUE.equals(answer.getIsCorrect())) {
                correctAnswer = i;
            }
        }

        // Bước 2: Trả về thông tin câu hỏi tương thích với Frontend
        return DraftQuestionResponse.builder()
                .id(question.getQuestionId())
                .content(question.getContent())
                .options(options)
                .correctAnswer(correctAnswer)
                .explanation(question.getExplanation() != null ? question.getExplanation() : "")
                .build();
    }
}