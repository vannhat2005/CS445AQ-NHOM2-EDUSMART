
import React from "react";
import { NavLink } from "react-router-dom";
import { LogOut, UserRound } from "lucide-react";

import { useAuth } from "../../context/AuthContext";
import LogoutButton from "../auth/LogoutButton";

// ========================================
// STYLE MENU
// ========================================

const navClass = ({ isActive }) =>
  isActive
    ? "flex items-center gap-3 px-3 py-2.5 rounded-lg bg-blue-50 text-blue-700 font-semibold text-sm transition-colors"
    : "flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-600 font-medium text-sm transition-colors hover:bg-gray-50 hover:text-blue-700";

// ========================================
// SIDEBAR INSTRUCTOR
// ========================================

const SidebarInstructor = () => {
  const { user } = useAuth();

  const displayName =
    user?.fullName ||
    user?.username ||
    "Giảng viên";

  return (
    <aside className="fixed left-0 top-0 z-50 flex h-full w-[240px] select-none flex-col justify-between border-r border-gray-100 bg-white shadow-[0_1px_8px_rgba(0,0,0,0.04)]">

      {/* ========================================
          LOGO EDUSMART
      ======================================== */}

      <div className="flex w-full flex-col">

        <div className="flex h-16 items-center gap-3 px-4">

          <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-blue-50 shadow-sm">
            <img
              src="https://lh3.googleusercontent.com/aida/AEtjO1VnNerk3_hdLCqNpvrv5UUH1S0EYMFx5B4pk64En5NnKz-I8s6ZRypAK3YArUh98X4d8WpJfXnc8L6Pq-CE2k74hWWx56SW54F2ScJLGRReSe8SBnyx2cMETiIh5CqfrH0WKksGogNxM7NFP-voLZyDaBaZd0M8Qr7ff13ACYX_hMfj8K2clw8iUEdwmGt9r7XQmipZO_DdoYQI0P_TM2iYOnWFYP0nFSFbKAofDE8"
              alt="EduSmart Logo"
              className="h-9 w-9 object-contain"
            />
          </div>

          <span className="text-lg font-bold tracking-tight text-blue-900">
            EduSmart
          </span>

        </div>

        {/* ========================================
            NAVIGATION MENU
        ======================================== */}

        <nav className="mt-4 flex flex-col gap-1 px-3">

          {/* TRANG CHỦ */}
          <NavLink
            to="/instructor"
            end
            className={navClass}
          >
            <span className="material-symbols-outlined text-[20px]">
              home
            </span>

            <span>Trang chủ</span>
          </NavLink>

          {/* KHÓA HỌC */}
          <NavLink
            to="/instructor/courses"
            className={navClass}
          >
            <span className="material-symbols-outlined text-[20px]">
              menu_book
            </span>

            <span>Khóa học được phân công</span>
          </NavLink>

          {/* QUẢN LÝ BẢN NHÁP */}
          <NavLink
            to="/instructor/drafts"
            className={navClass}
          >
            <span className="material-symbols-outlined text-[20px]">
              edit_document
            </span>

            <span>Quản lý bản nháp</span>
          </NavLink>

          {/* BÁO CÁO */}
          <NavLink
            to="/instructor/reports"
            className={navClass}
          >
            <span className="material-symbols-outlined text-[20px]">
              bar_chart
            </span>

            <span>Báo cáo thống kê</span>
          </NavLink>

        </nav>
      </div>

      {/* ========================================
          USER PROFILE & LOGOUT
      ======================================== */}

      <div className="border-t border-gray-100 bg-white p-3">

        <div className="flex items-center justify-between gap-2">

          {/* THÔNG TIN GIẢNG VIÊN */}
          <NavLink
            to="/instructor/profile"
            title="Quản lý thông tin cá nhân"
            className="flex min-w-0 flex-1 items-center gap-3 rounded-lg py-1 transition-colors hover:bg-blue-50"
          >

  {/* ẢNH ĐẠI DIỆN */}
  {user?.avatarUrl ? (
    <img
      src={user.avatarUrl}
      alt="Ảnh đại diện"
      className="h-8 w-8 shrink-0 rounded-full object-cover"
    />
  ) : (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600">
      <UserRound size={19} />
    </div>
  )}

  {/* TÊN VÀ VAI TRÒ GIẢNG VIÊN */}
  <div className="min-w-0">
    <p className="truncate text-sm font-semibold leading-tight text-gray-800">
      {displayName}
    </p>

    <p className="truncate text-xs text-gray-500">
      Giảng viên
    </p>
  </div>

</NavLink>

          {/* ========================================
              NÚT ĐĂNG XUẤT
          ======================================== */}

          <LogoutButton
            className="flex shrink-0 items-center justify-center rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600"
          >
            <LogOut size={20} />
          </LogoutButton>

        </div>
      </div>
    </aside>
  );
};

export default SidebarInstructor;
