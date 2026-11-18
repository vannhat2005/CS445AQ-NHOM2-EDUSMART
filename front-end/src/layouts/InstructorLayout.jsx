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
    </div>
  );
};

export default InstructorLayout;