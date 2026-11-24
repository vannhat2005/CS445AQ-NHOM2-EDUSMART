package com.example.back_end.service.impl;

import com.example.back_end.dto.request.StudentQuizSubmitRequest;
import com.example.back_end.dto.response.StudentQuizDetailResponse;
import com.example.back_end.dto.response.StudentQuizSubmitResponse;
import com.example.back_end.entity.*;
import com.example.back_end.enumType.QuizStatus;
import com.example.back_end.enumType.ResultStatus;
import com.example.back_end.repository.*;
import com.example.back_end.service.StudentQuizService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class StudentQuizServiceImpl implements StudentQuizService {

    private final QuizRepository quizRepository;
    private final QuestionRepository questionRepository;
    private final AnswerRepository answerRepository;
    private final QuizResultRepository quizResultRepository;
    private final StudentAnswerRepository studentAnswerRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional
    public StudentQuizDetailResponse getQuizDetail(Integer quizId) {
        if (quizId == null || quizId <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "ID bài kiểm tra không hợp lệ");
        }

        User user = getCurrentAuthenticatedUser();

        Quiz quiz = quizRepository.findById(quizId).orElse(null);
        if (quiz == null) {
            // Nếu chưa có trong DB, tạo quiz mẫu để học viên trải nghiệm
            quiz = new Quiz();
            quiz.setTitle("Bài kiểm tra: Kiến trúc Spring Boot & Microservices");
            quiz.setTimeLimit(45);
            quiz.setStatus(QuizStatus.Published);
            quiz = quizRepository.save(quiz);
        }

        // Lấy danh sách câu hỏi
        List<Question> questions = questionRepository.findByQuiz_QuizIdOrderByQuestionIdAsc(quiz.getQuizId());
        if (questions.isEmpty()) {
            // Tự động khởi tạo bộ câu hỏi chuẩn Microservices Spring Boot
            questions = seedDefaultQuestions(quiz);
        }

        // Chuyển sang DTO
        List<StudentQuizDetailResponse.QuestionItem> questionItems = new ArrayList<>();
        int questionNumber = 1;

        for (Question q : questions) {
            List<Answer> answers = answerRepository.findByQuestion_QuestionIdOrderByAnswerIdAsc(q.getQuestionId());
            List<StudentQuizDetailResponse.OptionItem> optionItems = new ArrayList<>();
            String[] labels = {"A", "B", "C", "D", "E", "F"};

            for (int i = 0; i < answers.size(); i++) {
                Answer a = answers.get(i);
                String label = i < labels.length ? labels[i] : String.valueOf((char) ('A' + i));
                
                String rawContent = a.getContent() != null ? a.getContent() : "";
                String title = rawContent;
                String desc = "";

                if (rawContent.contains("||")) {
                    String[] parts = rawContent.split("\\|\\|", 2);
                    title = parts[0].trim();
                    desc = parts.length > 1 ? parts[1].trim() : "";
                }

                optionItems.add(StudentQuizDetailResponse.OptionItem.builder()
                        .answerId(a.getAnswerId())
                        .label(label)
                        .title(title)
                        .description(desc)
                        .build());
            }

            // Phân tách code snippet nếu có
            String content = q.getContent();
            String codeSnippet = null;
            String codeLanguage = "YAML";

            if (content != null && content.contains("```")) {
                int firstIdx = content.indexOf("```");
                int secondIdx = content.indexOf("```", firstIdx + 3);
                if (secondIdx > firstIdx) {
                    String fullBlock = content.substring(firstIdx + 3, secondIdx);
                    content = (content.substring(0, firstIdx) + content.substring(secondIdx + 3)).trim();

                    int nl = fullBlock.indexOf('\n');
                    if (nl > 0) {
                        codeLanguage = fullBlock.substring(0, nl).trim();
                        codeSnippet = fullBlock.substring(nl + 1).trim();
                    } else {
                        codeSnippet = fullBlock.trim();
                    }
                }
            }

            questionItems.add(StudentQuizDetailResponse.QuestionItem.builder()
                    .questionId(q.getQuestionId())
                    .questionNumber(questionNumber++)
                    .content(content)
                    .codeSnippet(codeSnippet)
                    .codeLanguage(codeLanguage)
                    .points(BigDecimal.valueOf(1.0))
                    .explanation(q.getExplanation())
                    .options(optionItems)
                    .build());
        }

        // Thông tin khóa học và chương
        String courseTitle = "Làm chủ Spring Boot 3 & Hệ sinh thái Microservices 2025";
        Integer courseId = null;
        String chapterTitle = "Chương 2: Kiến trúc & Điều phối Microservices";
        Integer chapterId = null;
        String lessonTitle = "Kiến trúc Spring Cloud Gateway & Service Discovery";
        Integer lessonId = null;

        if (quiz.getLesson() != null) {
            Lesson l = quiz.getLesson();
            lessonId = l.getLessonId();
            lessonTitle = l.getTitle();
            if (l.getChapter() != null) {
                Chapter ch = l.getChapter();
                chapterId = ch.getChapterId();
                chapterTitle = ch.getTitle();
                if (ch.getCourse() != null) {
                    Course c = ch.getCourse();
                    courseId = c.getCourseId();
                    courseTitle = c.getTitle();
                }
            }
        } else if (quiz.getChapter() != null) {
            Chapter ch = quiz.getChapter();
            chapterId = ch.getChapterId();
            chapterTitle = ch.getTitle();
            if (ch.getCourse() != null) {
                Course c = ch.getCourse();
                courseId = c.getCourseId();
                courseTitle = c.getTitle();
            }
        }

        // Xác định loại bài kiểm tra:
        // - Bài thường ("quizzi"): gắn với Lesson (lessonId != null), KHÔNG tính thời gian (isTimed = false)
        // - Bài kiểm tra cuối chương: gắn với Chapter (lessonId == null), CÓ tính thời gian (isTimed = true)
        boolean isTimed = (lessonId == null);
        if (quiz.getTimeLimit() != null && quiz.getTimeLimit() <= 0) {
            isTimed = false;
        }

        return StudentQuizDetailResponse.builder()
                .quizId(quiz.getQuizId())
                .title(quiz.getTitle() != null ? quiz.getTitle() : "Bài kiểm tra cuối khóa: Lập trình Spring Boot")
                .courseId(courseId)
                .courseTitle(courseTitle)
                .chapterId(chapterId)
                .chapterTitle(chapterTitle)
                .lessonId(lessonId)
                .lessonTitle(lessonTitle)
                .isTimed(isTimed)
                .timeLimit(isTimed ? (quiz.getTimeLimit() != null && quiz.getTimeLimit() > 0 ? quiz.getTimeLimit() : 45) : null)
                .totalQuestions(questionItems.size())
                .passPercentage(70)
                .questions(questionItems)
                .build();
    }

    @Override
    @Transactional
    public StudentQuizSubmitResponse submitQuiz(Integer quizId, StudentQuizSubmitRequest request) {
        if (quizId == null || quizId <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "ID bài kiểm tra không hợp lệ");
        }

        User user = getCurrentAuthenticatedUser();

        Quiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy bài kiểm tra"));

        List<Question> questions = questionRepository.findByQuiz_QuizIdOrderByQuestionIdAsc(quizId);
        if (questions.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Bài kiểm tra chưa có câu hỏi để chấm");
        }

        // Tổng hợp câu trả lời từ request (hỗ trợ cả map answers và list selectedAnswers)
        Map<Integer, Integer> studentSelections = new HashMap<>();
        if (request != null && request.getAnswers() != null) {
            studentSelections.putAll(request.getAnswers());
        }
        if (request != null && request.getSelectedAnswers() != null) {
            for (var item : request.getSelectedAnswers()) {
                if (item.getQuestionId() != null) {
                    studentSelections.put(item.getQuestionId(), item.getAnswerId());
                }
            }
        }

        int totalQuestions = questions.size();
        int correctCount = 0;
        int unansweredCount = 0;

        List<StudentQuizSubmitResponse.QuestionFeedback> feedbacks = new ArrayList<>();
        List<Answer> allAnswers = answerRepository.findByQuestion_Quiz_QuizIdOrderByAnswerIdAsc(quizId);
        
        Map<Integer, List<Answer>> answersByQuestion = new HashMap<>();
        for (Answer a : allAnswers) {
            if (a.getQuestion() != null) {
                answersByQuestion.computeIfAbsent(a.getQuestion().getQuestionId(), k -> new ArrayList<>()).add(a);
            }
        }

        for (Question q : questions) {
            Integer selectedAnswerId = studentSelections.get(q.getQuestionId());
            List<Answer> qAnswers = answersByQuestion.getOrDefault(q.getQuestionId(), Collections.emptyList());

            Integer correctAnswerId = null;
            for (Answer a : qAnswers) {
                if (Boolean.TRUE.equals(a.getIsCorrect())) {
                    correctAnswerId = a.getAnswerId();
                    break;
                }
            }

            boolean isCorrect = false;
            if (selectedAnswerId == null) {
                unansweredCount++;
            } else if (correctAnswerId != null && correctAnswerId.equals(selectedAnswerId)) {
                isCorrect = true;
                correctCount++;
            }

            feedbacks.add(StudentQuizSubmitResponse.QuestionFeedback.builder()
                    .questionId(q.getQuestionId())
                    .selectedAnswerId(selectedAnswerId)
                    .correctAnswerId(correctAnswerId)
                    .isCorrect(isCorrect)
                    .explanation(q.getExplanation())
                    .build());
        }

        int incorrectCount = totalQuestions - correctCount - unansweredCount;

        // Tính điểm trên thang 10.0
        BigDecimal score = BigDecimal.valueOf(correctCount)
                .multiply(BigDecimal.valueOf(10.0))
                .divide(BigDecimal.valueOf(totalQuestions), 2, RoundingMode.HALF_UP);

        BigDecimal percentage = BigDecimal.valueOf(correctCount)
                .multiply(BigDecimal.valueOf(100.0))
                .divide(BigDecimal.valueOf(totalQuestions), 1, RoundingMode.HALF_UP);

        boolean passed = percentage.compareTo(BigDecimal.valueOf(70.0)) >= 0;

        // Lưu kết quả vào QuizResults
        QuizResult result = new QuizResult();
        result.setQuiz(quiz);
        result.setStudent(user);
        result.setScore(score);
        result.setStatus(passed ? ResultStatus.Pass : ResultStatus.Fail);
        result.setAttemptNumber(1);
        result.setSubmittedAt(LocalDateTime.now());
        result = quizResultRepository.save(result);

        // Lưu chi tiết câu trả lời vào StudentAnswers
        for (Question q : questions) {
            Integer selectedAnswerId = studentSelections.get(q.getQuestionId());
            Answer selectedAnswer = null;
            if (selectedAnswerId != null) {
                selectedAnswer = answerRepository.findById(selectedAnswerId).orElse(null);
            }

            StudentAnswer studentAnswer = new StudentAnswer();
            studentAnswer.setResult(result);
            studentAnswer.setQuestion(q);
            studentAnswer.setSelectedAnswer(selectedAnswer);
            studentAnswer.setIsCorrect(selectedAnswer != null && Boolean.TRUE.equals(selectedAnswer.getIsCorrect()));
            studentAnswerRepository.save(studentAnswer);
        }

        String message = passed
                ? "Chúc mừng bạn đã hoàn thành xuất sắc bài kiểm tra với kết quả ĐẠT!"
                : "Bạn chưa đạt điểm tối thiểu 70%. Hãy ôn tập kỹ nội dung và thử lại nhé!";

        // Thông tin khóa học và chương
        String courseTitle = "Làm chủ Spring Boot 3 & Hệ sinh thái Microservices 2025";
        Integer courseId = null;
        String chapterTitle = "Chương 2: Kiến trúc & Điều phối Microservices";
        Integer chapterId = null;
        String lessonTitle = "Kiến trúc Spring Cloud Gateway & Service Discovery";
        Integer lessonId = null;

        if (quiz.getLesson() != null) {
            Lesson l = quiz.getLesson();
            lessonId = l.getLessonId();
            lessonTitle = l.getTitle();
            if (l.getChapter() != null) {
                Chapter ch = l.getChapter();
                chapterId = ch.getChapterId();
                chapterTitle = ch.getTitle();
                if (ch.getCourse() != null) {
                    Course c = ch.getCourse();
                    courseId = c.getCourseId();
                    courseTitle = c.getTitle();
                }
            }
        } else if (quiz.getChapter() != null) {
            Chapter ch = quiz.getChapter();
            chapterId = ch.getChapterId();
            chapterTitle = ch.getTitle();
            if (ch.getCourse() != null) {
                Course c = ch.getCourse();
                courseId = c.getCourseId();
                courseTitle = c.getTitle();
            }
        }

        boolean isTimed = (lessonId == null);
        if (quiz.getTimeLimit() != null && quiz.getTimeLimit() <= 0) {
            isTimed = false;
        }

        Integer timeSpent = request != null ? request.getTimeSpentSeconds() : null;

        return StudentQuizSubmitResponse.builder()
                .resultId(result.getResultId())
                .quizId(quizId)
                .quizTitle(quiz.getTitle() != null ? quiz.getTitle() : "Bài kiểm tra cuối khóa: Lập trình Spring Boot")
                .courseId(courseId)
                .courseTitle(courseTitle)
                .chapterId(chapterId)
                .chapterTitle(chapterTitle)
                .lessonId(lessonId)
                .lessonTitle(lessonTitle)
                .isTimed(isTimed)
                .timeLimit(isTimed ? (quiz.getTimeLimit() != null && quiz.getTimeLimit() > 0 ? quiz.getTimeLimit() : 45) : null)
                .timeSpentSeconds(timeSpent)
                .score(score)
                .totalQuestions(totalQuestions)
                .correctCount(correctCount)
                .incorrectCount(incorrectCount)
                .unansweredCount(unansweredCount)
                .passed(passed)
                .percentage(percentage)
                .message(message)
                .submittedAt(LocalDateTime.now())
                .feedback(feedbacks)
                .build();
    }

    private User getCurrentAuthenticatedUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated() || "anonymousUser".equals(authentication.getPrincipal())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Vui lòng đăng nhập");
        }
        return userRepository.findByUsername(authentication.getName())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Không tìm thấy học viên"));
    }

    /**
     * Khởi tạo bộ câu hỏi 20 câu chuẩn Spring Boot & Microservices
     */
    private List<Question> seedDefaultQuestions(Quiz quiz) {
        log.info("Seeding 20 realistic questions for quiz ID: {}", quiz.getQuizId());
        List<Question> questions = new ArrayList<>();

        Object[][] seedData = getPredefinedQuestions();

        for (int i = 0; i < seedData.length; i++) {
            Object[] item = seedData[i];
            String questionText = (String) item[0];
            String explanation = (String) item[1];
            String[][] options = (String[][]) item[2];
            int correctIndex = (int) item[3];

            Question q = new Question();
            q.setQuiz(quiz);
            q.setContent(questionText);
            q.setExplanation(explanation);
            q.setIsAiGenerated(false);
            q.setStatus(QuizStatus.Published);
            q = questionRepository.save(q);

            for (int optIdx = 0; optIdx < options.length; optIdx++) {
                Answer a = new Answer();
                a.setQuestion(q);
                // format: title || description
                a.setContent(options[optIdx][0] + " || " + options[optIdx][1]);
                a.setIsCorrect(optIdx == correctIndex);
                answerRepository.save(a);
            }

            questions.add(q);
        }

        return questions;
    }

    private Object[][] getPredefinedQuestions() {
        return new Object[][] {
            // Câu 1
            {
                "Trong Spring Boot 3, phiên bản Java tối thiểu được hỗ trợ chính thức là phiên bản nào?",
                "Spring Boot 3 yêu cầu Spring Framework 6 và baseline là Java 17 trở lên.",
                new String[][] {
                    {"Java 8", "Phiên bản cũ đã ngừng hỗ trợ trong Spring Framework 6."},
                    {"Java 11", "Phiên bản LTS trước đây nhưng không còn là baseline của Spring Boot 3."},
                    {"Java 17", "Phiên bản LTS hiện đại là yêu cầu tối thiểu (baseline) cho toàn bộ Spring Boot 3."},
                    {"Java 21", "Phiên bản mới nhất có Virtual Threads nhưng không phải yêu cầu tối thiểu."}
                },
                2
            },
            // Câu 2
            {
                "Annotation nào trong Spring Boot được sử dụng để tự động cấu hình và kích hoạt chức năng quét component (component scanning) và cấu hình Spring?",
                "@SpringBootApplication là tổ hợp của @Configuration, @EnableAutoConfiguration và @ComponentScan.",
                new String[][] {
                    {"@SpringBootApplication", "Annotation tiện ích cốt lõi bao gồm cấu hình, quét component và tự động thiết lập."},
                    {"@EnableAutoConfiguration", "Chỉ bật cơ chế cấu hình tự động nhưng không quét component."},
                    {"@ComponentScan", "Chỉ thực hiện quét các @Component, @Service, @Repository."},
                    {"@Configuration", "Đánh dấu class là nguồn định nghĩa Spring Bean đơn thuần."}
                },
                0
            },
            // Câu 3
            {
                "Trong kiến trúc Microservices, mẫu thiết kế nào giúp phân tán các transaction giữa nhiều service mà vẫn đảm bảo tính nhất quán cuối cùng (eventual consistency)?",
                "Saga Pattern thay thế 2PC (Two-Phase Commit) trong kiến trúc phân tán.",
                new String[][] {
                    {"Two-Phase Commit (2PC)", "Giao thức khóa đồng bộ dễ gây tắc nghẽn mạng trong môi trường microservices."},
                    {"Saga Pattern", "Điều phối chuỗi transaction cục bộ bằng Choreography hoặc Orchestration kèm cơ chế bù trừ (compensating)."},
                    {"CQRS Pattern", "Tách biệt luồng đọc và ghi dữ liệu, không xử lý phân tán transaction."},
                    {"Event Sourcing", "Lưu trữ trạng thái dưới dạng chuỗi sự kiện, hỗ trợ Saga nhưng không phải mẫu quản lý transaction."}
                },
                1
            },
            // Câu 4
            {
                "Công cụ nào trong hệ sinh thái Spring Cloud thường được dùng để quản lý cấu hình tập trung từ Git repository cho tất cả các microservices?",
                "Spring Cloud Config Server cung cấp REST API để các service client lấy cấu hình khi khởi động.",
                new String[][] {
                    {"Spring Cloud Bus", "Truyền tải sự kiện làm mới cấu hình qua message broker."},
                    {"Spring Cloud Config Server", "Máy chủ lưu trữ và phân phối cấu hình tập trung theo môi trường (dev, test, prod)."},
                    {"Spring Cloud Eureka", "Đảm nhiệm vai trò Service Registry chứ không quản lý cấu hình."},
                    {"Spring Cloud OpenFeign", "Thư viện declarative REST client cho giao tiếp nội bộ."}
                },
                1
            },
            // Câu 5 - CÂU MẪU CHÍNH XÁC TRONG ĐỀ CỦA NGƯỜI DÙNG
            {
                "Trong kiến trúc Microservices, thành phần nào thường được sử dụng để định tuyến (route) các request từ client đến đúng service tương ứng, đồng thời xử lý các tác vụ cross-cutting như xác thực (Authentication), giới hạn tần suất (Rate Limiting) và ghi log tập trung?\n\n```yaml\nspring:\n  cloud:\n    gateway:\n      routes:\n        - id: user-service\n          uri: lb://USER-SERVICE\n          predicates:\n            - Path=/api/v1/users/**\n          filters:\n            - AuthenticationFilter\n            - RequestRateLimiter=10/s\n```",
                "API Gateway là điểm tiếp nhận tập trung (Single Entry Point) cho mọi client gọi vào cụm microservices.",
                new String[][] {
                    {"Service Registry (Eureka / Consul)", "Nơi đăng ký và khám phá danh sách các instance đang hoạt động của từng microservice trong cụm mạng nội bộ."},
                    {"API Gateway (Spring Cloud Gateway / Zuul)", "Điểm tiếp nhận request tập trung duy nhất từ client, chịu trách nhiệm định tuyến thông minh, áp dụng bộ lọc xác thực và giới hạn tốc độ truy cập."},
                    {"Config Server (Spring Cloud Config)", "Quản lý tập trung các tệp tin cấu hình môi trường bên ngoài từ Git/Vault cho toàn bộ hệ thống microservices."},
                    {"Message Broker (Apache Kafka / RabbitMQ)", "Hạ tầng phân phối và xử lý truyền tải thông điệp theo mô hình publish/subscribe bất đồng bộ giữa các service."}
                },
                1
            },
            // Câu 6
            {
                "Thư viện nào hiện nay thay thế Netflix Hystrix để triển khai Circuit Breaker và Rate Limiting trong Spring Cloud?",
                "Resilience4j là chuẩn Circuit Breaker được khuyến nghị bởi Spring Cloud.",
                new String[][] {
                    {"Netflix Hystrix", "Đã ngừng phát triển (Maintenance Mode) từ lâu."},
                    {"Resilience4j", "Thư viện gọn nhẹ, hiện đại dựa trên functional programming dành cho Java 8+."},
                    {"Spring Retry", "Hỗ trợ thử lại đơn giản nhưng thiếu trạng thái Circuit Breaker hoàn chỉnh."},
                    {"Sentinel", "Giải pháp bảo vệ lưu lượng của Alibaba nhưng Resilience4j là chuẩn mặc định của Spring Cloud."}
                },
                1
            },
            // Câu 7
            {
                "Để giao tiếp HTTP đồng bộ giữa các Microservices theo cách khai báo (declarative) mà không cần viết code RestTemplate thủ công, Spring Cloud cung cấp giải pháp nào?",
                "Spring Cloud OpenFeign cho phép định nghĩa interface với Spring MVC annotations.",
                new String[][] {
                    {"Spring Cloud OpenFeign", "Tạo HTTP client tự động từ interface kèm tích hợp sẵn Load Balancer."},
                    {"RestTemplate", "Client HTTP cổ điển yêu cầu cấu hình thủ công nhiều chi tiết."},
                    {"WebClient", "Reactive client bất đồng bộ nhưng không có cú pháp khai báo interface như Feign."},
                    {"Apache HttpClient", "Thư viện cấp thấp không tích hợp tự động với Spring Cloud Discovery."}
                },
                0
            },
            // Câu 8
            {
                "Trong Spring Security, filter nào chịu trách nhiệm đọc và giải mã JWT token từ Authorization Header để xác thực người dùng?",
                "Một custom OncePerRequestFilter thường được đặt trước UsernamePasswordAuthenticationFilter.",
                new String[][] {
                    {"BasicAuthenticationFilter", "Chỉ xử lý xác thực Basic Auth qua username/password mã hóa Base64."},
                    {"JwtAuthenticationFilter (OncePerRequestFilter)", "Trích xuất token Bearer, giải mã chữ ký và nạp SecurityContextHolder cho mỗi request."},
                    {"CsrfFilter", "Bảo vệ chống tấn công CSRF, thường tắt khi dùng kiến trúc stateless JWT."},
                    {"AnonymousAuthenticationFilter", "Cung cấp đối tượng xác thực ẩn danh khi người dùng chưa đăng nhập."}
                },
                1
            },
            // Câu 9
            {
                "Khi triển khai Service Discovery với Netflix Eureka, cơ chế nào giúp Eureka Server phát hiện một instance service đã bị chết hoặc mất kết nối mạng?",
                "Cơ chế Heartbeat (nhịp đập) định kỳ từ client gửi lên Eureka Server.",
                new String[][] {
                    {"Long Polling", "Duy trì kết nối mở để chờ dữ liệu mới."},
                    {"Heartbeat / Renewal", "Client định kỳ (mặc định mỗi 30s) gửi tín hiệu gia hạn thuê bao (renewal) lên Server."},
                    {"Websocket Streaming", "Kênh hai chiều liên tục không phải giao thức mặc định của Eureka."},
                    {"Database Polling", "Eureka không sử dụng database quan hệ trung gian để kiểm tra tình trạng sống."}
                },
                1
            },
            // Câu 10
            {
                "Mục đích chính của cơ chế Client-Side Load Balancing (như Spring Cloud LoadBalancer) là gì?",
                "Client tự phân phối tải dựa trên danh sách instance nhận được từ Service Registry.",
                new String[][] {
                    {"Giảm bớt phần cứng Gateway và tự động cân bằng tải cục bộ từ phía client gọi", "Client truy vấn danh sách instance từ Registry rồi chọn đích gọi theo thuật toán Round Robin."},
                    {"Thay thế hoàn toàn tường lửa mạng của máy chủ", "Không liên quan đến bảo mật tường lửa hạ tầng."},
                    {"Đồng bộ hóa cache cơ sở dữ liệu", "Load balancer chỉ điều hướng lưu lượng mạng HTTP/gRPC."},
                    {"Mã hóa toàn bộ dữ liệu lưu trữ tại ổ cứng", "Không phải nhiệm vụ của giải pháp load balancing."}
                },
                0
            },
            // Câu 11
            {
                "Annotation nào trong JPA được dùng để chỉ định mối quan hệ 1-Nhiều và khuyến nghị sử dụng FetchType.LAZY để tránh lỗi hiệu năng N+1?",
                "@OneToMany(fetch = FetchType.LAZY)",
                new String[][] {
                    {"@OneToMany(fetch = FetchType.LAZY)", "Ánh xạ 1-Nhiều và chỉ tải danh sách con khi thực sự được truy cập."},
                    {"@ManyToOne(fetch = FetchType.EAGER)", "Ánh xạ Nhiều-1 mặc định tải ngay lập tức."},
                    {"@ManyToMany", "Ánh xạ quan hệ nhiều-nhiều qua bảng trung gian."},
                    {"@OneToOne", "Ánh xạ quan hệ một-một."}
                },
                0
            },
            // Câu 12
            {
                "Trong Spring Data JPA, từ khóa nào trong tên phương thức Repository sẽ tự động sinh câu truy vấn sắp xếp theo thứ tự giảm dần?",
                "OrderBy...Desc",
                new String[][] {
                    {"SortDescendingBy", "Không phải cú pháp chuẩn của Spring Data JPA derived query."},
                    {"OrderBy...Desc", "Quy ước chuẩn của Spring Data JPA, ví dụ: findByStatusOrderByCreatedAtDesc."},
                    {"WithDescendingOrder", "Cú pháp không hợp lệ."},
                    {"ArrangeDescBy", "Không được hỗ trợ."}
                },
                1
            },
            // Câu 13
            {
                "Khi một Microservice cần gửi sự kiện thông báo cho nhiều service khác mà không cần biết ai đang nhận, mô hình nào là phù hợp nhất?",
                "Mô hình Publish/Subscribe qua Message Broker.",
                new String[][] {
                    {"Publish / Subscribe qua Message Broker (Kafka / RabbitMQ)", "Giúp các service hoàn toàn lỏng lẻo (decoupled) về mặt thời gian và không gian."},
                    {"Đồng bộ REST API gọi vòng lặp", "Gây phụ thuộc chặt chẽ và tắc nghẽn dây chuyền khi một service bị chậm."},
                    {"Chia sẻ chung một bảng MySQL", "Vi phạm nguyên tắc Database-per-service của Microservices."},
                    {"Gửi email trực tiếp giữa các backend", "Hiệu năng rất chậm và không đảm bảo tin cậy hệ thống."}
                },
                0
            },
            // Câu 14
            {
                "Annotation @Transactional(readOnly = true) đem lại lợi ích gì trong Hibernate / Spring?",
                "Tối ưu hóa bộ nhớ và không cần thực hiện kiểm tra Dirty Checking khi kết thúc giao dịch.",
                new String[][] {
                    {"Tối ưu hiệu năng đọc, ngăn chặn flush dữ liệu và tắt Dirty Checking không cần thiết", "Giúp Hibernate chạy nhanh hơn và tiết kiệm CPU/RAM."},
                    {"Tự động mã hóa tất cả dữ liệu trả về", "Không liên quan đến mã hóa."},
                    {"Xóa sạch bộ nhớ đệm cache", "Không có tác dụng xóa cache."},
                    {"Cho phép ghi dữ liệu mà không cần commit", "Ngược lại, ngăn chặn ghi sửa dữ liệu."}
                },
                0
            },
            // Câu 15
            {
                "Trong Docker, lệnh nào được dùng để xây dựng một Docker image từ một Dockerfile trong thư mục hiện tại?",
                "docker build -t <tag> .",
                new String[][] {
                    {"docker run", "Khởi chạy một container từ image có sẵn."},
                    {"docker build -t <name> .", "Đọc chỉ dẫn trong Dockerfile và đóng gói thành image."},
                    {"docker compose up", "Khởi động toàn bộ cụm dịch vụ được định nghĩa trong compose file."},
                    {"docker push", "Đẩy image lên Docker Registry từ xa."}
                },
                1
            },
            // Câu 16
            {
                "Công cụ nào trong hệ sinh thái Observability thường được kết hợp với Micrometer và Spring Boot Actuator để thu thập và giám sát Metrics hệ thống?",
                "Prometheus kết hợp cùng Grafana để visualize biểu đồ.",
                new String[][] {
                    {"Prometheus & Grafana", "Bộ đôi chuẩn công nghiệp để thu thập, lưu trữ time-series metrics và hiển thị dashboard trực quan."},
                    {"Swagger UI", "Chỉ dùng để tài liệu hóa và thử nghiệm REST API."},
                    {"Postman", "Công cụ test API phía client."},
                    {"Maven", "Công cụ quản lý thư viện và build dự án Java."}
                },
                0
            },
            // Câu 17
            {
                "Trong mô hình CQRS (Command Query Responsibility Segregation), sự phân chia cốt lõi nằm ở đâu?",
                "Tách biệt các tác vụ thay đổi trạng thái (Command) và tác vụ đọc dữ liệu (Query).",
                new String[][] {
                    {"Tách biệt luồng ghi thay đổi dữ liệu (Command) và luồng đọc dữ liệu (Query)", "Cho phép tối ưu hóa độc lập mô hình dữ liệu đọc và ghi."},
                    {"Tách biệt mã nguồn Frontend và Backend", "Đó là kiến trúc SPA/Client-Server cơ bản."},
                    {"Tách cơ sở dữ liệu quan hệ sang NoSQL", "CQRS có thể dùng cùng hoặc khác database."},
                    {"Tách các chức năng thanh toán sang cổng thứ ba", "Đó là Payment Gateway Integration."}
                },
                0
            },
            // Câu 18
            {
                "Mục đích của việc sử dụng DTO (Data Transfer Object) thay vì trả trực tiếp Entity JPA ra Controller là gì?",
                "Bảo vệ cấu trúc dữ liệu nội bộ, tránh lỗi LazyInitializationException và tuần hoàn JSON.",
                new String[][] {
                    {"Bảo vệ cấu trúc bảng cơ sở dữ liệu, tối ưu dung lượng payload và tránh lỗi vòng lặp JSON / Lazy loading", "Ngăn chặn rò rỉ thông tin nhạy cảm và kiểm soát chặt chẽ dữ liệu API."},
                    {"Bắt buộc bởi đặc tả HTTP chuẩn", "HTTP chỉ nhận chuỗi byte, không bắt buộc DTO."},
                    {"Tự động tăng tốc độ mạng lên gấp đôi", "DTO chỉ đóng gói dữ liệu hợp lý hơn."},
                    {"Thay thế hoàn toàn câu lệnh SQL", "DTO chỉ là đối tượng chứa dữ liệu."}
                },
                0
            },
            // Câu 19
            {
                "Trong Spring Boot, file nào được dùng để nạp các thông số biến môi trường cấu hình như cổng port, database url, jwt secret?",
                "application.properties hoặc application.yaml / application.yml.",
                new String[][] {
                    {"pom.xml", "Quản lý dependencies và build plugins của Maven."},
                    {"application.yml / application.properties", "Nơi khai báo toàn bộ cấu hình thuộc tính của ứng dụng Spring Boot."},
                    {"package.json", "Tệp cấu hình của hệ sinh thái Node.js/NPM."},
                    {"web.xml", "Tệp cấu hình Servlet cũ thời Java EE cổ điển."}
                },
                1
            },
            // Câu 20
            {
                "Khi một Microservice bị lỗi quá tải liên tục, trạng thái nào của Circuit Breaker sẽ chặn ngay lập tức các request mới và trả về fallback mà không gọi vào service hỏng?",
                "Trạng thái OPEN.",
                new String[][] {
                    {"CLOSED", "Trạng thái bình thường, mọi request đều được chuyển tiếp đến service."},
                    {"OPEN", "Mạch ngắt hoàn toàn: từ chối mọi request và kích hoạt fallback ngay tức thì."},
                    {"HALF_OPEN", "Cho phép một số lượng request thăm dò thử nghiệm để xem service đã hồi phục chưa."},
                    {"DISABLED", "Tắt cơ chế bảo vệ mạch ngắt."}
                },
                1
            }
        };
    }
}
