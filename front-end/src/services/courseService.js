
import api from './api';

/**
 * Lấy danh sách khóa học được phân công cho giảng viên.
 *
 * @param {number} instructorId - ID giảng viên
 * @param {number} pageNo - Trang hiện tại
 * @param {number} pageSize - Số lượng khóa học mỗi trang
 */
export const getAssignedCourses = async (instructorId, pageNo = 1, pageSize = 10) => {
    const response = await api.get(`/courses/assigned/${instructorId}`,
        {
            params: {
                pageNo,
                pageSize
            }
        }
    );

    return response.data;
};

// ==========================================
// API: Giảng viên xem chi tiết khóa học
// ==========================================
export const getAssignedCourseDetail = async (instructorId, courseId) => {
  const response = await api.get(
    `/courses/assigned/${instructorId}/${courseId}`
  );

  return response.data;
};

// ==========================================
// API: Giảng viên xuất bản khóa học
// ==========================================
// Method: PUT
// URL: /courses/assigned/{instructorId}/{courseId}/publish

export const publishCourse = (instructorId, courseId) => {
    return api.put(
        `/courses/assigned/${instructorId}/${courseId}/publish`
    );
};

