package com.example.back_end.rag;

import com.example.back_end.config.AIProperties;
import com.mongodb.ConnectionString;
import com.mongodb.MongoClientSettings;
import com.mongodb.client.*;
import com.mongodb.client.model.Filters;
import com.mongodb.client.model.IndexOptions;
import com.mongodb.client.model.Indexes;
import com.mongodb.client.model.ReplaceOptions;
import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.bson.Document;
import org.bson.conversions.Bson;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.concurrent.TimeUnit;

@Slf4j
@Component
@RequiredArgsConstructor
public class VectorDb {

    private final AIProperties aiProperties;
    private final Embeddings embeddings;

    private MongoClient mongoClient;
    private MongoCollection<Document> collection;
    private final List<PdfLoader.ChunkItem> inMemoryStore = new CopyOnWriteArrayList<>();

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
            this.collection = db.getCollection(aiProperties.getMongodb().getCollection());

            // Test kết nối nhanh
            db.runCommand(new Document("ping", 1));

            // Tự động dọn dẹp các chunk rác font nhị phân cũ nếu có trong MongoDB
            try {
                collection.deleteMany(Filters.or(
                        Filters.regex("text", ".*\\uFFFD.*"),
                        Filters.regex("text", ".*NNOO.*"),
                        Filters.regex("text", ".*XU`tX.*")
                ));
            } catch (Exception ignored) {}

            // Tạo index
            collection.createIndex(Indexes.ascending("chunk_id"), new IndexOptions().unique(true));
            collection.createIndex(Indexes.ascending("lesson_id"));
            collection.createIndex(Indexes.ascending("course_id"));
            log.info("Kết nối MongoDB thành công: Database '{}', Collection '{}'",
                    aiProperties.getMongodb().getDatabase(), aiProperties.getMongodb().getCollection());
        } catch (Exception e) {
            log.warn("MongoDB chưa sẵn sàng ({}). Hệ thống kích hoạt In-Memory Vector Store dự phòng.", e.getMessage());
            this.collection = null;
        }
    }

    @PreDestroy
    public void close() {
        if (mongoClient != null) {
            try {
                mongoClient.close();
            } catch (Exception ignored) {}
        }
    }

    public static boolean isGarbageChunk(String text) {
        if (text == null || text.isBlank() || text.length() < 10) return true;
        if (text.contains("\uFFFD")) return true;
        if (text.contains("NNOO") || text.contains("XU`tX") || text.contains("PQQQ") || text.contains("SSTTT")) return true;
        long letterCount = text.chars().filter(c -> Character.isLetterOrDigit(c) || Character.isWhitespace(c)).count();
        double ratio = (double) letterCount / text.length();
        return ratio < 0.60;
    }

    public int upsertChunks(List<PdfLoader.ChunkItem> chunks) {
        if (chunks == null || chunks.isEmpty()) return 0;

        int savedCount = 0;
        for (PdfLoader.ChunkItem chunk : chunks) {
            if (isGarbageChunk(chunk.getText())) {
                continue; // Bỏ qua không lưu chunk rác
            }

            if (chunk.getEmbedding() == null || chunk.getEmbedding().isEmpty()) {
                chunk.setEmbedding(embeddings.embedText(chunk.getText()));
            }

            // 1. Lưu vào MongoDB nếu sẵn sàng
            if (collection != null) {
                try {
                    Document doc = new Document("chunk_id", chunk.getChunkId())
                            .append("lesson_id", chunk.getLessonId())
                            .append("course_id", chunk.getCourseId())
                            .append("source_file", chunk.getSourceFile())
                            .append("page_number", chunk.getPageNumber())
                            .append("chunk_index", chunk.getChunkIndex())
                            .append("text", chunk.getText())
                            .append("created_at", chunk.getCreatedAt())
                            .append("embedding", chunk.getEmbedding());

                    collection.replaceOne(
                            Filters.eq("chunk_id", chunk.getChunkId()),
                            doc,
                            new ReplaceOptions().upsert(true)
                    );
                } catch (Exception e) {
                    log.warn("Lỗi ghi chunk {} vào MongoDB: {}", chunk.getChunkId(), e.getMessage());
                }
            }

            // 2. Lưu vào in-memory backup
            inMemoryStore.removeIf(item -> item.getChunkId().equals(chunk.getChunkId()));
            inMemoryStore.add(chunk);
            savedCount++;
        }

        return savedCount;
    }

    public List<PdfLoader.ChunkItem> searchRelevantChunks(String query, Integer lessonId, Integer courseId, int topK) {
        if (query == null || query.isBlank()) return Collections.emptyList();

        List<Double> queryEmbedding = embeddings.embedText(query);
        List<PdfLoader.ChunkItem> candidates = new ArrayList<>();

        boolean mongoReadSuccess = false;
        if (collection != null) {
            try {
                Bson filter;
                if (lessonId != null) {
                    filter = Filters.eq("lesson_id", lessonId);
                } else if (courseId != null) {
                    filter = Filters.eq("course_id", courseId);
                } else {
                    filter = new Document();
                }

                FindIterable<Document> docs = collection.find(filter);
                for (Document doc : docs) {
                    String chunkText = doc.getString("text");
                    if (isGarbageChunk(chunkText)) {
                        continue; // Bỏ qua chunk rác
                    }

                    List<Double> emb = doc.getList("embedding", Double.class);
                    candidates.add(PdfLoader.ChunkItem.builder()
                            .chunkId(doc.getString("chunk_id"))
                            .lessonId(doc.getInteger("lesson_id"))
                            .courseId(doc.getInteger("course_id"))
                            .sourceFile(doc.getString("source_file"))
                            .pageNumber(doc.getInteger("page_number"))
                            .chunkIndex(doc.getInteger("chunk_index"))
                            .text(chunkText)
                            .embedding(emb)
                            .build());
                }
                if (!candidates.isEmpty()) {
                    mongoReadSuccess = true;
                }
            } catch (Exception e) {
                log.warn("Lỗi đọc từ MongoDB ({}). Chuyển sang đọc In-Memory Store.", e.getMessage());
            }
        }

        if (!mongoReadSuccess) {
            for (PdfLoader.ChunkItem item : inMemoryStore) {
                if (isGarbageChunk(item.getText())) {
                    continue;
                }
                if (lessonId != null && !lessonId.equals(item.getLessonId())) {
                    continue;
                }
                if (courseId != null && !courseId.equals(item.getCourseId())) {
                    continue;
                }
                candidates.add(item);
            }
        }

        if (candidates.isEmpty() && !inMemoryStore.isEmpty()) {
            candidates.addAll(inMemoryStore);
        }

        List<PdfLoader.ChunkItem> scored = new ArrayList<>();
        for (PdfLoader.ChunkItem c : candidates) {
            if (c.getEmbedding() == null) continue;
            double score = Embeddings.cosineSimilarity(queryEmbedding, c.getEmbedding());
            c.setScore(Math.round(score * 10000.0) / 10000.0);
            scored.add(c);
        }

        scored.sort((a, b) -> Double.compare(b.getScore(), a.getScore()));
        return scored.subList(0, Math.min(topK, scored.size()));
    }

    public int getCachedCount() {
        return inMemoryStore.size();
    }
}
