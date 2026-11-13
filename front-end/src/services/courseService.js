
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
