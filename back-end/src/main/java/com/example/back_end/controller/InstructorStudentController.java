package com.example.back_end.controller;

import com.example.back_end.dto.response.ApiResponse;
import com.example.back_end.dto.response.CourseStudentPageResponse;
import com.example.back_end.dto.response.StudentDetailResponse;
import com.example.back_end.service.InstructorStudentService;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/instructor/courses/{courseId}/students")
@RequiredArgsConstructor
public class InstructorStudentController {

    private final InstructorStudentService instructorStudentService;

    // ==================================================
    // 1. API LẤY DANH SÁCH SINH VIÊN
    // ==================================================
    // courseId: ID khóa học lấy từ URL
    // instructorId: ID giảng viên gửi từ Frontend
    // keyword: Từ khóa tìm kiếm
    // pageNo: Số trang hiện tại, bắt đầu từ 1
    // pageSize: Số sinh viên hiển thị trên mỗi trang

    @GetMapping
    public ApiResponse<CourseStudentPageResponse> getStudents(
            @PathVariable Integer courseId,
            @RequestParam Integer instructorId,
            @RequestParam(defaultValue = "") String keyword,
            @RequestParam(defaultValue = "1") int pageNo,
            @RequestParam(defaultValue = "7") int pageSize) {

        return ApiResponse.<CourseStudentPageResponse>builder()
                .message("Lấy danh sách sinh viên thành công")
                .result(instructorStudentService.getStudents(instructorId, courseId, keyword, pageNo, pageSize))
                .build();
    }

    // ==================================================
    // 2. API XEM CHI TIẾT SINH VIÊN
    // ==================================================
    // studentId: ID sinh viên cần xem chi tiết
    // courseId: ID khóa học đang quản lý
    // instructorId: ID giảng viên gửi từ Frontend

    @GetMapping("/{studentId}")
    public ApiResponse<StudentDetailResponse> getStudentDetail(
            @PathVariable Integer courseId,
            @PathVariable Integer studentId,
            @RequestParam Integer instructorId) {

        return ApiResponse.<StudentDetailResponse>builder()
                .message("Lấy chi tiết sinh viên thành công")
                .result(instructorStudentService.getStudentDetail(instructorId, courseId, studentId))
                .build();
    }

    // ==================================================
    // 3. API XUẤT DANH SÁCH SINH VIÊN RA EXCEL
    // ==================================================
    // Trả về file Excel trực tiếp, không sử dụng ApiResponse

    @GetMapping("/export")
    public ResponseEntity<byte[]> exportStudents(
            @PathVariable Integer courseId,
            @RequestParam Integer instructorId,
            @RequestParam(defaultValue = "") String keyword) {

        // Gọi Service để tạo file Excel
        byte[] excelFile = instructorStudentService.exportStudents(instructorId, courseId, keyword);

        // Đặt tên file theo ID khóa học
        String fileName = "DanhSachSinhVien_" + courseId + ".xlsx";

        // Trả file Excel về Frontend để tải xuống
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + fileName + "\"")
                .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .contentLength(excelFile.length)
                .body(excelFile);
    }
}