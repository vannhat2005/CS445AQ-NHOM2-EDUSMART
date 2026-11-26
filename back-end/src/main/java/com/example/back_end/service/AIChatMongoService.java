package com.example.back_end.service;

import com.example.back_end.config.AIProperties;
import com.mongodb.ConnectionString;
import com.mongodb.MongoClientSettings;
import com.mongodb.client.MongoClient;
import com.mongodb.client.MongoClients;
import com.mongodb.client.MongoCollection;
import com.mongodb.client.MongoDatabase;
import com.mongodb.client.model.Filters;
import com.mongodb.client.model.IndexOptions;
import com.mongodb.client.model.Indexes;
import com.mongodb.client.model.Sorts;
import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.bson.Document;
import org.bson.conversions.Bson;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Service lưu trữ và truy vấn lịch sử trò chuyện AI vào MongoDB
 * Collection: ai_chat_histories
 * Cấu trúc Document tuân thủ 100% các field trong Entity AIChatHistory:
 * - chatId / chat_id: Khóa chính tự tăng
 * - resultId / result_id: ID kết quả làm quiz (nullable)
 * - lessonId / lesson_id: ID bài học (nullable)
 * - messageRole / message_role: "User" hoặc "AI"
 * - messageContent / message_content: Nội dung chat
 * - createdAt / created_at: Thời gian tạo (ISO 8601 String)
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AIChatMongoService {

    private final AIProperties aiProperties;

    private static final String DEFAULT_CHAT_COLLECTION = "ai_chat_histories";
    private final AtomicInteger chatCounter = new AtomicInteger(1);
    private final List<Document> inMemoryHistory = new CopyOnWriteArrayList<>();

    private MongoClient mongoClient;
    private MongoCollection<Document> collection;

    @PostConstruct
    public void init() {
        try {
            String uri = aiProperties.getMongodb().getUri();
            int timeoutMs = aiProperties.getMongodb().getTimeoutMs();

            MongoClientSettings settings = MongoClientSettings.builder()
                    .applyConnectionString(new ConnectionString(uri))
                    .applyToSocketSettings(builder ->
                            builder.connectTimeout(timeoutMs, TimeUnit.MILLISECONDS)
                                   .readTimeout(timeoutMs, TimeUnit.MILLISECONDS))
                    .applyToClusterSettings(builder ->
                            builder.serverSelectionTimeout(timeoutMs, TimeUnit.MILLISECONDS))
                    .build();

            this.mongoClient = MongoClients.create(settings);
            MongoDatabase db = mongoClient.getDatabase(aiProperties.getMongodb().getDatabase());
            this.collection = db.getCollection(DEFAULT_CHAT_COLLECTION);

            // Test ping
            db.runCommand(new Document("ping", 1));

            // Tạo các Index tra cứu nhanh
            collection.createIndex(Indexes.ascending("chatId"), new IndexOptions().unique(true));
            collection.createIndex(Indexes.ascending("lessonId"));
            collection.createIndex(Indexes.ascending("resultId"));
            collection.createIndex(Indexes.ascending("createdAt"));

            // Khởi tạo bộ đếm ID dựa trên bản ghi lớn nhất hiện có
            Document maxDoc = collection.find().sort(Sorts.descending("chatId")).first();
            if (maxDoc != null && maxDoc.get("chatId") instanceof Number num) {
                chatCounter.set(num.intValue() + 1);
            }

            // Tự động dọn dẹp các bản ghi giải thích Quiz bị lẫn vào Chatbox Lesson trước đây
            cleanContaminatedQuizMessages();

            log.info("[MongoDB AI Chat] Kết nối thành công tới collection '{}' trong database '{}'. Sẵn sàng lưu lịch sử.",
                    DEFAULT_CHAT_COLLECTION, aiProperties.getMongodb().getDatabase());
        } catch (Exception e) {
            log.warn("[MongoDB AI Chat] MongoDB chưa sẵn sàng ({}). Tự động kích hoạt In-Memory Chat Store dự phòng.", e.getMessage());
            this.collection = null;
        }
    }

    private void cleanContaminatedQuizMessages() {
        if (collection != null) {
            try {
                Bson contaminatedFilter = Filters.or(
                        Filters.regex("messageContent", "Giải thích ngắn gọn 2-3 câu vì sao đáp án đúng"),
                        Filters.regex("message_content", "Giải thích ngắn gọn 2-3 câu vì sao đáp án đúng"),
                        Filters.regex("messageContent", "không dùng các ký tự markdown như"),
                        Filters.regex("message_content", "không dùng các ký tự markdown như"),
                        Filters.eq("messageContent", "Kiểm tra giúp phát hiện và sửa lỗi."),
                        Filters.eq("messageContent", "Đây là kiến thức nền tảng được trình bày trong chương.")
                );
                var deleteResult = collection.deleteMany(contaminatedFilter);
                if (deleteResult.getDeletedCount() > 0) {
                    log.info("[MongoDB AI Chat] Đã xóa {} bản ghi Quiz bị lẫn vào Chatbox Lesson.", deleteResult.getDeletedCount());
                }
            } catch (Exception e) {
                log.warn("[MongoDB AI Chat] Không thể tự động dọn bản ghi cũ: {}", e.getMessage());
            }
        }
        inMemoryHistory.removeIf(doc -> {
            String content = doc.getString("messageContent");
            return isQuizContent(content);
        });
    }

    @PreDestroy
    public void close() {
        if (mongoClient != null) {
            try {
                mongoClient.close();
            } catch (Exception ignored) {}
        }
    }

    /**
     * Lưu 1 tin nhắn vào MongoDB với đúng các field của Entity AIChatHistory
     */
    public Map<String, Object> saveMessage(Integer lessonId, Integer resultId, String messageRole, String messageContent) {
        if (messageContent == null || messageContent.isBlank()) {
            return Collections.emptyMap();
        }

        int id = chatCounter.getAndIncrement();
        String nowStr = LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME);

        Document doc = new Document();
        // Cung cấp cả camelCase và snake_case để tương thích hoàn toàn với entity
        doc.put("chatId", id);
        doc.put("chat_id", id);
        doc.put("lessonId", lessonId);
        doc.put("lesson_id", lessonId);
        doc.put("resultId", resultId);
        doc.put("result_id", resultId);
        doc.put("messageRole", messageRole != null ? messageRole : "User");
        doc.put("message_role", messageRole != null ? messageRole : "User");
        doc.put("messageContent", messageContent);
        doc.put("message_content", messageContent);
        doc.put("createdAt", nowStr);
        doc.put("created_at", nowStr);

        boolean savedMongo = false;
        if (collection != null) {
            try {
                collection.insertOne(doc);
                savedMongo = true;
                log.info("[MongoDB AI Chat] Đã lưu tin nhắn vào MongoDB: chatId={}, role={}, lessonId={}, resultId={}",
                        id, messageRole, lessonId, resultId);
            } catch (Exception e) {
                log.warn("[MongoDB AI Chat] Lỗi khi ghi MongoDB ({}). Chuyển sang lưu bộ nhớ đệm.", e.getMessage());
            }
        }

        if (!savedMongo) {
            inMemoryHistory.add(doc);
            log.info("[In-Memory AI Chat] Đã lưu tin nhắn vào RAM: chatId={}, role={}, lessonId={}", id, messageRole, lessonId);
        }

        return toMap(doc);
    }

    /**
     * Lấy lịch sử chat theo bài học (lessonId) từ MongoDB
     */
    public List<Map<String, Object>> getLessonHistory(Integer lessonId) {
        if (lessonId == null) {
            return Collections.emptyList();
        }

        List<Map<String, Object>> list = new ArrayList<>();
        boolean mongoReadSuccess = false;

        if (collection != null) {
            try {
                Bson filter = Filters.or(Filters.eq("lessonId", lessonId), Filters.eq("lesson_id", lessonId));

                for (Document doc : collection.find(filter).sort(Sorts.ascending("chatId"))) {
                    String content = doc.getString("messageContent");
                    if (content == null) content = doc.getString("message_content");
                    if (isQuizContent(content)) {
                        continue;
                    }
                    list.add(toMap(doc));
                }
                mongoReadSuccess = true;
            } catch (Exception e) {
                log.warn("[MongoDB AI Chat] Lỗi đọc MongoDB ({}). Chuyển sang đọc In-Memory Store.", e.getMessage());
            }
        }

        if (!mongoReadSuccess) {
            for (Document doc : inMemoryHistory) {
                Object lid = doc.get("lessonId");
                String content = doc.getString("messageContent");

                if (isQuizContent(content)) continue;

                if (lid instanceof Number n && n.intValue() == lessonId.intValue()) {
                    list.add(toMap(doc));
                }
            }
        }

        return list;
    }

    /**
     * Lấy lịch sử chat theo quiz result (resultId) hoặc bài học
     */
    public List<Map<String, Object>> getQuizHistory(Integer resultId, Integer lessonId) {
        List<Map<String, Object>> list = new ArrayList<>();
        boolean mongoReadSuccess = false;

        if (collection != null) {
            try {
                List<Bson> filters = new ArrayList<>();
                if (resultId != null) {
                    filters.add(Filters.or(Filters.eq("resultId", resultId), Filters.eq("result_id", resultId)));
                } else if (lessonId != null) {
                    filters.add(Filters.or(Filters.eq("lessonId", lessonId), Filters.eq("lesson_id", lessonId)));
                }

                Bson combined = filters.isEmpty() ? new Document() : (filters.size() == 1 ? filters.get(0) : Filters.and(filters));
                for (Document doc : collection.find(combined).sort(Sorts.ascending("chatId"))) {
                    list.add(toMap(doc));
                }
                mongoReadSuccess = true;
            } catch (Exception e) {
                log.warn("[MongoDB AI Chat] Lỗi đọc quiz history từ MongoDB: {}", e.getMessage());
            }
        }

        if (!mongoReadSuccess) {
            for (Document doc : inMemoryHistory) {
                if (resultId != null) {
                    Object rid = doc.get("resultId");
                    if (rid instanceof Number n && n.intValue() == resultId.intValue()) {
                        list.add(toMap(doc));
                    }
                } else if (lessonId != null) {
                    Object lid = doc.get("lessonId");
                    if (lid instanceof Number n && n.intValue() == lessonId.intValue()) {
                        list.add(toMap(doc));
                    }
                }
            }
        }

        return list;
    }

    public void clearLessonHistory(Integer lessonId) {
        if (lessonId == null) return;
        if (collection != null) {
            try {
                Bson filter = Filters.or(Filters.eq("lessonId", lessonId), Filters.eq("lesson_id", lessonId));
                collection.deleteMany(filter);
                log.info("[MongoDB AI Chat] Đã xóa lịch sử chat của lessonId: {}", lessonId);
            } catch (Exception e) {
                log.warn("[MongoDB AI Chat] Lỗi khi xóa lịch sử chat lesson: {}", e.getMessage());
            }
        }
        inMemoryHistory.removeIf(doc -> {
            Object lid = doc.get("lessonId");
            return lid instanceof Number n && n.intValue() == lessonId.intValue();
        });
    }

    private boolean isQuizContent(String text) {
        if (text == null) return false;
        return text.contains("Giải thích ngắn gọn 2-3 câu vì sao đáp án đúng")
                || text.contains("không dùng các ký tự markdown như")
                || text.startsWith("Kiểm tra giúp phát hiện và sửa lỗi.")
                || text.startsWith("Đây là kiến thức nền tảng được trình bày trong chương.");
    }

    private Map<String, Object> toMap(Document doc) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("chatId", doc.get("chatId"));
        map.put("lessonId", doc.get("lessonId"));
        map.put("resultId", doc.get("resultId"));
        map.put("messageRole", doc.get("messageRole"));
        map.put("messageContent", doc.get("messageContent"));
        map.put("createdAt", doc.get("createdAt"));
        return map;
    }
}
