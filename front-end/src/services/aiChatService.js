import api from "./api";

/**
 * Service giao tiếp với module AI ChatBox & RAG EduSmart trên Backend Spring Boot
 */
export const aiChatService = {
  /**
   * Hỏi đáp bài học dựa trên tài liệu PDF
   * @param {Object} params
   * @param {string} params.message - Câu hỏi của học sinh
   * @param {number|string} [params.lessonId] - ID bài học
   * @param {number|string} [params.courseId] - ID khóa học
   * @param {Array} [params.history] - Lịch sử đàm thoại
   */
  chatLesson: async ({ message, lessonId, courseId, history = [] }) => {
    const payload = {
      message: message.trim(),
      lessonId: lessonId ? Number(lessonId) : null,
      courseId: courseId ? Number(courseId) : null,
      history: history.map((h) => ({
        role: h.role,
        content: h.content,
      })),
    };
    const response = await api.post("/chat/lesson", payload);
    return response.data;
  },

  /**
   * Giải thích câu hỏi trắc nghiệm và phân tích đáp án dựa trên PDF bài học
   * @param {Object} params
   * @param {string} params.questionText - Nội dung câu hỏi
   * @param {Array<string>} [params.options] - Các lựa chọn
   * @param {string} [params.selectedOption] - Lựa chọn của học sinh
   * @param {number|string} [params.lessonId] - ID bài học
   * @param {number|string} [params.courseId] - ID khóa học
   * @param {number|string} [params.questionId] - ID câu hỏi trong DB
   * @param {string} [params.userQuery] - Thắc mắc cụ thể của học sinh
   */
  chatQuiz: async ({
    questionText,
    options = [],
    selectedOption = null,
    lessonId = null,
    courseId = null,
    questionId = null,
    userQuery = null,
    resultId = null,
  }) => {
    const payload = {
      questionText,
      options,
      selectedOption,
      lessonId: lessonId ? Number(lessonId) : null,
      courseId: courseId ? Number(courseId) : null,
      questionId: questionId ? Number(questionId) : null,
      userQuery,
      resultId: resultId ? Number(resultId) : null,
    };
    const response = await api.post("/chat/quiz", payload);
    return response.data;
  },

  /**
   * Lấy lịch sử chat bài học lưu trong MongoDB
   */
  getLessonHistory: async (lessonId) => {
    if (!lessonId) return [];
    try {
      const response = await api.get(`/chat/history/lesson/${lessonId}`);
      return response.data || [];
    } catch (err) {
      console.warn("Không thể tải lịch sử chat từ MongoDB:", err);
      return [];
    }
  },

  /**
   * Xóa / làm mới lịch sử chat bài học trong MongoDB
   */
  clearLessonHistory: async (lessonId) => {
    if (!lessonId) return false;
    try {
      await api.delete(`/chat/history/lesson/${lessonId}`);
      return true;
    } catch (err) {
      console.warn("Không thể xóa lịch sử chat bài học:", err);
      return false;
    }
  },

  /**
   * Lấy lịch sử chat quiz lưu trong MongoDB
   */
  getQuizHistory: async ({ resultId, lessonId }) => {
    try {
      const params = {};
      if (resultId) params.resultId = resultId;
      if (lessonId) params.lessonId = lessonId;
      const response = await api.get("/chat/history/quiz", { params });
      return response.data || [];
    } catch (err) {
      console.warn("Không thể tải lịch sử chat quiz từ MongoDB:", err);
      return [];
    }
  },

  /**
   * Kiểm tra tình trạng kết nối AI Engine
   */
  getHealth: async () => {
    const response = await api.get("/chat/health");
    return response.data;
  },
};

export default aiChatService;
