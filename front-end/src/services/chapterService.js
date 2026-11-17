import api from './api';

// Lấy danh sách chương theo khóa học
export const getChaptersByCourseId = async (courseId) => {
    const response = await api.get(`/courses/${courseId}/chapters`);
    return response.data;
};

// Thêm chương học mới vào khóa học
export const createChapter = async (courseId, data) => {
    const response = await api.post(`/courses/${courseId}/chapters`, data);
    return response.data;
};

// Cập nhật thông tin chương học
export const updateChapter = async (courseId, chapterId, data) => {
    const response = await api.put(
        `/courses/${courseId}/chapters/${chapterId}`,
        data
    );
    return response.data;
};

// Xóa chương học
export const deleteChapter = async (courseId, chapterId) => {
    const response = await api.delete(`/courses/${courseId}/chapters/${chapterId}`);
    return response.data;
};

// Di chuyển chương học lên hoặc xuống
export const moveChapter = async (courseId, chapterId, direction) => {
    const response = await api.patch(
        `/courses/${courseId}/chapters/${chapterId}/move`,
        null,
        {
            params: { direction }
        }
    );
    return response.data;
};