package com.example.back_end.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Data
@Component
@ConfigurationProperties(prefix = "ai")
public class AIProperties {

    private LlmConfig llm = new LlmConfig();
    private EmbeddingsConfig embeddings = new EmbeddingsConfig();
    private MongoConfig mongodb = new MongoConfig();
    private RagConfig rag = new RagConfig();
    private KafkaConfig kafka = new KafkaConfig();

    @Data
    public static class KafkaConfig {
        private Boolean enabled = true;
        private String topic = "lesson-pdf-topic";
    }

    @Data
    public static class LlmConfig {
        private String provider = "gemini";
        private String apiKey = "";
        private String modelName = "gemini-1.5-flash";
        private Double temperature = 0.3;
        private Integer maxTokens = 2048;
    }

    @Data
    public static class EmbeddingsConfig {
        private String provider = "gemini";
        private String modelName = "models/text-embedding-004";
        private Integer dimension = 768;
    }

    @Data
    public static class MongoConfig {
        private String uri = "mongodb://localhost:27017";
        private String database = "edusmart_ai_db";
        private String collection = "lesson_pdf_embeddings";
        private Integer timeoutMs = 3000;
    }

    @Data
    public static class RagConfig {
        private Integer chunkSize = 600;
        private Integer chunkOverlap = 100;
        private Integer topK = 4;
        private String uploadDir = "uploads/lesson-contents";
    }
}
