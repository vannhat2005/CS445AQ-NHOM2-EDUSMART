package com.example.back_end.tools;

import org.springframework.stereotype.Component;

/**
 * PolicyTool - Tương thích cấu trúc hiển thị theo kiến trúc tham khảo.
 * Kế thừa / ủy nhiệm cho LessonTool để tra cứu kiến thức và quy định học tập.
 */
@Component
public class PolicyTool extends LessonTool {

    public PolicyTool(com.example.back_end.rag.VectorDb vectorDb, SqlTool sqlTool) {
        super(vectorDb, sqlTool);
    }
}
