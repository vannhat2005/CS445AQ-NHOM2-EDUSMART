package com.example.back_end.controller;

import com.example.back_end.dto.response.ApiResponse;
import com.example.back_end.dto.response.admin.AdminReportOverviewResponse;
import com.example.back_end.service.AdminReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/reports")
@RequiredArgsConstructor
public class AdminReportController {

    private final AdminReportService adminReportService;

    // Lấy toàn bộ số liệu báo cáo & thống kê hệ thống
    @GetMapping("/overview")
    public ApiResponse<AdminReportOverviewResponse> getOverview(
            @RequestParam(required = false, defaultValue = "Tháng này") String period,
            @RequestParam(required = false) Integer categoryId,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate,
            @RequestParam(required = false, defaultValue = "week") String granularity
    ) {
        AdminReportOverviewResponse response = adminReportService.getOverview(
                period,
                categoryId,
                startDate,
                endDate,
                granularity
        );

        return ApiResponse.<AdminReportOverviewResponse>builder()
                .code(200)
                .message("Lấy báo cáo và thống kê hệ thống thành công")
                .result(response)
                .build();
    }

    // Xuất file báo cáo thống kê Excel (.csv UTF-8 mở trực tiếp trên Excel)
    @GetMapping("/export-excel")
    public ResponseEntity<byte[]> exportExcel(
            @RequestParam(required = false, defaultValue = "Tháng này") String period,
            @RequestParam(required = false) Integer categoryId
    ) {
        byte[] fileBytes = adminReportService.exportExcelReport(period, categoryId);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"BaoCao_ThongKe_EduSmart.csv\"")
                .contentType(MediaType.parseMediaType("text/csv; charset=UTF-8"))
                .body(fileBytes);
    }
}
