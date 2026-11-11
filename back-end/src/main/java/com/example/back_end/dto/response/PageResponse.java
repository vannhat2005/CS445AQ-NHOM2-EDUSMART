package com.example.back_end.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor

public class PageResponse<T>{
    private List<T> content;        // Danh sách dữ liệu của trang hiện tại
    private int pageNo;             // Số trang hiện tại (thường bắt đầu từ 1 trên UI)
    private int pageSize;           // Kích thước trang
    private long totalElements;     // Tổng số bản ghi trong DB
    private int totalPages;         // Tổng số trang
    private boolean isLast;         // Có phải trang cuối không?

    // Helper map từ Page của Spring Data JPA sang PageResponse
    public static <T> PageResponse<T> of(org.springframework.data.domain.Page<T> page) {
        return PageResponse.<T>builder()
                .content(page.getContent())
                .pageNo(page.getNumber() + 1) // Spring Data JPA bắt đầu từ 0
                .pageSize(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .isLast(page.isLast())
                .build();
    }
}
