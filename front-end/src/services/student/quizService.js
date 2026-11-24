import api from "../api";

const unwrap = (response) => {
  if (response.data?.code !== 1000) {
    throw new Error(response.data?.message || "Không thể tải dữ liệu bài kiểm tra");
  }
  return response.data.result;
};

/**
 * Lấy chi tiết đề thi trắc nghiệm (câu hỏi, phương án, thời lượng, tiêu đề)
 * @param {number|string} quizId
 * @param {AbortSignal} [signal]
 */
export const getStudentQuizDetail = async (quizId, signal) =>
  unwrap(
    await api.get(`/student/quizzes/${quizId}`, { signal })
  );

/**
 * Nộp bài kiểm tra trắc nghiệm
 * @param {number|string} quizId
 * @param {object} payload - { timeSpentSeconds, answers: { [questionId]: answerId } }
 */
export const submitStudentQuiz = async (quizId, payload) =>
  unwrap(
    await api.post(`/student/quizzes/${quizId}/submit`, payload)
  );
