
const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ||
  "http://localhost:8080"
).replace(/\/+$/, "");

const getHeaders = () => {
  const token =
    localStorage.getItem("accessToken") ||
    localStorage.getItem("token");

  return {
    Accept: "application/json",
    ...(token
      ? { Authorization: `Bearer ${token}` }
      : {}),
  };
};

const request = async (endpoint, signal) => {
  const response = await fetch(
    `${API_BASE_URL}${endpoint}`,
    {
      method: "GET",
      headers: getHeaders(),
      signal,
    }
  );

  if (!response.ok) {
    throw new Error(
      `Không thể tải dữ liệu (HTTP ${response.status})`
    );
  }

  const data = await response.json();

  if (data.code != null && data.code !== 1000) {
    throw new Error(
      data.message || "Không thể tải dữ liệu khóa học"
    );
  }

  return data.result;
};

// 1. Lấy thông tin chi tiết khóa học
export const getCourseDetail = (courseId, signal) => {
  return request(
    `/api/courses/${encodeURIComponent(courseId)}/detail`,
    signal
  );
};

// 2. Lấy chương và bài học
export const getCourseCurriculum = (courseId, signal) => {
  return request(
    `/api/courses/${encodeURIComponent(courseId)}/curriculum`,
    signal
  );
};

// 3. Lấy đánh giá khóa học
export const getCourseReviews = (
  courseId,
  pageNo = 1,
  pageSize = 5,
  signal
) => {
  return request(
    `/api/courses/${encodeURIComponent(courseId)}/reviews?pageNo=${pageNo}&pageSize=${pageSize}`,
    signal
  );
};
