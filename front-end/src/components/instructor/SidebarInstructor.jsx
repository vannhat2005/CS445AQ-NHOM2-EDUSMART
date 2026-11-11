import React from 'react';
import { NavLink } from 'react-router-dom';

const SidebarInstructor = () => {
  return (
    <aside className="fixed left-0 top-0 h-full w-[240px] bg-white shadow-[0_1px_8px_rgba(0,0,0,0.04)] z-50 flex flex-col justify-between select-none border-r border-gray-100">
      <div className="flex flex-col w-full">
        {/* Logo Brand */}
        <div className="h-16 px-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg overflow-hidden flex items-center justify-center shrink-0 shadow-sm bg-blue-50">
            <img 
              src="https://lh3.googleusercontent.com/aida/AEtjO1VnNerk3_hdLCqNpvrv5UUH1S0EYMFx5B4pk64En5NnKz-I8s6ZRypAK3YArUh98X4d8WpJfXnc8L6Pq-CE2k74hWWx56SW54F2ScJLGRReSe8SBnyx2cMETiIh5CqfrH0WKksGogNxM7NFP-voLZyDaBaZd0M8Qr7ff13ACYX_hMfj8K2clw8iUEdwmGt9r7XQmipZO_DdoYQI0P_TM2iYOnWFYP0nFSFbKAofDE8" 
              alt="EduSmart Logo" 
              className="w-9 h-9 object-contain" 
            />
          </div>
          <span className="text-lg font-bold text-blue-900 tracking-tight">EduSmart</span>
        </div>
        
        {/* Navigation Menu */}
        <nav className="flex flex-col gap-1 px-3 mt-4">
          <NavLink 
            to="/instructor" 
            end
            className={({ isActive }) => 
              isActive 
                ? "flex items-center gap-3 px-3 py-2.5 rounded-lg bg-blue-50 text-blue-700 font-semibold text-sm transition-colors"
                : "flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-600 font-medium text-sm transition-colors hover:bg-gray-50 hover:text-blue-700"
            }
          >
            <span className="material-symbols-outlined text-[20px]">home</span>
            <span>Trang chủ</span>
          </NavLink>

          <NavLink 
            to="/instructor/courses" 
            className={({ isActive }) => 
              isActive 
                ? "flex items-center gap-3 px-3 py-2.5 rounded-lg bg-blue-50 text-blue-700 font-semibold text-sm transition-colors"
                : "flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-600 font-medium text-sm transition-colors hover:bg-gray-50 hover:text-blue-700"
            }
          >
            <span className="material-symbols-outlined text-[20px]">menu_book</span>
            <span>Khóa học được phân công</span>
          </NavLink>

          <NavLink 
            to="/instructor/drafts" 
            className={({ isActive }) => 
              isActive 
                ? "flex items-center gap-3 px-3 py-2.5 rounded-lg bg-blue-50 text-blue-700 font-semibold text-sm transition-colors"
                : "flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-600 font-medium text-sm transition-colors hover:bg-gray-50 hover:text-blue-700"
            }
          >
            <span className="material-symbols-outlined text-[20px]">edit_document</span>
            <span>Quản lý bản nháp</span>
          </NavLink>

          <NavLink 
            to="/instructor/reports" 
            className={({ isActive }) => 
              isActive 
                ? "flex items-center gap-3 px-3 py-2.5 rounded-lg bg-blue-50 text-blue-700 font-semibold text-sm transition-colors"
                : "flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-600 font-medium text-sm transition-colors hover:bg-gray-50 hover:text-blue-700"
            }
          >
            <span className="material-symbols-outlined text-[20px]">bar_chart</span>
            <span>Báo cáo thống kê</span>
          </NavLink>
        </nav>
      </div>

      {/* User Profile & Logout */}
      <div className="p-3 bg-white border-t border-gray-100">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <img 
              alt="Profile" 
              className="w-8 h-8 rounded-full object-cover shrink-0" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuDOXlDs79aDr0mfM5eg4Qv07RHn2tsEy1igrdEIbeqIlsgyNLNpxIQIahtaS6XhsBvZkDUqHgxlp7j7-pxic_XLKz1gxcjFpuae1WqchXIzF8otAl4ykb-K41aghg8R2ayNLHfjqoVn-j2PlLNKe70sxF6u1NtdRMQunLQyzEPEzF9IMxtgDlgPZO2I-KS8QWm1sBM3-y2Ipya6PzLojODIjHE2Ba7RuluyQtlKJwY" 
            />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-800 truncate leading-tight">Nguyễn Văn A</p>
              <p className="text-xs text-gray-500 truncate">Giảng viên</p>
            </div>
          </div>
          <button 
            className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors shrink-0 flex items-center justify-center" 
            title="Đăng xuất" 
            type="button"
            onClick={() => {
              const m = document.getElementById('logout-modal'); 
              if(m){ m.classList.remove('hidden'); m.style.display = 'flex'; }
            }}
          >
            <span className="material-symbols-outlined text-[20px]">logout</span>
          </button>
        </div>
      </div>
    </aside>
  );
};

export default SidebarInstructor;