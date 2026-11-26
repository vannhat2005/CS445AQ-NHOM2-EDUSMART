import api from './api';

import { getCurrentUser } from '../services/authService';

// Lấy ID tài khoản đang đăng nhập để truyền vào đường dẫn API
export const getInstructorId = async () => {
    const response = await getCurrentUser();
    const id = Number(response?.result?.userId ?? response?.result ?? response?.userId ?? response);

    if (!Number.isInteger(id) || id <= 0) {
        throw new Error('Không xác định được tài khoản giảng viên');
    }

    return id;
};
// Đường dẫn API quản lý trắc nghiệm
const getBaseUrl = (instructorId) => `/instructors/${instructorId}/quizzes`;

// Lấy bài kiểm tra cuối chương
export const getChapterQuiz = async (instructorId, chapterId) => {
    const response = await api.get(`${getBaseUrl(instructorId)}/chapter/${chapterId}`);
    return response.data;
};

// Lấy trắc nghiệm bài học
export const getLessonQuiz = async (instructorId, lessonId) => {
    const response = await api.get(`${getBaseUrl(instructorId)}/lesson/${lessonId}`);
    return response.data;
};

// Lấy chi tiết bộ trắc nghiệm
export const getQuizDetail = async (instructorId, quizId) => {
    const response = await api.get(`${getBaseUrl(instructorId)}/${quizId}`);
    return response.data;
};

// Tạo bộ trắc nghiệm thủ công
export const createQuiz = async (instructorId, data) => {
    const response = await api.post(getBaseUrl(instructorId), data);
    return response.data;
};

// Cập nhật tên bộ trắc nghiệm
export const updateQuizTitle = async (instructorId, quizId, data) => {
    const response = await api.patch(`${getBaseUrl(instructorId)}/${quizId}/title`, data);
    return response.data;
};

// Thêm câu hỏi
export const addQuestion = async (instructorId, quizId, data) => {
    const response = await api.post(`${getBaseUrl(instructorId)}/${quizId}/questions`, data);
    return response.data;
};

// Cập nhật câu hỏi
export const updateQuestion = async (instructorId, quizId, questionId, data) => {
    const response = await api.put(`${getBaseUrl(instructorId)}/${quizId}/questions/${questionId}`, data);
    return response.data;
};

// Xóa câu hỏi
export const deleteQuestion = async (instructorId, quizId, questionId) => {
    const response = await api.delete(`${getBaseUrl(instructorId)}/${quizId}/questions/${questionId}`);
    return response.data;
};

// Xuất bản bộ trắc nghiệm
export const publishQuiz = async (instructorId, quizId) => {
    const response = await api.patch(`${getBaseUrl(instructorId)}/${quizId}/publish`);
    return response.data;
};