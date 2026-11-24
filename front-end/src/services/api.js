
import axios from "axios";

// ========================================
// 1. CẤU HÌNH API
// ========================================

const API_BASE_URL = (
  import.meta.env.VITE_API_URL ||
  "http://localhost:8080"
).replace(/\/+$/, "");

// ========================================
// 2. ACCESS TOKEN - LOCAL STORAGE
// ========================================

const TOKEN_KEY = "accessToken";

let refreshPromise = null;

// Lưu Access Token
export const setAccessToken = (token) => {
  const cleanToken = token
    ? String(token).replace(/^Bearer\s+/i, "").trim()
    : "";

  if (cleanToken) {
    localStorage.setItem(TOKEN_KEY, cleanToken);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
};

// Lấy Access Token
export const getAccessToken = () => {
  const token = localStorage.getItem(TOKEN_KEY);

  return token
    ? token.replace(/^Bearer\s+/i, "").trim()
    : null;
};

// Xóa Access Token
export const clearAccessToken = () => {
  localStorage.removeItem(TOKEN_KEY);
};

// ========================================
// 3. AXIOS INSTANCE
// ========================================

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,

  withCredentials: true,

  headers: {
    "Content-Type": "application/json",
  },

  timeout: 15000,
});

// ========================================
// 4. PUBLIC ENDPOINTS
// ========================================

const publicEndpoints = [
  "/auth/login",
  "/auth/refresh",
  "/auth/logout",
  "/users/register",
];

const getRequestPath = (url = "") => {
  try {
    const parsed = new URL(
      String(url),
      `${api.defaults.baseURL}/`
    );

    return parsed.pathname.replace(
      /^\/api(?=\/|$)/,
      ""
    );
  } catch {
    return String(url).split("?")[0];
  }
};

const isPublicEndpoint = (url = "") => {
  return publicEndpoints.includes(
    getRequestPath(url)
  );
};

// ========================================
// 5. REFRESH ACCESS TOKEN
// ========================================

export const refreshAccessToken = async () => {
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = api
    .post("/auth/refresh")
    .then((response) => {
      const newToken =
        response.data?.result?.accessToken;

      if (!newToken) {
        throw new Error(
          "Không nhận được Access Token từ Backend"
        );
      }

      setAccessToken(newToken);

      return newToken;
    })
    .catch((error) => {
      clearAccessToken();
      throw error;
    })
    .finally(() => {
      refreshPromise = null;
    });

  return refreshPromise;
};

// ========================================
// 6. REQUEST INTERCEPTOR
// ========================================

api.interceptors.request.use(
  async (config) => {
    config.headers = config.headers || {};

    const url = config.url || "";

    // API public không gửi JWT
    if (isPublicEndpoint(url)) {
      delete config.headers.Authorization;
      return config;
    }

    let token = getAccessToken();

    // Nếu chưa có token thì thử refresh
    if (!token) {
      try {
        token = await refreshAccessToken();
      } catch {
        // Không có refresh cookie hợp lệ
      }
    }

    if (token) {
      config.headers.Authorization =
        `Bearer ${token}`;
    } else {
      delete config.headers.Authorization;
    }

    // Nếu dữ liệu gửi lên là FormData, xóa Content-Type để browser tự thêm multipart và boundary
    if (config.data instanceof FormData) {
      delete config.headers["Content-Type"];
      delete config.headers["content-type"];
    }

    return config;
  },

  (error) => Promise.reject(error)
);

// ========================================
// 7. RESPONSE INTERCEPTOR
// ========================================

api.interceptors.response.use(
  (response) => response,

  async (error) => {
    const originalRequest = error.config;

    if (
      error.response?.status !== 401 ||
      !originalRequest ||
      originalRequest._retry ||
      isPublicEndpoint(originalRequest.url)
    ) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      const newToken =
        await refreshAccessToken();

      originalRequest.headers =
        originalRequest.headers || {};

      originalRequest.headers.Authorization =
        `Bearer ${newToken}`;

      return api(originalRequest);
    } catch (refreshError) {
      clearAccessToken();
      return Promise.reject(refreshError);
    }
  }
);

// ========================================
// 8. EXPORT
// ========================================

export default api;
