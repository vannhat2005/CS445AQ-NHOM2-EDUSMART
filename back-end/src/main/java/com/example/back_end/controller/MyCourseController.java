
package com.example.back_end.controller;

import com.example.back_end.dto.response.ApiResponse;
import com.example.back_end.dto.response.MyCourseResponse;
import com.example.back_end.dto.response.MyCourseSummaryResponse;
import com.example.back_end.dto.response.PageResponse;
import com.example.back_end.service.MyCourseService;

import lombok.RequiredArgsConstructor;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/student/my-courses")
@RequiredArgsConstructor
public class MyCourseController {

    private final MyCourseService myCourseService;

    /**
     * API lấy danh sách khóa học đã mua của học viên
     * đang đăng nhập.
     *
     * Hỗ trợ:
     *
     * 1. Phân trang:
     *    pageNo, pageSize
     *
     * 2. Lọc trạng thái học tập:
     *    ALL         - Tất cả khóa học
     *    IN_PROGRESS - Đang học
     *    COMPLETED   - Đã hoàn thành
     *    NOT_STARTED - Chưa bắt đầu
     *
     * 3. Tìm kiếm:
     *    keyword - Tìm theo tên khóa học đã mua
     *
     * 4. Sắp xếp:
     *    ALL_NEWEST     - Mới đăng ký trước
     *    NEWEST         - Đăng ký trong 30 ngày gần nhất
     *    RECENT_30_DAYS - Đăng ký trong 30 ngày gần nhất
     *    PROGRESS_DESC  - Tiến độ cao nhất
     *    TITLE_ASC      - Tên khóa học A-Z
     *
     * GET /api/student/my-courses
     */
    @GetMapping
    public ApiResponse<PageResponse<MyCourseResponse>> getMyCourses(

            @RequestParam(defaultValue = "1")
            int pageNo,

            @RequestParam(defaultValue = "6")
            int pageSize,

            @RequestParam(defaultValue = "ALL")
            String status,

            @RequestParam(defaultValue = "")
            String keyword,

            @RequestParam(defaultValue = "ALL_NEWEST")
            String sortBy
    ) {

        PageResponse<MyCourseResponse> result =
                myCourseService.getMyCourses(
                        pageNo,
                        pageSize,
                        status,
                        keyword,
                        sortBy
                );

        return ApiResponse
                .<PageResponse<MyCourseResponse>>builder()
                .code(1000)
                .message(
                        "Lấy danh sách khóa học của tôi thành công"
                )
                .result(result)
                .build();
    }

    /**
     * API lấy thống kê tổng quan số lượng khóa học cố định của học viên:
     * - total: Tổng số khóa học đã mua
     * - inProgress: Số khóa học đang học
     * - completed: Số khóa học đã hoàn thành
     * - notStarted: Số khóa học chưa bắt đầu
     *
     * GET /api/student/my-courses/summary
     */
    @GetMapping("/summary")
    public ApiResponse<MyCourseSummaryResponse> getMyCourseSummary() {
        MyCourseSummaryResponse result = myCourseService.getMyCourseSummary();

        return ApiResponse
                .<MyCourseSummaryResponse>builder()
                .code(1000)
                .message("Lấy thống kê khóa học thành công")
                .result(result)
                .build();
    }
}
