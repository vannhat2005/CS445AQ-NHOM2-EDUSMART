
import api from "./api";

// ========================================
// XỬ LÝ RESPONSE TỪ BACKEND
// ========================================

const handleResponse = (response) => {
  const data = response.data;

  // Backend EduSmart trả code = 1000 khi thành công
  if (data?.code !== 1000) {
    throw new Error(
      data?.message || "Yêu cầu xử lý thất bại!"
    );
  }

  return data;
};

// Lấy thông báo lỗi từ Backend
export const getForgotPasswordError = (error) => {
  // Lỗi được chủ động throw từ handleResponse
  if (!error.response && error.message) {
    return error.message;
  }

  // Lỗi từ ApiResponse của Spring Boot
  if (error.response?.data?.message) {
    return error.response.data.message;
  }

  if (error.code === "ECONNABORTED") {
    return "Máy chủ phản hồi quá lâu. Vui lòng thử lại!";
  }

  if (error.response?.status === 401) {
    return "Yêu cầu bị từ chối. Vui lòng thử lại!";
  }

  if (error.response?.status === 429) {
    return "Bạn thao tác quá nhiều lần. Vui lòng thử lại sau!";
  }

  return "Có lỗi xảy ra. Vui lòng thử lại!";
};

// ========================================
// 1. GỬI OTP QUA GMAIL
// ========================================

export const sendForgotPasswordOtp = async (email) => {
  const response = await api.post(
    "/auth/forgot-password",
    { email }
  );

  return handleResponse(response);
};

// ========================================
// 2. GỬI LẠI OTP
// ========================================

export const resendForgotPasswordOtp = async (email) => {
  const response = await api.post(
    "/auth/resend-otp",
    { email }
  );

  return handleResponse(response);
};

// ========================================
// 3. XÁC THỰC OTP
// ========================================

export const verifyForgotPasswordOtp = async (
  email,
  otp
) => {
  const response = await api.post(
    "/auth/verify-otp",
    {
      email,
      otp,
    }
  );

  return handleResponse(response);
};

// ========================================
// 4. ĐẶT LẠI MẬT KHẨU
// ========================================

export const resetForgotPassword = async (
  resetToken,
  newPassword,
  confirmPassword
) => {
  const response = await api.post(
    "/auth/reset-password",
    {
      resetToken,
      newPassword,
      confirmPassword,
    }
  );

  return handleResponse(response);
};
