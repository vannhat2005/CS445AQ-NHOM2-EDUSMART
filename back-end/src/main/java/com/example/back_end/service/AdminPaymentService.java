package com.example.back_end.service;

import com.example.back_end.dto.request.AdminPaymentUpdateRequest;
import com.example.back_end.dto.response.AdminPaymentResponse;
import com.example.back_end.dto.response.AdminPaymentStatisticsResponse;
import org.springframework.data.domain.Page;

import java.util.List;
import java.util.Map;

public interface AdminPaymentService {

    Page<AdminPaymentResponse> getAll(
            String keyword,
            String status,
            String method,
            Integer instructorId,
            int page,
            int size
    );

    AdminPaymentStatisticsResponse getStatistics();

    AdminPaymentResponse getDetail(Integer paymentId);

    AdminPaymentResponse updatePayment(Integer paymentId, AdminPaymentUpdateRequest request);

    List<Map<String, Object>> getInstructors();
}
