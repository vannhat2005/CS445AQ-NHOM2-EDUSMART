
import api from "../api";

// ==========================================
// 1. KIỂM TRA COURSE ID
// ==========================================

const validateCourseId = (courseId) => {
  if (
    courseId === null ||
    courseId === undefined ||
    String(courseId).trim() === ""
  ) {
    throw new Error("ID khóa học không hợp lệ");
  }

  return encodeURIComponent(courseId);
};

// ==========================================
// 2. XỬ LÝ LỖI API
// ==========================================

const handleApiError = (error) => {
  // Request bị hủy khi chuyển trang
  if (
    error?.code === "ERR_CANCELED" ||
    error?.name === "CanceledError" ||
    error?.name === "AbortError"
  ) {
    throw error;
  }

  // Lỗi HTTP từ backend
  if (error?.response) {
    const status = error.response.status;

    let message =
      error.response.data?.message ||
      `Không thể tải dữ liệu (HTTP ${status})`;

    if (status === 401) {
      message =
        "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.";
    } else if (status === 403) {
      message =
        "Bạn không có quyền truy cập dữ liệu này.";
    } else if (status === 404) {
      message =
        "Không tìm thấy dữ liệu khóa học.";
    }

    const apiError = new Error(message);
    apiError.status = status;
    apiError.code = error.response.data?.code;

    throw apiError;
  }

  // Lỗi đã được xử lý trước đó
  if (error instanceof Error) {
    throw error;
  }

  throw new Error(
    "Không thể kết nối đến máy chủ."
  );
};

// ==========================================
// 3. HÀM GỌI API CHUNG
// ==========================================

const request = async (endpoint, signal) => {
  try {
    // api.js tự động:
    // - Lấy Access Token từ localStorage
    // - Gắn Authorization: Bearer token
    // - Refresh token nếu cần

    const response = await api.get(endpoint, {
      signal,
    });

    const data = response.data;

    if (!data) {
      throw new Error(
        "Server không trả về dữ liệu hợp lệ."
      );
    }

    // Kiểm tra ApiResponse của Spring Boot
    if (
      data.code != null &&
      data.code !== 1000
    ) {
      const error = new Error(
        data.message ||
        "Không thể tải dữ liệu khóa học."
      );

      error.code = data.code;
      throw error;
    }

    return data.result ?? data;
  } catch (error) {
    handleApiError(error);
  }
};

// ==========================================
// 4. LẤY CHI TIẾT KHÓA HỌC
// ==========================================
// GET /api/courses/{courseId}/detail
//
// Backend phải trả:
// isEnrolled: true/false
// canReview: true/false
// ==========================================

export const getCourseDetail = async (
  courseId,
  signal
) => {
  const id = validateCourseId(courseId);

  const detail = await request(
    `/courses/${id}/detail`,
    signal
  );

  // Log kiểm tra trạng thái đã mua
  if (import.meta.env.DEV) {
    console.log(
      "[CourseDetail] Course ID:",
      courseId
    );

    console.log(
      "[CourseDetail] isEnrolled:",
      detail?.isEnrolled
    );

    console.log(
      "[CourseDetail] canReview:",
      detail?.canReview
    );

    if (detail?.isEnrolled === undefined) {
      console.warn(
        "[CourseDetail] API chưa trả isEnrolled. Kiểm tra CourseDetailResponse.java và CourseServiceImpl.java."
      );
    }
  }

  return detail;
};

// ==========================================
// 5. LẤY CHƯƠNG VÀ BÀI HỌC
// ==========================================
// GET /api/courses/{courseId}/curriculum
// ==========================================

export const getCourseCurriculum = (
  courseId,
  signal
) => {
  const id = validateCourseId(courseId);

  return request(
    `/courses/${id}/curriculum`,
    signal
  );
};

// ==========================================
// 6. LẤY ĐÁNH GIÁ KHÓA HỌC
// ==========================================
// GET /api/courses/{courseId}/reviews
// ==========================================

export const getCourseReviews = (
  courseId,
  pageNo = 1,
  pageSize = 5,
  signal
) => {
  const id = validateCourseId(courseId);

  const params = new URLSearchParams({
    pageNo: String(pageNo),
    pageSize: String(pageSize),
  });

  return request(
    `/courses/${id}/reviews?${params.toString()}`,
    signal
  );
};
