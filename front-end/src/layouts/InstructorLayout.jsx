import React from 'react';
import { Outlet } from 'react-router-dom';
import SidebarInstructor from '../components/instructor/SidebarInstructor';
import HeaderInstructor from '../components/instructor/HeaderInstructor';

const InstructorLayout = () => {
  return (
    <div className="bg-gray-50 text-gray-900 antialiased min-h-screen flex">
      {/* 1. Sidebar cố định bên trái */}
      <SidebarInstructor />

      {/* Khu vực nội dung bên phải */}
      <div className="pl-[240px] flex-1 flex flex-col min-h-screen">
        {/* 2. Header ở trên cùng */}
        <HeaderInstructor />

        {/* 3. Phần hiển thị nội dung các trang con thay đổi linh hoạt qua Outlet */}
        <main className="w-full pt-20 px-6 bg-gray-50 min-h-screen pb-6">
          <Outlet/>
        </main>
      </div>

      {/* 4. Logout Modal */}
      <div id="logout-modal" className="fixed inset-0 z-50 items-center justify-center bg-black/40 backdrop-blur-sm transition-opacity duration-200 hidden" style={{ display: 'none' }}>
        <div id="logout-modal-backdrop" className="fixed inset-0" onClick={() => {
          const m = document.getElementById('logout-modal'); 
          if(m){ m.classList.add('hidden'); m.style.display = 'none'; }
        }}></div>
        <div className="relative bg-white rounded-xl shadow-xl border border-gray-100 max-w-md w-full mx-4 p-6 flex flex-col gap-4 z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[24px]">logout</span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 tracking-tight">Xác nhận đăng xuất</h3>
              <p className="text-xs text-gray-500">Tài khoản EduSmart</p>
            </div>
          </div>
          <p className="text-sm text-gray-600">Bạn có chắc chắn muốn đăng xuất khỏi tài khoản EduSmart của mình không?</p>
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
            <button 
              type="button" 
              id="cancel-logout-btn" 
              className="px-4 py-2 rounded-lg border border-gray-200 text-gray-700 font-semibold text-sm hover:bg-gray-50 transition-colors" 
              onClick={() => {
                const m = document.getElementById('logout-modal'); 
                if(m){ m.classList.add('hidden'); m.style.display = 'none'; }
              }}
            >
              Hủy
            </button>
            <button 
              type="button" 
              id="confirm-logout-btn" 
              className="px-4 py-2 rounded-lg bg-red-600 text-white font-semibold text-sm hover:bg-red-700 shadow-sm transition-all flex items-center gap-1.5" 
              onClick={() => {
                const m = document.getElementById('logout-modal'); 
                if(m){ m.classList.add('hidden'); m.style.display = 'none'; } 
                alert('Bạn đã đăng xuất thành công!');
              }}
            >
              <span className="material-symbols-outlined text-[18px]">logout</span>
              <span>Đăng xuất</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InstructorLayout;