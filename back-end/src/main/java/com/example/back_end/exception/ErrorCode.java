
package com.example.back_end.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;

@Getter
public enum ErrorCode {

    // ==========================================
    // 0. MÃ CHUNG & HỆ THỐNG (0000 - 0099)
    // ==========================================

    SUCCESS(200, "Thành công", HttpStatus.OK),
    UNCATEGORIZED_EXCEPTION(9999, "Lỗi hệ thống không xác định", HttpStatus.INTERNAL_SERVER_ERROR),
    VALIDATION_ERROR(4000, "Dữ liệu đầu vào không hợp lệ", HttpStatus.BAD_REQUEST),

    // ==========================================
    // 1. MODULE USER - QUẢN LÝ NGƯỜI DÙNG
    // (1000 - 1099)
    // ==========================================

    ROLE_USER_NOT_FOUND(1101, "Không tìm thấy người dùng", HttpStatus.NOT_FOUND),
    ROLE_NOT_FOUND(1102, "Vai trò không hợp lệ", HttpStatus.BAD_REQUEST),
    ROLE_NO_CHANGES(1103, "Không có thay đổi nào để lưu", HttpStatus.BAD_REQUEST),
    ROLE_INVALID_DATA(1104, "Dữ liệu phân quyền không hợp lệ", HttpStatus.BAD_REQUEST),
    ROLE_SELF_DEMOTION(1105, "Không thể tự gỡ quyền Admin của tài khoản đang đăng nhập", HttpStatus.FORBIDDEN),

    // TODO: Bổ sung lỗi đăng ký, đăng nhập và quản lý người dùng


    // ==========================================
    // 2. MODULE ROLE & AUTHENTICATION
    // QUẢN LÝ VAI TRÒ & XÁC THỰC
    // (1100 - 1199)
    // ==========================================

    // TODO: Bổ sung lỗi xác thực tài khoản và phân quyền


    // ==========================================
    // 3. MODULE COURSE - QUẢN LÝ KHÓA HỌC
    // (2000 - 2099)
    // ==========================================
    COURSE_NOT_FOUND(2001, "Không tìm thấy khóa học hoặc khóa học không thuộc giảng viên này", HttpStatus.NOT_FOUND),
    COURSE_NOT_DRAFT(2002, "Chỉ khóa học ở trạng thái Draft mới được xuất bản", HttpStatus.CONFLICT),
    COURSE_NO_ACTIVE_CHAPTER(2003, "Khóa học phải có ít nhất một chương hoạt động", HttpStatus.BAD_REQUEST),
    
    // TODO: Bổ sung lỗi tạo, sửa, xóa, ẩn và quản lý khóa học


    // ==========================================
    // 4. MODULE CHAPTER - QUẢN LÝ CHƯƠNG
    // (2100 - 2199)
    // ==========================================
    CHAPTER_NOT_FOUND(2100, "Không tìm thấy chương hoặc chương không thuộc khóa học này", HttpStatus.NOT_FOUND),
    CHAPTER_NO_ACTIVE_LESSON(2101, "Chương chưa có bài học hoạt động", HttpStatus.BAD_REQUEST),
    COURSE_MUST_HAVE_ACTIVE_CHAPTER(
            2103,
            "Không thể vô hiệu hóa chương học cuối cùng đang hoạt động. Khóa học đã xuất bản phải có ít nhất một chương hoạt động.",
            HttpStatus.BAD_REQUEST
    ),
    // TODO: Bổ sung lỗi thêm, sửa, xóa và thay đổi trạng thái chương


    // ==========================================
    // 5. MODULE LESSON - QUẢN LÝ BÀI HỌC
    // (2200 - 2299)
    // ==========================================

