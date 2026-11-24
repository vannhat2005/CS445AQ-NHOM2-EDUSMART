package com.example.back_end.controller;

import com.example.back_end.dto.request.AdminPaymentUpdateRequest;
import com.example.back_end.dto.response.AdminPaymentResponse;
import com.example.back_end.dto.response.AdminPaymentStatisticsResponse;
import com.example.back_end.dto.response.ApiResponse;
import com.example.back_end.service.AdminPaymentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/payments")
@RequiredArgsConstructor
public class AdminPaymentController {

    private final AdminPaymentService adminPaymentService;

    // Lấy danh sách giao dịch thanh toán (tìm kiếm, lọc, phân trang)
    @GetMapping
    public ApiResponse<Page<AdminPaymentResponse>> getAll(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String method,
            @RequestParam(required = false) Integer instructorId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        return ApiResponse.<Page<AdminPaymentResponse>>builder()
                .code(200)
                .message("Lấy danh sách giao dịch thanh toán thành công")
                .result(adminPaymentService.getAll(keyword, status, method, instructorId, page, size))
                .build();
    }

    // Lấy thống kê KPI giao dịch (Tổng tiền, Thành công, Đang chờ, Thất bại)
    @GetMapping("/statistics")
    public ApiResponse<AdminPaymentStatisticsResponse> getStatistics() {
        return ApiResponse.<AdminPaymentStatisticsResponse>builder()
                .code(200)
                .message("Lấy thống kê giao dịch thành công")
                .result(adminPaymentService.getStatistics())
                .build();
    }

    // Lấy chi tiết một giao dịch
    @GetMapping("/{paymentId}")
    public ApiResponse<AdminPaymentResponse> getDetail(@PathVariable Integer paymentId) {
        return ApiResponse.<AdminPaymentResponse>builder()
                .code(200)
                .message("Lấy chi tiết giao dịch thành công")
                .result(adminPaymentService.getDetail(paymentId))
                .build();
    }

    // Chỉnh sửa giao dịch (Cập nhật trạng thái đối soát, ghi chú kiểm toán, phương thức, số tiền)
    @PutMapping("/{paymentId}")
    public ApiResponse<AdminPaymentResponse> updatePayment(
            @PathVariable Integer paymentId,
            @Valid @RequestBody AdminPaymentUpdateRequest request
    ) {
        return ApiResponse.<AdminPaymentResponse>builder()
                .code(200)
                .message("Cập nhật thông tin giao dịch thành công")
                .result(adminPaymentService.updatePayment(paymentId, request))
                .build();
    }

    // Lấy danh sách giáo viên để lọc
    @GetMapping("/instructors")
    public ApiResponse<List<Map<String, Object>>> getInstructors() {
        return ApiResponse.<List<Map<String, Object>>>builder()
                .code(200)
                .message("Lấy danh sách giảng viên thành công")
                .result(adminPaymentService.getInstructors())
                .build();
    }
}
