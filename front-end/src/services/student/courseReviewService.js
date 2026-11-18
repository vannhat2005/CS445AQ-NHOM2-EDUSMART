
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
    const error = new Error(
      "ID khóa học không hợp lệ"
    );

    error.status = 400;
    throw error;
  }

  return encodeURIComponent(courseId);
};

// ==========================================
// 2. TẠO ERROR
// ==========================================

const createError = (message, status, code) => {
  const error = new Error(message);

  if (status !== undefined) {
    error.status = status;
  }

  if (code !== undefined) {
    error.code = code;
  }

  return error;
};

// ==========================================
// 3. XỬ LÝ LỖI API
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
      `Không thể gửi đánh giá (HTTP ${status})`;

    switch (status) {
      case 400:
        message =
          data?.message ||
          "Dữ liệu đánh giá không hợp lệ";
        break;

      case 401:
        message =
          "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.";
        break;

      case 403:
        message =
          data?.message ||
          "Bạn cần thanh toán khóa học trước khi đánh giá.";
        break;

      case 404:
        message =
          data?.message ||
          "Không tìm thấy khóa học.";
        break;

      case 409:
        message =
          data?.message ||
          "Bạn đã đánh giá khóa học này rồi.";
        break;

      case 500:
        message =
          data?.message ||
          "Máy chủ gặp lỗi. Vui lòng thử lại sau.";
        break;

      default:
        break;
    }

    throw createError(
      message,
      status,
      data?.code
    );
  }

  // Lỗi do kiểm tra dữ liệu hoặc ApiResponse
  if (error instanceof Error) {
    throw error;
  }

  throw createError(
    "Không thể kết nối đến máy chủ.",
    0
  );
};

// ==========================================
// 4. GỬI ĐÁNH GIÁ KHÓA HỌC
// ==========================================
// POST /api/courses/{courseId}/reviews
//
// Backend tự lấy userId từ JWT.
//
// Điều kiện:
// - Đã đăng nhập
// - Đã thanh toán khóa học (Paid)
// - Chưa đánh giá khóa học
// - Rating từ 1 đến 5
// ==========================================

export const createCourseReview = async (
  courseId,
  reviewData
) => {
  // Kiểm tra ID khóa học
  const id = validateCourseId(courseId);

  // Kiểm tra số sao
  const rating = Number(reviewData?.rating);

  if (
    !Number.isInteger(rating) ||
    rating < 1 ||
    rating > 5
  ) {
    throw createError(
      "Số sao đánh giá phải từ 1 đến 5.",
      400
    );
  }

  // Kiểm tra nội dung
  const comment = String(
    reviewData?.comment ?? ""
  ).trim();

  if (comment.length > 5000) {
    throw createError(
      "Nội dung đánh giá không được vượt quá 5000 ký tự.",
      400
    );
  }

  try {
    // Axios api.js tự động:
    // - Lấy Access Token từ localStorage
    // - Gửi Authorization: Bearer token
    // - Refresh Access Token nếu hết hạn

    const response = await api.post(
      `/courses/${id}/reviews`,
      {
        rating,
        comment,
      }
    );

    const data = response.data;

    // Kiểm tra response rỗng
    if (data == null) {
      // Backend có thể trả 204 No Content
      if (response.status === 204) {
        return null;
      }

      throw createError(
        "Server không trả về dữ liệu hợp lệ."
      );
    }

    // Kiểm tra ApiResponse Spring Boot
    if (
      data.code != null &&
      data.code !== 1000
    ) {
      throw createError(
        data.message ||
          "Không thể gửi đánh giá khóa học.",
        response.status,
        data.code
      );
    }

    // Trả kết quả
    return data.result ?? data;
  } catch (error) {
    handleApiError(error);
  }
};
