package com.example.back_end.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminPaymentStatisticsResponse {
    private BigDecimal totalRevenue;
    private Long successCount;
    private Long pendingCount;
    private Long failedCount;
    private Long totalCount;
    private Double successRate;
    private Double failureRate;
    private Double growthRate; // Mức tăng trưởng % so với tháng trước
}
