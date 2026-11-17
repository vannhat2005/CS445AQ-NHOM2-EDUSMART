
import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import AdminHeader from '../components/admin/AdminHeader';
import AdminSidebar from '../components/admin/AdminSidebar';

const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Chưa kết nối API đăng xuất, sẽ bổ sung khi tích hợp Authentication
  const handleLogout = () => {
    console.log('Admin yêu cầu đăng xuất');
  };

  return (
    <div className="min-h-screen bg-[#f8faff]">
      <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} onLogout={handleLogout} />

      <div className="flex min-h-screen flex-col lg:ml-[250px]">
        <AdminHeader onMenuClick={() => setSidebarOpen(true)} />
        <main className="min-w-0 flex-1 p-5 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
