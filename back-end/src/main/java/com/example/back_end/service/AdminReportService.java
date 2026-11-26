package com.example.back_end.service;

import com.example.back_end.dto.response.admin.AdminReportOverviewResponse;

public interface AdminReportService {

    AdminReportOverviewResponse getOverview(
            String period,
            Integer categoryId,
            String startDate,
            String endDate,
            String granularity
    );

    byte[] exportExcelReport(String period, Integer categoryId);
}
