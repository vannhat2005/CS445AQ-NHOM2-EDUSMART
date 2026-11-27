import api from './api';

// Đường dẫn API quản lý sinh viên theo khóa học
const basePath = (courseId) => `/instructor/courses/${courseId}/students`;

const studentListService = {

  // 1. Lấy danh sách sinh viên, tìm kiếm và phân trang
  getStudents: async (instructorId, courseId, keyword = '', pageNo = 1, pageSize = 7) => {
    const response = await api.get(basePath(courseId), {
      params: { instructorId, keyword, pageNo, pageSize }
    });
    return response.data.result;
  },

  // 2. Lấy chi tiết thông tin và lịch sử kiểm tra của sinh viên
  getStudentDetail: async (instructorId, courseId, studentId) => {
    const response = await api.get(`${basePath(courseId)}/${studentId}`, {
      params: { instructorId }
    });
    return response.data.result;
  },

  // 3. Xuất danh sách sinh viên ra file Excel
  exportStudents: async (instructorId, courseId, keyword = '') => {
    const response = await api.get(`${basePath(courseId)}/export`, {
      params: { instructorId, keyword },
      responseType: 'blob' // Nhận dữ liệu dưới dạng file
    });
    return response.data;
  }
};

export default studentListService;