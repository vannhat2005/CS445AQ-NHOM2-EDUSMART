
import React, { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { ShieldCheck, Shield, GraduationCap, BookOpen, Search, RotateCcw, Users, Save, X, CheckCircle2, AlertTriangle, ChevronLeft, ChevronRight, ArrowRight, ClipboardList, RefreshCw } from 'lucide-react';
import { roleService, getRoleError } from '../../services/adminRoleApi';

const ROLE_OPTIONS = [
  { value: 'Admin', label: 'Admin' },
  { value: 'Instructor', label: 'Giảng viên' },
  { value: 'Student', label: 'Học viên' }
];

const ROLE_CONFIG = {
  Admin: { label: 'Admin', Icon: Shield, select: 'bg-purple-50 border-purple-200 text-purple-700' },
  Instructor: { label: 'Giảng viên', Icon: BookOpen, select: 'bg-blue-50 border-blue-200 text-blue-700' },
  Student: { label: 'Học viên', Icon: GraduationCap, select: 'bg-slate-50 border-slate-200 text-slate-700' }
};

const PAGE_SIZE = 5;

const ManageRoles = () => {
  const [users, setUsers] = useState([]);
  const [pending, setPending] = useState({});
  const [keyword, setKeyword] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [showConfirm, setShowConfirm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await roleService.getAll();
      setUsers(data);
    } catch (error) {
      toast.error(getRoleError(error));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadUsers(); }, []);

  const pendingChanges = useMemo(() => users
    .filter(user => pending[user.userId] && pending[user.userId] !== user.role)
    .map(user => ({ ...user, newRole: pending[user.userId] })), [users, pending]);

  const filteredUsers = useMemo(() => {
    const search = keyword.trim().toLowerCase();
    return users.filter(user => {
      const matchesSearch = !search || String(user.userId).includes(search.replace('#', '')) ||
        (user.username || '').toLowerCase().includes(search) ||
        (user.fullName || '').toLowerCase().includes(search) ||
        (user.email || '').toLowerCase().includes(search);
      const selectedRole = pending[user.userId] || user.role;
      return matchesSearch && (roleFilter === 'ALL' || selectedRole === roleFilter);
    });
  }, [users, pending, keyword, roleFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const visibleUsers = filteredUsers.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const handleRoleChange = (user, newRole) => {
    setPending(prev => {
      const next = { ...prev };
      if (newRole === user.role) delete next[user.userId];
      else next[user.userId] = newRole;
      return next;
    });
  };

  const handleResetFilters = () => { setKeyword(''); setRoleFilter('ALL'); setPage(1); };

  const handleCancelChanges = () => {
    setPending({});
    setShowConfirm(false);
    toast('Đã hủy các thay đổi chưa lưu.', { icon: 'ℹ️' });
  };

  const handleSaveChanges = async () => {
    if (!pendingChanges.length || saving) return;
    try {
      setSaving(true);
      const response = await roleService.updateRoles(pendingChanges);
      setUsers(prev => prev.map(user => ({ ...user, role: pending[user.userId] || user.role })));
      setPending({});
      setShowConfirm(false);
      toast.success(response.message || 'Cập nhật phân quyền thành công!');
    } catch (error) {
      toast.error(getRoleError(error));
    } finally {
      setSaving(false);
    }
  };

  const handleRefresh = async () => {
    if (pendingChanges.length) return toast.error('Vui lòng lưu hoặc hủy các thay đổi trước khi tải lại.');
    await loadUsers();
  };

  const getRole = role => ROLE_CONFIG[role] || ROLE_CONFIG.Student;

  return (
    <div className="w-full space-y-5 p-4 md:p-6 text-slate-800">
      {/* Tiêu đề */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0"><ShieldCheck size={25} /></div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Quản lý phân quyền</h1>
            <p className="text-sm text-slate-500 mt-1">Quản lý vai trò và quyền truy cập của người dùng trong hệ thống EduSmart.</p>
          </div>
        </div>
        <button type="button" onClick={handleRefresh} disabled={loading || saving} className="flex items-center justify-center gap-2 px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-medium hover:bg-slate-50 disabled:opacity-50">
          <RefreshCw size={17} className={loading ? 'animate-spin' : ''} /> Làm mới dữ liệu
        </button>
      </div>

      {/* Tìm kiếm và bộ lọc */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row gap-3 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search size={19} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={keyword} onChange={e => { setKeyword(e.target.value); setPage(1); }} placeholder="Tìm kiếm người dùng..." className="w-full h-11 pl-10 pr-10 rounded-xl border border-slate-200 bg-slate-50 text-sm outline-none focus:border-blue-500 focus:bg-white" />
            {keyword && <button type="button" onClick={() => { setKeyword(''); setPage(1); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"><X size={17} /></button>}
          </div>
          <select value={roleFilter} onChange={e => { setRoleFilter(e.target.value); setPage(1); }} className="h-11 min-w-[175px] px-3 rounded-xl border border-slate-200 bg-slate-50 text-sm outline-none focus:border-blue-500">
            <option value="ALL">Tất cả vai trò</option>
            {ROLE_OPTIONS.map(role => <option key={role.value} value={role.value}>{role.label}</option>)}
          </select>
          <button type="button" onClick={handleResetFilters} className="h-11 px-4 rounded-xl border border-slate-200 flex items-center justify-center gap-2 text-sm font-medium hover:bg-slate-50"><RotateCcw size={17} /> Đặt lại</button>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-50 border border-slate-100 text-sm whitespace-nowrap">
          <Users size={18} className="text-blue-600" /> Tổng cộng: <strong>{filteredUsers.length}</strong> người dùng
        </div>
      </div>

      {/* Bảng phân quyền */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr className="text-xs font-bold uppercase tracking-wide text-slate-500">
                <th className="px-5 py-4">Mã ND</th>
                <th className="px-5 py-4">Tên đăng nhập</th>
                <th className="px-5 py-4">Thông tin người dùng</th>
                <th className="px-5 py-4">Vai trò hiện tại</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={4} className="py-14 text-center text-slate-500">Đang tải danh sách người dùng...</td></tr>
              ) : visibleUsers.length === 0 ? (
                <tr><td colSpan={4} className="py-14 text-center text-slate-500">Không tìm thấy người dùng phù hợp.</td></tr>
              ) : visibleUsers.map(user => {
                const selectedRole = pending[user.userId] || user.role;
                const changed = selectedRole !== user.role;
                const roleInfo = getRole(selectedRole);
                const RoleIcon = roleInfo.Icon;
                return (
                  <tr key={user.userId} className={`hover:bg-slate-50 transition-colors ${changed ? 'bg-blue-50/40' : ''}`}>
                    <td className="px-5 py-4 font-mono text-xs text-slate-500">#{String(user.userId).padStart(3, '0')}</td>
                    <td className="px-5 py-4 font-medium">{user.username}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 shrink-0"><Users size={21} /></div>
                        <div className="min-w-0">
                          <div className="font-semibold text-slate-900">{user.fullName}</div>
                          <div className="text-xs text-slate-500 mt-0.5">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <div className="relative">
                          <RoleIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-600 pointer-events-none" />
                          <select value={selectedRole} disabled={saving} onChange={e => handleRoleChange(user, e.target.value)} className={`h-10 w-44 pl-9 pr-2 rounded-lg border text-xs font-semibold outline-none cursor-pointer ${roleInfo.select}`}>
                            {ROLE_OPTIONS.map(role => <option key={role.value} value={role.value}>{role.label}</option>)}
                          </select>
                        </div>
                        {changed && <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-semibold whitespace-nowrap">Chờ lưu</span>}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Phân trang */}
        <div className="px-5 py-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-sm text-slate-600">
            {filteredUsers.length === 0 ? 'Hiển thị 0 người dùng' : `Hiển thị ${(currentPage - 1) * PAGE_SIZE + 1} - ${Math.min(currentPage * PAGE_SIZE, filteredUsers.length)} trong tổng số ${filteredUsers.length} người dùng`}
          </p>
          <div className="flex items-center gap-2">
            <button type="button" disabled={currentPage === 1} onClick={() => setPage(p => p - 1)} className="w-9 h-9 rounded-lg flex items-center justify-center hover:bg-slate-100 disabled:opacity-40"><ChevronLeft size={19} /></button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(number => (
              <button key={number} type="button" onClick={() => setPage(number)} className={`w-9 h-9 rounded-lg text-sm font-semibold ${currentPage === number ? 'bg-blue-600 text-white' : 'hover:bg-slate-100 text-slate-600'}`}>{number}</button>
            ))}
            <button type="button" disabled={currentPage === totalPages} onClick={() => setPage(p => p + 1)} className="w-9 h-9 rounded-lg flex items-center justify-center hover:bg-slate-100 disabled:opacity-40"><ChevronRight size={19} /></button>
          </div>
        </div>
      </div>

      {/* Thanh lưu thay đổi */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${pendingChanges.length > 0 ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'}`}>
            {pendingChanges.length > 0 ? <ClipboardList size={22} /> : <CheckCircle2 size={22} />}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-semibold text-slate-900">{pendingChanges.length > 0 ? `Bạn có ${pendingChanges.length} thay đổi chưa lưu` : 'Tất cả thay đổi đã được lưu'}</p>
              {pendingChanges.length > 0 && <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-xs font-medium">Cần xác nhận</span>}
            </div>
            <p className="text-xs text-slate-500 mt-1">Quyền hạn hệ thống sẽ có hiệu lực sau khi lưu thay đổi.</p>
          </div>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <button type="button" onClick={handleCancelChanges} disabled={!pendingChanges.length || saving} className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium hover:bg-slate-50 disabled:opacity-40"><RotateCcw size={17} /> Hủy bỏ</button>
          <button type="button" disabled={!pendingChanges.length || saving} onClick={() => setShowConfirm(true)} className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-40"><Save size={17} /> Lưu thay đổi</button>
        </div>
      </div>

      {/* Modal xác nhận */}
      {showConfirm && (
        <div className="fixed inset-0 z-[100] bg-slate-900/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center"><ShieldCheck size={24} /></div>
                <div>
                  <h2 className="font-bold text-lg text-slate-900">Xác nhận thay đổi phân quyền</h2>
                  <p className="text-xs text-slate-500 mt-1">Kiểm tra các thay đổi trước khi lưu.</p>
                </div>
              </div>
              <button type="button" disabled={saving} onClick={() => setShowConfirm(false)} className="text-slate-400 hover:text-slate-700"><X size={21} /></button>
            </div>

            <div className="p-6 space-y-4 max-h-[65vh] overflow-y-auto">
              <h3 className="text-xs font-bold uppercase text-slate-600">Danh sách thay đổi vai trò ({pendingChanges.length})</h3>
              <div className="space-y-3">
                {pendingChanges.map(user => (
                  <div key={user.userId} className="p-3 rounded-xl border border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="font-semibold text-sm">{user.fullName}</div>
                      <div className="text-xs text-slate-500">{user.email}</div>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-semibold">
                      <span className="px-2 py-1 rounded-lg bg-slate-200 text-slate-700">{getRole(user.role).label}</span>
                      <ArrowRight size={17} className="text-slate-400" />
                      <span className="px-2 py-1 rounded-lg bg-blue-100 text-blue-700">{getRole(user.newRole).label}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-100 rounded-xl">
                <AlertTriangle size={20} className="text-blue-600 shrink-0" />
                <div>
                  <p className="text-sm font-semibold">Bạn có chắc chắn muốn lưu các thay đổi này?</p>
                  <p className="text-xs text-slate-600 mt-1">Thay đổi vai trò có thể ảnh hưởng đến quyền truy cập và các chức năng của người dùng.</p>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
              <button type="button" disabled={saving} onClick={() => setShowConfirm(false)} className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-medium">Hủy</button>
              <button type="button" disabled={saving} onClick={handleSaveChanges} className="px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-50">{saving ? 'Đang lưu...' : 'Xác nhận thay đổi'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageRoles;
