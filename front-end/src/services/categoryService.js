import api from './api';

// Chuyển dữ liệu Backend sang định dạng Frontend
const toUI = (category) => ({
  id: category.categoryId,
  name: category.name ?? '',
  description: category.description ?? '',
  active: category.status === true,
});

// Chuyển dữ liệu Frontend thành Request gửi đến Backend
const toRequest = (form) => ({
  name: form.name.trim(),
  description: form.description.trim(),
  status: form.active,
});

// Lấy thông báo lỗi từ Backend
export const getCategoryError = (error) => {
  return error.response?.data?.message
    || error.message
    || 'Có lỗi xảy ra, vui lòng thử lại.';
};

// Các API quản lý danh mục khóa học
export const categoryService = {

  // Lấy danh sách tất cả danh mục
  async getAll() {
    const response = await api.get('/categories');

    // Backend có thể trả về List hoặc ApiResponse
    const data = response.data;
    const categories = Array.isArray(data) ? data : data?.result;

    if (!Array.isArray(categories)) {
      throw new Error('Dữ liệu danh mục không hợp lệ');
    }

    return categories.map(toUI);
  },

  // Lấy thông tin chi tiết danh mục theo ID
  async getById(categoryId) {
    const response = await api.get(`/categories/${categoryId}`);

    return toUI(response.data?.result ?? response.data);
  },

  // Thêm danh mục khóa học
  async create(form) {
    const response = await api.post('/categories', toRequest(form));

    // Trả về toàn bộ response để giữ message từ Backend
    return response.data;
  },

  // Cập nhật thông tin danh mục
  async update(categoryId, form) {
    const response = await api.put(
      `/categories/${categoryId}`,
      toRequest(form)
    );

    // Trả về toàn bộ response để giữ message từ Backend
    return response.data;
  },
};