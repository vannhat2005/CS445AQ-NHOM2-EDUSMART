package com.example.back_end.rag;

import com.example.back_end.config.AIProperties;
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
import java.security.MessageDigest;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class Embeddings {

    private final AIProperties aiProperties;
    private final ObjectMapper objectMapper;
    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(5))
            .build();

    public List<Double> embedText(String text) {
        if (text == null || text.isBlank()) {
            return generateLocalEmbedding("", aiProperties.getEmbeddings().getDimension());
        }

        String provider = aiProperties.getEmbeddings().getProvider();
        String apiKey = aiProperties.getLlm().getApiKey();
        if (apiKey == null || apiKey.isBlank()) {
            apiKey = System.getenv("GEMINI_API_KEY");
        }

        if ("gemini".equalsIgnoreCase(provider) && apiKey != null && !apiKey.isBlank()) {
            try {
                String model = aiProperties.getEmbeddings().getModelName();
                String url = "https://generativelanguage.googleapis.com/v1beta/" + model + ":embedContent?key=" + apiKey;

                Map<String, Object> body = Map.of(
                        "model", model,
                        "content", Map.of("parts", List.of(Map.of("text", text)))
                );

                String jsonBody = objectMapper.writeValueAsString(body);
                HttpRequest request = HttpRequest.newBuilder()
                        .uri(URI.create(url))
                        .header("Content-Type", "application/json")
                        .timeout(Duration.ofSeconds(8))
                        .POST(HttpRequest.BodyPublishers.ofString(jsonBody, StandardCharsets.UTF_8))
                        .build();

                HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));
                if (response.statusCode() == 200) {
                    JsonNode root = objectMapper.readTree(response.body());
                    JsonNode valuesNode = root.path("embedding").path("values");
                    if (valuesNode.isArray() && valuesNode.size() > 0) {
                        List<Double> vector = new ArrayList<>();
                        for (JsonNode val : valuesNode) {
                            vector.add(val.asDouble());
                        }
                        return vector;
                    }
                } else {
                    log.warn("Gemini Embedding API trả về status {}: {}", response.statusCode(), response.body());
                }
            } catch (Exception e) {
                log.warn("Lỗi gọi Gemini Embedding API ({}), chuyển sang Local Embedding.", e.getMessage());
            }
        } else if ("openai".equalsIgnoreCase(provider) && apiKey != null && !apiKey.isBlank()) {
            try {
                String url = "https://api.openai.com/v1/embeddings";
                String model = aiProperties.getEmbeddings().getModelName() != null && aiProperties.getEmbeddings().getModelName().contains("embedding")
                        ? aiProperties.getEmbeddings().getModelName()
                        : "text-embedding-3-small";

                Map<String, Object> body = Map.of(
                        "input", text,
                        "model", model
                );

                String jsonBody = objectMapper.writeValueAsString(body);
                HttpRequest request = HttpRequest.newBuilder()
                        .uri(URI.create(url))
                        .header("Content-Type", "application/json")
                        .header("Authorization", "Bearer " + apiKey)
                        .timeout(Duration.ofSeconds(8))
                        .POST(HttpRequest.BodyPublishers.ofString(jsonBody, StandardCharsets.UTF_8))
                        .build();

                HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));
                if (response.statusCode() == 200) {
                    JsonNode root = objectMapper.readTree(response.body());
                    JsonNode data = root.path("data");
                    if (data.isArray() && data.size() > 0) {
                        JsonNode embNode = data.get(0).path("embedding");
                        if (embNode.isArray()) {
                            List<Double> vector = new ArrayList<>();
                            for (JsonNode val : embNode) {
                                vector.add(val.asDouble());
                            }
                            return vector;
                        }
                    }
                } else {
                    log.warn("OpenAI Embedding API trả về status {}: {}", response.statusCode(), response.body());
                }
            } catch (Exception e) {
                log.warn("Lỗi gọi OpenAI Embedding API ({}), chuyển sang Local Embedding.", e.getMessage());
            }
        }

        return generateLocalEmbedding(text, aiProperties.getEmbeddings().getDimension());
    }

    public List<Double> generateLocalEmbedding(String text, int dimension) {
        double[] vec = new double[dimension];
        if (text == null || text.isBlank()) {
            List<Double> result = new ArrayList<>(dimension);
            for (int i = 0; i < dimension; i++) result.add(0.0);
            return result;
        }

        try {
            MessageDigest md5 = MessageDigest.getInstance("MD5");
            MessageDigest sha256 = MessageDigest.getInstance("SHA-256");

            String[] words = text.toLowerCase().split("\\s+");
            for (String word : words) {
                if (word.isBlank()) continue;
                byte[] hash = md5.digest(word.getBytes(StandardCharsets.UTF_8));
                int idx = Math.abs(java.nio.ByteBuffer.wrap(hash).getInt()) % dimension;
                vec[idx] += 1.0;
            }

            for (int i = 0; i < words.length - 1; i++) {
                String bigram = words[i] + "_" + words[i + 1];
                byte[] hash = sha256.digest(bigram.getBytes(StandardCharsets.UTF_8));
                int idx = Math.abs(java.nio.ByteBuffer.wrap(hash).getInt()) % dimension;
                vec[idx] += 1.5;
            }
        } catch (Exception ignored) {}

        // Chuẩn hóa L2 norm
        double sumSq = 0.0;
        for (double v : vec) sumSq += v * v;
        double norm = Math.sqrt(sumSq);

        List<Double> result = new ArrayList<>(dimension);
        for (double v : vec) {
            result.add(norm > 0 ? (v / norm) : 0.0);
        }
        return result;
    }

    public static double cosineSimilarity(List<Double> v1, List<Double> v2) {
        if (v1 == null || v2 == null || v1.isEmpty() || v2.isEmpty()) return 0.0;
        int size = Math.min(v1.size(), v2.size());
        double dot = 0.0;
        double norm1 = 0.0;
        double norm2 = 0.0;

        for (int i = 0; i < size; i++) {
            double a = v1.get(i);
            double b = v2.get(i);
            dot += a * b;
            norm1 += a * a;
            norm2 += b * b;
        }

        if (norm1 == 0.0 || norm2 == 0.0) return 0.0;
        return dot / (Math.sqrt(norm1) * Math.sqrt(norm2));
    }
}
