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

    // Địa chỉ email người dùng
    email:
      result.email ??
      result.user?.email ??
      "",

    // Đường dẫn ảnh đại diện người dùng
    avatarUrl:
      result.avatarUrl ??
      result.user?.avatarUrl ??
      null,

    role,
  };
};

// ========================================
// AUTH PROVIDER
// ========================================

const USER_STORAGE_KEY = "user";

// ========================================
// LẤY THÔNG TIN CÁ NHÂN MỚI NHẤT
// ========================================

const fetchPersonalProfile = async (currentUser) => {
  if (!currentUser) return null;

  try {
    // Lấy thông tin cá nhân từ Backend
    const response = await api.get("/users/my-info");

    const profile = response.data?.result;

    if (!profile) return currentUser;

    // Giữ nguyên ID và vai trò của tài khoản,
    // chỉ đồng bộ thông tin cá nhân mới nhất
    return {
      ...currentUser,
      username: profile.username ?? currentUser.username,
      fullName: profile.fullName ?? currentUser.fullName,
      email: profile.email ?? currentUser.email,
      avatarUrl: profile.avatarUrl !== undefined
        ? profile.avatarUrl
        : currentUser.avatarUrl,
    };

  } catch (error) {
    // Không làm mất phiên đăng nhập nếu API
    // quản lý thông tin cá nhân gặp lỗi
    console.error(
      "Không thể đồng bộ thông tin cá nhân:",
      error
    );

    return currentUser;
  }
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem(USER_STORAGE_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // true khi đang khôi phục đăng nhập
  const [loading, setLoading] = useState(true);

  // ========================================
  // ĐỒNG BỘ USER VÀO LOCAL STORAGE
  // ========================================

  useEffect(() => {
    try {
      if (user) {
        // Lưu thông tin người dùng mới nhất
        localStorage.setItem(
          USER_STORAGE_KEY,
          JSON.stringify(user)
        );
      } else {
        // Xóa thông tin khi đăng xuất
        localStorage.removeItem(USER_STORAGE_KEY);
      }
    } catch {
      // Bỏ qua lỗi lưu trữ
    }
  }, [user]);

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

        if (!active) return;

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

        // Đồng bộ họ tên, email và ảnh đại diện
        // mới nhất từ Backend khi F5
        currentUser = await fetchPersonalProfile(currentUser);

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
          localStorage.removeItem(USER_STORAGE_KEY);
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

      // Lấy họ tên, email và ảnh đại diện
      // mới nhất sau khi đăng nhập
      currentUser = await fetchPersonalProfile(currentUser);

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
      localStorage.removeItem(USER_STORAGE_KEY);
      setUser(null);
      setLoading(false);
    }
  }, []);

  // ========================================
  // CẬP NHẬT THÔNG TIN CÁ NHÂN
  // ========================================

  const updateUserProfile = useCallback((updatedProfile) => {
    if (!updatedProfile) return;

    setUser((previousUser) => {
      if (!previousUser) return previousUser;

      // Kiểm tra thông tin cập nhật có thuộc
      // tài khoản đang đăng nhập hay không
      if (
        updatedProfile.userId != null &&
        previousUser.userId != null &&
        String(updatedProfile.userId) !== String(previousUser.userId)
      ) {
        return previousUser;
      }

      // Giữ nguyên ID, username và role.
      // Chỉ cập nhật họ tên, email và ảnh đại diện.
      return {
        ...previousUser,

        fullName:
          updatedProfile.fullName ??
          previousUser.fullName,

        email:
          updatedProfile.email ??
          previousUser.email,

        avatarUrl:
          updatedProfile.avatarUrl !== undefined
            ? updatedProfile.avatarUrl
            : previousUser.avatarUrl,
      };
    });

    // useEffect sẽ tự động đồng bộ user
    // mới nhất vào localStorage.
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

    // Cập nhật thông tin cá nhân
    updateUserProfile,

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