
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
    ACCOUNT_NOT_FOUND(1001, "Không tìm thấy tài khoản", HttpStatus.NOT_FOUND),
    USERNAME_EXISTED(1002, "Tên đăng nhập đã tồn tại", HttpStatus.CONFLICT),
    EMAIL_EXISTED(1003, "Email này đã tồn tại", HttpStatus.CONFLICT),
    PASSWORD_TOO_SHORT(1004, "Mật khẩu phải có ít nhất 8 ký tự", HttpStatus.BAD_REQUEST),
    ROLE_USER_NOT_FOUND(1101, "Không tìm thấy người dùng", HttpStatus.NOT_FOUND),
    ROLE_NOT_FOUND(1102, "Vai trò không hợp lệ", HttpStatus.BAD_REQUEST),
    ROLE_NO_CHANGES(1103, "Không có thay đổi nào để lưu", HttpStatus.BAD_REQUEST),
    ROLE_INVALID_DATA(1104, "Dữ liệu phân quyền không hợp lệ", HttpStatus.BAD_REQUEST),
    ROLE_SELF_DEMOTION(1105, "Không thể tự gỡ quyền Admin của tài khoản đang đăng nhập", HttpStatus.FORBIDDEN),
    ACCESS_DENIED(1106, "Bạn không có quyền thực hiện chức năng này", HttpStatus.FORBIDDEN),
    // TODO: Bổ sung lỗi đăng ký, đăng nhập và quản lý người dùng

    // MODULE QUÊN MẬT KHẨU (1200 - 1299)
    PASSWORD_RESET_OTP_INVALID(
            1200, "Mã OTP không hợp lệ, yêu cầu nhập lại",
            HttpStatus.BAD_REQUEST
    ),
    PASSWORD_RESET_OTP_EXPIRED(
            1201, "Mã OTP đã hết hạn",
            HttpStatus.BAD_REQUEST
    ),
    PASSWORD_RESET_TOKEN_INVALID(
            1202, "Phiên đổi mật khẩu không hợp lệ hoặc đã hết hạn",
            HttpStatus.BAD_REQUEST
    ),
    PASSWORD_RESET_PASSWORD_INVALID(
            1203, "Mật khẩu phải có ít nhất 8 ký tự",
            HttpStatus.BAD_REQUEST
    ),
    PASSWORD_RESET_PASSWORD_MISMATCH(
            1204, "Mật khẩu xác nhận không khớp",
            HttpStatus.BAD_REQUEST
    ),
    PASSWORD_RESET_OTP_ATTEMPTS_EXCEEDED(
            1205, "Bạn đã nhập sai OTP quá 5 lần. Vui lòng yêu cầu mã mới",
            HttpStatus.TOO_MANY_REQUESTS
    ),
    PASSWORD_RESET_SAME_AS_OLD(1206, "Mật khẩu mới không được trùng với mật khẩu hiện tại", HttpStatus.BAD_REQUEST),
    EMAIL_NOT_REGISTERED(1207, "Email này chưa được đăng ký trong hệ thống", HttpStatus.BAD_REQUEST),

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
    ENROLLMENT_NOT_FOUND(2501, "Sinh viên chưa ghi danh vào khóa học này", HttpStatus.NOT_FOUND),
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

    // Không tìm thấy bài trắc nghiệm hoặc không thuộc giảng viên
    QUIZ_NOT_FOUND(2801, "Không tìm thấy bài trắc nghiệm", HttpStatus.NOT_FOUND),

    // Bài trắc nghiệm không còn ở trạng thái bản nháp
    QUIZ_NOT_DRAFT(2802, "Bài trắc nghiệm không còn ở trạng thái bản nháp", HttpStatus.CONFLICT),

    // Bài trắc nghiệm đã có kết quả làm bài
    QUIZ_HAS_RESULTS(2803, "Không thể xóa bài trắc nghiệm đã có kết quả làm bài", HttpStatus.CONFLICT),

    // Không có quyền quản lý bài trắc nghiệm
    QUIZ_ACCESS_DENIED(2804, "Bạn không có quyền quản lý bài trắc nghiệm này", HttpStatus.FORBIDDEN),

    // Bài trắc nghiệm đang được dữ liệu khác tham chiếu
    QUIZ_DELETE_CONFLICT(2805, "Không thể xóa bài trắc nghiệm vì còn dữ liệu liên quan", HttpStatus.CONFLICT),

    QUIZ_ALREADY_EXISTS(2805, "Đã tồn tại bộ trắc nghiệm", HttpStatus.CONFLICT),
    QUIZ_MIN_QUESTIONS(2806, "Bộ trắc nghiệm phải có ít nhất 3 câu hỏi để xuất bản", HttpStatus.BAD_REQUEST),
    QUIZ_INVALID_CONFIG(2807, "Cấu hình bài kiểm tra không hợp lệ", HttpStatus.BAD_REQUEST),
    QUESTION_NOT_FOUND(2808, "Không tìm thấy câu hỏi", HttpStatus.NOT_FOUND),
    QUESTION_INVALID(2809, "Nội dung câu hỏi hoặc phương án trả lời không hợp lệ", HttpStatus.BAD_REQUEST),
    QUESTION_DUPLICATE_OPTIONS(2810, "Các phương án trả lời không được trùng nhau", HttpStatus.BAD_REQUEST),
    QUESTION_INVALID_CORRECT_ANSWER(2811, "Đáp án đúng không hợp lệ", HttpStatus.BAD_REQUEST),
    QUIZ_INVALID_LOCATION(2812, "Chương học hoặc bài học không hợp lệ", HttpStatus.BAD_REQUEST),
    QUIZ_INVALID_TITLE(2813, "Tên trắc nghiệm không hợp lệ", HttpStatus.BAD_REQUEST),
    QUIZ_AI_INVALID_REQUEST(2814, "Cấu hình tạo trắc nghiệm bằng AI không hợp lệ", HttpStatus.BAD_REQUEST),
    QUIZ_AI_INVALID_PDF(2815, "Tài liệu PDF không hợp lệ hoặc không trích xuất được nội dung", HttpStatus.BAD_REQUEST),
    QUIZ_AI_UNAVAILABLE(2816, "Dịch vụ AI chưa được cấu hình hoặc đang tạm thời không khả dụng", HttpStatus.SERVICE_UNAVAILABLE),
    QUIZ_AI_INVALID_RESPONSE(2817, "AI không trả về bộ câu hỏi hợp lệ. Vui lòng thử lại", HttpStatus.BAD_GATEWAY),
    QUIZ_AI_INSUFFICIENT_CONTENT(2818, "Tài liệu không đủ nội dung phù hợp để tạo số lượng câu hỏi đã chọn", HttpStatus.BAD_REQUEST),
    // TODO: Bổ sung lỗi bài kiểm tra, câu hỏi và đáp án


    // ==========================================
    // 12. MODULE NOTIFICATION - QUẢN LÝ THÔNG BÁO
    // (2900 - 2999)
    // ==========================================
    // ==================== BÁO CÁO THỐNG KÊ GIẢNG VIÊN (2900 - 2999) ====================

    REPORT_ACCESS_DENIED(2901, "Không có quyền truy cập báo cáo này", HttpStatus.FORBIDDEN),
    REPORT_COURSE_NOT_FOUND(2902, "Khóa học không tồn tại hoặc không thuộc giảng viên", HttpStatus.NOT_FOUND),
    REPORT_CHAPTER_NOT_FOUND(2903, "Chương học không thuộc khóa học đã chọn", HttpStatus.NOT_FOUND),
    REPORT_COURSE_REQUIRED(2904, "Vui lòng chọn khóa học trước khi chọn chương học", HttpStatus.BAD_REQUEST),
    REPORT_INVALID_ASSESSMENT_TYPE(2905, "Loại đánh giá không hợp lệ", HttpStatus.BAD_REQUEST),
    REPORT_INVALID_TIME_RANGE(2906, "Bộ lọc thời gian không hợp lệ", HttpStatus.BAD_REQUEST),
    REPORT_DATE_REQUIRED(2907, "Vui lòng chọn đầy đủ ngày bắt đầu và ngày kết thúc", HttpStatus.BAD_REQUEST),
    REPORT_INVALID_DATE_RANGE(2908, "Ngày bắt đầu không được lớn hơn ngày kết thúc", HttpStatus.BAD_REQUEST),
    REPORT_FUTURE_DATE(2909, "Không được chọn ngày trong tương lai", HttpStatus.BAD_REQUEST),
