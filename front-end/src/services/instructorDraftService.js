import api from './api';

// Lấy danh sách bản nháp của giảng viên
export const getDrafts = async (instructorId) => {
  const response = await api.get(`/instructors/${instructorId}/drafts`);
  return response.data;
};

// Lấy chi tiết bản nháp và danh sách câu hỏi
export const getDraftDetail = async (instructorId, quizId) => {
  const response = await api.get(`/instructors/${instructorId}/drafts/${quizId}`);
  return response.data;
};

// Xóa bản nháp và toàn bộ câu hỏi, phương án trả lời liên quan
export const deleteDraft = async (instructorId, quizId) => {
  const response = await api.delete(`/instructors/${instructorId}/drafts/${quizId}`);
  return response.data;
};