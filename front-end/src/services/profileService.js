import api from "./api";

// ========================================
// API QUẢN LÝ THÔNG TIN CÁ NHÂN
// ========================================

// Lấy thông tin cá nhân
export const getPersonalProfile = async () => {
  const response = await api.get("/users/my-info");
  return response.data;
};

// Cập nhật họ tên và ảnh đại diện
export const updatePersonalProfile = async (fullName, avatarFile) => {
  const formData = new FormData();

  // Thêm họ và tên
  formData.append("fullName", fullName);

  // Chỉ gửi ảnh nếu người dùng chọn ảnh mới
  if (avatarFile) {
    formData.append("avatar", avatarFile);
  }

  // Gửi yêu cầu cập nhật lên Backend
  const response = await api.put("/users/my-info", formData);
  return response.data;
};