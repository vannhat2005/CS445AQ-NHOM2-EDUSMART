
import api from './api';

// Lấy danh sách bài học thuộc chương
export const getLessonsByChapterId = async (courseId, chapterId) => {
  const response = await api.get(`/courses/${courseId}/chapters/${chapterId}/lessons`);
  return response.data;
};

// Thêm bài học mới
export const createLesson = async (courseId, chapterId, data) => {
  const response = await api.post(`/courses/${courseId}/chapters/${chapterId}/lessons`, data);
  return response.data;
};

// Cập nhật tên và trạng thái bài học
export const updateLesson = async (courseId, chapterId, lessonId, data) => {
  const response = await api.put(`/courses/${courseId}/chapters/${chapterId}/lessons/${lessonId}`, data);
  return response.data;
};

// Di chuyển bài học lên hoặc xuống
export const moveLesson = async (courseId, chapterId, lessonId, direction) => {
  const response = await api.patch(
    `/courses/${courseId}/chapters/${chapterId}/lessons/${lessonId}/move`,
    null,
    { params: { direction } }
  );
  return response.data;
};
