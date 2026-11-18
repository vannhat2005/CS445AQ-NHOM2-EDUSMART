
import api from "../api";

// ==========================================
// 1. XỬ LÝ LỖI API
// ==========================================

const handleApiError = (error) => {
  // Request bị hủy
  if (
    error?.code === "ERR_CANCELED" ||
    error?.name === "CanceledError" ||
    error?.name === "AbortError"
  ) {
    throw error;
  }

  // Lỗi HTTP từ Backend
  if (error?.response) {
    const status = error.response.status;
    const data = error.response.data;

    let message =
      data?.message ||
      `Không thể lấy danh sách khóa học (HTTP ${status})`;

    switch (status) {
      case 400:
        message =
          data?.message ||
          "Tham số tìm kiếm hoặc phân trang không hợp lệ.";
        break;

      case 401:
        message =
          "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.";
        break;

      case 403:
        message =
          "Bạn không có quyền xem danh sách khóa học này.";
        break;

      case 404:
        message =
          "Không tìm thấy dữ liệu khóa học.";
        break;

      default:
        if (status >= 500) {
          message =
            data?.message ||
            "Máy chủ gặp lỗi. Vui lòng thử lại sau.";
        }
    }

    const apiError = new Error(message);
    apiError.status = status;
    apiError.code = data?.code;

    throw apiError;
  }

  // Request quá thời gian
  if (error?.code === "ECONNABORTED") {
    throw new Error(
      "Kết nối quá thời gian. Vui lòng thử lại."
    );
  }

  // Không thể kết nối Backend
  if (error?.isAxiosError) {
    throw new Error(
      "Không thể kết nối Backend. Kiểm tra Spring Boot hoặc CORS."
    );
  }

  // Lỗi đã được tạo trước đó
  if (error instanceof Error) {
    throw error;
  }

  throw new Error(
    "Đã xảy ra lỗi không xác định."
  );
};

// ==========================================
// 2. LẤY DANH SÁCH KHÓA HỌC ĐÃ MUA
// ==========================================
// GET /api/student/my-courses
//
// Axios api.js tự động:
// - Đọc Access Token từ localStorage
// - Gắn Authorization: Bearer token
// - Refresh token nếu cần
// ==========================================

export const getMyCourses = async (
  pageNo = 1,
  pageSize = 6,
  status = "ALL",
  keyword = "",
  sortBy = "ALL_NEWEST",
  signal
) => {
  // ========================================
  // KIỂM TRA PHÂN TRANG
  // ========================================

  if (
    !Number.isInteger(pageNo) ||
    pageNo < 1
  ) {
    throw new Error(
      "Số trang phải là số nguyên >= 1."
    );
  }

  if (
    !Number.isInteger(pageSize) ||
    pageSize < 1 ||
    pageSize > 100
  ) {
    throw new Error(
      "Kích thước trang phải từ 1 đến 100."
    );
  }

  // ========================================
  // CHUẨN HÓA THAM SỐ
  // ========================================

  const normalizedStatus = String(
    status ?? "ALL"
  ).trim();

  const normalizedKeyword =
    typeof keyword === "string"
      ? keyword.trim()
      : "";

  const normalizedSortBy = String(
    sortBy ?? "ALL_NEWEST"
  ).trim();

  // ========================================
  // GỌI API BACKEND
  // ========================================

  try {
    const response = await api.get(
      "/student/my-courses",
      {
        params: {
          pageNo,
          pageSize,
          status: normalizedStatus,
          keyword: normalizedKeyword,
          sortBy: normalizedSortBy,
        },
        signal,
      }
    );

    const data = response.data;

    // ======================================
    // KIỂM TRA API RESPONSE
    // ======================================

    if (
      !data ||
      typeof data !== "object"
    ) {
      throw new Error(
        "Backend không trả về dữ liệu hợp lệ."
      );
    }

    if (data.code !== 1000) {
      const error = new Error(
        data.message ||
        "Không thể lấy danh sách khóa học."
      );

      error.code = data.code;
      error.status = response.status;

      throw error;
    }

    const result = data.result;

    // ======================================
    // KIỂM TRA DỮ LIỆU PHÂN TRANG
    // ======================================

    if (
      !result ||
      !Array.isArray(result.content)
    ) {
      throw new Error(
        "Dữ liệu khóa học từ Backend không hợp lệ."
      );
    }

    // ======================================
    // TRẢ KẾT QUẢ
    // ======================================

    return result;

  } catch (error) {
    if (
      error?.code !== "ERR_CANCELED" &&
      error?.name !== "CanceledError" &&
      error?.name !== "AbortError"
    ) {
      console.error(
        "[MyCourses] Lỗi lấy danh sách khóa học:",
        error
      );
    }

    handleApiError(error);
  }
};

// ==========================================
// 3. EXPORT DEFAULT
// ==========================================

export default {
  getMyCourses,
};
