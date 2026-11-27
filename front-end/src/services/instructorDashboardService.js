import api from "./api";

// ==========================================
// LẤY THÔNG TIN DASHBOARD GIẢNG VIÊN
// ==========================================

export const getInstructorDashboard = async () => {
  const response = await api.get("/instructors/dashboard");
  return response.data;
};