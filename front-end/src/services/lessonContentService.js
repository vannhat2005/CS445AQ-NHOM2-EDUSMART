
import api, { getAccessToken } from './api';

const unwrap = (response) => response.data?.result ?? response.data;

export const getLessonContentFileUrl = (path) => {
  if (!path) return '';
  let fullUrl = path;
  if (!/^https?:\/\//i.test(path)) {
    fullUrl = `http://localhost:8080${path.startsWith('/') ? '' : '/'}${path}`;
  }
  const token = getAccessToken();
  if (token) {
    try {
      const u = new URL(fullUrl);
      if (!u.searchParams.has('token')) {
        u.searchParams.set('token', token);
      }
      return u.href;
    } catch {
      return fullUrl;
    }
  }
  return fullUrl;
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
