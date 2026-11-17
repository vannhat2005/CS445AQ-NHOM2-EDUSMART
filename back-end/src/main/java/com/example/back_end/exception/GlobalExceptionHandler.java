
package com.example.back_end.exception;

import com.example.back_end.dto.response.ApiResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    // ==========================================
    // 1. BẮT LỖI LOGIC NGHIỆP VỤ
    // ==========================================

    @ExceptionHandler(AppException.class)
    public ResponseEntity<ApiResponse<Void>> handlingAppException(
            AppException exception) {

        ErrorCode errorCode = exception.getErrorCode();

        ApiResponse<Void> apiResponse = ApiResponse.<Void>builder()
                .code(errorCode.getCode())
                .message(errorCode.getMessage())
                .build();

        return ResponseEntity
                .status(errorCode.getStatusCode())
                .body(apiResponse);
    }

    // ==========================================
    // 2. BẮT LỖI VALIDATION TỪ DTO
    // ==========================================

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<Void>> handlingValidation(
            MethodArgumentNotValidException exception) {

        ErrorCode errorCode = ErrorCode.VALIDATION_ERROR;

        // Lấy message trực tiếp từ annotation trong DTO
        // Ví dụ:
        // @NotBlank(message = "Tên bài học không được để trống")
        // @Size(max = 255, message = "Tên bài học không được vượt quá 255 ký tự")
        String message = exception.getBindingResult()
                .getFieldErrors()
                .stream()
                .findFirst()
                .map(error -> error.getDefaultMessage())
                .orElse(errorCode.getMessage());

        ApiResponse<Void> apiResponse = ApiResponse.<Void>builder()
                .code(errorCode.getCode())
                .message(message)
                .build();

        return ResponseEntity
                .status(errorCode.getStatusCode())
                .body(apiResponse);
    }

    // ==========================================
    // 3. BẮT CÁC LỖI HỆ THỐNG KHÔNG XÁC ĐỊNH
    // ==========================================

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Void>> handlingUncategorizedException(
            Exception exception) {

        // Ghi chi tiết lỗi vào Console để kiểm tra
        log.error("Lỗi hệ thống không xác định: ", exception);

        ErrorCode errorCode = ErrorCode.UNCATEGORIZED_EXCEPTION;

        ApiResponse<Void> apiResponse = ApiResponse.<Void>builder()
                .code(errorCode.getCode())
                .message(errorCode.getMessage())
                .build();

        return ResponseEntity
                .status(errorCode.getStatusCode())
                .body(apiResponse);
    }
}