// ========================================
// QUẢN LÝ THÔNG TIN CÁ NHÂN
// ========================================

    PROFILE_NOT_FOUND(2910, "Không tìm thấy thông tin tài khoản", HttpStatus.NOT_FOUND),
    PROFILE_FULL_NAME_REQUIRED(2911, "Họ và tên không được để trống", HttpStatus.BAD_REQUEST),
    PROFILE_FULL_NAME_TOO_LONG(2912, "Họ và tên không được vượt quá 100 ký tự", HttpStatus.BAD_REQUEST),
    PROFILE_AVATAR_INVALID_TYPE(2913, "Ảnh đại diện phải có định dạng JPG, JPEG hoặc PNG", HttpStatus.BAD_REQUEST),
    PROFILE_AVATAR_TOO_LARGE(2914, "Dung lượng tệp vượt quá 2MB. Vui lòng chọn tệp nhỏ hơn", HttpStatus.BAD_REQUEST),
    PROFILE_AVATAR_INVALID(2915, "Tệp ảnh không hợp lệ hoặc không thể đọc được", HttpStatus.BAD_REQUEST),
    PROFILE_AVATAR_UPLOAD_FAILED(2916, "Không thể lưu ảnh đại diện. Vui lòng thử lại", HttpStatus.INTERNAL_SERVER_ERROR),
    PROFILE_NO_CHANGES(2917, "Thông tin cá nhân chưa có thay đổi", HttpStatus.BAD_REQUEST),
    // TODO: Bổ sung lỗi tạo, gửi và quản lý thông báo;

    // ==========================================
    // 13. MODULE PAYMENT - QUẢN LÝ GIAO DỊCH THANH TOÁN
    // (3000 - 3099)
    // ==========================================
    PAYMENT_NOT_FOUND(3001, "Không tìm thấy giao dịch thanh toán", HttpStatus.NOT_FOUND),

    // ==========================================
    // THUỘC TÍNH CHUNG
    // ==========================================
    INVALID_PAGINATION(4001, "Thông tin phân trang không hợp lệ", HttpStatus.BAD_REQUEST),
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
