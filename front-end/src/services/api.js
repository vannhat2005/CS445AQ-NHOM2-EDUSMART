
import axios from "axios";

// ========================================
// 1. ACCESS TOKEN - LƯU TRONG RAM
// ========================================

let accessToken = null;
let refreshPromise = null;

// ========================================
// 2. AXIOS INSTANCE
// ========================================

const api = axios.create({
  baseURL: `${
    import.meta.env.VITE_API_URL || "http://localhost:8080"
  }/api`,

  withCredentials: true,

  headers: {
    "Content-Type": "application/json",
  },

  timeout: 15000,
});

// ========================================
// 3. ACCESS TOKEN FUNCTIONS
// ========================================

export const setAccessToken = (token) => {
  accessToken = token || null;
};

export const getAccessToken = () => {
  return accessToken;
};

export const clearAccessToken = () => {
  accessToken = null;
};

// ========================================
// 4. PUBLIC AUTH ENDPOINTS
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
      api.defaults.baseURL
    );

    return parsed.pathname.replace(/^\/api/, "");
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

// Chỉ tạo một request refresh khi nhiều API
// cùng cần lấy lại Access Token.

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

    // API công khai không gửi JWT
    if (isPublicEndpoint(url)) {
      delete config.headers.Authorization;
      return config;
    }

    // Nếu chưa có token trong RAM,
    // thử khôi phục bằng Refresh Cookie.
    if (!accessToken) {
      try {
        await refreshAccessToken();
      } catch {
        // Không có refresh cookie hợp lệ.
        // Backend sẽ quyết định quyền truy cập.
      }
    }

    if (accessToken) {
      config.headers.Authorization =
        `Bearer ${accessToken}`;
    } else {
      delete config.headers.Authorization;
    }

    return config;
  },

  (error) => Promise.reject(error)
);

// ========================================
// 7. RESPONSE INTERCEPTOR
// AUTO REFRESH TOKEN KHI 401
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
      const newToken = await refreshAccessToken();

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
