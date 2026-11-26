package com.example.back_end.rag;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.zip.InflaterInputStream;

@Slf4j
@Component
public class PdfLoader {

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ChunkItem {
        private String chunkId;
        private Integer lessonId;
        private Integer courseId;
        private String sourceFile;
        private Integer pageNumber;
        private Integer chunkIndex;
        private String text;
        private String createdAt;
        private List<Double> embedding;
        private Double score;
    }

    public String cleanText(String text) {
        if (text == null) return "";
        // 1. Loại bỏ các ký tự điều khiển non-printable và replacement character \uFFFD
        String cleaned = text.replaceAll("[\\uFFFD\\u0000-\\u0008\\u000B\\u000C\\u000E-\\u001F]", " ")
                             .replaceAll("\r\n|\r", "\n")
                             .replaceAll("[ \t]+", " ")
                             .replaceAll("\n\\s*\n+", "\n\n")
                             .trim();

        if (cleaned.length() < 10) return "";

        // 2. Kiểm tra tỷ lệ ký tự chữ cái/số hợp lệ (loại bỏ triệt để rác nhị phân / font bytecode)
        long letterCount = cleaned.chars()
                .filter(c -> Character.isLetterOrDigit(c) || Character.isWhitespace(c) || c == '.' || c == ',' || c == ':' || c == '-' || c == '(' || c == ')')
                .count();
        double ratio = (double) letterCount / cleaned.length();
        if (ratio < 0.60) {
            return "";
        }

        return cleaned;
    }

    public List<String> chunkText(String text, int chunkSize, int chunkOverlap) {
        List<String> chunks = new ArrayList<>();
        if (text == null || text.isBlank()) return chunks;

        if (text.length() <= chunkSize) {
            chunks.add(text.trim());
            return chunks;
        }

        int start = 0;
        int len = text.length();

        while (start < len) {
            int end = Math.min(start + chunkSize, len);
            if (end >= len) {
                String sub = text.substring(start).trim();
                if (!sub.isEmpty()) chunks.add(sub);
                break;
            }

            int splitPos = -1;
            String[] seps = {".\n", ". ", "?\n", "? ", "!\n", "! ", "\n\n", "\n", " "};
            for (String sep : seps) {
                int pos = text.lastIndexOf(sep, end);
                if (pos > start + chunkSize / 2) {
                    splitPos = pos + sep.length();
                    break;
                }
            }

            if (splitPos <= start) {
                splitPos = end;
            }

            String chunk = text.substring(start, splitPos).trim();
            if (!chunk.isEmpty()) {
                chunks.add(chunk);
            }

            start = Math.max(splitPos - chunkOverlap, start + 1);
        }

        return chunks;
    }

    public List<String> extractPagesFromPdf(File pdfFile) {
        List<String> pages = new ArrayList<>();
        if (pdfFile == null || !pdfFile.exists()) {
            return pages;
        }

        try {
            byte[] bytes = Files.readAllBytes(pdfFile.toPath());
            String rawIso = new String(bytes, StandardCharsets.ISO_8859_1);

            // 1. Phân tích đối tượng Page trong PDF: /Type/Page hoặc /Type /Page
            Pattern pagePattern = Pattern.compile("(\\d+)\\s+0\\s+obj\\s*<<[^>]*?/Type\\s*/Page\\b(.*?)endobj", Pattern.DOTALL);
            Matcher pageMatcher = pagePattern.matcher(rawIso);

            List<Integer> contentObjIds = new ArrayList<>();
            while (pageMatcher.find()) {
                String pageBody = pageMatcher.group(2);
                // Tìm /Contents: dạng "/Contents 4 0 R" hoặc mảng "/Contents [ 4 0 R 5 0 R ]"
                Matcher singleContent = Pattern.compile("/Contents\\s+(\\d+)\\s+0\\s+R").matcher(pageBody);
                if (singleContent.find()) {
                    contentObjIds.add(Integer.parseInt(singleContent.group(1)));
                } else {
                    Matcher arrayContent = Pattern.compile("/Contents\\s*\\[([^\\]]+)\\]").matcher(pageBody);
                    if (arrayContent.find()) {
                        String inner = arrayContent.group(1);
                        Matcher refMatcher = Pattern.compile("(\\d+)\\s+0\\s+R").matcher(inner);
                        while (refMatcher.find()) {
                            contentObjIds.add(Integer.parseInt(refMatcher.group(1)));
                        }
                    }
                }
            }

            // Nếu tìm thấy các stream nội dung chỉ định của trang
            if (!contentObjIds.isEmpty()) {
                for (Integer objId : contentObjIds) {
                    String pageText = extractTextFromSpecificObject(rawIso, bytes, objId);
                    String cleaned = cleanText(pageText);
                    if (!cleaned.isEmpty()) {
                        pages.add(cleaned);
                    }
                }
            } else {
                // Fallback nếu file PDF cấu trúc đặc biệt: quét stream nhưng BỎ QUA triệt để các stream Font, Image, XRef
                pages.addAll(extractStreamsWithStrictFiltering(rawIso, bytes));
            }
        } catch (Exception e) {
            log.error("Lỗi trích xuất văn bản từ file PDF {}: {}", pdfFile.getName(), e.getMessage());
        }

        return pages;
    }

