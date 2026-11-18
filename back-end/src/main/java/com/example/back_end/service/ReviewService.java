
package com.example.back_end.service;

import com.example.back_end.dto.request.CreateReviewRequest;

public interface ReviewService {

    // ==========================================
    // HỌC VIÊN: ĐÁNH GIÁ KHÓA HỌC
    // ==========================================
    //
    // Điều kiện:
    // 1. Học viên đã đăng nhập
    // 2. Khóa học đã được xuất bản
    // 3. Học viên đã thanh toán (Paid)
    // 4. Học viên chưa đánh giá khóa học này
    // 5. Rating từ 1 đến 5 sao
    //
    // userId được Controller lấy từ JWT
    // Frontend KHÔNG truyền userId
    // ==========================================

    void createReview(
            Integer courseId,
            Integer userId,
            CreateReviewRequest request
    );
}
