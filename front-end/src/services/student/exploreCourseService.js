
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
      `Không thể gọi API (HTTP ${status})`;

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
        data?.message ||
        "Máy chủ gặp lỗi. Vui lòng thử lại sau.";
    }

    const apiError = new Error(message);
    apiError.status = status;
    apiError.code = data?.code;

    throw apiError;
  }

  // Axios timeout
  if (error?.code === "ECONNABORTED") {
    throw new Error(
      "Kết nối quá thời gian. Vui lòng thử lại."
    );
  }

  // Không kết nối được backend
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
// api.js đã có baseURL:
// http://localhost:8080/api
//
// Vì vậy không thêm /api lần nữa.
// ==========================================

const request = async (endpoint, signal) => {
  try {
    const response = await api.get(endpoint, {
      signal,
    });

    const data = response.data;

    if (!data || typeof data !== "object") {
      throw new Error(
        "API không trả về JSON hợp lệ."
      );
    }

    // Kiểm tra ApiResponse Spring Boot
    if (
      data.code != null &&
      data.code !== 1000
    ) {
      const error = new Error(
        data.message ||
        `Không thể gọi API (${response.status})`
      );

      error.code = data.code;
      error.status = response.status;

      throw error;
    }

    // Giữ nguyên kiểu dữ liệu trả về
    return data.result;
  } catch (error) {
    handleApiError(error);
  }
};

// ==========================================
// 3. LẤY TOÀN BỘ DANH MỤC
// ==========================================
// GET /api/public/explore/categories
// ==========================================

export const getExploreCategories = async (
  signal
) => {
  const result = await request(
    "/public/explore/categories",
    signal
  );

  if (!Array.isArray(result)) {
    throw new Error(
      "Danh sách danh mục không hợp lệ."
    );
  }

  return result;
};

// ==========================================
// 4. TÌM KIẾM + LỌC + SẮP XẾP
// ==========================================
// GET /api/public/explore/courses
//
// Query params:
// keyword
// categoryId
// minPrice
// maxPrice
// sort
// page
// size
// ==========================================

export const getExploreCourses = async ({
  keyword = "",
  categoryId = null,
  minPrice = null,
  maxPrice = null,
  sort = "newest",
  page = 1,
  size = 8,
  signal,
} = {}) => {
  // ========================================
  // KIỂM TRA PHÂN TRANG
  // ========================================

  if (
    !Number.isInteger(page) ||
    page < 1
  ) {
    throw new Error(
      "Trang phải là số nguyên >= 1"
    );
  }

  if (
    !Number.isInteger(size) ||
    size < 1 ||
    size > 50
  ) {
    throw new Error(
      "Kích thước trang phải từ 1 đến 50"
    );
  }

  // ========================================
  // KIỂM TRA SẮP XẾP
  // ========================================

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

  // ========================================
  // TẠO QUERY PARAMS
  // ========================================

  const params = new URLSearchParams();

  // Tìm kiếm theo tên khóa học
  const normalizedKeyword = String(
    keyword ?? ""
  ).trim();

  if (normalizedKeyword) {
    params.set(
      "keyword",
      normalizedKeyword
    );
  }

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

  // ========================================
  // LỌC THEO GIÁ
  // ========================================

  const hasMinPrice =
    minPrice !== null &&
    minPrice !== undefined &&
    minPrice !== "";

  const hasMaxPrice =
    maxPrice !== null &&
    maxPrice !== undefined &&
    maxPrice !== "";

  let min = null;
  let max = null;

  if (hasMinPrice) {
    min = Number(minPrice);

    if (
      !Number.isFinite(min) ||
      min < 0
    ) {
      throw new Error(
        "Giá tối thiểu không hợp lệ."
      );
    }

    params.set(
      "minPrice",
      String(min)
    );
  }

  if (hasMaxPrice) {
    max = Number(maxPrice);

    if (
      !Number.isFinite(max) ||
      max < 0
    ) {
      throw new Error(
        "Giá tối đa không hợp lệ."
      );
    }

    params.set(
      "maxPrice",
      String(max)
    );
  }

  // Giá tối thiểu không được lớn hơn giá tối đa
  if (
    min !== null &&
    max !== null &&
    min > max
  ) {
    throw new Error(
      "Giá tối thiểu không được lớn hơn giá tối đa."
    );
  }

  // ========================================
  // SẮP XẾP VÀ PHÂN TRANG
  // ========================================

  params.set(
    "sort",
    normalizedSort
  );

  params.set(
    "page",
    String(page)
  );

  params.set(
    "size",
    String(size)
  );

  // ========================================
  // GỌI API
  // ========================================

  const result = await request(
    `/public/explore/courses?${params.toString()}`,
    signal
  );

  // ========================================
  // KIỂM TRA RESPONSE
  // ========================================

  if (
    !result ||
    !Array.isArray(result.content)
  ) {
    throw new Error(
      "API trả về dữ liệu khóa học không hợp lệ."
    );
  }

  // Giữ nguyên cấu trúc result
  // để không ảnh hưởng ExplorePage.jsx
  return result;
};
