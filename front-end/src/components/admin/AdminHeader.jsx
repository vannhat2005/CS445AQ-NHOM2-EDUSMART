import React, { useState, useEffect, useRef } from "react";
import { Menu, Search, Bell, ChevronDown, UserRound, Settings } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const AdminHeader = ({ onMenuClick }) => {
  // ========================================
  // THÔNG TIN TÀI KHOẢN ĐANG ĐĂNG NHẬP
  // ========================================

  const { user } = useAuth();
  const location = useLocation();

  // Trạng thái hiển thị dropdown tài khoản
  const [showProfile, setShowProfile] = useState(false);

  // Tham chiếu đến dropdown tài khoản
  const profileRef = useRef(null);

  // Họ tên quản trị viên
  const displayName = user?.fullName || user?.username || "Quản trị viên";

  // Email quản trị viên
  const displayEmail = user?.email || "EduSmart Admin";

  // ========================================
  // ĐÓNG DROPDOWN KHI CLICK BÊN NGOÀI
  // ========================================

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setShowProfile(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // ========================================
  // ĐÓNG DROPDOWN KHI CHUYỂN TRANG
  // ========================================

  useEffect(() => {
    setShowProfile(false);
  }, [location.pathname]);

  // ========================================
  // GIAO DIỆN HEADER ADMIN
  // ========================================

  return (
    <header className="sticky top-0 z-30 flex h-[68px] shrink-0 items-center justify-between gap-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:px-6">

      {/* ========================================
          TÌM KIẾM
      ======================================== */}

      <div className="flex min-w-0 flex-1 items-center gap-4">
        <button
          onClick={onMenuClick}
          className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 lg:hidden"
        >
          <Menu size={22} />
        </button>

        <div className="relative hidden w-full max-w-sm sm:block">
          <Search size={19} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />

          <input
            type="text"
            placeholder="Tìm kiếm thông tin..."
            className="h-10 w-full rounded-lg border border-gray-200 bg-gray-50 pl-10 pr-4 text-sm outline-none transition focus:border-blue-500 focus:bg-white"
          />
        </div>
      </div>

      {/* ========================================
          THÔNG BÁO VÀ TÀI KHOẢN
      ======================================== */}

      <div className="flex shrink-0 items-center gap-4">

        {/* Nút thông báo */}
        <button
          type="button"
          title="Thông báo"
          className="relative rounded-lg p-2 text-gray-600 hover:bg-gray-100"
        >
          <Bell size={21} />
        </button>

        {/* Menu tài khoản */}
        <div ref={profileRef} className="relative">

          {/* Nút mở dropdown tài khoản */}
          <button
            type="button"
            onClick={() => setShowProfile((prev) => !prev)}
            aria-expanded={showProfile}
            className="flex items-center gap-2 rounded-lg p-1.5 hover:bg-gray-100"
          >

            {/* Ảnh đại diện quản trị viên */}
            {user?.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt="Ảnh đại diện quản trị viên"
                className="h-9 w-9 shrink-0 rounded-full object-cover ring-1 ring-gray-200"
              />
            ) : (
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                <UserRound size={20} />
              </div>
            )}

            {/* Họ tên và vai trò quản trị viên */}
            <div className="hidden text-left sm:block">
              <p className="max-w-[160px] truncate text-sm font-semibold text-gray-800">
                {displayName}
              </p>

              <p className="text-[11px] font-medium text-blue-600">
                Admin
              </p>
            </div>

            {/* Biểu tượng mở dropdown */}
            <ChevronDown
              size={16}
              className={`hidden text-gray-500 transition-transform duration-200 sm:block ${
                showProfile ? "rotate-180" : ""
              }`}
            />
          </button>

          {/* ========================================
              DROPDOWN TÀI KHOẢN
          ======================================== */}

          {showProfile && (
            <div className="absolute right-0 top-full mt-2 w-56 rounded-xl border border-gray-100 bg-white py-2 shadow-lg">

              {/* Thông tin tài khoản */}
              <div className="border-b border-gray-100 px-4 py-2">
                <p className="truncate text-sm font-semibold text-gray-800">
                  {displayName}
                </p>

                <p className="truncate text-xs text-gray-500">
                  {displayEmail}
                </p>
              </div>

              {/* Quản lý thông tin cá nhân */}
              <Link
                to="/admin/profile"
                onClick={() => setShowProfile(false)}
                className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-600 transition-colors hover:bg-gray-50 hover:text-blue-600"
              >
                <UserRound size={17} />
                <span>Hồ sơ cá nhân</span>
              </Link>

              {/* Cài đặt hệ thống */}
              <button
                type="button"
                onClick={() => setShowProfile(false)}
                className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-gray-600 transition-colors hover:bg-gray-50 hover:text-blue-600"
              >
                <Settings size={17} />
                <span>Cài đặt hệ thống</span>
              </button>

            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;