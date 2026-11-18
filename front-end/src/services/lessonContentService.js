
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8080/api'
});

const unwrap = (response) => response.data?.result ?? response.data;

export const getLessonContentFileUrl = (path) => {
  if (!path) return '';
  if (/^https?:\/\//i.test(path)) return path;
  return `http://localhost:8080${path.startsWith('/') ? '' : '/'}${path}`;
};

const basePath = (courseId, chapterId, lessonId) =>
  `/courses/${courseId}/chapters/${chapterId}/lessons/${lessonId}/contents`;

const lessonContentService = {
  // Lấy danh sách nội dung
  getContents: async (courseId, chapterId, lessonId) =>
    unwrap(await api.get(basePath(courseId, chapterId, lessonId))),

  // Thêm nội dung
  createContent: async (courseId, chapterId, lessonId, formData) =>
    (await api.post(basePath(courseId, chapterId, lessonId), formData)).data,

  // Cập nhật nội dung
  updateContent: async (courseId, chapterId, lessonId, contentId, formData) =>
    (await api.put(`${basePath(courseId, chapterId, lessonId)}/${contentId}`, formData)).data,

  // Thay đổi thứ tự
  moveContent: async (courseId, chapterId, lessonId, contentId, direction) =>
    (await api.patch(`${basePath(courseId, chapterId, lessonId)}/${contentId}/move`, null, { params: { direction } })).data,
};

export default lessonContentService;
