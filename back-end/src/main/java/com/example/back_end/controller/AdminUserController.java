
package com.example.back_end.controller;

import com.example.back_end.dto.request.AccountRequest;
import com.example.back_end.dto.response.AccountResponse;
import com.example.back_end.dto.response.AccountStatisticsResponse;
import com.example.back_end.enumType.AccountStatus;
import com.example.back_end.service.AccountService;
import com.example.back_end.dto.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;

@RestController
@RequestMapping("/api/admin/accounts")
@RequiredArgsConstructor
public class AdminUserController {

    private final AccountService accountService;

    // Lấy danh sách tài khoản, tìm kiếm, lọc và phân trang
    @GetMapping
    public ApiResponse<Page<AccountResponse>> getAccounts(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) AccountStatus status,
            @RequestParam(defaultValue = "1") int pageNo,
            @RequestParam(defaultValue = "5") int pageSize) {

        return ApiResponse.<Page<AccountResponse>>builder()
                .message("Lấy danh sách tài khoản thành công")
                .result(accountService.getAccounts(
                        keyword, status, pageNo, pageSize
                ))
                .build();
    }

    // Lấy chi tiết tài khoản
    @GetMapping("/{userId}")
    public ApiResponse<AccountResponse> getAccount(
            @PathVariable Integer userId) {

        return ApiResponse.<AccountResponse>builder()
                .message("Lấy thông tin tài khoản thành công")
                .result(accountService.getAccount(userId))
                .build();
    }

    // Thống kê tài khoản
    @GetMapping("/statistics")
    public ApiResponse<AccountStatisticsResponse> getStatistics() {

        return ApiResponse.<AccountStatisticsResponse>builder()
                .message("Lấy thống kê tài khoản thành công")
                .result(accountService.getStatistics())
                .build();
    }

    // Thêm tài khoản
    @PostMapping
    public ApiResponse<AccountResponse> createAccount(
            @Valid @RequestBody AccountRequest request) {

        return ApiResponse.<AccountResponse>builder()
                .message("Thêm tài khoản thành công")
                .result(accountService.createAccount(request))
                .build();
    }

    // Cập nhật tài khoản
    @PutMapping("/{userId}")
    public ApiResponse<AccountResponse> updateAccount(
            @PathVariable Integer userId,
            @Valid @RequestBody AccountRequest request) {

        return ApiResponse.<AccountResponse>builder()
                .message("Cập nhật thông tin tài khoản thành công")
                .result(accountService.updateAccount(userId, request))
                .build();
    }
}