    private String extractTextFromSpecificObject(String rawIso, byte[] bytes, int objId) {
        String targetObj = objId + " 0 obj";
        int objIdx = rawIso.indexOf(targetObj);
        if (objIdx == -1) return "";

        int streamIdx = rawIso.indexOf("stream", objIdx);
        if (streamIdx == -1) return "";

        int endobjIdx = rawIso.indexOf("endobj", objIdx);
        if (endobjIdx != -1 && streamIdx > endobjIdx) return "";

        int start = streamIdx + 6;
        if (start < bytes.length && bytes[start] == '\r') start++;
        if (start < bytes.length && bytes[start] == '\n') start++;

        int end = rawIso.indexOf("endstream", start);
        if (end == -1) return "";
        while (end > start && (bytes[end - 1] == '\r' || bytes[end - 1] == '\n')) {
            end--;
        }

        byte[] streamBytes = new byte[end - start];
        System.arraycopy(bytes, start, streamBytes, 0, streamBytes.length);

        String uncompressed = decompressStream(streamBytes);
        if (uncompressed == null || uncompressed.isBlank()) return "";

        return extractTextFromContentStream(uncompressed);
    }

    private String decompressStream(byte[] streamBytes) {
        if (streamBytes == null || streamBytes.length == 0) return null;
        try (ByteArrayInputStream bais = new ByteArrayInputStream(streamBytes);
             InflaterInputStream iis = new InflaterInputStream(bais);
             ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            byte[] buf = new byte[4096];
            int r;
            while ((r = iis.read(buf)) != -1) {
                baos.write(buf, 0, r);
            }
            return baos.toString(StandardCharsets.UTF_8);
        } catch (Exception ex) {
            // Thử decompress không dùng zlib header (nowrap) hoặc đọc raw nếu không nén
            try (ByteArrayInputStream bais = new ByteArrayInputStream(streamBytes);
                 InflaterInputStream iis = new InflaterInputStream(bais, new java.util.zip.Inflater(true));
                 ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
                byte[] buf = new byte[4096];
                int r;
                while ((r = iis.read(buf)) != -1) {
                    baos.write(buf, 0, r);
                }
                return baos.toString(StandardCharsets.UTF_8);
            } catch (Exception ignored) {
                return new String(streamBytes, StandardCharsets.UTF_8);
            }
        }
    }

    private String extractTextFromContentStream(String contentStream) {
        // Chỉ trích xuất nội dung nằm giữa BT (Begin Text) và ET (End Text)
        Pattern btPattern = Pattern.compile("BT(.*?)ET", Pattern.DOTALL);
        Matcher btMatcher = btPattern.matcher(contentStream);

        StringBuilder sb = new StringBuilder();
        Pattern textPattern = Pattern.compile("\\(([^)]*)\\)");

        while (btMatcher.find()) {
            String block = btMatcher.group(1);
            Matcher tm = textPattern.matcher(block);
            while (tm.find()) {
                String token = tm.group(1)
                        .replace("\\(", "(")
                        .replace("\\)", ")")
                        .replace("\\n", " ")
                        .replace("\\r", "")
                        .replace("\\t", " ");
                token = token.replaceAll("[\\uFFFD\\u0000-\\u001F]", "").trim();
                if (!token.isEmpty()) {
                    sb.append(token).append(" ");
                }
            }
        }

        if (sb.length() == 0) {
            Matcher tm = textPattern.matcher(contentStream);
            while (tm.find()) {
                String token = tm.group(1)
                        .replace("\\(", "(")
                        .replace("\\)", ")")
                        .replace("\\n", " ")
                        .replace("\\r", "")
                        .replace("\\t", " ");
                token = token.replaceAll("[\\uFFFD\\u0000-\\u001F]", "").trim();
                if (token.length() > 1) {
                    sb.append(token).append(" ");
                }
            }
        }

        return sb.toString().trim();
    }

