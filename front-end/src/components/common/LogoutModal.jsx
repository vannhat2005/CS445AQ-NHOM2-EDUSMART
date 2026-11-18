
import React from 'react';
import { LogOut, X } from 'lucide-react';

const LogoutModal = ({ isOpen, onClose, onConfirm }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="absolute inset-0" onClick={onClose}></div>
      <div role="dialog" aria-modal="true" aria-labelledby="logout-title" className="relative bg-white rounded-xl shadow-xl border border-gray-100 max-w-md w-full p-6 flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0"><LogOut size={22} /></div>
          <div className="flex-1">
            <h3 id="logout-title" className="text-lg font-semibold text-gray-900">Xác nhận đăng xuất</h3>
            <p className="text-xs text-gray-500">Tài khoản EduSmart</p>
          </div>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>
        <p className="text-sm text-gray-600">Bạn có chắc chắn muốn đăng xuất khỏi tài khoản EduSmart của mình không?</p>
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg border border-gray-200 text-gray-700 font-semibold text-sm hover:bg-gray-50">Hủy</button>
          <button type="button" onClick={onConfirm} className="px-4 py-2 rounded-lg bg-red-600 text-white font-semibold text-sm hover:bg-red-700 flex items-center gap-2"><LogOut size={17} /> Đăng xuất</button>
        </div>
      </div>
    </div>
  );
};

export default LogoutModal;
