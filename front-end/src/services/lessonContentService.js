
import api from "./api";

const unwrap = (response) => response.data?.result ?? response.data;

export const getLessonContentFileUrl = (path) => {
  if (!path) return "";
  if (/^https?:\/\//i.test(path)) return path;
  const baseUrl = (import.meta.env.VITE_API_URL || "http://localhost:8080").replace(/\/+$/, "");
  return `${baseUrl}${path.startsWith("/") ? "" : "/"}${path}`;
};

const basePath = (courseId, chapterId, lessonId) => `/courses/${courseId}/chapters/${chapterId}/lessons/${lessonId}/contents`;

const lessonContentService = {
  // Lấy danh sách nội dung bài học
  getContents: async (courseId, chapterId, lessonId) =>
    unwrap(await api.get(basePath(courseId, chapterId, lessonId))),

  // Thêm nội dung bài học
  createContent: async (courseId, chapterId, lessonId, formData) =>
    (await api.post(basePath(courseId, chapterId, lessonId), formData, {
      headers: { "Content-Type": undefined }
    })).data,

  // Cập nhật nội dung bài học
  updateContent: async (courseId, chapterId, lessonId, contentId, formData) =>
    (await api.put(`${basePath(courseId, chapterId, lessonId)}/${contentId}`, formData, {
      headers: { "Content-Type": undefined }
    })).data,

  // Thay đổi thứ tự nội dung bài học
  moveContent: async (courseId, chapterId, lessonId, contentId, direction) =>
    (await api.patch(`${basePath(courseId, chapterId, lessonId)}/${contentId}/move`, null, { params: { direction } })).data,
};

export default lessonContentService;
