import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { UserRound, ChevronDown } from "lucide-react";

import { useAuth } from "../../context/AuthContext";

// ========================================
// HEADER INSTRUCTOR
// ========================================

const HeaderInstructor = () => {
  const { user } = useAuth();

  const [showProfile, setShowProfile] = useState(false);
  const profileRef = useRef(null);

  // Lấy tên giảng viên
  const displayName = user?.fullName || user?.username || "Giảng viên";

  // Đóng dropdown khi click bên ngoài
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setShowProfile(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="fixed top-0 left-[240px] right-0 h-16 bg-white/90 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)] z-40 px-6 flex items-center justify-between gap-4 border-b border-gray-100">

      <div className="flex items-center gap-4 min-w-0"></div>

      <div className="flex items-center gap-6">

        {/* Ô TÌM KIẾM */}
        <div className="relative flex items-center">
          <span className="material-symbols-outlined absolute left-3 text-gray-400 text-[18px] pointer-events-none">
            search
          </span>
          <input
            className="w-72 pl-9 pr-4 py-1.5 text-sm rounded-lg bg-gray-50 text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-600 transition-all border border-gray-200"
            placeholder="Tìm kiếm học phần, sinh viên..."
            type="search"
          />
        </div>

        {/* CÁC CHỨC NĂNG BÊN PHẢI */}
        <div className="flex items-center gap-4">

          {/* THÔNG BÁO */}
          <button
            aria-label="Thông báo"
            className="relative p-2 rounded-full text-gray-500 hover:text-blue-700 hover:bg-gray-100 transition-colors"
            type="button"
          >
            <span className="material-symbols-outlined text-[22px]">
              notifications
            </span>
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 ring-2 ring-white"></span>
          </button>

          <div className="flex items-center gap-3 pl-2">

            {/* TRẠNG THÁI HOẠT ĐỘNG */}
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50">
              <span className="w-2 h-2 rounded-full bg-blue-600"></span>
              <span className="text-xs text-blue-700 font-medium">
                Đang hoạt động
              </span>
            </div>

            {/* HỒ SƠ CÁ NHÂN */}
            <div ref={profileRef} className="relative">

              <button
                type="button"
                aria-label="Hồ sơ cá nhân"
                aria-expanded={showProfile}
                onClick={() => setShowProfile((prev) => !prev)}
                className="flex items-center gap-1.5 rounded-lg p-1 hover:bg-gray-100"
              >

                {/* ẢNH ĐẠI DIỆN */}
                {user?.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt="Ảnh đại diện"
                    className="w-8 h-8 rounded-full object-cover shrink-0 border border-gray-200"
                  />
                ) : (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                    <UserRound size={19} />
                  </div>
                )}

                <ChevronDown size={15} className="text-gray-500" />
              </button>

              {/* DROPDOWN HỒ SƠ */}
              {showProfile && (
                <div className="absolute right-0 top-full mt-2 w-56 rounded-xl border border-gray-100 bg-white py-2 shadow-lg">

                  <div className="border-b border-gray-100 px-4 py-2">
                    <p className="truncate text-sm font-semibold text-gray-800">
                      {displayName}
                    </p>
                    <p className="truncate text-xs text-gray-500">
                      {user?.email || "Giảng viên"}
                    </p>
                  </div>

                  {/* QUẢN LÝ THÔNG TIN CÁ NHÂN */}
                  <Link
                    to="/instructor/profile"
                    onClick={() => setShowProfile(false)}
                    className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-600 hover:bg-blue-50 hover:text-blue-700"
                  >
                    <UserRound size={17} />
                    Hồ sơ cá nhân
                  </Link>

                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default HeaderInstructor;