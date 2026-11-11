import React, { useState } from 'react';

const ManageChapters = () => {
  // Danh sách chương mẫu
  const [chapters, setChapters] = useState([
    { id: 1, title: "Chương 1: Giới thiệu", desc: "Tổng quan khóa học", status: "active" },
    { id: 2, title: "Chương 2: Cơ bản", desc: "Kiến thức cơ bản", status: "active" },
    { id: 3, title: "Chương 3: Nâng cao", desc: "Kiến thức nâng cao", status: "inactive" },
  ]);

  // State quản lý Modal và form
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  
  // Dữ liệu form chỉnh sửa
  const [editingChapter, setEditingChapter] = useState(null);
  const [formData, setFormData] = useState({ title: '', desc: '', status: 'active' });

  // Mở modal sửa và nạp dữ liệu cũ
  const handleOpenEdit = (chap) => {
    setEditingChapter(chap);
    setFormData({ title: chap.title, desc: chap.desc, status: chap.status });
    setShowEditModal(true);
  };

  // Di chuyển thứ tự chương lên/xuống
  const handleMove = (index, direction) => {
    const newChapters = [...chapters];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newChapters.length) return;
    
    const temp = newChapters[index];
    newChapters[index] = newChapters[targetIndex];
    newChapters[targetIndex] = temp;
    setChapters(newChapters);
  };

  return (
    <div className="flex flex-col w-full px-2 pt-4 pb-12">
      {/* Breadcrumb & Header */}
      <div className="flex flex-col gap-2 mb-6">
        <div className="flex items-center justify-between gap-2 mb-1">
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm text-gray-500">
            <a className="hover:text-blue-600 transition-colors font-medium" href="/instructor/courses">Khóa học</a>
            <span className="material-symbols-outlined text-[14px] text-gray-400">chevron_right</span>
            <a className="hover:text-blue-600 transition-colors font-medium" href="/instructor/courses/detail">Chi tiết khóa học</a>
            <span className="material-symbols-outlined text-[14px] text-gray-400">chevron_right</span>
            <span className="text-blue-600 font-semibold">Quản lý chương học</span>
          </nav>
          <button 
            className="group flex items-center justify-center w-10 h-10 rounded-xl bg-white text-gray-600 shadow-sm hover:bg-gray-50 hover:text-blue-600 transition-all active:scale-95 shrink-0 border border-gray-100" 
            onClick={() => window.history.back()} 
            title="Quay lại chi tiết khóa học" 
            type="button"
          >
            <span className="material-symbols-outlined text-[20px] transition-transform group-hover:-translate-x-0.5">arrow_back</span>
          </button>
        </div>
        
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Quản lý chương học</h1>
          <div className="flex items-center gap-2 mt-1 text-sm text-gray-600">
            <span>Khóa học: <strong className="text-gray-900 font-semibold">Lập trình C (C Programming Fundamentals)</strong></span>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white p-4 rounded-xl shadow-sm mb-6 border border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-blue-600"></div>
          <span className="font-semibold text-sm text-gray-800">Danh sách phân phối chương</span>
          <span className="px-3 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold">{chapters.length} chương học</span>
        </div>
        <button 
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-sm transition-all" 
          onClick={() => setShowCreateModal(true)} 
          type="button"
        >
          <span className="material-symbols-outlined text-[20px]">add</span>
          <span>Thêm chương</span>
        </button>
      </div>

      {/* Table Container - Đã mở rộng tối đa màn hình */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100 w-full">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-600 font-medium text-xs border-b border-gray-100">
                <th className="py-4 px-6 w-20 text-center">ID</th>
                <th className="py-4 px-6 min-w-[220px]">Tên chương</th>
                <th className="py-4 px-6 min-w-[300px]">Mô tả</th>
                <th className="py-4 px-6 w-44 text-center">Thứ tự chương</th>
                <th className="py-4 px-6 min-w-[180px] text-center">Trạng thái</th>
                <th className="py-4 px-6 min-w-[260px] text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {chapters.map((chap, idx) => (
                <tr key={chap.id} className="hover:bg-gray-50/60 transition-colors group">
                  <td className="py-4 px-6 text-center font-medium text-gray-500">{chap.id}</td>
                  <td className="py-4 px-6 font-semibold text-blue-600">{chap.title}</td>
                  <td className="py-4 px-6 text-gray-600">{chap.desc}</td>
                  <td className="py-4 px-6">
                    <div className="flex items-center justify-center gap-2">
                      <span className="w-7 h-7 flex items-center justify-center font-semibold rounded bg-gray-100 text-blue-600 text-xs">{idx + 1}</span>
                      <div className="flex items-center gap-0.5">
                        <button 
                          className="p-1 rounded text-gray-400 hover:text-blue-600 hover:bg-gray-100 transition-colors disabled:opacity-30" 
                          disabled={idx === 0} 
                          onClick={() => handleMove(idx, 'up')}
                          title="Di chuyển lên" 
                          type="button"
                        >
                          <span className="material-symbols-outlined text-[18px]">arrow_upward</span>
                        </button>
                        <button 
                          className="p-1 rounded text-gray-400 hover:text-blue-600 hover:bg-gray-100 transition-colors disabled:opacity-30" 
                          disabled={idx === chapters.length - 1} 
                          onClick={() => handleMove(idx, 'down')}
                          title="Di chuyển xuống" 
                          type="button"
                        >
                          <span className="material-symbols-outlined text-[18px]">arrow_downward</span>
                        </button>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-center">
                    {chap.status === 'active' ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                        Hoạt động
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-rose-50 text-rose-700">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                        Không hoạt động
                      </span>
                    )}
                  </td>
                  <td className="py-4 px-6 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button 
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gray-100 text-gray-800 hover:text-blue-600 hover:bg-gray-200 transition-colors text-xs font-semibold shadow-xs" 
                        onClick={() => handleOpenEdit(chap)}
                        type="button"
                      >
                        <span className="material-symbols-outlined text-[16px]">edit</span>
                        <span>Sửa</span>
                      </button>
                      <a 
                        className="inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors text-xs font-semibold shadow-xs whitespace-nowrap" 
                        href="/instructor/lessons" 
                        title="Quản lý bài học"
                      >
                        Quản lý bài học
                      </a>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL THÊM CHƯƠNG MỚI */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="relative w-full max-w-lg bg-white rounded-xl shadow-xl overflow-hidden border border-gray-100">
            <div className="flex items-center justify-between px-6 py-4 bg-gray-50 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center">
                  <span className="material-symbols-outlined text-[20px]">add</span>
                </div>
                <h2 className="text-base font-semibold text-gray-900">Thêm chương học mới</h2>
              </div>
              <button className="p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-200 transition-colors" onClick={() => setShowCreateModal(false)} type="button">
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            <form className="p-6 flex flex-col gap-4" onSubmit={(e) => { e.preventDefault(); setShowCreateModal(false); }}>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-700">Tên chương <span className="text-red-500">*</span></label>
                <input className="w-full px-3 py-2 rounded-lg bg-gray-50 text-gray-900 border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600" placeholder="Nhập tên chương học..." required type="text" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-700">Mô tả</label>
                <textarea className="w-full px-3 py-2 rounded-lg bg-gray-50 text-gray-900 border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 resize-none" placeholder="Mô tả nội dung chương..." rows="3"></textarea>
              </div>
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
                <button className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold transition-colors" onClick={() => setShowCreateModal(false)} type="button">Hủy</button>
                <button className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-sm transition-all" type="submit">Lưu</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL CHỈNH SỬA CHƯƠNG */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="relative w-full max-w-lg bg-white rounded-xl shadow-xl overflow-hidden border border-gray-100">
            <div className="flex items-center justify-between px-6 py-4 bg-gray-50 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center">
                  <span className="material-symbols-outlined text-[20px]">edit</span>
                </div>
                <h2 className="text-base font-semibold text-gray-900">Chỉnh sửa chương học</h2>
              </div>
              <button className="p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-200 transition-colors" onClick={() => setShowEditModal(false)} type="button">
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            <form className="p-6 flex flex-col gap-4" onSubmit={(e) => { e.preventDefault(); setShowEditModal(false); }}>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-700">Tên chương <span className="text-red-500">*</span></label>
                <input 
                  className="w-full px-3 py-2 rounded-lg bg-gray-50 text-gray-900 border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600" 
                  value={formData.title} 
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  required 
                  type="text" 
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-700">Mô tả</label>
                <textarea 
                  className="w-full px-3 py-2 rounded-lg bg-gray-50 text-gray-900 border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 resize-none" 
                  value={formData.desc} 
                  onChange={(e) => setFormData({...formData, desc: e.target.value})}
                  rows="3"
                ></textarea>
              </div>
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
                <button className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold transition-colors" onClick={() => setShowEditModal(false)} type="button">Hủy</button>
                <button className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-sm transition-all" type="submit">Lưu thay đổi</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageChapters;