
import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, ShieldCheck, FolderOpen, BookOpen, CreditCard, ChartNoAxesCombined, LogOut, X } from 'lucide-react';
import LogoutModal from '../common/LogoutModal';

const menus = [
  { title: 'Tổng quan', path: '/admin', icon: LayoutDashboard, end: true },
  { title: 'Quản lý tài khoản', path: '/admin/accounts', icon: Users },
  { title: 'Quản lý phân quyền', path: '/admin/roles', icon: ShieldCheck },
  { title: 'Quản lý danh mục khóa học', path: '/admin/categories', icon: FolderOpen },
  { title: 'Quản lý khóa học', path: '/admin/courses', icon: BookOpen },
  { title: 'Quản lý giao dịch thanh toán', path: '/admin/payments', icon: CreditCard },
  { title: 'Báo cáo thống kê', path: '/admin/reports', icon: ChartNoAxesCombined }
];

const AdminSidebar = ({ isOpen, onClose, onLogout }) => {
  const [showLogout, setShowLogout] = useState(false);

  const handleConfirmLogout = () => {
    setShowLogout(false);
    onLogout?.();
  };

  return (
    <>
      {isOpen && <div className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={onClose} />}

      <aside className={`fixed inset-y-0 left-0 z-50 flex w-[250px] flex-col bg-[#00174b] text-white transition-transform duration-300 lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        {/* Logo EduSmart */}
        <div className="flex h-[68px] shrink-0 items-center justify-between border-b border-white/10 px-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600">
              <BookOpen size={23} />
            </div>
            <div>
              <h2 className="text-lg font-bold leading-tight">EduSmart</h2>
              <p className="text-[11px] font-semibold uppercase tracking-widest text-blue-300">Admin</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="lg:hidden"><X size={20} /></button>
        </div>

        {/* Danh sách menu */}
        <div className="flex-1 overflow-y-auto px-3 py-5">
          <p className="mb-3 px-3 text-[11px] font-semibold uppercase tracking-wider text-white/45">Hệ thống quản trị</p>
          <nav className="space-y-1">
            {menus.map(({ title, path, icon: Icon, end }) => (
              <NavLink key={path} to={path} end={end} onClick={onClose}
                className={({ isActive }) => `relative flex min-h-[44px] items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium transition-colors ${isActive ? 'bg-blue-600 text-white shadow-sm' : 'text-white/75 hover:bg-white/10 hover:text-white'}`}>
                {({ isActive }) => (
                  <>
                    {isActive && <span className="absolute bottom-2 left-0 top-2 w-1 rounded-r-full bg-white" />}
                    <Icon size={19} className="shrink-0" />
                    <span>{title}</span>
                  </>
                )}
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Nút đăng xuất */}
        <div className="shrink-0 border-t border-white/10 p-3">
          <button type="button" onClick={() => setShowLogout(true)}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-sm font-medium text-white/80 transition-colors hover:bg-white/10 hover:text-white">
            <LogOut size={19} />
            <span>Đăng xuất</span>
          </button>
        </div>
      </aside>

      {/* Sử dụng Modal đăng xuất dùng chung */}
      <LogoutModal isOpen={showLogout} onClose={() => setShowLogout(false)} onConfirm={handleConfirmLogout} />
    </>
  );
};

export default AdminSidebar;
