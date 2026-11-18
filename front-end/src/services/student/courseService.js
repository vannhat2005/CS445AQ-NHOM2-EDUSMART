
const API_BASE_URL = "http://localhost:8080/api/public/home";

async function request(endpoint, signal) {
  let response;

  try {
    response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      signal,
    });
  } catch (error) {
    if (error.name === "AbortError") throw error;

    throw new Error(
      "Không thể kết nối Backend. Kiểm tra Spring Boot hoặc CORS."
    );
  }

  let data;

  try {
    data = await response.json();
  } catch {
    throw new Error(
      `Backend trả về JSON không hợp lệ (HTTP ${response.status})`
    );
  }

  if (!response.ok || data?.code !== 1000) {
    throw new Error(
      data?.message ||
        `Yêu cầu thất bại (HTTP ${response.status})`
    );
  }

  return data;
}

// ==========================================
// TOP 3 DANH MỤC
// ==========================================

export const getTopCategories = async (signal) => {
  const data = await request("/top-categories", signal);

  if (!Array.isArray(data.result)) {
    throw new Error(
      "Dữ liệu danh mục không hợp lệ: result phải là mảng"
    );
  }

  return data.result.map(({ categoryId, name }) => ({
    categoryId,
    name,
  }));
};

// ==========================================
// KHÓA HỌC + LỌC + SẮP XẾP + PHÂN TRANG
// ==========================================

export const getCourses = async ({
  categoryId = null,
  sort = "newest",
  page = 1,
  size = 8,
  signal,
} = {}) => {
  if (!Number.isInteger(page) || page < 1) {
    throw new Error("Trang phải là số nguyên >= 1");
  }

  if (!Number.isInteger(size) || size < 1 || size > 50) {
    throw new Error("Kích thước trang phải từ 1 đến 50");
  }

  const normalizedSort = String(sort || "newest")
    .trim()
    .toLowerCase();

  if (
    !["newest", "price_asc", "price_desc"].includes(normalizedSort)
  ) {
    throw new Error("Kiểu sắp xếp không hợp lệ");
  }

  const params = new URLSearchParams({
    sort: normalizedSort,
    page: String(page),
    size: String(size),
  });

  if (
    categoryId !== null &&
    categoryId !== undefined &&
    categoryId !== ""
  ) {
    const id = Number(categoryId);

    if (!Number.isInteger(id) || id <= 0) {
      throw new Error("categoryId không hợp lệ");
    }

    params.set("categoryId", String(id));
  }

  const data = await request(
    `/courses?${params.toString()}`,
    signal
  );

  if (!data.result || !Array.isArray(data.result.content)) {
    throw new Error(
      "Dữ liệu khóa học không hợp lệ: thiếu result.content"
    );
  }

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
