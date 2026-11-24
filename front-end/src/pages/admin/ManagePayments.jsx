import React, { useState, useEffect, useCallback, useMemo } from 'react';
import toast from 'react-hot-toast';
import {
  getAdminPayments,
  getAdminPaymentStatistics,
  getAdminPaymentInstructors,
  updateAdminPayment,
  exportTransactionsToExcel
} from '../../services/adminPaymentApi';

const ManagePayments = () => {
  // State danh sách & thống kê
  const [transactions, setTransactions] = useState([]);
  const [statistics, setStatistics] = useState({
    totalRevenue: 2500000000,
    successCount: 498,
    pendingCount: 14,
    failedCount: 8,
    totalCount: 520,
    successRate: 95.8,
    failureRate: 1.5,
    growthRate: 18.4
  });
  const [instructors, setInstructors] = useState([]);
  const [loading, setLoading] = useState(true);

  // Bộ lọc & Phân trang
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [teacherFilter, setTeacherFilter] = useState('');
  const [timeFilter, setTimeFilter] = useState('all');
  const [page, setPage] = useState(0);
  const [pageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);

  // Modal Chi tiết giao dịch
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailTx, setDetailTx] = useState(null);

  // Modal Chỉnh sửa giao dịch
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    paymentId: null,
    sysId: '',
    studentName: '',
    studentEmail: '',
    courseName: '',
    paymentMethod: 'MoMo',
    amount: '',
    status: 'pending'
  });
  const [saving, setSaving] = useState(false);

  // Toast thông báo tùy chỉnh theo giao diện mẫu
  const [toastMessage, setToastMessage] = useState('');
  const [showToastAlert, setShowToastAlert] = useState(false);

  const showSuccessToast = (msg) => {
    setToastMessage(msg);
    setShowToastAlert(true);
    toast.success(msg);
    setTimeout(() => {
      setShowToastAlert(false);
    }, 3500);
  };

  // Format tiền tệ VNĐ
  const formatCurrency = (val) => {
    if (val === null || val === undefined) return '0 đ';
    const num = Number(val);
    if (isNaN(num)) return val;
    return num.toLocaleString('vi-VN') + ' đ';
  };

  // Format thời gian hiển thị
  const formatDateTime = (dateStr) => {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      const hours = String(d.getHours()).padStart(2, '0');
      const minutes = String(d.getMinutes()).padStart(2, '0');
      return `${day}/${month}/${year} ${hours}:${minutes}`;
    } catch {
      return dateStr;
    }
  };

  // Tải danh sách giao dịch
  const loadPayments = useCallback(async (targetPage = page, searchKeyword = keyword) => {
    setLoading(true);
    try {
      const activeKw = typeof searchKeyword === 'string' ? searchKeyword.trim() : (keyword || '').trim();
      const params = {
        keyword: activeKw || undefined,
        status: statusFilter || undefined,
        instructorId: teacherFilter || undefined,
        page: targetPage,
        size: pageSize
      };
      const res = await getAdminPayments(params);
      const items = res?.content || res?.items || (Array.isArray(res) ? res : []);
      setTransactions(items);
      setTotalPages(res?.totalPages || 1);
      setTotalElements(res?.totalElements ?? items.length);
      setPage(targetPage);
    } catch (err) {
      console.error('Lỗi khi tải danh sách giao dịch:', err);
    } finally {
      setLoading(false);
    }
  }, [keyword, statusFilter, teacherFilter, page, pageSize]);

  // Tải thống kê KPI
  const loadStatistics = useCallback(async () => {
    try {
      const stat = await getAdminPaymentStatistics();
      if (stat) setStatistics(stat);
    } catch (err) {
      console.error('Lỗi tải thống kê giao dịch:', err);
    }
  }, []);

  // Tải danh sách giảng viên
  const loadInstructors = useCallback(async () => {
    try {
      const data = await getAdminPaymentInstructors();
      if (Array.isArray(data)) setInstructors(data);
    } catch (err) {
      console.error('Lỗi tải danh sách giảng viên:', err);
    }
  }, []);

  useEffect(() => {
    loadPayments(0);
    loadStatistics();
    loadInstructors();
  }, [statusFilter, teacherFilter]);

  // Xử lý Escape đóng modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setDetailModalOpen(false);
        setEditModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Mở modal xem chi tiết
  const handleOpenDetailModal = (tx) => {
    setDetailTx(tx);
    setDetailModalOpen(true);
  };

  // Mở modal chỉnh sửa
  const handleOpenEditModal = (tx) => {
    setEditForm({
      paymentId: tx.paymentId,
      sysId: tx.sysId || tx.orderId || `#TXN-${tx.paymentId}`,
      studentName: tx.studentName || '',
      studentEmail: tx.studentEmail || '',
      courseName: tx.courseName || '',
      paymentMethod: tx.paymentMethod || 'MoMo',
      amount: tx.amount ? String(tx.amount) : '',
      status: tx.status ? tx.status.toLowerCase() : 'pending'
    });
    setEditModalOpen(true);
  };

  // Lưu chỉnh sửa giao dịch
  const handleSaveTransaction = async (e) => {
    e.preventDefault();
    if (!editForm.paymentId) return;

    setSaving(true);
    try {
      const rawAmount = String(editForm.amount).replace(/[^0-9.]/g, '');
      const payload = {
        status: editForm.status,
        paymentMethod: editForm.paymentMethod,
        amount: rawAmount ? parseFloat(rawAmount) : undefined
      };

      await updateAdminPayment(editForm.paymentId, payload);
      setEditModalOpen(false);
      showSuccessToast(`Đã lưu thay đổi giao dịch ${editForm.sysId} thành công!`);

      // Cập nhật lại giao diện và số liệu thống kê
      loadPayments(page);
      loadStatistics();
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || 'Có lỗi xảy ra khi lưu giao dịch');
    } finally {
      setSaving(false);
    }
  };

  // Xuất báo cáo Excel
  const handleExportExcel = () => {
    if (transactions.length === 0) {
      toast('Không có giao dịch nào để xuất báo cáo', { icon: 'ℹ️' });
      return;
    }
    exportTransactionsToExcel(transactions);
    showSuccessToast('Đã xuất báo cáo giao dịch thành công!');
  };

  // Helper render badge trạng thái
  const renderStatusBadge = (status) => {
    const s = String(status || '').toLowerCase();
    if (s === 'success' || s === 'paid') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-label-sm text-[11px] font-semibold bg-tertiary-container/15 text-tertiary">
          <span className="material-symbols-outlined text-[13px]">check</span>
          Thành công
        </span>
      );
    }
    if (s === 'pending') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-label-sm text-[11px] font-semibold bg-amber-500/15 text-amber-700">
          <span className="material-symbols-outlined text-[13px]">schedule</span>
          Chờ duyệt
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-label-sm text-[11px] font-semibold bg-error-container/40 text-error">
        <span className="material-symbols-outlined text-[13px]">close</span>
        Thất bại
      </span>
    );
  };

  // Helper render badge phương thức (chỉ có ZaloPay và MoMo)
  const renderMethodBadge = (method) => {
    const m = String(method || '').toLowerCase();
    if (m.includes('momo')) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-pink-50 text-pink-700 font-label-sm text-[11px] font-semibold">
          <span className="w-1.5 h-1.5 rounded-full bg-pink-500"></span>
          MoMo
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-sky-50 text-sky-700 font-label-sm text-[11px] font-semibold">
        <span className="w-1.5 h-1.5 rounded-full bg-sky-500"></span>
        ZaloPay
      </span>
    );
  };

  return (
    <div className="w-full bg-surface flex-1">
      <div className="flex flex-col w-full">
        <div className="p-space-lg max-w-[1600px] w-full mx-auto flex flex-col gap-6">

          {/* =========================================================
              TOP HEADER & BREADCRUMB
          ========================================================= */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex flex-col gap-1">
              <nav className="flex items-center gap-2 font-label-sm text-label-sm text-outline">
                <span className="hover:text-primary transition-colors cursor-pointer">EduSmart</span>
                <span className="material-symbols-outlined text-[14px]">chevron_right</span>
                <span className="text-on-surface font-semibold">Quản lý giao dịch thanh toán</span>
              </nav>

              <div className="flex items-center gap-3 mt-1">
                <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight text-2xl md:text-3xl font-extrabold">
                  Quản lý giao dịch thanh toán
                </h1>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-label-sm text-label-sm bg-surface-container text-on-surface-variant font-medium">
                  <span className="material-symbols-outlined text-[14px] text-primary">visibility</span>
                  Chế độ Chỉ Xem &amp; Đối Soát
                </span>
              </div>

              <p className="font-body-md text-body-md text-on-surface-variant text-sm">
                Theo dõi, tra cứu và đối soát toàn bộ dòng tiền và lịch sử giao dịch thanh toán khóa học trực tuyến.
              </p>
            </div>

            {/* Quick Action Toolbar */}
            <div className="flex items-center gap-3">
              <button
                onClick={handleExportExcel}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-container text-on-primary font-label-md text-label-md shadow-sm hover:bg-primary transition-all cursor-pointer font-semibold text-sm"
                type="button"
              >
                <span className="material-symbols-outlined text-[18px]">file_download</span>
                Xuất báo cáo Excel
              </button>
            </div>
          </div>

          {/* =========================================================
              KPI METRIC CARDS GRID
          ========================================================= */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
            {/* Card 1: Tổng Doanh Thu */}
            <div className="relative overflow-hidden rounded-xl bg-surface-container-lowest p-5 shadow-sm flex flex-col justify-between group hover:shadow-md transition-shadow border border-surface-container-low">
              <div className="flex items-start justify-between">
                <div className="flex flex-col">
                  <span className="font-label-md text-label-md text-outline font-medium text-xs">Tổng doanh thu</span>
                  <span className="text-on-surface mt-2 tracking-tight text-[35px] font-bold whitespace-nowrap leading-tight">
                    {formatCurrency(statistics?.totalRevenue)}
                  </span>
                </div>
                <div className="h-11 w-11 rounded-xl bg-primary-fixed/60 flex items-center justify-center text-primary shrink-0">
                  <span className="material-symbols-outlined text-[24px]">account_balance_wallet</span>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-4 pt-3 border-t border-surface-container-low overflow-hidden">
                <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full font-label-sm text-label-sm text-tertiary bg-tertiary-container/15 font-semibold text-xs">
                  <span className="material-symbols-outlined text-[14px]">trending_up</span>
                  +{statistics?.growthRate || 18.4}%
                </span>
                <span className="font-body-sm text-body-sm text-outline text-xs">so với tháng trước</span>
              </div>
            </div>

            {/* Card 2: Thành Công */}
            <div className="relative overflow-hidden rounded-xl bg-surface-container-lowest p-5 shadow-sm flex flex-col justify-between group hover:shadow-md transition-shadow border border-surface-container-low">
              <div className="flex items-start justify-between">
                <div className="flex flex-col">
                  <span className="font-label-md text-label-md text-outline font-medium text-xs">Giao dịch thành công</span>
                  <div className="flex items-baseline gap-2 mt-2">
                    <span className="text-on-surface mt-2 tracking-tight text-[35px] font-bold whitespace-nowrap leading-tight">
                      {statistics?.successCount || 0}
                    </span>
                    <span className="text-on-surface-variant text-[22px] font-medium whitespace-nowrap">giao dịch</span>
                  </div>
                </div>
                <div className="h-11 w-11 rounded-xl bg-tertiary-container/15 flex items-center justify-center text-tertiary shrink-0">
                  <span className="material-symbols-outlined text-[24px]">check_circle</span>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-4 pt-3 border-t border-surface-container-low overflow-hidden">
                <div className="w-full bg-surface-container-low rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-tertiary h-1.5 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, statistics?.successRate || 95.8)}%` }}
                  ></div>
                </div>
                <span className="font-label-sm text-label-sm font-semibold text-tertiary shrink-0 text-xs">
                  {statistics?.successRate || 95.8}%
                </span>
              </div>
            </div>

            {/* Card 3: Đang Xử Lý */}
            <div className="relative overflow-hidden rounded-xl bg-surface-container-lowest p-5 shadow-sm flex flex-col justify-between group hover:shadow-md transition-shadow border border-surface-container-low">
              <div className="flex items-start justify-between">
                <div className="flex flex-col">
                  <span className="font-label-md text-label-md text-outline font-medium text-xs">Đang chờ duyệt</span>
                  <div className="flex items-baseline gap-2 mt-2">
                    <span className="text-on-surface mt-2 tracking-tight text-[35px] font-bold whitespace-nowrap leading-tight">
                      {statistics?.pendingCount || 0}
                    </span>
                    <span className="text-on-surface-variant text-[22px] font-medium whitespace-nowrap">giao dịch</span>
                  </div>
                </div>
                <div className="h-11 w-11 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600 shrink-0">
                  <span className="material-symbols-outlined text-[24px]">schedule</span>
                </div>
              </div>
              <div className="flex items-center gap-1.5 mt-4 pt-3 border-t border-surface-container-low overflow-hidden">
                <span className="inline-flex w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                <span className="font-body-sm text-body-sm text-on-surface-variant font-medium text-xs">
                  Giao dịch đang chờ quản trị viên phê duyệt
                </span>
              </div>
            </div>

            {/* Card 4: Thất Bại / Hủy */}
            <div className="relative overflow-hidden rounded-xl bg-surface-container-lowest p-5 shadow-sm flex flex-col justify-between group hover:shadow-md transition-shadow border border-surface-container-low">
              <div className="flex items-start justify-between">
                <div className="flex flex-col">
                  <span className="font-label-md text-label-md text-outline font-medium text-xs">Thất bại / Hủy</span>
                  <div className="flex items-baseline gap-2 mt-2">
                    <span className="text-on-surface mt-2 tracking-tight text-[35px] font-bold whitespace-nowrap leading-tight text-red-600">
                      {statistics?.failedCount || 0}
                    </span>
                    <span className="text-on-surface-variant text-[22px] font-medium whitespace-nowrap">giao dịch</span>
                  </div>
                </div>
                <div className="h-11 w-11 rounded-xl bg-error-container/40 flex items-center justify-center text-error shrink-0">
                  <span className="material-symbols-outlined text-[24px]">cancel</span>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-4 pt-3 border-t border-surface-container-low overflow-hidden">
                <span className="font-body-sm text-body-sm text-outline text-xs">Tỷ lệ rủi ro:</span>
                <span className="font-label-sm text-label-sm font-semibold text-error text-xs text-red-600">
                  {statistics?.failureRate || 1.5}%
                </span>
                <span className="font-body-sm text-body-sm text-outline text-xs">(Mức an toàn)</span>
              </div>
            </div>
          </div>

          {/* =========================================================
              MAIN WORKSPACE CONTAINER
          ========================================================= */}
          <div className="bg-surface-container-lowest rounded-xl shadow-sm flex flex-col overflow-hidden border border-surface-container-low">

            {/* Filter & Search Toolbar */}
            <div className="p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-surface-container-lowest">
              {/* Left Section: Search Input and Stacked Action Buttons */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1 min-w-[320px] max-w-2xl">
                <div className="relative flex-1">
                  <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-outline text-[20px]">
                    search
                  </span>
                  <input
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        loadPayments(0, e.target.value);
                      }
                    }}
                    className="w-full h-full min-h-[88px] sm:min-h-[88px] pl-11 pr-4 rounded-lg bg-surface-container-low text-on-surface font-body-md text-body-md placeholder:text-outline focus:outline-none focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary/20 transition-all border border-transparent focus:border-outline-variant/40"
                    placeholder="Tìm kiếm theo mã GD, tên học viên, tên khóa học..."
                    type="text"
                  />
                </div>

                {/* Stacked Buttons Column right beside Search */}
                <div className="flex flex-col gap-2 shrink-0">
                  <button
                    onClick={() => loadPayments(0, keyword)}
                    className="h-10 px-4 rounded-lg bg-primary text-white font-label-md text-label-md inline-flex items-center justify-center gap-2 hover:bg-primary/90 shadow-sm transition-all cursor-pointer font-semibold text-sm"
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[18px]">search</span>
                    <span>Tìm kiếm</span>
                  </button>

                  <button
                    onClick={() => loadPayments(0, keyword)}
                    className="h-10 px-4 rounded-lg bg-primary-container text-on-primary font-label-md text-label-md inline-flex items-center justify-center gap-2 hover:bg-primary shadow-sm transition-all cursor-pointer font-semibold text-sm"
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[18px]">filter_list</span>
                    <span>Lọc dữ liệu</span>
                  </button>
                </div>
              </div>

              {/* Right Section: Filters (Trạng thái, Giáo viên, Date Picker) */}
              <div className="flex flex-wrap items-center gap-3 overflow-hidden">
                {/* Status Filter & Teacher Filter Stacked Column */}
                <div className="flex flex-col gap-2 min-w-[180px]">
                  <div className="relative">
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="appearance-none h-10 pl-3.5 pr-9 rounded-lg bg-surface-container-low text-on-surface font-label-md text-label-md cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all border border-transparent hover:bg-surface-container w-full text-xs font-medium"
                    >
                      <option value="">Tất cả trạng thái</option>
                      <option value="success">Thành công</option>
                      <option value="pending">Đang chờ duyệt</option>
                      <option value="failed">Thất bại</option>
                    </select>
                    <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-outline text-[18px] pointer-events-none">
                      expand_more
                    </span>
                  </div>

                  <div className="relative">
                    <select
                      value={teacherFilter}
                      onChange={(e) => setTeacherFilter(e.target.value)}
                      className="appearance-none h-10 pl-3.5 pr-9 rounded-lg bg-surface-container-low text-on-surface font-label-md text-label-md cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all border border-transparent hover:bg-surface-container w-full text-xs font-medium"
                    >
                      <option value="">Tất cả giáo viên</option>
                      {instructors.map((ins) => (
                        <option key={ins.instructorId} value={ins.instructorId}>
                          {ins.fullName}
                        </option>
                      ))}
                      {instructors.length === 0 && (
                        <>
                          <option value="lan">Trần Thị Thanh Lan</option>
                          <option value="quyen">Nguyễn Minh Quyền</option>
                          <option value="huong">Hồ Thanh Hương</option>
                        </>
                      )}
                    </select>
                    <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-outline text-[18px] pointer-events-none">
                      expand_more
                    </span>
                  </div>
                </div>

                {/* Date Picker Button */}
                <button
                  onClick={() => {
                    setTimeFilter((prev) => (prev === 'all' ? 'month' : 'all'));
                    toast('Đang đối soát khoảng thời gian giao dịch gần nhất', { icon: '📅' });
                  }}
                  className="h-[88px] px-3.5 rounded-lg bg-surface-container-low hover:bg-surface-container text-on-surface font-label-md text-label-md inline-flex flex-col sm:flex-row items-center justify-center gap-2 transition-colors shrink-0 cursor-pointer"
                  type="button"
                >
                  <span className="material-symbols-outlined text-[20px] text-outline">
                    calendar_month
                  </span>
                  <div className="flex flex-col text-left">
                    <span className="text-[11px] text-outline font-normal uppercase">Thời gian</span>
                    <span className="font-medium text-xs">
                      {timeFilter === 'all' ? 'Toàn bộ thời gian' : '25/10/2026 - Hôm nay'}
                    </span>
                  </div>
                  <span className="material-symbols-outlined text-[16px] text-outline">
                    arrow_drop_down
                  </span>
                </button>
              </div>
            </div>

            {/* Data Table Area */}
            <div className="w-full overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-container-low text-on-surface-variant font-label-sm text-label-sm uppercase tracking-wider text-xs font-semibold">
                    <th className="w-[11%] py-3.5 px-2.5 font-semibold whitespace-nowrap" scope="col">MÃ GD</th>
                    <th className="w-[16%] py-3.5 px-2.5 font-semibold whitespace-nowrap" scope="col">HỌC VIÊN</th>
                    <th className="w-[17%] py-3.5 px-2 font-semibold whitespace-nowrap" scope="col">KHÓA HỌC</th>
                    <th className="w-[11%] py-3.5 px-2 font-semibold whitespace-nowrap" scope="col">PHƯƠNG THỨC</th>
                    <th className="w-[11%] py-3.5 px-2 font-semibold text-right whitespace-nowrap" scope="col">SỐ TIỀN</th>
                    <th className="w-[12%] py-3.5 px-2 font-semibold whitespace-nowrap" scope="col">THỜI GIAN</th>
                    <th className="w-[11%] py-3.5 px-1.5 font-semibold text-center whitespace-nowrap" scope="col">TRẠNG THÁI</th>
                    <th className="w-[11%] py-3.5 px-2 font-bold text-center whitespace-nowrap text-primary bg-primary-fixed/20 border-l border-outline-variant/30" scope="col">THAO TÁC</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-surface-container-low font-body-md text-body-md text-on-surface text-xs">
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-outline">
                        <div className="inline-flex items-center gap-2">
                          <span className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></span>
                          <span>Đang tải danh sách giao dịch thanh toán...</span>
                        </div>
                      </td>
                    </tr>
                  ) : transactions.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-outline">
                        Không tìm thấy giao dịch nào phù hợp với bộ lọc.
                      </td>
                    </tr>
                  ) : (
                    transactions.map((tx) => (
                      <tr key={tx.paymentId} className="hover:bg-surface-container-low/40 transition-colors">
                        {/* Cột 1: MÃ GD */}
                        <td className="py-3 px-2.5 whitespace-nowrap">
                          <span className="font-semibold text-primary tracking-tight font-mono text-[12px]">
                            {tx.sysId || tx.orderId || `#TXN-${tx.paymentId}`}
                          </span>
                        </td>

                        {/* Cột 2: HỌC VIÊN */}
                        <td className="py-3 px-2.5">
                          <div className="flex flex-col min-w-0">
                            <span className="font-semibold text-on-surface truncate text-[13px]">
                              {tx.studentName}
                            </span>
                            <span className="font-body-sm text-[11px] text-outline truncate">
                              {tx.studentEmail}
                            </span>
                          </div>
                        </td>

                        {/* Cột 3: KHÓA HỌC */}
                        <td className="py-3 px-2">
                          <span className="font-medium text-on-surface block truncate text-[13px] max-w-[200px]" title={tx.courseName}>
                            {tx.courseName}
                          </span>
                        </td>

                        {/* Cột 4: PHƯƠNG THỨC */}
                        <td className="py-3 px-2 whitespace-nowrap">
                          {renderMethodBadge(tx.paymentMethod)}
                        </td>

                        {/* Cột 5: SỐ TIỀN */}
                        <td className="py-3 px-2 text-right whitespace-nowrap">
                          <span className="font-bold text-on-surface text-[13px]">
                            {formatCurrency(tx.amount)}
                          </span>
                        </td>

                        {/* Cột 6: THỜI GIAN */}
                        <td className="py-3 px-2 text-on-surface-variant font-body-sm text-[12px] whitespace-nowrap">
                          {formatDateTime(tx.createdAt)}
                        </td>

                        {/* Cột 7: TRẠNG THÁI */}
                        <td className="py-3 px-1.5 text-center whitespace-nowrap">
                          {renderStatusBadge(tx.status)}
                        </td>

                        {/* Cột 8: THAO TÁC */}
                        <td className="py-3 px-2 text-center whitespace-nowrap bg-primary-fixed/5 border-l border-outline-variant/30">
                          <div className="flex items-center justify-center gap-1">
                            {/* Nút Sửa */}
                            <button
                              onClick={() => handleOpenEditModal(tx)}
                              className="bg-blue-50 text-blue-600 border border-primary/20 hover:bg-primary hover:text-white rounded-lg px-2 py-1 font-medium inline-flex items-center gap-0.5 transition-all font-label-sm text-[11px] shadow-sm cursor-pointer"
                              title="Chỉnh sửa giao dịch"
                              type="button"
                            >
                              <span className="material-symbols-outlined text-[13px]">edit</span>
                              <span>Sửa</span>
                            </button>

                            {/* Nút Xem chi tiết */}
                            <button
                              onClick={() => handleOpenDetailModal(tx)}
                              className="h-7 w-7 rounded-lg inline-flex items-center justify-center text-on-surface-variant bg-surface-container-low hover:text-primary hover:bg-primary-fixed/50 transition-colors border border-outline-variant/40 cursor-pointer"
                              title="Xem chi tiết giao dịch"
                              type="button"
                            >
                              <span className="material-symbols-outlined text-[15px]">visibility</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Footer */}
            <div className="px-5 py-3.5 bg-surface-container-lowest flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-surface-container-low">
              <div className="font-body-sm text-body-sm text-outline text-xs">
                Đang xem <span className="font-semibold text-on-surface">{transactions.length > 0 ? page * pageSize + 1 : 0} - {Math.min((page + 1) * pageSize, totalElements)}</span> trên tổng số <span className="font-semibold text-on-surface">{totalElements}</span> giao dịch
              </div>

              <div className="flex items-center gap-1 overflow-hidden">
                {/* Prev Button */}
                <button
                  disabled={page === 0}
                  onClick={() => loadPayments(page - 1)}
                  className="h-8 w-8 rounded-lg flex items-center justify-center text-outline hover:text-on-surface hover:bg-surface-container-low transition-colors disabled:opacity-40 cursor-pointer"
                  type="button"
                >
                  <span className="material-symbols-outlined text-[18px]">chevron_left</span>
                </button>

                {/* Pages */}
                {Array.from({ length: totalPages }, (_, i) => i)
                  .filter((p) => p === 0 || p === totalPages - 1 || Math.abs(p - page) <= 1)
                  .map((p, idx, arr) => (
                    <React.Fragment key={p}>
                      {idx > 0 && arr[idx - 1] !== p - 1 && (
                        <span className="h-8 w-8 flex items-center justify-center text-outline font-label-sm text-label-sm text-xs">
                          ...
                        </span>
                      )}
                      <button
                        onClick={() => loadPayments(p)}
                        className={`h-8 w-8 rounded-lg font-label-sm text-label-sm font-semibold flex items-center justify-center shadow-sm text-xs cursor-pointer ${
                          page === p
                            ? 'bg-primary text-on-primary'
                            : 'text-on-surface hover:bg-surface-container-low transition-colors'
                        }`}
                        type="button"
                      >
                        {p + 1}
                      </button>
                    </React.Fragment>
                  ))}

                {/* Next Button */}
                <button
                  disabled={page >= totalPages - 1}
                  onClick={() => loadPayments(page + 1)}
                  className="h-8 w-8 rounded-lg flex items-center justify-center text-on-surface hover:bg-surface-container-low transition-colors disabled:opacity-40 cursor-pointer"
                  type="button"
                >
                  <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* =========================================================
          INTERACTIVE MODAL: CHI TIẾT GIAO DỊCH
      ========================================================= */}
      {detailModalOpen && detailTx && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm transition-opacity duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) setDetailModalOpen(false);
          }}
        >
          <div className="relative w-full max-w-2xl bg-surface-container-lowest rounded-2xl shadow-2xl flex flex-col overflow-hidden max-h-[90vh]">
            {/* Modal Header */}
            <div className="px-6 py-4.5 bg-surface-container-lowest flex items-center justify-between border-b border-surface-container-low">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-primary-fixed/50 flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined text-[20px]">receipt_long</span>
                </div>
                <div className="flex flex-col">
                  <span className="font-headline-sm text-headline-sm text-on-surface font-bold text-base">
                    Chi tiết giao dịch
                  </span>
                  <span className="font-label-sm text-label-sm text-primary font-semibold text-xs font-mono">
                    {detailTx.sysId || detailTx.orderId}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setDetailModalOpen(false)}
                className="h-8 w-8 rounded-lg flex items-center justify-center text-outline hover:text-on-surface hover:bg-surface-container-low transition-colors cursor-pointer"
                type="button"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {/* Modal Body (Scrollable) */}
            <div className="p-6 overflow-y-auto flex flex-col gap-6">
              {/* Status & Amount Banner */}
              <div className="p-4 rounded-xl bg-surface-container-low flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex flex-col">
                  <span className="font-body-sm text-body-sm text-outline text-xs">Tổng tiền giao dịch</span>
                  <span className="font-display-lg text-display-lg text-on-surface tracking-tight font-bold mt-0.5 text-xl">
                    {formatCurrency(detailTx.amount)}
                  </span>
                </div>
                <div>
                  {renderStatusBadge(detailTx.status)}
                </div>
              </div>

              {/* Khối 1: Thông tin thanh toán cổng */}
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px] text-primary">credit_card</span>
                  <h3 className="font-label-lg text-label-lg text-on-surface font-semibold uppercase tracking-wider text-xs">
                    Thông tin thanh toán cổng
                  </h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3.5 p-4 rounded-xl bg-surface-container-lowest border border-surface-container-low text-xs">
                  <div className="flex flex-col">
                    <span className="font-body-sm text-body-sm text-outline text-xs">Mã giao dịch hệ thống</span>
                    <span className="font-label-md text-label-md text-on-surface font-semibold mt-0.5 font-mono">
                      {detailTx.sysId || detailTx.orderId}
                    </span>
                  </div>
                  <div className="flex flex-col overflow-hidden">
                    <span className="font-body-sm text-body-sm text-outline text-xs">Mã giao dịch cổng (Partner TXN)</span>
                    <span className="font-label-md text-label-md text-on-surface font-mono font-medium mt-0.5">
                      {detailTx.gatewayTransactionId || 'Chưa cập nhật'}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="font-body-sm text-body-sm text-outline text-xs">Phương thức thanh toán</span>
                    <span className="font-label-md text-label-md text-on-surface font-semibold mt-0.5">
                      {detailTx.paymentMethod === 'ZaloPay' ? 'Ví điện tử ZaloPay' : detailTx.paymentMethod === 'MoMo' ? 'Ví điện tử MoMo' : detailTx.paymentMethod}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="font-body-sm text-body-sm text-outline text-xs">Thời gian khởi tạo</span>
                    <span className="font-body-md text-body-md text-on-surface mt-0.5">
                      {formatDateTime(detailTx.createdAt)}
                    </span>
                  </div>
                  <div className="flex flex-col sm:col-span-2">
                    <span className="font-body-sm text-body-sm text-outline text-xs">Thời gian đối soát cập nhật</span>
                    <span className="font-body-md text-body-md text-on-surface mt-0.5">
                      {formatDateTime(detailTx.updatedAt)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Khối 2: Thông tin Đơn hàng & Học viên */}
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px] text-primary">school</span>
                  <h3 className="font-label-lg text-label-lg text-on-surface font-semibold uppercase tracking-wider text-xs">
                    Thông tin đơn hàng &amp; Học viên
                  </h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3.5 p-4 rounded-xl bg-surface-container-lowest border border-surface-container-low text-xs">
                  <div className="flex flex-col">
                    <span className="font-body-sm text-body-sm text-outline text-xs">Mã đăng ký (Enrollment Code)</span>
                    <span className="font-label-md text-label-md text-primary font-semibold mt-0.5 font-mono">
                      {detailTx.enrollmentCode || 'ENR-2026-88129'}
                    </span>
                  </div>
                  <div className="flex flex-col overflow-hidden">
                    <span className="font-body-sm text-body-sm text-outline text-xs">Họ và tên học viên</span>
                    <span className="font-label-md text-label-md text-on-surface font-semibold mt-0.5">
                      {detailTx.studentName}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="font-body-sm text-body-sm text-outline text-xs">Email tài khoản</span>
                    <span className="font-body-md text-body-md text-on-surface mt-0.5">
                      {detailTx.studentEmail}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="font-body-sm text-body-sm text-outline text-xs">Số điện thoại liên hệ</span>
                    <span className="font-body-md text-body-md text-on-surface mt-0.5">
                      {detailTx.studentPhone || '0912 345 678'}
                    </span>
                  </div>
                  <div className="flex flex-col sm:col-span-2">
                    <span className="font-body-sm text-body-sm text-outline text-xs">Khóa học đăng ký</span>
                    <span className="font-label-md text-label-md text-on-surface font-semibold mt-0.5">
                      {detailTx.courseName}
                    </span>
                  </div>
                  <div className="flex flex-col sm:col-span-2">
                    <span className="font-body-sm text-body-sm text-outline text-xs">Giảng viên giảng dạy</span>
                    <span className="font-body-md text-body-md text-on-surface-variant mt-0.5">
                      {detailTx.instructorName || 'Trần Thị Thanh Lan'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-surface-container-low flex items-start gap-3">
                <span className="material-symbols-outlined text-[18px] text-outline shrink-0 mt-0.5">security</span>
                <span className="font-body-sm text-body-sm text-outline leading-relaxed text-xs">
                  Dữ liệu tài chính được mã hóa và bảo toàn nguyên vẹn từ API của Cổng thanh toán. Quản trị viên chỉ có quyền đối soát và ghi nhận nhật ký hệ thống.
                </span>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-surface-container-low flex items-center justify-between border-t border-surface-container-low">
              <span className="font-body-sm text-body-sm text-outline text-xs font-mono">
                Mã định danh nội bộ #TXN_SECURE_AUTH
              </span>
              <button
                onClick={() => setDetailModalOpen(false)}
                className="px-5 py-2 rounded-lg bg-surface-container-lowest hover:bg-surface-container text-on-surface font-label-md text-label-md transition-all shadow-sm cursor-pointer text-xs font-semibold"
                type="button"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          INTERACTIVE MODAL: CHỈNH SỬA THÔNG TIN GIAO DỊCH
      ========================================================= */}
      {editModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm transition-opacity duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) setEditModalOpen(false);
          }}
        >
          <div className="relative w-full max-w-2xl bg-surface-container-lowest rounded-2xl shadow-2xl flex flex-col overflow-hidden max-h-[92vh]">
            <div className="px-6 py-4 bg-surface-container-lowest flex items-center justify-between border-b border-surface-container-low">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-primary-fixed/50 flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined text-[20px]">edit_document</span>
                </div>
                <div className="flex flex-col">
                  <span className="font-headline-sm text-headline-sm text-on-surface font-bold text-base">
                    Chỉnh sửa thông tin giao dịch
                  </span>
                  <span className="font-body-sm text-body-sm text-outline text-xs">
                    Cập nhật trạng thái đối soát và thông tin học viên
                  </span>
                </div>
              </div>
              <button
                onClick={() => setEditModalOpen(false)}
                className="h-8 w-8 rounded-lg flex items-center justify-center text-outline hover:text-on-surface hover:bg-surface-container-low transition-colors cursor-pointer"
                type="button"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <form className="p-6 overflow-y-auto flex flex-col gap-4 text-xs" onSubmit={handleSaveTransaction}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Mã giao dịch */}
                <div className="flex flex-col gap-1.5 sm:col-span-2">
                  <label className="font-label-md text-label-md text-on-surface font-medium flex items-center justify-between">
                    <span>Mã giao dịch</span>
                    <span className="font-body-sm text-body-sm text-outline font-normal">(Không được phép thay đổi mã giao dịch)</span>
                  </label>
                  <input
                    value={editForm.sysId}
                    readOnly
                    className="h-10 px-3.5 rounded-lg bg-surface-container-low text-outline font-mono text-body-md border border-outline-variant/30 cursor-not-allowed"
                    type="text"
                  />
                </div>

                {/* Họ tên học viên */}
                <div className="flex flex-col gap-1.5">
                  <label className="font-label-md text-label-md text-on-surface font-medium">Họ tên học viên</label>
                  <input
                    value={editForm.studentName}
                    onChange={(e) => setEditForm({ ...editForm, studentName: e.target.value })}
                    required
                    className="h-10 px-3.5 rounded-lg bg-surface-container-lowest text-on-surface font-body-md border border-outline-variant/40 focus:outline-none focus:border-primary-container focus:ring-2 focus:ring-primary-container/20"
                    type="text"
                  />
                </div>

                {/* Email học viên */}
                <div className="flex flex-col gap-1.5">
                  <label className="font-label-md text-label-md text-on-surface font-medium">Email học viên</label>
                  <input
                    value={editForm.studentEmail}
                    onChange={(e) => setEditForm({ ...editForm, studentEmail: e.target.value })}
                    required
                    className="h-10 px-3.5 rounded-lg bg-surface-container-lowest text-on-surface font-body-md border border-outline-variant/40 focus:outline-none focus:border-primary-container focus:ring-2 focus:ring-primary-container/20"
                    type="email"
                  />
                </div>

                {/* Khóa học đăng ký */}
                <div className="flex flex-col gap-1.5 sm:col-span-2">
                  <label className="font-label-md text-label-md text-on-surface font-medium">Khóa học đăng ký</label>
                  <input
                    value={editForm.courseName}
                    onChange={(e) => setEditForm({ ...editForm, courseName: e.target.value })}
                    className="h-10 px-3.5 rounded-lg bg-surface-container-lowest text-on-surface font-body-md border border-outline-variant/40 focus:outline-none focus:border-primary-container focus:ring-2 focus:ring-primary-container/20"
                    type="text"
                  />
                </div>

                {/* Phương thức thanh toán */}
                <div className="flex flex-col gap-1.5">
                  <label className="font-label-md text-label-md text-on-surface font-medium">Phương thức thanh toán</label>
                  <div className="relative">
                    <select
                      value={editForm.paymentMethod}
                      onChange={(e) => setEditForm({ ...editForm, paymentMethod: e.target.value })}
                      className="w-full appearance-none h-10 pl-3.5 pr-9 rounded-lg bg-surface-container-lowest text-on-surface font-body-md border border-outline-variant/40 focus:outline-none focus:border-primary-container focus:ring-2 focus:ring-primary-container/20 cursor-pointer"
                    >
                      <option value="MoMo">Ví điện tử MoMo</option>
                      <option value="ZaloPay">Ví điện tử ZaloPay</option>
                    </select>
                    <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-outline text-[18px] pointer-events-none">
                      expand_more
                    </span>
                  </div>
                </div>

                {/* Số tiền giao dịch */}
                <div className="flex flex-col gap-1.5">
                  <label className="font-label-md text-label-md text-on-surface font-medium">Số tiền giao dịch</label>
                  <input
                    value={editForm.amount}
                    onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })}
                    required
                    className="h-10 px-3.5 rounded-lg bg-surface-container-lowest text-on-surface font-headline-sm text-[16px] font-bold border border-outline-variant/40 focus:outline-none focus:border-primary-container focus:ring-2 focus:ring-primary-container/20"
                    type="text"
                  />
                </div>

                {/* Trạng thái giao dịch */}
                <div className="flex flex-col gap-1.5 sm:col-span-2">
                  <label className="font-label-md text-label-md text-on-surface font-medium">Trạng thái giao dịch</label>
                  <div className="relative">
                    <select
                      value={editForm.status}
                      onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                      className="w-full appearance-none h-10 pl-3.5 pr-9 rounded-lg bg-surface-container-lowest text-on-surface font-label-md text-label-md font-semibold border border-outline-variant/40 focus:outline-none focus:border-primary-container focus:ring-2 focus:ring-primary-container/20 cursor-pointer"
                    >
                      <option value="pending">Đang chờ duyệt</option>
                      <option value="success">Thành công</option>
                      <option value="failed">Thất bại / Hủy</option>
                    </select>
                    <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-outline text-[18px] pointer-events-none">
                      expand_more
                    </span>
                  </div>
                </div>
              </div>

              {/* Form Buttons */}
              <div className="px-6 py-4 bg-surface-container-low flex items-center justify-end gap-3 -mx-6 -mb-6 mt-2 border-t border-surface-container-low">
                <button
                  onClick={() => setEditModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-surface-container-lowest hover:bg-surface-container text-on-surface font-label-md text-label-md transition-all shadow-sm cursor-pointer font-semibold text-xs"
                  type="button"
                >
                  Hủy
                </button>
                <button
                  disabled={saving}
                  className="px-5 py-2 rounded-lg bg-primary text-white font-label-md text-label-md transition-all shadow-sm hover:bg-primary/90 flex items-center gap-1.5 cursor-pointer font-semibold text-xs disabled:opacity-50"
                  type="submit"
                >
                  {saving ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      <span>Đang lưu...</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[18px]">check</span>
                      <span>Lưu thay đổi</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================
          TOAST THÔNG BÁO TÙY CHỈNH THEO MẪU
      ========================================================= */}
      <div
        className={`fixed bottom-6 right-6 z-50 transform transition-all duration-300 ${
          showToastAlert
            ? 'translate-y-0 opacity-100 pointer-events-auto'
            : 'translate-y-20 opacity-0 pointer-events-none'
        }`}
      >
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-on-background text-white shadow-2xl border border-white/10">
          <span className="material-symbols-outlined text-[20px] text-tertiary-fixed">
            check_circle
          </span>
          <span className="font-body-md text-body-md font-medium text-xs">
            {toastMessage}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ManagePayments;
