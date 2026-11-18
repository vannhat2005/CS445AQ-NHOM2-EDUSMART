
package com.example.back_end.exception;

import com.example.back_end.dto.response.ApiResponse;

import lombok.extern.slf4j.Slf4j;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import org.springframework.security.core.AuthenticationException;

import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;

@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    // ==========================================
    // 1. BẮT LỖI LOGIC NGHIỆP VỤ
    // ==========================================

    @ExceptionHandler(AppException.class)
    public ResponseEntity<ApiResponse<Void>> handlingAppException(
            AppException exception
    ) {

        ErrorCode errorCode = exception.getErrorCode();

        ApiResponse<Void> apiResponse =
                ApiResponse.<Void>builder()
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
            MethodArgumentNotValidException exception
    ) {

        ErrorCode errorCode = ErrorCode.VALIDATION_ERROR;

        String message = exception.getBindingResult()
                .getFieldErrors()
                .stream()
                .findFirst()
                .map(error -> error.getDefaultMessage())
                .orElse(errorCode.getMessage());

        ApiResponse<Void> apiResponse =
                ApiResponse.<Void>builder()
                        .code(errorCode.getCode())
                        .message(message)
                        .build();

        return ResponseEntity
                .status(errorCode.getStatusCode())
                .body(apiResponse);
    }

    // ==========================================
    // 3. BẮT LỖI ĐĂNG NHẬP / XÁC THỰC
    // ==========================================

    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<ApiResponse<Void>> handlingAuthentication(
            AuthenticationException exception
    ) {

        log.warn("Đăng nhập thất bại: {}", exception.getMessage());

        ApiResponse<Void> apiResponse =
                ApiResponse.<Void>builder()
                        .code(401)
                        .message("Thông tin đăng nhập không hợp lệ hoặc tài khoản bị khóa")
                        .build();

        return ResponseEntity
                .status(HttpStatus.UNAUTHORIZED)
                .body(apiResponse);
    }

    // ==========================================
    // 4. BẮT CÁC LỖI HỆ THỐNG KHÔNG XÁC ĐỊNH
    // ==========================================

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Void>> handlingUncategorizedException(
            Exception exception
    ) {

        log.error("Lỗi hệ thống không xác định: ", exception);

        ErrorCode errorCode =
                ErrorCode.UNCATEGORIZED_EXCEPTION;

        ApiResponse<Void> apiResponse =
                ApiResponse.<Void>builder()
                        .code(errorCode.getCode())
                        .message(errorCode.getMessage())
                        .build();

        return ResponseEntity
                .status(errorCode.getStatusCode())
                .body(apiResponse);
    }


    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<ApiResponse<Void>> handleResponseStatusException(
            ResponseStatusException ex
    ) {

        ApiResponse<Void> response = ApiResponse
                .<Void>builder()
                .message(ex.getReason())
                .build();

        return ResponseEntity
                .status(ex.getStatusCode())
                .body(response);
    }

}
