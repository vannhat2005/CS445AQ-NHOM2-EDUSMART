import api from './api';

// ==================== 1. LẤY ID GIẢNG VIÊN ====================

// Lấy ID tài khoản giảng viên đang đăng nhập
export const getCurrentUser = async () => {
    const response = await api.get('/courses/current-user-id');
    return response.data;
};
// ==================== 2. LẤY DANH SÁCH KHÓA HỌC ====================

// Lấy danh sách khóa học được phân công cho giảng viên
export const getReportCourses = async (instructorId) => {
  const response = await api.get(`/instructors/${instructorId}/reports/courses`);
  return response.data;
};

// ==================== 3. LẤY DANH SÁCH CHƯƠNG HỌC ====================

// Lấy danh sách chương thuộc khóa học được chọn
export const getReportChapters = async (instructorId, courseId) => {
  const response = await api.get(`/instructors/${instructorId}/reports/courses/${courseId}/chapters`);
  return response.data;
};

// ==================== 4. LẤY BÁO CÁO THỐNG KÊ ====================

// Lấy báo cáo thống kê theo các điều kiện lọc
export const getInstructorReport = async (instructorId, filters = {}) => {
  const params = {};

  // Chỉ truyền courseId khi chọn khóa học cụ thể
  if (filters.courseId && filters.courseId !== 'all') {
    params.courseId = Number(filters.courseId);
  }

  // Chỉ truyền chapterId khi đã chọn khóa học và chương học cụ thể
  if (params.courseId && filters.chapterId && filters.chapterId !== 'all') {
    params.chapterId = Number(filters.chapterId);
  }

  // Truyền loại đánh giá và thời gian thống kê
  params.assessmentType = filters.assessmentType || 'all';
  params.timeRange = filters.timeRange || 'all';

  // Truyền khoảng ngày khi chọn thời gian tùy chỉnh
  if (params.timeRange === 'custom') {
    params.fromDate = filters.fromDate;
    params.toDate = filters.toDate;
  }

  const response = await api.get(`/instructors/${instructorId}/reports`, { params });
  return response.data;
};