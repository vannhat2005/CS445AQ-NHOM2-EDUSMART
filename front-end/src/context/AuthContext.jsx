
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

import api, {
  setAccessToken,
  getAccessToken,
  clearAccessToken,
  refreshAccessToken,
} from "../services/api";

const AuthContext = createContext(null);

// ========================================
// CHUẨN HÓA ROLE
// ========================================

const normalizeRole = (role) => {
  if (typeof role === "string") {
    return role
      .replace(/^ROLE_/i, "")
      .trim()
      .toUpperCase();
  }

  if (role && typeof role === "object") {
    return normalizeRole(
      role.roleName ||
        role.name ||
        role.authority
    );
  }

  return "";
};

// ========================================
// CHUYỂN DỮ LIỆU USER
// ========================================

const mapUser = (result) => {
  if (!result) return null;

  const role = normalizeRole(
    result.role || result.user?.role
  );

  if (!role) return null;

  return {
    userId:
      result.userId ??
      result.user?.userId ??
      null,

    username:
      result.username ??
      result.user?.username ??
      "",

    fullName:
      result.fullName ??
      result.user?.fullName ??
      "",

    role,
  };
};

// ========================================
// AUTH PROVIDER
// ========================================

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  // true khi đang khôi phục đăng nhập
  const [loading, setLoading] = useState(true);

  // ========================================
  // KHÔI PHỤC PHIÊN ĐĂNG NHẬP KHI F5
  // ========================================

  useEffect(() => {
    let active = true;

    const restoreSession = async () => {
      setLoading(true);

      try {
        // Refresh Token được gửi tự động
        // bằng HttpOnly Cookie.
        const response = await api.post(
          "/auth/refresh"
        );

        const result = response.data?.result;

        if (!result?.accessToken) {
          throw new Error(
            "Không nhận được Access Token khi khôi phục phiên"
          );
        }

        // Lưu Access Token mới vào RAM
        setAccessToken(result.accessToken);

        // Trường hợp refresh trả đầy đủ user
        let currentUser = mapUser(result);

        // Nếu refresh chỉ trả token,
        // lấy thông tin user từ API profile.
        if (!currentUser) {
          const profileResponse = await api.get(
            "/users/me"
          );

          const profile =
            profileResponse.data?.result;

          currentUser = mapUser(profile);
        }

        if (!currentUser) {
          throw new Error(
            "Không lấy được thông tin người dùng"
          );
        }

        if (active) {
          setUser(currentUser);
        }
      } catch (error) {
        console.error(
          "Không thể khôi phục phiên đăng nhập:",
          error
        );

        if (active) {
          clearAccessToken();
          setUser(null);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    restoreSession();

    return () => {
      active = false;
    };
  }, []);

  // ========================================
  // ĐĂNG NHẬP
  // ========================================

  const login = useCallback(
    async (username, password) => {
      const response = await api.post(
        "/auth/login",
        {
          username: username.trim(),
          password,
        }
      );

      const result = response.data?.result;

      if (!result?.accessToken) {
        throw new Error(
          "Đăng nhập thất bại: không nhận được Access Token"
        );
      }

      setAccessToken(result.accessToken);

      let currentUser = mapUser(result);

      // Hỗ trợ trường hợp API login
      // chỉ trả token.
      if (!currentUser) {
        try {
          const profileResponse = await api.get(
            "/users/me"
          );

          currentUser = mapUser(
            profileResponse.data?.result
          );
        } catch (error) {
          clearAccessToken();
          throw error;
        }
      }

      if (!currentUser) {
        clearAccessToken();

        throw new Error(
          "Không lấy được thông tin người dùng sau đăng nhập"
        );
      }

      setUser(currentUser);
      setLoading(false);

      return currentUser;
    },
    []
  );

  // ========================================
  // ĐĂNG XUẤT
  // ========================================

  const logout = useCallback(async () => {
    try {
      await api.post("/auth/logout");
    } catch (error) {
      console.error(
        "Lỗi khi đăng xuất:",
        error
      );
    } finally {
      clearAccessToken();
      setUser(null);
      setLoading(false);
    }
  }, []);

  // ========================================
  // KIỂM TRA ROLE
  // ========================================

  const hasRole = useCallback(
    (role) => {
      if (!user) return false;

      return (
        normalizeRole(user.role) ===
        normalizeRole(role)
      );
    },
    [user]
  );

  // ========================================
  // KIỂM TRA NHIỀU ROLE
  // ========================================

  const hasAnyRole = useCallback(
    (roles = []) => {
      if (!user) return false;

      return roles.some(
        (role) =>
          normalizeRole(role) ===
          normalizeRole(user.role)
      );
    },
    [user]
  );

  // ========================================
  // KIỂM TRA TRẠNG THÁI ĐĂNG NHẬP
  // ========================================

  const isAuthenticated =
    Boolean(user) &&
    Boolean(getAccessToken());

  // ========================================
  // CONTEXT VALUE
  // ========================================

  const value = {
    user,
    loading,
    isAuthenticated,

    isAdmin: hasRole("ADMIN"),
    isInstructor: hasRole("INSTRUCTOR"),
    isStudent: hasRole("STUDENT"),

    login,
    logout,

    hasRole,
    hasAnyRole,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// ========================================
// CUSTOM HOOK
// ========================================

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth phải được sử dụng trong AuthProvider"
    );
  }

  return context;
}
