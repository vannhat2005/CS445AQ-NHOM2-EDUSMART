package com.example.back_end.agents;

import com.example.back_end.config.AIProperties;
import com.example.back_end.rag.VectorDb;
import com.example.back_end.tools.LessonTool;
import com.example.back_end.tools.QuizTool;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class EduAgent {

    private final AIProperties aiProperties;
    private final LessonTool lessonTool;
    private final QuizTool quizTool;
    private final ObjectMapper objectMapper;

    // Khởi tạo HTTP Client để kết nối với Gemini API
    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(6))
            .build();

    // ==================== 1. HỎI ĐÁP NỘI DUNG BÀI HỌC ====================

    public QueryModels.ChatResponse chatLesson(QueryModels.ChatLessonRequest request) {
        String userMsg = request.getMessage() != null ? request.getMessage().trim() : "";

        // Nhận diện câu chào hỏi hoặc giao tiếp thông thường
        if (isConversationalOrSystemQuery(userMsg)) {
            String quickReply = handleConversationalQuery(userMsg);
            return QueryModels.ChatResponse.builder()
                    .success(true)
                    .reply(quickReply)
                    .citations(new ArrayList<>())
                    .lessonId(request.getLessonId())
                    .reasoning("Phản hồi tự nhiên cho giao tiếp người dùng.")
                    .build();
        }

        // Truy xuất nội dung liên quan từ tài liệu PDF bài học
        int topK = aiProperties.getRag().getTopK();
        LessonTool.KnowledgeResult knowledge = lessonTool.retrieveLessonKnowledge(
                userMsg,
                request.getLessonId(),
                request.getCourseId(),
                topK
        );

        // Lấy thông tin bài học và khóa học
        String pdfContext = knowledge.getContext();
        String lessonTitle = knowledge.getLessonTitle() != null
                ? knowledge.getLessonTitle()
                : "Bài học " + (request.getLessonId() != null ? request.getLessonId() : "");
        String courseTitle = knowledge.getCourseTitle() != null
                ? knowledge.getCourseTitle()
                : "Khóa học trực tuyến";

        // Lấy danh sách nguồn tài liệu tham khảo
        List<QueryModels.CitationItem> citations = new ArrayList<>();

        if (knowledge.getCitations() != null) {
            for (LessonTool.Citation c : knowledge.getCitations()) {
                citations.add(QueryModels.CitationItem.builder()
                        .source(c.getSource())
                        .page(c.getPage())
                        .score(c.getScore())
                        .build());
            }
        }

        // Tạo System Prompt kết hợp nội dung tài liệu PDF
        String systemInstruction = String.format(
                Prompts.LESSON_QA_SYSTEM_PROMPT,
                lessonTitle,
                courseTitle,
                pdfContext
        );

        // Gọi Gemini để sinh câu trả lời
        String reply = generateContent(systemInstruction, userMsg);
        boolean aiGenerated = reply != null && !reply.isBlank();

        // Sử dụng nội dung tài liệu dự phòng nếu Gemini gặp lỗi
        if (!aiGenerated) {
            reply = fallbackLessonReasoning(userMsg, pdfContext, citations);
        }

        // Trả kết quả về Frontend
        return QueryModels.ChatResponse.builder()
                .success(true)
                .reply(reply)
                .citations(citations)
                .lessonId(request.getLessonId())
                .reasoning(aiGenerated
                        ? "Đã phân tích và trả lời dựa trên trích dẫn PDF bài giảng và suy luận AI."
                        : "Dịch vụ AI không khả dụng, sử dụng nội dung tài liệu dự phòng.")
                .build();
    }

    // ==================== 2. NHẬN DIỆN CÂU GIAO TIẾP ====================

    private boolean isConversationalOrSystemQuery(String query) {
        if (query == null || query.isBlank()) return true;

        String lower = query.toLowerCase().trim();

        return lower.contains("het token")
                || lower.contains("hết token")
                || lower.contains("đừng nhắn")
                || lower.contains("dung nhan")
                || lower.contains("có token rồi")
                || lower.contains("co token roi")
                || lower.equals("chào")
                || lower.equals("chào bạn")
                || lower.equals("hello")
                || lower.equals("hi")
                || lower.equals("cảm ơn")
                || lower.equals("cam on")
                || lower.equals("thanks")
                || lower.equals("thank you");
    }

    // ==================== 3. XỬ LÝ CÂU GIAO TIẾP ====================

    private String handleConversationalQuery(String query) {
        String lower = query == null ? "" : query.toLowerCase().trim();

        if (lower.contains("có token rồi") || lower.contains("co token roi")) {
            return "Tôi đã sẵn sàng hỗ trợ bạn. Bạn hãy gửi câu hỏi về nội dung bài học nhé!";
        }

        if (lower.contains("token") || lower.contains("đừng nhắn") || lower.contains("dung nhan")) {
            return "Tôi đã nhận được thông tin. Bạn có thể tiếp tục đặt câu hỏi khi sẵn sàng.";
        }

        if (lower.equals("chào") || lower.equals("chào bạn")
                || lower.equals("hello") || lower.equals("hi")) {
            return "Xin chào bạn! Tôi là Trợ giảng AI EduSmart của bài học này. Bạn cần tôi hỗ trợ giải đáp thắc mắc hay phân tích nội dung nào trong bài học không?";
        }

        if (lower.equals("cảm ơn") || lower.equals("cam on")
                || lower.equals("thanks") || lower.equals("thank you")) {
            return "Không có gì! Rất vui được đồng hành cùng bạn. Chúc bạn học tập thật hiệu quả!";
        }

        return "Tôi luôn sẵn sàng hỗ trợ bạn khi bạn có câu hỏi về bài học.";
    }

    // ==================== 4. NHẬN DIỆN CÂU HỎI TRẮC NGHIỆM ====================

    private boolean isDefaultQuizQuery(String query) {
        if (query == null || query.isBlank()) return true;

        String lower = query.toLowerCase().trim();

        return lower.contains("giải thích ngắn gọn 2-3 câu vì sao đáp án đúng")
                || lower.equals("giải thích")
                || lower.equals("giai thich")
                || lower.equals("tại sao đúng")
                || lower.equals("tai sao dung")
                || lower.equals("vì sao đúng")
                || lower.equals("vi sao dung")
                || lower.equals("tại sao")
                || lower.equals("vì sao")
                || lower.equals("xem giải thích")
                || lower.equals("xem giai thich")
                || lower.equals("xem đáp án")
                || lower.equals("xem dap an");
    }

    // ==================== 5. AI GIẢI THÍCH TRẮC NGHIỆM ====================

    public QueryModels.ChatResponse explainQuiz(QueryModels.ChatQuizRequest request) {

        // Truy xuất ngữ cảnh câu hỏi và tài liệu liên quan
        int topK = aiProperties.getRag().getTopK();
        QuizTool.QuizContextResult qCtx = quizTool.prepareQuizContext(
                request.getQuestionText(),
                request.getOptions(),
                request.getLessonId(),
                request.getCourseId(),
                request.getQuestionId(),
                topK
        );

        // Lấy nội dung tài liệu PDF liên quan
        String pdfEvidence = qCtx.getPdfEvidence();
        List<QueryModels.CitationItem> citations = new ArrayList<>();

        // Lấy danh sách nguồn tài liệu tham khảo
        if (qCtx.getRawChunks() != null) {
            for (var c : qCtx.getRawChunks()) {
                if (VectorDb.isGarbageChunk(c.getText())) continue;

                citations.add(QueryModels.CitationItem.builder()
                        .source(c.getSourceFile() != null
                                ? c.getSourceFile() : "Tài liệu bài học")
                        .page(c.getPageNumber() != null ? c.getPageNumber() : 1)
                        .score(c.getScore() != null ? c.getScore() : 0.0)
                        .build());
            }
        }

        // Chuyển danh sách đáp án sang dạng văn bản A, B, C, D
        StringBuilder optionsStr = new StringBuilder();

        if (qCtx.getOptions() != null) {
            for (int i = 0; i < qCtx.getOptions().size(); i++) {
                char prefix = (char) ('A' + i);
                optionsStr.append(prefix)
                        .append(". ")
                        .append(qCtx.getOptions().get(i))
                        .append("\n");
            }
        }

        // Lấy đáp án học viên lựa chọn và đáp án đúng
        String studentChoice = request.getSelectedOption() != null
                ? request.getSelectedOption()
                : "Học sinh chưa chọn (yêu cầu phân tích)";

        String correctAnswer = qCtx.getCorrectAnswerText() != null
                ? qCtx.getCorrectAnswerText()
                : "Chưa xác định";

        // Ưu tiên sử dụng lời giải thích có sẵn trong MySQL
        if (qCtx.getDbExplanation() != null
                && !qCtx.getDbExplanation().isBlank()
                && qCtx.getDbExplanation().length() > 30) {

            log.info("Lấy lời giải thích có sẵn cho câu hỏi [{}], không tốn token AI.",
                    request.getQuestionId());

            return QueryModels.ChatResponse.builder()
                    .success(true)
                    .reply(qCtx.getDbExplanation())
                    .citations(citations)
                    .lessonId(qCtx.getLessonId())
                    .reasoning("Lời giải thích được lấy trực tiếp từ cơ sở dữ liệu hệ thống.")
                    .build();
        }

        // Lấy lời giải thích của giảng viên nếu có
        String teacherExplanation = qCtx.getDbExplanation() != null
                && !qCtx.getDbExplanation().isBlank()
                ? qCtx.getDbExplanation()
                : "Chưa có lời giải thích sẵn trong hệ thống";

        // Tạo System Prompt giải thích câu hỏi
        String systemInstruction = String.format(
                Prompts.QUIZ_EXPLAIN_SYSTEM_PROMPT,
                qCtx.getQuestionText(),
                optionsStr.toString(),
                studentChoice,
                correctAnswer,
                teacherExplanation,
                pdfEvidence
        );

        // Lấy yêu cầu giải thích của học viên
        String userAsk = request.getUserQuery() != null
                && !request.getUserQuery().isBlank()
                ? request.getUserQuery()
                : "Hãy phân tích câu hỏi trắc nghiệm này, giải thích chi tiết vì sao đáp án đúng dựa trên tài liệu bài học và chỉ ra vì sao các phương án khác chưa chính xác.";

        // Gọi Gemini để giải thích câu hỏi
        String reply = generateContent(systemInstruction, userAsk);
        boolean aiGenerated = reply != null && !reply.isBlank();

        if (!aiGenerated) {

            // Sử dụng lời giải thích dự phòng nếu Gemini gặp lỗi
            reply = fallbackQuizReasoning(
                    qCtx.getQuestionText(),
                    qCtx.getOptions(),
                    pdfEvidence,
                    teacherExplanation,
                    citations
            );

        } else {

            // Chuẩn hóa định dạng nội dung AI trả về
            reply = formatQuizMarkdown(reply);

            // Lưu lời giải thích vào MySQL nếu câu hỏi chưa có lời giải thích
            if (request.getQuestionId() != null) {
                quizTool.saveExplanationIfMissing(request.getQuestionId(), reply);
            }
        }

        // Trả kết quả về Frontend
        return QueryModels.ChatResponse.builder()
                .success(true)
                .reply(reply)
                .citations(citations)
                .lessonId(qCtx.getLessonId())
                .reasoning(aiGenerated
                        ? "Đã đọc dữ liệu PDF và đối chiếu câu hỏi trắc nghiệm để phân tích giải đáp."
                        : "Dịch vụ AI không khả dụng, sử dụng nội dung giải thích dự phòng.")
                .build();
    }

    // ==================== 6. ĐIỀU PHỐI MÔ HÌNH AI ====================

    // Sử dụng Gemini và tự động chuyển đổi model khi gặp lỗi
    public String generateContent(String systemInstruction, String userPrompt) {
        return callGemini(systemInstruction, userPrompt);
    }

