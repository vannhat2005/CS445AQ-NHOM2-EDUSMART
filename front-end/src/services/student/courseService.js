
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

    let message =
      error.response.data?.message ||
      `Yêu cầu thất bại (HTTP ${status})`;

    if (status === 401) {
      message =
        "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.";
    } else if (status === 403) {
      message =
        "Bạn không có quyền truy cập dữ liệu này.";
    } else if (status === 404) {
      message =
        "Không tìm thấy dữ liệu yêu cầu.";
    } else if (status >= 500) {
      message =
        error.response.data?.message ||
        "Máy chủ gặp lỗi. Vui lòng thử lại sau.";
    }

    const apiError = new Error(message);
    apiError.status = status;
    apiError.code = error.response.data?.code;

    throw apiError;
  }

  // Lỗi Axios timeout
  if (error?.code === "ECONNABORTED") {
    throw new Error(
      "Kết nối quá thời gian. Vui lòng thử lại."
    );
  }

  // Lỗi Axios không kết nối được
  if (error?.isAxiosError) {
    throw new Error(
      "Không thể kết nối Backend. Kiểm tra Spring Boot hoặc CORS."
    );
  }

  if (error instanceof Error) {
    throw error;
  }

  throw new Error("Đã xảy ra lỗi không xác định.");
};

// ==========================================
// 2. HÀM GỌI API CHUNG
// ==========================================
// Axios api.js đã có baseURL /api
// Endpoint trang chủ: /public/home
// ==========================================

const request = async (endpoint, signal) => {
  try {
    const response = await api.get(
      `/public/home${endpoint}`,
      {
        signal,
      }
    );

    const data = response.data;

    if (!data || typeof data !== "object") {
      throw new Error(
        "Backend trả về dữ liệu JSON không hợp lệ."
      );
    }

    // Kiểm tra ApiResponse Spring Boot
    if (data.code !== 1000) {
      const error = new Error(
        data.message ||
        `Yêu cầu thất bại (HTTP ${response.status})`
      );

      error.code = data.code;
      error.status = response.status;

      throw error;
    }

    // Giữ nguyên ApiResponse để tương thích
    // với frontend đang sử dụng data.result
    return data;
  } catch (error) {
    handleApiError(error);
  }
};

// ==========================================
// 3. TOP 3 DANH MỤC
// ==========================================
// GET /api/public/home/top-categories
// ==========================================

export const getTopCategories = async (signal) => {
  const data = await request(
    "/top-categories",
    signal
  );

  if (!Array.isArray(data.result)) {
    throw new Error(
      "Dữ liệu danh mục không hợp lệ: result phải là mảng"
    );
  }

  return data.result.map(
    ({ categoryId, name }) => ({
      categoryId,
      name,
    })
  );
};

// ==========================================
// 4. KHÓA HỌC + LỌC + SẮP XẾP
// ==========================================
// GET /api/public/home/courses
//
// Query params:
// categoryId
// sort
// page
// size
// ==========================================

export const getCourses = async ({
  categoryId = null,
  sort = "newest",
  page = 1,
  size = 8,
  signal,
} = {}) => {
  // Kiểm tra page
  if (!Number.isInteger(page) || page < 1) {
    throw new Error(
      "Trang phải là số nguyên >= 1"
    );
  }

  // Kiểm tra size
  if (
    !Number.isInteger(size) ||
    size < 1 ||
    size > 50
  ) {
    throw new Error(
      "Kích thước trang phải từ 1 đến 50"
    );
  }

  // Chuẩn hóa sort
  const normalizedSort = String(
    sort || "newest"
  )
    .trim()
    .toLowerCase();

  const allowedSorts = [
    "newest",
    "price_asc",
    "price_desc",
  ];

  if (!allowedSorts.includes(normalizedSort)) {
    throw new Error(
      "Kiểu sắp xếp không hợp lệ"
    );
  }

  // Tạo query params
  const params = new URLSearchParams({
    sort: normalizedSort,
    page: String(page),
    size: String(size),
  });

  // Lọc theo danh mục
  if (
    categoryId !== null &&
    categoryId !== undefined &&
    categoryId !== ""
  ) {
    const id = Number(categoryId);

    if (
      !Number.isInteger(id) ||
      id <= 0
    ) {
      throw new Error(
        "categoryId không hợp lệ"
      );
    }

    params.set(
      "categoryId",
      String(id)
    );
  }

  // Gọi API
  const data = await request(
    `/courses?${params.toString()}`,
    signal
  );

  // Kiểm tra dữ liệu phân trang
  if (
    !data.result ||
    !Array.isArray(data.result.content)
  ) {
    throw new Error(
      "Dữ liệu khóa học không hợp lệ: thiếu result.content"
    );
  }

  // Chuẩn hóa last/isLast
  return {
    ...data,

    result: {
      ...data.result,

      last:
        data.result.last ??
        data.result.isLast ??
        false,
    },
  };
};
