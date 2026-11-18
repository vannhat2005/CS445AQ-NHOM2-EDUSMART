package com.example.back_end.dto.response;

import lombok.Data;

@Data
public class CategoryResponse {

    private Integer categoryId;
    private String name;
    private String description;
    private Boolean status;
}