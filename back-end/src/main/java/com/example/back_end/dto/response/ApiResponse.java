package com.example.back_end.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL) // Không trả về các field bị null
public class ApiResponse<T>{
    @Builder.Default
    private int code = 1000; // Code 1000 mặc định là thành công

    private String message;

    private T result; // Dữ liệu trả về (nếu có)
}
