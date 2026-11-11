import React from 'react';

const HeaderInstructor = () => {
  return (
    <header className="fixed top-0 left-[240px] right-0 h-16 bg-white/90 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)] z-40 px-6 flex items-center justify-between gap-4 border-b border-gray-100">
      <div className="flex items-center gap-4 min-w-0"></div>
      <div className="flex items-center gap-6">
        {/* Search Input */}
        <div className="relative flex items-center">
          <span className="material-symbols-outlined absolute left-3 text-gray-400 text-[18px] pointer-events-none">search</span>
          <input 
            className="w-72 pl-9 pr-4 py-1.5 text-sm rounded-lg bg-gray-50 text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-600 transition-all border border-gray-200" 
            placeholder="Tìm kiếm học phần, sinh viên..." 
            type="search" 
          />
        </div>
        
        {/* Right Actions */}
        <div className="flex items-center gap-4">
          <button aria-label="Thông báo" className="relative p-2 rounded-full text-gray-500 hover:text-blue-700 hover:bg-gray-100 transition-colors" type="button">
            <span className="material-symbols-outlined text-[22px]">notifications</span>
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 ring-2 ring-white"></span>
          </button>
          
          <div className="flex items-center gap-3 pl-2">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50">
              <span className="w-2 h-2 rounded-full bg-blue-600"></span>
              <span className="text-xs text-blue-700 font-medium">Đang hoạt động</span>
            </div>
            <img 
              alt="Profile" 
              className="w-8 h-8 rounded-full object-cover shrink-0 border border-gray-200" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuDOXlDs79aDr0mfM5eg4Qv07RHn2tsEy1igrdEIbeqIlsgyNLNpxIQIahtaS6XhsBvZkDUqHgxlp7j7-pxic_XLKz1gxcjFpuae1WqchXIzF8otAl4ykb-K41aghg8R2ayNLHfjqoVn-j2PlLNKe70sxF6u1NtdRMQunLQyzEPEzF9IMxtgDlgPZO2I-KS8QWm1sBM3-y2Ipya6PzLojODIjHE2Ba7RuluyQtlKJwY" 
            />
          </div>
        </div>
      </div>
    </header>
  );
};

export default HeaderInstructor;