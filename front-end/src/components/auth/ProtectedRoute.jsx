
import {
  Navigate,
  Outlet,
  useLocation,
} from "react-router-dom";

import { useAuth } from "../../context/AuthContext";

// ==========================================
// CHUẨN HÓA ROLE
// ==========================================

const normalizeRole = (role) => {
  if (!role) return "";

  if (typeof role === "string") {
    return role
      .trim()
      .replace(/^ROLE_/i, "")
      .toUpperCase();
  }

  if (typeof role === "object") {
    return normalizeRole(
      role.roleName ??
      role.name ??
      role.authority ??
      role.role ??
      ""
    );
  }

  return "";
};

// ==========================================
// LẤY DANH SÁCH ROLE CỦA USER
// ==========================================

const getUserRoles = (user) => {
  if (!user) return [];

  const roleSources = [
    user.role,
    user.roleName,
    user.roles,
    user.authorities,
  ];

  const roles = roleSources.flatMap((source) => {
    if (!source) return [];

    return Array.isArray(source)
      ? source
      : [source];
  });

  return [
    ...new Set(
      roles
        .map(normalizeRole)
        .filter(Boolean)
    ),
  ];
};

// ==========================================
// ĐƯỜNG DẪN THEO ROLE
// ==========================================

const getHomeRoute = (roles) => {
  if (roles.includes("ADMIN")) {
    return "/admin";
  }

  if (roles.includes("INSTRUCTOR")) {
    return "/instructor";
  }

  if (roles.includes("STUDENT")) {
    return "/student";
  }

  return "/student";
};

// ==========================================
// LOADING
// ==========================================

function AuthLoading() {
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

// ==========================================
// KHÔNG CÓ QUYỀN
// ==========================================

function AccessDenied() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="max-w-md text-center">
        <h2 className="mb-3 text-xl font-bold text-red-600">
          Không có quyền truy cập
        </h2>

        <p className="text-sm text-slate-600">
          Tài khoản của bạn không có quyền
          truy cập trang này.
        </p>
      </div>
    </div>
  );
}

// ==========================================
// PROTECTED ROUTE
// ==========================================

export default function ProtectedRoute({
  allowedRoles = [],
}) {
  const {
    user,
    isAuthenticated,
    loading,
  } = useAuth();

  const location = useLocation();

  // 1. Chờ khôi phục phiên đăng nhập
  if (loading) {
    return <AuthLoading />;
  }

  // 2. Chưa đăng nhập
  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        state={{ from: location }}
        replace
      />
    );
  }

  // 3. Lấy quyền người dùng
  const userRoles = getUserRoles(user);

  // 4. Chuẩn hóa quyền được phép
  const normalizedAllowedRoles = allowedRoles
    .map(normalizeRole)
    .filter(Boolean);

  // 5. Kiểm tra quyền
  const hasPermission =
    normalizedAllowedRoles.length === 0 ||
    normalizedAllowedRoles.some((role) =>
      userRoles.includes(role)
    );

  // 6. Không đủ quyền
  if (!hasPermission) {
    const fallbackRoute =
      getHomeRoute(userRoles);

    // Tránh chuyển hướng về chính trang hiện tại
    if (location.pathname === fallbackRoute) {
      return <AccessDenied />;
    }

    return (
      <Navigate
        to={fallbackRoute}
        replace
      />
    );
  }

  // 7. Có quyền -> hiển thị trang con
  return <Outlet />;
}
