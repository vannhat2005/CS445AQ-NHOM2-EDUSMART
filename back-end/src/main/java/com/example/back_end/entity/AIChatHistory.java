package com.example.back_end.entity;

import com.example.back_end.enumType.MessageRole;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;


//Lịch sử trò chuyện với AI (AIChatHistories)
@Entity
@Table(name = "AIChatHistories")
@Data @NoArgsConstructor @AllArgsConstructor
public class AIChatHistory {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "chat_id")
    private Integer chatId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "result_id", nullable = true)
    private QuizResult result;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "lesson_id", nullable = true)
    private Lesson lesson;

    @Enumerated(EnumType.STRING)
    @Column(name = "message_role")
    private MessageRole messageRole;

    @Column(name = "message_content", columnDefinition = "TEXT")
    private String messageContent;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
