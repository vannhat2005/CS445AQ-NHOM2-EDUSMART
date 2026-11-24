
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

  // Backend trả lỗi HTTP
  if (error?.response) {
    const status = error.response.status;
    const data = error.response.data;

    let message =
      data?.message ||
      `Không thể tìm kiếm khóa học (HTTP ${status})`;

    if (status === 400) {
      message =
        data?.message ||
        "Tham số tìm kiếm không hợp lệ.";
    } else if (status === 401) {
      message =
        "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.";
    } else if (status === 403) {
      message =
        "Bạn không có quyền truy cập.";
    } else if (status === 404) {
      message =
        "Không tìm thấy API tìm kiếm khóa học.";
    } else if (status >= 500) {
      message =
        data?.message ||
        "Máy chủ gặp lỗi. Vui lòng thử lại sau.";
    }

    const apiError = new Error(message);
    apiError.status = status;
    apiError.code = data?.code;

    throw apiError;
  }

  // Request timeout
  if (error?.code === "ECONNABORTED") {
    throw new Error(
      "Kết nối quá thời gian. Vui lòng thử lại."
    );
  }

  // Không kết nối được Backend
  if (error?.isAxiosError) {
    throw new Error(
      "Không thể kết nối Backend. Kiểm tra Spring Boot hoặc CORS."
    );
  }

  // Lỗi xử lý dữ liệu
  if (error instanceof Error) {
    throw error;
  }

  throw new Error(
    "Đã xảy ra lỗi không xác định."
  );
};

// ==========================================
// 2. TÌM KIẾM KHÓA HỌC
// ==========================================
// GET /api/courses/search
//
// Query params:
// - keyword
// - pageNo: bắt đầu từ 1
// - pageSize: mặc định 8
//
// api.js tự xử lý JWT và refresh token.
// ==========================================

export const searchCourses = async (
  keyword = "",
  pageNo = 1,
  pageSize = 8,
  signal
) => {
  // Kiểm tra phân trang
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

  try {
    const response = await api.get(
      "/courses/search",
      {
        params: {
          keyword: String(keyword ?? "").trim().replace(/\s+/g, " "),
          pageNo,
          pageSize,
        },
        signal,
      }
    );

    const data = response.data;

    // Kiểm tra dữ liệu Backend
    if (!data || typeof data !== "object") {
      throw new Error(
        "Backend không trả về dữ liệu hợp lệ."
      );
    }

    // Kiểm tra ApiResponse Spring Boot
    if (
      data.code != null &&
      data.code !== 1000
    ) {
      const error = new Error(
        data.message ||
        "Không thể tìm kiếm khóa học."
      );

      error.code = data.code;
      error.status = response.status;

      throw error;
    }

    // Giữ nguyên response.data
    // để tương thích với frontend cũ
    return data;
  } catch (error) {
    if (
      error?.code !== "ERR_CANCELED" &&
      error?.name !== "CanceledError" &&
      error?.name !== "AbortError"
    ) {
      console.error(
        "[CourseSearch] Lỗi tìm kiếm:",
        error
      );
    }

    handleApiError(error);
  }
};

// ==========================================
// 3. CHUẨN HÓA PAGE RESPONSE
// ==========================================
// Hỗ trợ nhiều kiểu PageResponse
// của Spring Boot.
// ==========================================

export const normalizeSearchResponse = (
  response,
  pageNo = 1,
  pageSize = 8
) => {
  const data = response?.result ?? response;

  const courses =
    data?.items ??
    data?.content ??
    data?.data ??
    (Array.isArray(data) ? data : []);

  if (!Array.isArray(courses)) {
    throw new Error(
      "Backend không trả về danh sách khóa học hợp lệ."
    );
  }

  // Tổng số khóa học
  const totalElements = Number(
    data?.totalElements ??
    data?.totalItems ??
    data?.totalRecords ??
    courses.length
  );

  // Tổng số trang
  const totalPages = Number(
    data?.totalPages ??
    data?.totalPage ??
    Math.ceil(totalElements / pageSize)
  );

  // Trang hiện tại
  const currentPage = Number(
    data?.pageNo ??
    pageNo
  );

  return {
    courses,
    totalElements,
    totalPages,
    currentPage,
  };
};

// ==========================================
// 4. LẤY KẾT QUẢ TÌM KIẾM
// ==========================================

export const getSearchResults = async (
  keyword = "",
  pageNo = 1,
  pageSize = 8,
  signal
) => {
  const response = await searchCourses(
    keyword,
    pageNo,
    pageSize,
    signal
  );

  return normalizeSearchResponse(
    response,
    pageNo,
    pageSize
  );
};