// ==================== 7. GỌI GEMINI API ====================

    private String callGemini(String systemInstruction, String userPrompt) {

        // 1. Lấy API Key từ cấu hình
        String apiKey = aiProperties.getLlm().getApiKey();

        if (apiKey == null || apiKey.isBlank()) {
            apiKey = System.getenv("GEMINI_API_KEY");
        }

        // Kiểm tra API Key
        if (apiKey == null || apiKey.isBlank()) {
            log.warn("Chưa cấu hình Gemini API Key.");
            return null;
        }

        // 2. Lấy model chính từ application.yml
        String primaryModel = aiProperties.getLlm().getModelName();

        // Khởi tạo danh sách model theo thứ tự ưu tiên
        List<String> modelsToTry = new ArrayList<>();

        // Thêm model chính vào danh sách
        if (primaryModel != null && !primaryModel.isBlank()) {
            primaryModel = primaryModel.trim();

            if (primaryModel.startsWith("models/")) {
                primaryModel = primaryModel.substring("models/".length());
            }

            modelsToTry.add(primaryModel);
        }

        // 3. Danh sách model Gemini dự phòng
        List<String> fallbackModels = List.of(
                "gemini-3.1-flash-lite",
                "gemini-3.5-flash",
                "gemini-4-hydrogen"
        );

        // Thêm model dự phòng và tránh trùng lặp
        for (String fallbackModel : fallbackModels) {
            if (!modelsToTry.contains(fallbackModel)) {
                modelsToTry.add(fallbackModel);
            }
        }

        // 4. Kết hợp hướng dẫn hệ thống và câu hỏi người dùng
        String combinedPrompt = systemInstruction + "\n\n[CÂU HỎI]:\n" + userPrompt;

        // 5. Tạo dữ liệu gửi đến Gemini
        Map<String, Object> body = Map.of(
                "contents", List.of(
                        Map.of("parts", List.of(
                                Map.of("text", combinedPrompt)
                        ))
                ),
                "generationConfig", Map.of(
                        "temperature", aiProperties.getLlm().getTemperature(),
                        "maxOutputTokens", aiProperties.getLlm().getMaxTokens()
                )
        );

        // Chuyển dữ liệu sang JSON
        String jsonBody;

        try {
            jsonBody = objectMapper.writeValueAsString(body);
        } catch (Exception e) {
            log.error("Không thể tạo dữ liệu JSON gửi đến Gemini.");
            return null;
        }

        // 6. Lần lượt gọi các model theo thứ tự ưu tiên
        for (int i = 0; i < modelsToTry.size(); i++) {

            String model = modelsToTry.get(i);

            // Đường dẫn API tương ứng với model hiện tại
            String url = "https://generativelanguage.googleapis.com/v1beta/models/"
                    + model + ":generateContent";

            try {

                log.info("Đang gọi Gemini [{}] - Model {}/{}.",
                        model, i + 1, modelsToTry.size());

                // Khởi tạo HTTP Request
                HttpRequest request = HttpRequest.newBuilder()
                        .uri(URI.create(url))
                        .header("Content-Type", "application/json")
                        .header("x-goog-api-key", apiKey)
                        .timeout(Duration.ofSeconds(30))
                        .POST(HttpRequest.BodyPublishers.ofString(
                                jsonBody, StandardCharsets.UTF_8))
                        .build();

                // Gửi yêu cầu đến Gemini
                HttpResponse<String> response = httpClient.send(
                        request,
                        HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8)
                );

                int status = response.statusCode();

                // 7. Xử lý khi gọi API thành công
                if (status == 200) {

                    JsonNode root = objectMapper.readTree(response.body());
                    JsonNode candidates = root.path("candidates");

                    if (candidates.isArray() && candidates.size() > 0) {

                        JsonNode parts = candidates.get(0)
                                .path("content")
                                .path("parts");

                        StringBuilder result = new StringBuilder();

                        // Lấy nội dung văn bản AI trả về
                        for (JsonNode part : parts) {
                            if (part.has("text")
                                    && !part.path("thought").asBoolean(false)) {
                                result.append(part.path("text").asText());
                            }
                        }

                        // Trả kết quả và dừng gọi các model còn lại
                        if (!result.toString().isBlank()) {
                            log.info("Gemini [{}] sinh câu trả lời thành công.", model);
                            return result.toString().trim();
                        }
                    }

                    // Không có nội dung văn bản trả về
                    log.warn("Gemini [{}] không trả về nội dung văn bản.", model);
                    return null;
                }

                // 8. Xử lý lỗi quá tải hoặc dịch vụ không khả dụng
                if (status == 503 || status == 500 || status == 502 || status == 504) {
                    log.warn("Gemini [{}] HTTP {} - Dịch vụ không khả dụng. Chi tiết: {}",
                            model, status, response.body());
                }

                // 9. Xử lý lỗi vượt hạn mức API
                else if (status == 429) {
                    log.warn("Gemini [{}] HTTP 429 - Vượt hạn mức API. Chi tiết: {}",
                            model, response.body());
                }

                // 10. Xử lý lỗi model không còn khả dụng
                else if (status == 404) {
                    log.warn("Gemini [{}] HTTP 404 - Model không khả dụng. Chi tiết: {}",
                            model, response.body());
                }

                // 11. Dừng gọi API nếu yêu cầu hoặc thông tin xác thực không hợp lệ
                else if (status == 400 || status == 401 || status == 403) {
                    log.warn("Gemini [{}] HTTP {} - Kiểm tra cấu hình và quyền truy cập. Chi tiết: {}",
                            model, status, response.body());
                    return null;
                }

                // 12. Xử lý các lỗi HTTP khác
                else {
                    log.warn("Gemini [{}] HTTP {}. Chi tiết: {}",
                            model, status, response.body());
                    return null;
                }

                // 13. Chuyển sang model dự phòng tiếp theo
                if (i < modelsToTry.size() - 1) {
                    log.warn("Tự động chuyển từ [{}] sang [{}].",
                            model, modelsToTry.get(i + 1));

                    // Chờ một giây trước khi gọi model tiếp theo
                    Thread.sleep(1000);
                }

            } catch (InterruptedException e) {

                // Khôi phục trạng thái ngắt của luồng
                Thread.currentThread().interrupt();
                log.warn("Quá trình gọi Gemini bị gián đoạn.");
                return null;

            } catch (java.io.IOException e) {

                // Chuyển model khi xảy ra lỗi kết nối hoặc hết thời gian chờ
                log.warn("Lỗi kết nối Gemini [{}]: {}.",
                        model, e.getClass().getSimpleName());

                if (i < modelsToTry.size() - 1) {
                    log.warn("Tự động chuyển sang model [{}].",
                            modelsToTry.get(i + 1));
                }

            } catch (Exception e) {

                // Dừng khi xảy ra lỗi xử lý dữ liệu hoặc cấu hình
                log.error("Lỗi khi xử lý Gemini [{}]: {}.",
                        model, e.getClass().getSimpleName());
                return null;
            }
        }

        // 14. Tất cả model đều không khả dụng
        log.error("Tất cả model Gemini đều gọi thất bại: {}", modelsToTry);

        // Trả về null để sử dụng chức năng phản hồi dự phòng hiện có
        return null;
    }

    // ==================== 8. PHẢN HỒI DỰ PHÒNG CHO BÀI HỌC ====================

    private String fallbackLessonReasoning(
            String query,
            String context,
            List<QueryModels.CitationItem> citations) {

        StringBuilder sb = new StringBuilder();

        // Thông báo dịch vụ AI không khả dụng
        sb.append("Dịch vụ AI hiện đang tạm thời không khả dụng. Vui lòng thử lại sau ít phút.\n\n");

        // Lấy nội dung tài liệu PDF liên quan
        String cleanContext = sanitizeContext(context);

        if (!cleanContext.isBlank()) {
            sb.append("Dưới đây là phần kiến thức liên quan được trích xuất từ tài liệu bài học để bạn tham khảo:\n\n");
            sb.append(cleanContext).append("\n\n");
        }

        // Hiển thị nguồn tài liệu tham khảo
        if (citations != null && !citations.isEmpty()) {
            sb.append("📚 **Nguồn tài liệu tham khảo trong bài học:**\n");

            for (QueryModels.CitationItem c : citations) {
                sb.append(String.format(
                        "• Tài liệu: `%s` (Trang %s)\n",
                        c.getSource(),
                        c.getPage()
                ));
            }
        }

        return sb.toString().trim();
    }

    // ==================== 9. LÀM SẠCH NỘI DUNG TÀI LIỆU ====================

    private String sanitizeContext(String context) {

        // Kiểm tra nội dung tài liệu rỗng
        if (context == null || context.isBlank()
                || context.contains("Không tìm thấy nội dung PDF trực tiếp")) {
            return "";
        }

        // Loại bỏ nội dung PDF bị lỗi mã hóa
        if (context.contains("\uFFFD")
                || context.contains("NNOO")
                || context.contains("XU`tX")
                || context.contains("PQQQ")) {
            return "";
        }

        // Kiểm tra tỷ lệ ký tự chữ và số
        long letterCount = context.chars()
                .filter(Character::isLetterOrDigit)
                .count();

        if ((double) letterCount / context.length() < 0.50) {
            return "";
        }

        // Chuẩn hóa khoảng trắng và xuống dòng
        String cleaned = context.replaceAll("\r\n|\r", "\n")
                .replaceAll("[ \t]+", " ")
                .replaceAll("\n\\s*\n+", "\n\n")
                .trim();

        // Giới hạn độ dài nội dung dự phòng
        if (cleaned.length() > 500) {
            cleaned = cleaned.substring(0, 500) + "...";
        }

        return cleaned;
    }

    // ==================== 10. PHẢN HỒI DỰ PHÒNG CHO TRẮC NGHIỆM ====================

    private String fallbackQuizReasoning(
            String question,
            List<String> options,
            String evidence,
            String teacherExplanation,
            List<QueryModels.CitationItem> citations) {

        StringBuilder sb = new StringBuilder();

        // Thông báo không thể sinh lời giải thích bằng AI
        sb.append("Dịch vụ AI hiện đang tạm thời không khả dụng.\n\n");

        // Hiển thị lời giải thích của giảng viên nếu có
        if (teacherExplanation != null
                && !teacherExplanation.isBlank()
                && !teacherExplanation.contains("Chưa có lời giải thích")) {

            sb.append("**Lời giải thích từ hệ thống:**\n")
                    .append(teacherExplanation.trim())
                    .append("\n\n");
        }

        // Hiển thị nội dung tài liệu PDF liên quan
        String cleanEvidence = sanitizeContext(evidence);

        if (!cleanEvidence.isBlank()) {
            sb.append("**Kiến thức đối chiếu từ tài liệu bài giảng:**\n")
                    .append(cleanEvidence.trim())
                    .append("\n\n");
        } else {
            sb.append("Hiện chưa thể tạo lời giải thích chi tiết bằng AI. Vui lòng thử lại sau ít phút.\n\n");
        }

        // Hiển thị nguồn tài liệu tham khảo
        if (citations != null && !citations.isEmpty()) {
            sb.append("📚 **Nguồn tài liệu PDF tham khảo:**\n");

            for (QueryModels.CitationItem c : citations) {
                sb.append(String.format(
                        "- Tài liệu: `%s` (Trang %s)\n",
                        c.getSource(),
                        c.getPage()
                ));
            }
        }

        return sb.toString().trim();
    }

    // ==================== 11. CHUẨN HÓA NỘI DUNG MARKDOWN ====================

    private String formatQuizMarkdown(String text) {
        if (text == null) return "";

        return text.replaceAll("\r\n|\r", "\n").trim();
    }
}