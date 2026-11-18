
import api from './api';

// Chuyển trạng thái Backend sang Frontend
const toStatusUI = status => ({
  Draft: 'DRAFT',
  Published: 'PUBLISHED',
  Hidden: 'HIDDEN'
}[status] || 'DRAFT');

// Chuyển trạng thái Frontend sang Backend
const toStatusBackend = status => ({
  DRAFT: 'Draft',
  PUBLISHED: 'Published',
  HIDDEN: 'Hidden'
}[status] || 'Draft');

// Chuyển dữ liệu khóa học Backend sang Frontend
const toUI = course => ({
  courseId: course.courseId,
  title: course.title ?? '',
  description: course.description ?? '',
  learningOutcomes: course.learningOutcomes ?? '[]',
  price: course.price ?? 0,
  imageUrl: course.imageUrl ?? '',
  instructorId: course.instructorId,
  instructorName: course.instructorName ?? '',
  categoryId: course.categoryId,
  categoryName: course.categoryName ?? '',
  status: toStatusUI(course.status),
  createdAt: course.createdAt,
  updatedAt: course.updatedAt
});

// Chuyển dữ liệu form thành Request gửi Backend
const toRequest = (form, isUpdate = false) => {
  const request = {
    title: form.title.trim(),
    description: form.description.trim(),
    learningOutcomes: JSON.stringify(
      form.learningOutcomes.map(item => item.trim()).filter(Boolean)
    ),
    price: form.price === '' ? null : Number(form.price),
    imageUrl: form.imageUrl.trim(),
    instructorId: form.instructorId === '' ? null : Number(form.instructorId),
    categoryId: form.categoryId === '' ? null : Number(form.categoryId)
  };

  // Chỉ UpdateRequest mới có trạng thái
  if (isUpdate) request.status = toStatusBackend(form.status);
  return request;
};

// Lấy thông báo lỗi từ Backend
export const getCourseError = error => {
  return error.response?.data?.message
    || error.message
    || 'Có lỗi xảy ra, vui lòng thử lại.';
};

// Các API quản lý khóa học dành cho Admin
export const courseService = {

  // Lấy danh sách khóa học có tìm kiếm, lọc và phân trang
  async getAll({ keyword = '', categoryId = 'all', page = 1, size = 5 } = {}) {
    const response = await api.get('/admin/courses', {
      params: {
        keyword: keyword.trim() || undefined,
        categoryId: categoryId === 'all' ? undefined : Number(categoryId),
        page: page - 1,
        size
      }
    });

    const data = response.data?.result ?? response.data;
    if (!Array.isArray(data?.content)) {
      throw new Error('Dữ liệu khóa học không hợp lệ');
    }

    return {
      courses: data.content.map(toUI),
      totalElements: data.totalElements ?? 0,
      totalPages: data.totalPages ?? 0
    };
  },

  // Xem thông tin chi tiết khóa học
  async getById(courseId) {
    const response = await api.get(`/admin/courses/${courseId}`);
    return toUI(response.data?.result ?? response.data);
  },

  // Thêm khóa học mới, Backend tự gán trạng thái Draft
  async create(form) {
    const response = await api.post('/admin/courses', toRequest(form));
    return response.data;
  },

  // Cập nhật thông tin và trạng thái khóa học
  async update(courseId, form) {
    const response = await api.put(
      `/admin/courses/${courseId}`,
      toRequest(form, true)
    );
    return response.data;
  },

  // Lấy thống kê khóa học
  async getStatistics() {
    const response = await api.get('/admin/courses/statistics');
    return response.data?.result ?? response.data;
  },

  // Lấy danh sách giảng viên từ Backend
  async getInstructors() {
    const response = await api.get('/admin/courses/instructors');
    const data = response.data?.result ?? response.data;

    if (!Array.isArray(data)) {
      throw new Error('Dữ liệu giảng viên không hợp lệ');
    }

    return data;
  }
};
