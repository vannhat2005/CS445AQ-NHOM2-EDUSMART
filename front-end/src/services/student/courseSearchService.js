
import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "http://localhost:8080";

/**
 * API tìm kiếm khóa học EduSmart.
 *
 * GET /api/courses/search
 *
 * Query params:
 * - keyword
 * - pageNo: bắt đầu từ 1
 * - pageSize: mặc định 8
 */
export const searchCourses = async (
  keyword = "",
  pageNo = 1,
  pageSize = 8
) => {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/api/courses/search`,
      {
        params: {
          keyword: String(keyword).trim(),
          pageNo,
          pageSize,
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error(
      "Lỗi tìm kiếm khóa học:",
      error.response?.data || error.message
    );

    throw error;
  }
};

/**
 * Chuẩn hóa PageResponse từ Spring Boot.
 *
 * Hỗ trợ các tên trường phân trang phổ biến.
 * Cần đối chiếu với PageResponse.java thực tế.
 */
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

  const totalElements = Number(
    data?.totalElements ??
    data?.totalItems ??
    data?.totalRecords ??
    courses.length
  );

  const totalPages = Number(
    data?.totalPages ??
    data?.totalPage ??
    Math.ceil(totalElements / pageSize)
  );

  return {
    courses,
    totalElements,
    totalPages,
    currentPage: Number(data?.pageNo ?? pageNo),
  };
};

export const getSearchResults = async (
  keyword,
  pageNo = 1,
  pageSize = 8
) => {
  const response = await searchCourses(
    keyword,
    pageNo,
    pageSize
  );

  return normalizeSearchResponse(
    response,
    pageNo,
    pageSize
  );
};