    private List<String> extractStreamsWithStrictFiltering(String rawIso, byte[] bytes) {
        List<String> pages = new ArrayList<>();
        int streamIdx = 0;
        StringBuilder fullDoc = new StringBuilder();

        while ((streamIdx = rawIso.indexOf("stream", streamIdx)) != -1) {
            int dictStart = Math.max(0, streamIdx - 500);
            String dictBefore = rawIso.substring(dictStart, streamIdx);

            // BỎ QUA triệt để các stream Font, Image, Metadata, XRef, ObjStm
            boolean isForbidden = dictBefore.contains("/Type /Font") || dictBefore.contains("/Type/Font")
                    || dictBefore.contains("/FontFile") || dictBefore.contains("/FontFile2") || dictBefore.contains("/FontFile3")
                    || dictBefore.contains("/Length1") || dictBefore.contains("/Length2")
                    || dictBefore.contains("/Subtype /Image") || dictBefore.contains("/Subtype/Image")
                    || dictBefore.contains("/Type /XRef") || dictBefore.contains("/Type/XRef")
                    || dictBefore.contains("/Type /ObjStm") || dictBefore.contains("/Type/ObjStm")
                    || dictBefore.contains("/Type /Metadata") || dictBefore.contains("/Subtype /XML");

            int start = streamIdx + 6;
            if (start < bytes.length && bytes[start] == '\r') start++;
            if (start < bytes.length && bytes[start] == '\n') start++;

            int end = rawIso.indexOf("endstream", start);
            if (end == -1) break;

            if (!isForbidden) {
                while (end > start && (bytes[end - 1] == '\r' || bytes[end - 1] == '\n')) {
                    end--;
                }
                byte[] streamBytes = new byte[end - start];
                System.arraycopy(bytes, start, streamBytes, 0, streamBytes.length);

                String uncompressed = decompressStream(streamBytes);
                if (uncompressed != null && uncompressed.contains("BT") && uncompressed.contains("ET")) {
                    String extracted = extractTextFromContentStream(uncompressed);
                    String cleaned = cleanText(extracted);
                    if (!cleaned.isEmpty()) {
                        fullDoc.append(cleaned).append("\n\n");
                    }
                }
            }

            streamIdx = end + 9;
        }

        String cleanedDoc = cleanText(fullDoc.toString());
        if (!cleanedDoc.isEmpty()) {
            pages.add(cleanedDoc);
        }
        return pages;
    }

    public List<ChunkItem> loadAndChunkPdf(File pdfFile, Integer lessonId, Integer courseId, int chunkSize, int chunkOverlap) {
        List<ChunkItem> chunks = new ArrayList<>();
        if (pdfFile == null || !pdfFile.exists()) {
            return chunks;
        }

        List<String> pages = extractPagesFromPdf(pdfFile);
        String filename = pdfFile.getName();
        String stem = filename.contains(".") ? filename.substring(0, filename.lastIndexOf('.')) : filename;
        String nowIso = Instant.now().toString();

        int pageNum = 1;
        for (String pageContent : pages) {
            List<String> textBlocks = chunkText(pageContent, chunkSize, chunkOverlap);
            int chunkIndex = 1;
            for (String block : textBlocks) {
                String chunkId = stem + "_p" + pageNum + "_c" + chunkIndex;
                chunks.add(ChunkItem.builder()
                        .chunkId(chunkId)
                        .lessonId(lessonId)
                        .courseId(courseId)
                        .sourceFile(filename)
                        .pageNumber(pageNum)
                        .chunkIndex(chunkIndex)
                        .text(block)
                        .createdAt(nowIso)
                        .build());
                chunkIndex++;
            }
            pageNum++;
        }

        return chunks;
    }
}
