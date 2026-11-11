    package com.example.back_end.entity;

    import com.example.back_end.enumType.CourseStatus;
    import jakarta.persistence.*;
    import lombok.AllArgsConstructor;
    import lombok.Data;
    import lombok.NoArgsConstructor;
    import org.hibernate.annotations.CreationTimestamp;
    import org.hibernate.annotations.UpdateTimestamp;

    import java.math.BigDecimal;
    import java.time.LocalDateTime;

    @Entity
    @Table(name = "Courses")
    @Data @NoArgsConstructor @AllArgsConstructor
    public class Course {
        @Id
        @GeneratedValue(strategy = GenerationType.IDENTITY)
        @Column(name = "course_id")
        private Integer courseId;

        @Column(length = 255)
        private String title;

        @Column(columnDefinition = "TEXT")
        private String description;

        @Column(name = "learning_outcomes", columnDefinition = "JSON")
        private String learningOutcomes;

        @Column(precision = 10, scale = 2)
        private BigDecimal price;

        @Column(name = "image_url", length = 255)
        private String imageUrl;

        @ManyToOne(fetch = FetchType.LAZY)
        @JoinColumn(name = "instructor_id")
        private User instructor;

        @ManyToOne(fetch = FetchType.LAZY)
        @JoinColumn(name = "category_id")
        private Category category;

        @Enumerated(EnumType.STRING)
        private CourseStatus status;

        @CreationTimestamp
        @Column(name = "created_at", updatable = false)
        private LocalDateTime createdAt;

        @UpdateTimestamp
        @Column(name = "updated_at")
        private LocalDateTime updatedAt;
    }