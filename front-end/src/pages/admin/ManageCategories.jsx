
import React, { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { categoryService, getCategoryError } from '../../services/categoryService';

const emptyForm = { name: '', description: '', active: true };
const PAGE_SIZE = 5;

const Icon = ({ children, className = '' }) => (
  <span className={`material-symbols-outlined ${className}`}>{children}</span>
);

const ManageCategories = () => {
  // Danh sách danh mục, tìm kiếm và phân trang
  const [categories, setCategories] = useState([]);
  const [keyword, setKeyword] = useState('');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(1);

  // Trạng thái modal và xử lý API
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [loadError, setLoadError] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Lấy danh sách danh mục từ Backend
  const loadCategories = async (showToast = true) => {
    setLoading(true);
    setLoadError('');
    try {
      const data = await categoryService.getAll();
      setCategories(data);
    } catch (err) {
      const message = getCategoryError(err);
      setLoadError(message);
      if (showToast) toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  // Tải dữ liệu khi mở trang
  useEffect(() => { loadCategories(); }, []);

  // Thống kê số lượng danh mục
  const activeCount = categories.filter(item => item.active).length;
  const hiddenCount = categories.length - activeCount;

  // Tìm kiếm theo tên, mô tả, ID và lọc trạng thái
  const filteredCategories = useMemo(() => {
    const query = search.trim().toLowerCase();
    return categories.filter(item => {
      const matchStatus = filter === 'all' || (filter === 'active' && item.active) || (filter === 'hidden' && !item.active);
      const matchSearch = !query || item.name.toLowerCase().includes(query) || item.description.toLowerCase().includes(query) || String(item.id).includes(query.replace('#', ''));
      return matchStatus && matchSearch;
    });
  }, [categories, search, filter]);

  // Tính toán phân trang
  const totalPages = Math.max(1, Math.ceil(filteredCategories.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const currentCategories = filteredCategories.slice(startIndex, startIndex + PAGE_SIZE);

  // Thay đổi bộ lọc
  const changeFilter = value => { setFilter(value); setPage(1); };

  // Tìm kiếm khi nhấn nút
  const handleSearch = e => { e.preventDefault(); setSearch(keyword); setPage(1); };

  // Mở modal thêm danh mục
  const openAdd = () => {
    setEditingId(null);
    setForm({ ...emptyForm });
    setShowModal(true);
  };

  // Mở modal chỉnh sửa danh mục
  const openEdit = item => {
    setEditingId(item.id);
    setForm({ name: item.name, description: item.description, active: item.active });
    setShowModal(true);
  };

  // Gửi dữ liệu lên Backend và hiển thị thông báo từ Backend
  const handleSave = async e => {
    e.preventDefault();
    if (saving) return;

    setSaving(true);
    try {
      // Backend kiểm tra dữ liệu, bao gồm trường hợp tên danh mục để trống
      const response = editingId !== null
        ? await categoryService.update(editingId, form)
        : await categoryService.create(form);

      // Hiển thị thông báo thành công do Backend trả về
      if (response.message) toast.success(response.message);
      setShowModal(false);
      setPage(1);
      await loadCategories(false);
    } catch (err) {
      // Chỉ hiển thị nội dung lỗi trong message của Backend
      const message = err.response?.data?.message;
      if (message) toast.error(message);
      else toast.error(getCategoryError(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="w-full flex flex-col gap-6 px-2 pt-4 pb-12">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-gray-500">
        <Icon className="text-[18px]">school</Icon>
        <span>EduSmart</span>
        <Icon className="text-[16px]">chevron_right</Icon>
        <span className="font-semibold text-gray-800">Quản lý danh mục khóa học</span>
      </nav>

      {/* Tiêu đề */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý danh mục khóa học</h1>
          <p className="text-sm text-gray-500 mt-1">
            Quản lý, phân loại và cấu hình trạng thái hiển thị các danh mục đào tạo trên toàn hệ thống EduSmart.
          </p>
        </div>
        <button onClick={openAdd} className="h-10 px-5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold flex items-center justify-center gap-2 shrink-0">
          <Icon className="text-[20px]">add</Icon>Thêm danh mục
        </button>
      </div>

      {/* Thống kê danh mục */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'Tổng danh mục', value: categories.length, icon: 'folder', bg: 'bg-blue-50', iconBg: 'bg-blue-100', color: 'text-blue-600' },
          { label: 'Đang hiển thị', value: activeCount, icon: 'visibility', bg: 'bg-green-50', iconBg: 'bg-green-100', color: 'text-green-600' },
          { label: 'Đang ẩn', value: hiddenCount, icon: 'visibility_off', bg: 'bg-gray-50', iconBg: 'bg-gray-200', color: 'text-gray-600' }
        ].map(card => (
          <div key={card.label} className={`${card.bg} rounded-xl border border-gray-100 shadow-sm p-5 flex items-center justify-between`}>
            <div>
              <p className="text-xs font-semibold text-gray-600">{card.label}</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{card.value}</p>
            </div>
            <div className={`w-12 h-12 rounded-xl ${card.iconBg} ${card.color} flex items-center justify-center`}>
              <Icon className="text-[27px]">{card.icon}</Icon>
            </div>
          </div>
        ))}
      </div>

      {/* Tìm kiếm và lọc */}
      <form onSubmit={handleSearch} className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex flex-col lg:flex-row gap-3">
        <div className="relative flex-1">
          <Icon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-[20px]">search</Icon>
          <input value={keyword} onChange={e => setKeyword(e.target.value)} placeholder="Tìm kiếm danh mục theo tên, mã hoặc nội dung..." className="w-full h-10 pl-10 pr-3 rounded-lg bg-gray-50 border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <button type="submit" className="h-10 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold flex items-center justify-center gap-2">
          <Icon className="text-[18px]">search</Icon>Tìm kiếm
        </button>
        <select value={filter} onChange={e => changeFilter(e.target.value)} className="h-10 min-w-[110px] px-3 pr-8 rounded-lg border border-gray-200 bg-white text-sm text-gray-700 outline-none cursor-pointer focus:ring-2 focus:ring-blue-500">
          <option value="all">Tất cả</option>
          <option value="active">Hiển thị</option>
          <option value="hidden">Ẩn</option>
        </select>
      </form>

      {/* Lỗi tải dữ liệu */}
      {loadError && (
        <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 flex items-center justify-between gap-3">
          <span>{loadError}</span>
          <button type="button" onClick={() => loadCategories()} className="font-semibold underline">Thử lại</button>
        </div>
      )}

      {/* Bảng danh mục */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left border-collapse">
            <thead>
              <tr className="bg-blue-50 text-xs uppercase text-gray-600">
                <th className="px-5 py-4 w-20">Mã ID</th>
                <th className="px-5 py-4">Tên danh mục</th>
                <th className="px-5 py-4">Mô tả chi tiết</th>
                <th className="px-5 py-4 text-center">Trạng thái</th>
                <th className="px-5 py-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading && (
                <tr><td colSpan={5} className="py-12 text-center text-sm text-gray-500">Đang tải danh mục...</td></tr>
              )}
              {!loading && !loadError && currentCategories.map(item => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-5 py-4 text-blue-600 font-semibold text-sm">#{item.id}</td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                        <Icon className="text-[20px]">folder</Icon>
                      </div>
                      <span className="font-semibold text-gray-900 text-sm">{item.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-sm text-gray-600">
                    <p className="max-w-[360px] truncate" title={item.description}>{item.description || '—'}</p>
                  </td>
                  <td className="px-5 py-4 text-center">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${item.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                      <span className={`w-2 h-2 rounded-full ${item.active ? 'bg-green-500' : 'bg-gray-500'}`} />
                      {item.active ? 'Hiển thị' : 'Ẩn'}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <button onClick={() => openEdit(item)} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 text-xs font-semibold">
                      <Icon className="text-[17px]">edit</Icon>Chỉnh sửa
                    </button>
                  </td>
                </tr>
              ))}
              {!loading && loadError && (
                <tr><td colSpan={5} className="py-12 text-center text-sm text-red-600">Không thể tải danh sách danh mục.</td></tr>
              )}
              {!loading && !loadError && currentCategories.length === 0 && (
                <tr><td colSpan={5} className="py-12 text-center text-gray-500">Không tìm thấy danh mục phù hợp.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Phân trang */}
        <div className="px-5 py-4 border-t border-gray-100 flex items-center justify-between gap-3">
          <p className="text-xs text-gray-500">
            Hiển thị <strong>{filteredCategories.length === 0 ? 0 : startIndex + 1} - {Math.min(startIndex + PAGE_SIZE, filteredCategories.length)}</strong> trên <strong>{filteredCategories.length}</strong> danh mục
          </p>
          <div className="flex items-center gap-2">
            <button disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100 disabled:opacity-30">
              <Icon>chevron_left</Icon>
            </button>
            <span className="w-8 h-8 rounded-lg bg-blue-600 text-white text-xs font-semibold flex items-center justify-center">{currentPage}</span>
            <button disabled={currentPage === totalPages} onClick={() => setPage(currentPage + 1)} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100 disabled:opacity-30">
              <Icon>chevron_right</Icon>
            </button>
          </div>
        </div>
      </div>

      {/* Modal thêm hoặc chỉnh sửa */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-xl bg-white rounded-xl shadow-xl overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Icon>{editingId !== null ? 'edit' : 'category'}</Icon>
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">{editingId !== null ? 'Cập nhật danh mục' : 'Thêm danh mục mới'}</h2>
                  <p className="text-xs text-gray-500 mt-1">{editingId !== null ? `Chỉnh sửa thông tin danh mục #${editingId}` : 'Tạo danh mục mới để phân loại khóa học'}</p>
                </div>
              </div>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-700"><Icon>close</Icon></button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-5">
              {/* Tên danh mục */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Tên danh mục <span className="text-red-500">*</span></label>
                <input value={form.name} maxLength={60} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Nhập tên danh mục..." className="w-full h-10 px-3 rounded-lg border border-gray-200 bg-gray-50 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
              </div>

              {/* Mô tả danh mục */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Mô tả</label>
                <textarea rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Nhập mô tả danh mục..." className="w-full p-3 rounded-lg border border-gray-200 bg-gray-50 text-sm outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
              </div>

              {/* Trạng thái hiển thị */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Trạng thái hiển thị</label>
                <div className="flex items-center justify-between gap-3 p-4 rounded-xl bg-gray-50">
                  <div className="flex items-center gap-3">
                    <Icon className={form.active ? 'text-green-600' : 'text-gray-500'}>{form.active ? 'visibility' : 'visibility_off'}</Icon>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{form.active ? 'Đang hiển thị công khai' : 'Đang tạm ẩn'}</p>
                      <p className="text-xs text-gray-500 mt-1">{form.active ? 'Học viên có thể xem danh mục này' : 'Danh mục tạm thời không hiển thị'}</p>
                    </div>
                  </div>
                  <input type="checkbox" checked={form.active} onChange={e => setForm({ ...form, active: e.target.checked })} className="w-5 h-5 accent-green-600 cursor-pointer" />
                </div>
              </div>

              {/* Nút hủy và lưu */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button type="button" onClick={() => !saving && setShowModal(false)} className="h-10 px-5 rounded-lg bg-gray-100 text-gray-700 text-sm font-semibold hover:bg-gray-200">Hủy</button>
                <button type="submit" disabled={saving} className="h-10 px-5 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 flex items-center gap-2">
                  <Icon className="text-[18px]">save</Icon>
                  {saving ? 'Đang lưu...' : editingId !== null ? 'Lưu thay đổi' : 'Tạo danh mục'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageCategories;
