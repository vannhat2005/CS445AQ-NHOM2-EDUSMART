
import {
  Navigate,
  Outlet,
  useLocation,
} from "react-router-dom";

import { useAuth } from "../../context/AuthContext";

// Chuẩn hóa role: ROLE_STUDENT -> STUDENT
const normalizeRole = (role) => {
  if (typeof role === "string") {
    return role
      .replace(/^ROLE_/i, "")
      .trim()
      .toUpperCase();
  }

  // Hỗ trợ trường hợp role là object
  if (role && typeof role === "object") {
    return normalizeRole(
      role.roleName || role.name || role.authority
    );
  }

  return "";
};

export default function ProtectedRoute({
  allowedRoles = [],
}) {
  const { user, isAuthenticated, loading } = useAuth();

  const location = useLocation();

  // 1. Chờ AuthContext khôi phục phiên đăng nhập
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />

          <p className="text-sm font-medium text-slate-600">
            Đang kiểm tra phiên đăng nhập...
          </p>
        </div>
      </div>
    );
  }

  // 2. Không có phiên đăng nhập hợp lệ
  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        state={{
          from: location,
        }}
        replace
      />
    );
  }

  // 3. Chuẩn hóa quyền của người dùng
  const currentRole = normalizeRole(user?.role);

  const normalizedAllowedRoles = allowedRoles.map(
    normalizeRole
  );

  // 4. Kiểm tra quyền truy cập
  const hasPermission =
    normalizedAllowedRoles.length === 0 ||
    normalizedAllowedRoles.includes(currentRole);

  // 5. Đã đăng nhập nhưng không đủ quyền
  if (!hasPermission) {
    // Tránh chuyển hướng lặp vô hạn
    const fallbackRoute =
      currentRole === "ADMIN"
        ? "/admin"
        : currentRole === "INSTRUCTOR"
        ? "/instructor"
        : currentRole === "STUDENT"
        ? "/student"
        : "/login";

    if (location.pathname === fallbackRoute) {
      return (
        <div className="flex min-h-screen items-center justify-center px-4 text-center">
          <p className="text-red-600">
            Tài khoản của bạn không có quyền truy cập trang này.
          </p>
        </div>
      );
    }

    return (
      <Navigate
        to={fallbackRoute}
        replace
      />
    );
  }

  // 6. Đăng nhập hợp lệ và đủ quyền
  return <Outlet />;
}
