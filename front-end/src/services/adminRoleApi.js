
import api from './api';

// Lấy thông báo lỗi từ Backend
export const getRoleError = error => {
  return error.response?.data?.message
    || error.message
    || 'Có lỗi xảy ra, vui lòng thử lại.';
};

// API quản lý phân quyền
export const roleService = {

  // Lấy danh sách người dùng và vai trò
  async getAll() {
    const response = await api.get('/admin/roles');
    const data = response.data?.result;

    if (!Array.isArray(data)) {
      throw new Error('Dữ liệu phân quyền không hợp lệ');
    }

    return data;
  },

  // Cập nhật nhiều vai trò cùng lúc
  async updateRoles(changes) {
    const response = await api.put('/admin/roles', {
      changes: changes.map(item => ({
        userId: item.userId,
        role: item.newRole
      }))
    });

    return response.data;
  }
};
