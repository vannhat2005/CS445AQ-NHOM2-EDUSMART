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

    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(6))
            .build();

    public QueryModels.ChatResponse chatLesson(QueryModels.ChatLessonRequest request) {
        String userMsg = request.getMessage() != null ? request.getMessage().trim() : "";

        // 1. Nhận diện các câu chào hỏi xã giao hoặc thông báo trạng thái người dùng (hết token, tạm dừng, chào hỏi, cảm ơn,...)
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

        // 2. Dùng LessonTool lấy ngữ cảnh tài liệu PDF bài học
        int topK = aiProperties.getRag().getTopK();
        LessonTool.KnowledgeResult knowledge = lessonTool.retrieveLessonKnowledge(
                userMsg,
                request.getLessonId(),
                request.getCourseId(),
                topK
        );

        String pdfContext = knowledge.getContext();
        String lessonTitle = knowledge.getLessonTitle() != null ? knowledge.getLessonTitle() : "Bài học " + (request.getLessonId() != null ? request.getLessonId() : "");
        String courseTitle = knowledge.getCourseTitle() != null ? knowledge.getCourseTitle() : "Khóa học trực tuyến";

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

        // 3. Tạo System Prompt RAG kết hợp suy luận AI
        String systemInstruction = String.format(Prompts.LESSON_QA_SYSTEM_PROMPT, lessonTitle, courseTitle, pdfContext);

        // 4. Gọi LLM sinh câu trả lời (Tự động điều phối OpenAI hoặc Gemini theo cấu hình)
        String reply = generateContent(systemInstruction, userMsg);
        if (reply == null || reply.isBlank()) {
            reply = fallbackLessonReasoning(userMsg, pdfContext, citations);
        }

        return QueryModels.ChatResponse.builder()
                .success(true)
                .reply(reply)
                .citations(citations)
                .lessonId(request.getLessonId())
                .reasoning("Đã phân tích và trả lời dựa trên trích dẫn PDF bài giảng và suy luận AI.")
                .build();
    }

    private boolean isConversationalOrSystemQuery(String query) {
        if (query == null || query.isBlank()) return true;
        String lower = query.toLowerCase().trim();
        return lower.contains("het token") || lower.contains("hết token")
                || lower.contains("đừng nhắn") || lower.contains("dung nhan")
                || lower.contains("có token rồi") || lower.contains("co token roi")
                || lower.equals("chào") || lower.equals("chào bạn") || lower.equals("hello") || lower.equals("hi")
                || lower.equals("cảm ơn") || lower.equals("cam on") || lower.equals("thanks") || lower.equals("thank you");
    }

    private String handleConversationalQuery(String query) {
        String lower = query.toLowerCase().trim();
        if (lower.contains("token") || lower.contains("đừng nhắn") || lower.contains("dung nhan")) {
            return "Dạ vâng, em đã nhận thông tin ạ! Em sẽ tạm dừng chờ bạn cập nhật thêm Token / Gemini API Key. Khi nào sẵn sàng, bạn cứ nhắn câu hỏi vào đây em sẽ tiếp tục hỗ trợ bạn nhé. Chúc bạn học tập thật tốt!";
        }
        if (lower.contains("chào") || lower.contains("hello") || lower.contains("hi")) {
            return "Xin chào bạn! Tôi là Trợ giảng AI EduSmart của bài học này. Bạn cần tôi hỗ trợ giải đáp thắc mắc hay phân tích nội dung nào trong bài học không?";
        }
        if (lower.contains("cảm ơn") || lower.contains("thanks")) {
            return "Không có gì ạ! Rất vui được đồng hành cùng bạn. Chúc bạn học tập thật hiệu quả!";
        }
        return "Dạ vâng, tôi luôn sẵn sàng hỗ trợ bạn khi bạn có câu hỏi về bài học.";
    }

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

    public QueryModels.ChatResponse explainQuiz(QueryModels.ChatQuizRequest request) {
        int topK = aiProperties.getRag().getTopK();
        QuizTool.QuizContextResult qCtx = quizTool.prepareQuizContext(
                request.getQuestionText(),
                request.getOptions(),
                request.getLessonId(),
                request.getCourseId(),
                request.getQuestionId(),
                topK
        );

        String pdfEvidence = qCtx.getPdfEvidence();
        List<QueryModels.CitationItem> citations = new ArrayList<>();
        if (qCtx.getRawChunks() != null) {
            for (var c : qCtx.getRawChunks()) {
                if (VectorDb.isGarbageChunk(c.getText())) continue;
                citations.add(QueryModels.CitationItem.builder()
                        .source(c.getSourceFile() != null ? c.getSourceFile() : "Tài liệu bài học")
                        .page(c.getPageNumber() != null ? c.getPageNumber() : 1)
                        .score(c.getScore() != null ? c.getScore() : 0.0)
                        .build());
            }
        }

        StringBuilder optionsStr = new StringBuilder();
        if (qCtx.getOptions() != null) {
            for (int i = 0; i < qCtx.getOptions().size(); i++) {
                char prefix = (char) ('A' + i);
                optionsStr.append(prefix).append(". ").append(qCtx.getOptions().get(i)).append("\n");
            }
        }

        String studentChoice = request.getSelectedOption() != null ? request.getSelectedOption() : "Học sinh chưa chọn (yêu cầu phân tích)";
        String correctAnswer = qCtx.getCorrectAnswerText() != null ? qCtx.getCorrectAnswerText() : "Chưa xác định";

        // 1. Nếu trong MySQL DB đã có sẵn câu giải thích chi tiết (của giáo viên hoặc AI đã tạo trước đó)
        if (qCtx.getDbExplanation() != null && !qCtx.getDbExplanation().isBlank() && qCtx.getDbExplanation().length() > 30) {
            log.info("Lấy trực tiếp lời giải thích có sẵn trong MySQL DB cho câu hỏi [{}], không tốn token AI.", request.getQuestionId());
            return QueryModels.ChatResponse.builder()
                    .success(true)
                    .reply(qCtx.getDbExplanation())
                    .citations(citations)
                    .lessonId(qCtx.getLessonId())
                    .reasoning("Lời giải thích chuẩn được lấy trực tiếp từ cơ sở dữ liệu hệ thống.")
                    .build();
        }

        String teacherExplanation = (qCtx.getDbExplanation() != null && !qCtx.getDbExplanation().isBlank())
                ? qCtx.getDbExplanation()
                : "Chưa có lời giải thích sẵn trong hệ thống";

        // 2. Nếu DB chưa có: Đọc tài liệu bài giảng PDF, đối chiếu và phân tích cặn kẽ
        String systemInstruction = String.format(Prompts.QUIZ_EXPLAIN_SYSTEM_PROMPT,
                qCtx.getQuestionText(),
                optionsStr.toString(),
                studentChoice,
                correctAnswer,
                teacherExplanation,
                pdfEvidence
        );

        String userAsk = (request.getUserQuery() != null && !request.getUserQuery().isBlank())
                ? request.getUserQuery()
                : "Hãy phân tích câu hỏi trắc nghiệm này, giải thích chi tiết vì sao đáp án đúng dựa trên tài liệu bài học và chỉ ra vì sao các phương án khác chưa chính xác.";

        String reply = generateContent(systemInstruction, userAsk);
        if (reply == null || reply.isBlank()) {
            reply = fallbackQuizReasoning(qCtx.getQuestionText(), qCtx.getOptions(), pdfEvidence, teacherExplanation, citations);
        } else {
            reply = formatQuizMarkdown(reply);
            // Tự động lưu câu giải thích có chiều sâu sư phạm này vào MySQL DB (Questions.explanation)
            if (request.getQuestionId() != null) {
                quizTool.saveExplanationIfMissing(request.getQuestionId(), reply);
            }
        }

        return QueryModels.ChatResponse.builder()
                .success(true)
                .reply(reply)
                .citations(citations)
                .lessonId(qCtx.getLessonId())
                .reasoning("Đã đọc dữ liệu bài học PDF và đối chiếu câu hỏi trắc nghiệm để phân tích giải đáp.")
                .build();
    }

    private String generateContent(String systemInstruction, String userPrompt) {
        String provider = aiProperties.getLlm().getProvider();
        if ("groq".equalsIgnoreCase(provider)) {
            String reply = callGroq(systemInstruction, userPrompt);
            if (reply != null && !reply.isBlank()) {
                return reply;
            }
            reply = callOpenAI(systemInstruction, userPrompt);
            if (reply != null && !reply.isBlank()) return reply;
            return callGemini(systemInstruction, userPrompt);
        } else if ("openai".equalsIgnoreCase(provider)) {
            String reply = callOpenAI(systemInstruction, userPrompt);
            if (reply != null && !reply.isBlank()) {
                return reply;
            }
            reply = callGroq(systemInstruction, userPrompt);
            if (reply != null && !reply.isBlank()) return reply;
            return callGemini(systemInstruction, userPrompt);
        } else {
            String reply = callGemini(systemInstruction, userPrompt);
            if (reply != null && !reply.isBlank()) {
                return reply;
            }
            reply = callGroq(systemInstruction, userPrompt);
            if (reply != null && !reply.isBlank()) return reply;
            return callOpenAI(systemInstruction, userPrompt);
        }
    }

    private String callGroq(String systemInstruction, String userPrompt) {
        String apiKey = aiProperties.getLlm().getApiKey();
        if (apiKey == null || apiKey.isBlank()) {
            apiKey = System.getenv("GROQ_API_KEY");
        }
        if (apiKey == null || apiKey.isBlank()) {
            return null;
        }

        String primaryModel = aiProperties.getLlm().getModelName();
        List<String> modelsToTry = new ArrayList<>();
        if (primaryModel != null && !primaryModel.isBlank() && !primaryModel.contains("gemini") && !primaryModel.contains("gpt")) {
            modelsToTry.add(primaryModel);
        }
        for (String m : List.of("llama-3.3-70b-versatile", "llama-3.1-8b-instant", "mixtral-8x7b-32768", "gemma2-9b-it")) {
            if (!modelsToTry.contains(m)) {
                modelsToTry.add(m);
            }
        }

        for (String model : modelsToTry) {
            try {
                String url = "https://api.groq.com/openai/v1/chat/completions";

                Map<String, Object> body = Map.of(
                        "model", model,
                        "messages", List.of(
                                Map.of("role", "system", "content", systemInstruction),
                                Map.of("role", "user", "content", userPrompt)
                        ),
                        "temperature", aiProperties.getLlm().getTemperature(),
                        "max_tokens", aiProperties.getLlm().getMaxTokens()
                );

                String jsonBody = objectMapper.writeValueAsString(body);
                HttpRequest request = HttpRequest.newBuilder()
                        .uri(URI.create(url))
                        .header("Content-Type", "application/json")
                        .header("Authorization", "Bearer " + apiKey)
                        .timeout(Duration.ofSeconds(12))
                        .POST(HttpRequest.BodyPublishers.ofString(jsonBody, StandardCharsets.UTF_8))
                        .build();

                HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));
                if (response.statusCode() == 200) {
                    JsonNode root = objectMapper.readTree(response.body());
                    JsonNode choices = root.path("choices");
                    if (choices.isArray() && choices.size() > 0) {
                        JsonNode msgNode = choices.get(0).path("message").path("content");
                        if (!msgNode.isMissingNode()) {
                            log.info("Groq [{}] sinh câu trả lời thành công siêu tốc.", model);
                            return msgNode.asText().trim();
                        }
                    }
                } else {
                    log.warn("Groq API [{}] trả về status {}: {}", model, response.statusCode(), response.body());
                }
            } catch (Exception e) {
                log.warn("Lỗi khi gọi Groq API [{}]: {}", model, e.getMessage());
            }
        }
        return null;
    }

    private String callOpenAI(String systemInstruction, String userPrompt) {
        String apiKey = aiProperties.getLlm().getApiKey();
        if (apiKey == null || apiKey.isBlank()) {
            apiKey = System.getenv("OPENAI_API_KEY");
        }
        if (apiKey == null || apiKey.isBlank()) {
            return null;
        }

        String primaryModel = aiProperties.getLlm().getModelName();
        List<String> modelsToTry = new ArrayList<>();
        if (primaryModel != null && !primaryModel.isBlank() && !primaryModel.toLowerCase().contains("gemini")) {
            modelsToTry.add(primaryModel);
        }
        for (String m : List.of("gpt-4o-mini", "gpt-4o", "gpt-3.5-turbo")) {
            if (!modelsToTry.contains(m)) {
                modelsToTry.add(m);
            }
        }

        for (String model : modelsToTry) {
            try {
                String url = "https://api.openai.com/v1/chat/completions";

                Map<String, Object> body = Map.of(
                        "model", model,
                        "messages", List.of(
                                Map.of("role", "system", "content", systemInstruction),
                                Map.of("role", "user", "content", userPrompt)
                        ),
                        "temperature", aiProperties.getLlm().getTemperature(),
                        "max_tokens", aiProperties.getLlm().getMaxTokens()
                );

                String jsonBody = objectMapper.writeValueAsString(body);
                HttpRequest request = HttpRequest.newBuilder()
                        .uri(URI.create(url))
                        .header("Content-Type", "application/json")
                        .header("Authorization", "Bearer " + apiKey)
                        .timeout(Duration.ofSeconds(15))
                        .POST(HttpRequest.BodyPublishers.ofString(jsonBody, StandardCharsets.UTF_8))
                        .build();

                HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));
                if (response.statusCode() == 200) {
                    JsonNode root = objectMapper.readTree(response.body());
                    JsonNode choices = root.path("choices");
                    if (choices.isArray() && choices.size() > 0) {
                        JsonNode msgNode = choices.get(0).path("message").path("content");
                        if (!msgNode.isMissingNode()) {
                            log.info("OpenAI [{}] sinh câu trả lời thành công.", model);
                            return msgNode.asText().trim();
                        }
                    }
                } else {
                    log.warn("OpenAI API [{}] trả về status {}: {}", model, response.statusCode(), response.body());
                }
            } catch (Exception e) {
                log.warn("Lỗi khi gọi OpenAI API [{}]: {}", model, e.getMessage());
            }
        }
        return null;
    }

    private String callGemini(String systemInstruction, String userPrompt) {
        String apiKey = aiProperties.getLlm().getApiKey();
        if (apiKey == null || apiKey.isBlank()) {
            apiKey = System.getenv("GEMINI_API_KEY");
        }
        if (apiKey == null || apiKey.isBlank()) {
            return null;
        }

        String primaryModel = aiProperties.getLlm().getModelName();
        List<String> modelsToTry = new ArrayList<>();
        if (primaryModel != null && !primaryModel.isBlank()) {
            modelsToTry.add(primaryModel);
        }
        for (String m : List.of("gemini-1.5-flash", "gemini-1.5-flash-8b", "gemini-2.0-flash", "gemini-1.5-pro", "gemini-2.0-flash-lite")) {
            if (!modelsToTry.contains(m)) {
                modelsToTry.add(m);
            }
        }

        String combinedPrompt = systemInstruction + "\n\n[CÂU HỎI]:\n" + userPrompt;

        for (String model : modelsToTry) {
            try {
                String url = "https://generativelanguage.googleapis.com/v1beta/models/" + model + ":generateContent?key=" + apiKey;

                Map<String, Object> body = Map.of(
                        "contents", List.of(
                                Map.of("parts", List.of(Map.of("text", combinedPrompt)))
                        ),
                        "generationConfig", Map.of(
                                "temperature", aiProperties.getLlm().getTemperature(),
                                "maxOutputTokens", aiProperties.getLlm().getMaxTokens()
                        )
                );

                String jsonBody = objectMapper.writeValueAsString(body);
                HttpRequest request = HttpRequest.newBuilder()
                        .uri(URI.create(url))
                        .header("Content-Type", "application/json")
                        .timeout(Duration.ofSeconds(12))
                        .POST(HttpRequest.BodyPublishers.ofString(jsonBody, StandardCharsets.UTF_8))
                        .build();

                HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));
                if (response.statusCode() == 200) {
                    JsonNode root = objectMapper.readTree(response.body());
                    JsonNode candidates = root.path("candidates");
                    if (candidates.isArray() && candidates.size() > 0) {
                        JsonNode textNode = candidates.get(0).path("content").path("parts").get(0).path("text");
                        if (!textNode.isMissingNode()) {
                            return textNode.asText().trim();
                        }
                    }
                } else if (response.statusCode() == 503 || response.statusCode() == 429 || response.statusCode() == 404) {
                    log.warn("Gemini model [{}] trả về HTTP {} (Quá tải hoặc không khả dụng). Đang tự động chuyển sang mô hình dự phòng tiếp theo...", model, response.statusCode());
                    try {
                        Thread.sleep(300);
                    } catch (InterruptedException ignored) {}
                } else {
                    log.warn("Gemini generateContent [{}] status {}: {}", model, response.statusCode(), response.body());
                }
            } catch (Exception e) {
                log.warn("Lỗi khi gọi Gemini model [{}]: {}. Thử model tiếp theo...", model, e.getMessage());
            }
        }
        return null;
    }

    private String fallbackLessonReasoning(String query, String context, List<QueryModels.CitationItem> citations) {
        StringBuilder sb = new StringBuilder();
        sb.append("Dịch vụ AI đang tạm thời đạt hạn mức lượt gọi (Gemini Quota) hoặc đang kết nối lại. ");

        String cleanContext = sanitizeContext(context);
        if (!cleanContext.isBlank()) {
            sb.append("Dưới đây là phần kiến thức liên quan được trích xuất từ tài liệu bài học để bạn tham khảo:\n\n");
            sb.append(cleanContext).append("\n\n");
        } else {
            sb.append("Tôi đã ghi nhận câu hỏi của bạn. Vui lòng thử lại sau ít phút hoặc nạp thêm lượt token để trò chuyện trực tiếp với AI nhé.\n\n");
        }

        if (citations != null && !citations.isEmpty()) {
            sb.append("📚 **Nguồn tài liệu tham khảo trong bài học:**\n");
            for (QueryModels.CitationItem c : citations) {
                sb.append(String.format("• Tài liệu: `%s` (Trang %s)\n", c.getSource(), c.getPage()));
            }
        }

        return sb.toString().trim();
    }

    private String sanitizeContext(String context) {
        if (context == null || context.isBlank() || context.contains("Không tìm thấy nội dung PDF trực tiếp")) {
            return "";
        }
        if (context.contains("\uFFFD") || context.contains("NNOO") || context.contains("XU`tX") || context.contains("PQQQ")) {
            return "";
        }
        // Kiểm tra tỷ lệ ký tự chữ/số
        long letterCount = context.chars().filter(Character::isLetterOrDigit).count();
        if ((double) letterCount / context.length() < 0.50) {
            return "";
        }

        String cleaned = context.replaceAll("\r\n|\r", "\n")
                .replaceAll("[ \t]+", " ")
                .replaceAll("\n\\s*\n+", "\n\n")
                .trim();

        if (cleaned.length() > 500) {
            cleaned = cleaned.substring(0, 500) + "...";
        }
        return cleaned;
    }

    private String fallbackQuizReasoning(String question, List<String> options, String evidence, String teacherExplanation, List<QueryModels.CitationItem> citations) {
        StringBuilder sb = new StringBuilder();
        sb.append("### Phân tích câu hỏi trắc nghiệm:\n\n");

        if (teacherExplanation != null && !teacherExplanation.isBlank() && !teacherExplanation.contains("Chưa có lời giải thích")) {
            sb.append("**Căn cứ chuẩn từ giảng viên:**\n").append(teacherExplanation.trim()).append("\n\n");
        }

        String cleanEvidence = sanitizeContext(evidence);
        if (!cleanEvidence.isBlank()) {
            sb.append("**Kiến thức đối chiếu từ tài liệu bài giảng:**\n").append(cleanEvidence.trim()).append("\n\n");
        } else {
            sb.append("Đáp án đúng được xác định dựa theo định nghĩa và chuẩn kiến thức cốt lõi trong bài học. Các phương án khác chưa chính xác hoặc thiếu điều kiện cần thiết.\n\n");
        }

        if (citations != null && !citations.isEmpty()) {
            sb.append("📚 **Nguồn tài liệu PDF tham khảo:**\n");
            for (QueryModels.CitationItem c : citations) {
                sb.append(String.format("- Tài liệu: `%s` (Trang %s)\n", c.getSource(), c.getPage()));
            }
        }
        return sb.toString().trim();
    }

    private String formatQuizMarkdown(String text) {
        if (text == null) return "";
        return text.replaceAll("\r\n|\r", "\n").trim();
    }
}
