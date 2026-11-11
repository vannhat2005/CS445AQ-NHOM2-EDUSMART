package com.example.back_end.entity;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;


@Entity
@Table(name = "Categories")
@Data @NoArgsConstructor @AllArgsConstructor
public class Category {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "category_id")
    private Integer categoryId;

    @Column(length = 255)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    private Boolean status; // 1: TRUE (Hiển thị), 0: FALSE (Ẩn)
}