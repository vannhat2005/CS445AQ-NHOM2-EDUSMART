
import api from "../api";

const unwrap = (response) => {
  if (response.data?.code !== 1000) {
    throw new Error(response.data?.message || "Không thể tải dữ liệu");
  }
  return response.data.result;
};

export const getLessonDetail = async (courseId, lessonId, signal) =>
  unwrap(
    await api.get(
      `/student/courses/${courseId}/lessons/${lessonId}`,
      { signal }
    )
  );

export const getCourseCurriculum = async (courseId, signal) =>
  unwrap(
    await api.get(
      `/courses/${courseId}/curriculum`,
      { signal }
    )
  );
