
const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8080"
).replace(/\/$/, "");

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "GET",
    signal: options.signal,
    headers: {
      Accept: "application/json",
    },
  });

  let data;

  try {
    data = await response.json();
  } catch {
    throw new Error(`API không trả về JSON hợp lệ (${response.status})`);
  }

  if (!response.ok || (data.code != null && data.code !== 1000)) {
    throw new Error(
      data.message || `Không thể gọi API (${response.status})`
    );
  }

  return data.result;
}

// Lấy toàn bộ danh mục từ Database
export async function getExploreCategories(signal) {
  const result = await request("/api/public/explore/categories", {
    signal,
  });

  if (!Array.isArray(result)) {
    throw new Error("Danh sách danh mục không hợp lệ");
  }

  return result;
}

// Tìm kiếm + lọc + sắp xếp + phân trang từ Database
export async function getExploreCourses({
  keyword = "",
  categoryId = null,
  minPrice = null,
  maxPrice = null,
  sort = "newest",
  page = 1,
  size = 8,
  signal,
} = {}) {
  const params = new URLSearchParams();

  if (keyword.trim()) {
    params.set("keyword", keyword.trim());
  }

  if (categoryId !== null && categoryId !== "") {
    params.set("categoryId", String(categoryId));
  }

  if (minPrice !== null) {
    params.set("minPrice", String(minPrice));
  }

  if (maxPrice !== null) {
    params.set("maxPrice", String(maxPrice));
  }

  params.set("sort", sort);
  params.set("page", String(page));
  params.set("size", String(size));

  const result = await request(
    `/api/public/explore/courses?${params.toString()}`,
    { signal }
  );

  if (!result || !Array.isArray(result.content)) {
    throw new Error("API trả về dữ liệu khóa học không hợp lệ");
  }

  return result;
}
