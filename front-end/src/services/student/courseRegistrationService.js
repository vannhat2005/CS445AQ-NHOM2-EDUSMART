
/**
 * EduSmart - Course Registration Service
 * Tạo đăng ký khóa học trước khi thanh toán
 */

const API_BASE_URL = (
  import.meta.env.VITE_API_URL ||
  "http://localhost:8080"
).replace(/\/+$/, "");

const REGISTER_PATH = (
  import.meta.env.VITE_COURSE_REGISTER_PATH || ""
).trim();

// ==========================================
// LẤY ACCESS TOKEN
// ==========================================

export function getAccessToken() {
  return (
    localStorage.getItem("accessToken") ||
    localStorage.getItem("token") ||
    ""
  );
}

// ==========================================
// ĐỌC RESPONSE
// ==========================================

async function parseResponse(response) {
  const text = await response.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

// ==========================================
// KIỂM TRA RESPONSE BACKEND
// ==========================================

function unwrapResponse(body, httpStatus) {
  if (
    body &&
    typeof body === "object" &&
    body.code != null &&
    Number(body.code) !== 1000
  ) {
    throw new Error(
      body.message ||
      `Đăng ký khóa học thất bại (code: ${body.code}).`
    );
  }

  const data =
    body?.result ??
    body?.data ??
    body;

  if (!data || typeof data !== "object") {
    throw new Error(
      `Backend trả về dữ liệu không hợp lệ (HTTP ${httpStatus}).`
    );
  }

  return data;
}

// ==========================================
// LẤY REGISTRATION ID
// ==========================================

function extractRegistrationId(data) {
  return (
    data?.registrationId ??
    data?.registration?.registrationId ??
    data?.registration?.id ??
    data?.id ??
    null
  );
}

// ==========================================
// ĐĂNG KÝ KHÓA HỌC
// ==========================================

/**
 * Chỉ gọi khi học viên nhấn
 * "XÁC NHẬN THANH TOÁN".
 *
 * Backend phải tạo hoặc trả về
 * CourseRegistration có trạng thái Pending.
 *
 * @param {number|string} courseId
 * @returns {Promise<object>}
 */
export async function registerCourse(courseId) {
  const id = Number(courseId);

  if (!Number.isInteger(id) || id <= 0) {
    throw new Error(
      "Mã khóa học không hợp lệ."
    );
  }

  if (!REGISTER_PATH) {
    throw new Error(
      "Chưa cấu hình VITE_COURSE_REGISTER_PATH. " +
      "Cần khai báo endpoint đăng ký khóa học trong file .env."
    );
  }

  const path = REGISTER_PATH
    .replace(/\{courseId\}/g, String(id))
    .replace(/:courseId\b/g, String(id));

  const url = /^https?:\/\//i.test(path)
    ? path
    : `${API_BASE_URL}/${path.replace(/^\/+/, "")}`;

  const token = getAccessToken();

  const response = await fetch(url, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(token
        ? {
            Authorization: `Bearer ${token}`,
          }
        : {}),
    },
    body: JSON.stringify({
      courseId: id,
    }),
  });

  const body = await parseResponse(response);

  // Kiểm tra HTTP status
  if (!response.ok) {
    throw new Error(
      body?.message ||
      body?.error ||
      `Đăng ký khóa học thất bại (HTTP ${response.status}).`
    );
  }

  // Xử lý ApiResponse Spring Boot
  const data = unwrapResponse(
    body,
    response.status
  );

  // Lấy registrationId
  const registrationId =
    extractRegistrationId(data);

  if (
    registrationId === null ||
    registrationId === undefined ||
    String(registrationId).trim() === ""
  ) {
    throw new Error(
      "Backend không trả về registrationId. " +
      "Vui lòng kiểm tra response API đăng ký khóa học."
    );
  }

  return {
    ...data,
    registrationId,
    registrationStatus:
      data.registrationStatus ??
      data.status ??
      "Pending",
  };
}
