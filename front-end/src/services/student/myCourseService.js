
import api from "../api";

// Lấy danh sách khóa học đã mua của học viên
// Hỗ trợ tìm kiếm, lọc, sắp xếp và phân trang
export const getMyCourses = async (
  pageNo = 1,
  pageSize = 6,
  status = "ALL",
  keyword = "",
  sortBy = "ALL_NEWEST"
) => {
  try {
    const response = await api.get("/student/my-courses", {
      params: {
        pageNo,
        pageSize,
        status,
        keyword: typeof keyword === "string"
          ? keyword.trim()
          : "",
        sortBy,
      },
    });

    // Kiểm tra kết quả trả về từ Backend
    if (response.data?.code !== 1000) {
      throw new Error(
        response.data?.message ||
          "Không thể lấy danh sách khóa học"
      );
    }

    const result = response.data?.result;

    // Kiểm tra dữ liệu phân trang
    if (!result || !Array.isArray(result.content)) {
      throw new Error(
        "Dữ liệu khóa học từ Backend không hợp lệ"
      );
    }

    return result;
  } catch (error) {
    console.error(
      "Lỗi khi lấy danh sách khóa học của tôi:",
      error
    );

    throw error;
  }
};

export default {
  getMyCourses,
};