    LESSON_NO_VALID_ACTIVE_CONTENT(2201, "Bài học phải có ít nhất một nội dung bài học hoạt động", HttpStatus.BAD_REQUEST),
    LESSON_HAS_INVALID_ACTIVE_CONTENT(2202, "Bài học có nội dung hoạt động chưa hợp lệ", HttpStatus.BAD_REQUEST),
    LESSON_NOT_FOUND(2203, "Không tìm thấy bài học trong chương này.", HttpStatus.NOT_FOUND),
    LESSON_CHAPTER_INACTIVE(2204, "Không thể kích hoạt bài học vì chương học đang không hoạt động.", HttpStatus.BAD_REQUEST),
    LESSON_LAST_ACTIVE(2205, "Không thể vô hiệu hóa bài học cuối cùng đang hoạt động của khóa học đã xuất bản.", HttpStatus.BAD_REQUEST),
    LESSON_MOVE_INVALID(2206, "Không thể di chuyển bài học vượt quá vị trí đầu hoặc cuối.", HttpStatus.BAD_REQUEST),
    // TODO: Bổ sung lỗi thêm, sửa, xóa và thay đổi trạng thái bài học


    // ==========================================
    // 6. MODULE LESSON CONTENT - QUẢN LÝ NỘI DUNG BÀI HỌC
    // (2300 - 2399)
    // ==========================================
    LESSON_CONTENT_PARENT_INACTIVE(2301,"Không thể kích hoạt nội dung vì bài học hoặc chương học đang không hoạt động.", HttpStatus.BAD_REQUEST),
    LESSON_CONTENT_TEXT_REQUIRED(2302, "Nội dung văn bản không được để trống", HttpStatus.BAD_REQUEST),
    LESSON_CONTENT_FILE_REQUIRED(2303, "Vui lòng chọn file PDF hoặc Video", HttpStatus.BAD_REQUEST),
    LESSON_CONTENT_TYPE_INVALID(2304, "Loại nội dung không hợp lệ", HttpStatus.BAD_REQUEST),
    // TODO: Bổ sung lỗi thêm, sửa, xóa và quản lý nội dung bài học


    // ==========================================
    // 7. MODULE CATEGORY - QUẢN LÝ DANH MỤC
    // (2400 - 2499)
    // ==========================================
    // Không tìm thấy danh mục theo ID
    CATEGORY_NOT_FOUND(2401, "Không tìm thấy danh mục khóa học", HttpStatus.NOT_FOUND),

    // Tên danh mục đã được sử dụng
    CATEGORY_NAME_EXISTS(2402, "Tên danh mục đã tồn tại", HttpStatus.CONFLICT),
    // TODO: Bổ sung lỗi thêm, sửa, xóa danh mục khóa học


    // ==========================================
    // 8. MODULE ENROLLMENT - ĐĂNG KÝ KHÓA HỌC
    // (2500 - 2599)
    // ==========================================

    // TODO: Bổ sung lỗi đăng ký và hủy đăng ký khóa học


    // ==========================================
    // 9. MODULE PAYMENT - QUẢN LÝ THANH TOÁN
    // (2600 - 2699)
    // ==========================================

    // TODO: Bổ sung lỗi thanh toán, giao dịch và hoàn tiền


    // ==========================================
    // 10. MODULE REVIEW - QUẢN LÝ ĐÁNH GIÁ
    // (2700 - 2799)
    // ==========================================

    // TODO: Bổ sung lỗi đánh giá và nhận xét khóa học


    // ==========================================
    // 11. MODULE QUIZ - QUẢN LÝ BÀI KIỂM TRA
    // (2800 - 2899)
    // ==========================================

    // TODO: Bổ sung lỗi bài kiểm tra, câu hỏi và đáp án


    // ==========================================
    // 12. MODULE NOTIFICATION - QUẢN LÝ THÔNG BÁO
    // (2900 - 2999)
    // ==========================================

    // TODO: Bổ sung lỗi tạo, gửi và quản lý thông báo;


    // ==========================================
    // THUỘC TÍNH CHUNG
    // ==========================================
    ;
    private final int code;
    private final String message;
    private final HttpStatus statusCode;

    ErrorCode(int code, String message, HttpStatus statusCode) {
        this.code = code;
        this.message = message;
        this.statusCode = statusCode;
    }
    }
