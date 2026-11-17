
const API_BASE_URL = "http://localhost:8080/api/courses";

/**
 * Lấy danh sách khóa học nổi bật có phân trang.
 *
 * GET /api/courses/featured?pageNo=1&pageSize=8
 *
 * @param {number} pageNo - Trang hiện tại, bắt đầu từ 1
 * @param {number} pageSize - Số khóa học mỗi trang (1 đến 20)
 * @returns {Promise<Object>} ApiResponse chứa PageResponse
 */
export const getCourses = async (pageNo = 1, pageSize = 8) => {
  if (!Number.isInteger(pageNo) || pageNo < 1) {
    throw new Error("pageNo phải là số nguyên >= 1");
  }

  if (
    !Number.isInteger(pageSize) ||
    pageSize < 1 ||
    pageSize > 20
  ) {
    throw new Error("pageSize phải từ 1 đến 20");
  }

  const params = new URLSearchParams({
    pageNo: String(pageNo),
    pageSize: String(pageSize),
  });

  const response = await fetch(
    `${API_BASE_URL}/featured?${params.toString()}`,
    {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    }
  );

  if (!response.ok) {
    throw new Error(
      `Không thể lấy khóa học. HTTP ${response.status}`
    );
  }

  const data = await response.json();

  // Backend trả về:
  // {
  //   code: 1000,
  //   message: "...",
  //   result: {
  //     content: [...],
  //     pageNo: 1,
  //     pageSize: 8,
  //     totalElements: 30,
  //     totalPages: 4,
  //     last: false
  //   }
  // }

  if (
    !data ||
    !data.result ||
    !Array.isArray(data.result.content)
  ) {
    throw new Error(
      "Dữ liệu khóa học không hợp lệ: thiếu result.content"
    );
  }

  const pageData = data.result;

  return {
    ...data,
    result: {
      ...pageData,
      content: pageData.content,
      pageNo: pageData.pageNo,
      pageSize: pageData.pageSize,
      totalElements: pageData.totalElements,
      totalPages: pageData.totalPages,
      last: pageData.last ?? pageData.isLast ?? false,
    },
  };
};
