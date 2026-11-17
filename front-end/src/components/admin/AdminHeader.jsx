
import React, { useState } from 'react';
import { Menu, Search, Bell, ChevronDown, UserRound, Settings } from 'lucide-react';

const AdminHeader = ({ onMenuClick }) => {
  const [showProfile, setShowProfile] = useState(false);

  return (
    <header className="sticky top-0 z-30 flex h-[68px] shrink-0 items-center justify-between gap-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:px-6">
      {/* Tìm kiếm */}
      <div className="flex min-w-0 flex-1 items-center gap-4">
        <button onClick={onMenuClick} className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 lg:hidden">
          <Menu size={22} />
        </button>
        <div className="relative hidden w-full max-w-sm sm:block">
          <Search size={19} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Tìm kiếm thông tin..."
            className="h-10 w-full rounded-lg border border-gray-200 bg-gray-50 pl-10 pr-4 text-sm outline-none transition focus:border-blue-500 focus:bg-white" />
        </div>
      </div>

      {/* Thông báo và tài khoản */}
      <div className="flex shrink-0 items-center gap-4">
        <button type="button" title="Thông báo" className="relative rounded-lg p-2 text-gray-600 hover:bg-gray-100">
          <Bell size={21} />
        </button>

        <div className="relative">
          <button onClick={() => setShowProfile(!showProfile)} className="flex items-center gap-2 rounded-lg p-1.5 hover:bg-gray-100">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-blue-600">
              <UserRound size={20} />
            </div>
            <div className="hidden text-left sm:block">
              <p className="text-sm font-semibold text-gray-800">Quản trị viên</p>
              <p className="text-[11px] font-medium text-blue-600">Admin</p>
            </div>
            <ChevronDown size={16} className="hidden text-gray-500 sm:block" />
          </button>

          {showProfile && (
            <div className="absolute right-0 top-full mt-2 w-52 rounded-xl border border-gray-100 bg-white py-2 shadow-lg">
              <div className="border-b border-gray-100 px-4 py-2">
                <p className="text-sm font-semibold text-gray-800">Quản trị viên</p>
                <p className="text-xs text-gray-500">EduSmart Admin</p>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600"><UserRound size={17} /> Hồ sơ cá nhân</div>
              <div className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600"><Settings size={17} /> Cài đặt hệ thống</div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;
