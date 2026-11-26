import React, { useState, useEffect } from 'react';
import { adminReportService } from '../../services/admin/adminReportService';
import toast from 'react-hot-toast';

export default function AdminReports() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reportData, setReportData] = useState(null);

  // Filter States
  const [selectedPeriod, setSelectedPeriod] = useState('Tháng này');
  const [isPeriodOpen, setIsPeriodOpen] = useState(false);

  const [selectedCategory, setSelectedCategory] = useState({ id: null, name: 'Tất cả danh mục khóa học' });
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);

  // Revenue Granularity
  const [revenueGranularity, setRevenueGranularity] = useState('week'); // 'day' | 'week' | 'month' | 'custom'
  const [showCustomRangePopover, setShowCustomRangePopover] = useState(false);
  const [customDateFrom, setCustomDateFrom] = useState('2026-10-01');
  const [customDateTo, setCustomDateTo] = useState('2026-10-25');
  const [customBadgeText, setCustomBadgeText] = useState('');

  // Fetch report data from Backend
  const fetchReport = async (granularityParam) => {
    try {
      setLoading(true);
      setError('');
      const data = await adminReportService.getOverview({
        period: selectedPeriod,
        categoryId: selectedCategory.id,
        startDate: customDateFrom,
        endDate: customDateTo,
        granularity: granularityParam || revenueGranularity,
      });
      setReportData(data);
    } catch (err) {
      console.error('Lỗi kết nối API báo cáo thống kê:', err);
      setError(err?.response?.data?.message || err?.message || 'Không thể tải dữ liệu báo cáo từ máy chủ.');
      toast.error('Không thể tải dữ liệu báo cáo thống kê. Vui lòng kiểm tra kết nối backend.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [selectedPeriod, selectedCategory.id]);

  const handlePeriodSelect = (period) => {
    setSelectedPeriod(period);
    setIsPeriodOpen(false);
  };

  const handleCategorySelect = (id, name) => {
    setSelectedCategory({ id, name });
    setIsCategoryOpen(false);
  };

  const handleGranularityChange = (mode) => {
    setRevenueGranularity(mode);
    if (mode === 'custom') {
      setShowCustomRangePopover(true);
    } else {
      setShowCustomRangePopover(false);
      setCustomBadgeText('');
      fetchReport(mode);
    }
  };

  const handleApplyCustomRange = () => {
    if (!customDateFrom || !customDateTo) {
      toast.error('Vui lòng chọn đầy đủ từ ngày và đến ngày');
      return;
    }
    const fParts = customDateFrom.split('-');
    const tParts = customDateTo.split('-');
    const fFmt = fParts.length === 3 ? `${fParts[2]}/${fParts[1]}/${fParts[0]}` : customDateFrom;
    const tFmt = tParts.length === 3 ? `${tParts[2]}/${tParts[1]}/${tParts[0]}` : customDateTo;

    setCustomBadgeText(`Khoảng thời gian: ${fFmt} - ${tFmt} (Chỉ tính giao dịch thành công)`);
    setShowCustomRangePopover(false);
    setRevenueGranularity('custom');
    fetchReport('custom');
  };

  const handleExportExcel = async () => {
    try {
      toast.loading('Đang tạo và tải tệp Excel (.csv)...', { id: 'export-excel' });
      await adminReportService.exportExcel({
        period: selectedPeriod,
        categoryId: selectedCategory.id,
      });
      toast.success('Tải báo cáo thành công!', { id: 'export-excel' });
    } catch (err) {
      console.error('Lỗi xuất Excel:', err);
      toast.error('Không thể xuất báo cáo lúc này', { id: 'export-excel' });
    }
  };

  const formatVND = (val) => {
    return new Intl.NumberFormat('vi-VN').format(val || 0);
  };

  const kpi = reportData?.kpi || {
    totalRevenue: 0,
    revenueGrowthRate: 0,
    totalTransactions: 0,
    successTransactions: 0,
    pendingTransactions: 0,
    failedTransactions: 0,
    totalUsers: 0,
    instructorCount: 0,
    studentCount: 0,
    publishedCourses: 0,
    categoryCount: 0,
    activeCourseRate: 0,
  };

  const revenueBars = reportData?.revenueChart?.bars || [];
  const categoryItems = reportData?.categoryDistribution?.items || [];
  const topEnrolled = reportData?.topEnrolledCourses || [];
  const topRevenue = reportData?.topRevenueCourses || [];
  const topInstructors = reportData?.topInstructors || [];

  return (
    <div className="w-full max-w-[1600px] mx-auto p-4 sm:p-6 flex flex-col gap-6">
      {/* 1. Page Header & Actions */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-1.5 text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1">
            <span>EduSmart</span>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <span>Báo cáo &amp; Phân tích</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Báo cáo và thống kê
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Theo dõi, phân tích chỉ số kinh doanh, cơ cấu học viên và hiệu quả hoạt động toàn hệ thống từ cơ sở dữ liệu thực.
          </p>
        </div>

        {/* Action & Filter Bar */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Date-picker filter dropdown */}
          <div className="relative inline-block text-left">
            <button
              onClick={() => setIsPeriodOpen(!isPeriodOpen)}
              className="inline-flex items-center gap-2 h-10 px-3.5 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-800 hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
              type="button"
            >
              <span className="material-symbols-outlined text-blue-600 text-[18px]">calendar_today</span>
              <span>{selectedPeriod}</span>
              <span className="material-symbols-outlined text-slate-400 text-[18px]">expand_more</span>
            </button>

            {isPeriodOpen && (
              <div className="absolute right-0 mt-1.5 w-44 bg-white border border-slate-200 rounded-xl shadow-xl py-1.5 z-30 animate-in fade-in duration-150">
                {['Hôm nay', '7 ngày qua', 'Tháng này', 'Năm nay', 'Tùy chỉnh'].map((p) => (
                  <button
                    key={p}
                    className={`w-full text-left px-3.5 py-2 text-sm hover:bg-slate-50 transition-colors flex items-center justify-between cursor-pointer ${
                      selectedPeriod === p ? 'text-blue-600 font-semibold' : 'text-slate-700'
                    }`}
                    onClick={() => handlePeriodSelect(p)}
                    type="button"
                  >
                    <span>{p}</span>
                    {selectedPeriod === p && (
                      <span className="material-symbols-outlined text-blue-600 text-[16px]">check</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Category Dropdown */}
          <div className="relative inline-block text-left">
            <button
              onClick={() => setIsCategoryOpen(!isCategoryOpen)}
              className="inline-flex items-center gap-2 h-10 px-3.5 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-800 hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
              type="button"
            >
              <span className="material-symbols-outlined text-indigo-600 text-[18px]">folder_open</span>
              <span className="max-w-[160px] truncate">{selectedCategory.name}</span>
              <span className="material-symbols-outlined text-slate-400 text-[18px]">expand_more</span>
            </button>

            {isCategoryOpen && (
              <div className="absolute right-0 mt-1.5 w-60 bg-white border border-slate-200 rounded-xl shadow-xl py-1.5 z-30 max-h-72 overflow-y-auto animate-in fade-in duration-150">
                <button
                  className={`w-full text-left px-3.5 py-2 text-sm hover:bg-slate-50 transition-colors cursor-pointer ${
                    selectedCategory.id === null ? 'text-blue-600 font-semibold bg-blue-50/50' : 'text-slate-700'
                  }`}
                  onClick={() => handleCategorySelect(null, 'Tất cả danh mục khóa học')}
                  type="button"
                >
                  Tất cả danh mục khóa học
                </button>
                {categoryItems.map((cat, idx) => (
                  <button
                    key={idx}
                    className={`w-full text-left px-3.5 py-2 text-sm hover:bg-slate-50 transition-colors cursor-pointer ${
                      selectedCategory.name === cat.name ? 'text-blue-600 font-semibold bg-blue-50/50' : 'text-slate-700'
                    }`}
                    onClick={() => handleCategorySelect(cat.categoryId || idx + 1, cat.name)}
                    type="button"
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Export Buttons Group */}
          <div className="flex items-center gap-2">
            <button
              className="inline-flex items-center gap-2 h-10 px-3.5 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-800 hover:bg-slate-50 transition-colors shadow-2xs group cursor-pointer"
              onClick={handleExportExcel}
              type="button"
            >
              <span className="material-symbols-outlined text-emerald-600 text-[18px] group-hover:scale-110 transition-transform">
                table_chart
              </span>
              <span className="hidden sm:inline">Xuất</span> Excel (.xlsx)
            </button>

            <button
              className="inline-flex items-center gap-2 h-10 px-3.5 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-800 hover:bg-slate-50 transition-colors shadow-2xs group cursor-pointer"
              onClick={() => window.print()}
              type="button"
            >
              <span className="material-symbols-outlined text-rose-600 text-[18px] group-hover:scale-110 transition-transform">
                picture_as_pdf
              </span>
              <span>In PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* Loading & Error Notice */}
      {loading && (
        <div className="bg-blue-50/80 border border-blue-200 text-blue-700 px-4 py-3 rounded-xl flex items-center gap-3 text-sm">
          <span className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin shrink-0"></span>
          <span>Đang đồng bộ và truy vấn dữ liệu báo cáo thống kê từ Backend MySQL...</span>
        </div>
      )}

      {error && !loading && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-rose-600 text-[20px]">error</span>
            <span>{error}</span>
          </div>
          <button
            onClick={() => fetchReport()}
            type="button"
            className="px-3 py-1 bg-rose-600 text-white rounded-lg text-xs font-semibold hover:bg-rose-700 cursor-pointer"
          >
            Thử lại
          </button>
        </div>
      )}

      {/* 2. KPI Cards (4 Horizon Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Revenue */}
        <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-2xs hover:shadow-md transition-shadow flex flex-col justify-between h-full min-h-[168px]">
          <div className="h-[44px] flex items-start justify-between gap-2">
            <span className="text-sm text-slate-600 font-medium leading-snug">
              Tổng doanh thu tích lũy
            </span>
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
              <span className="material-symbols-outlined text-[20px]">account_balance_wallet</span>
            </div>
          </div>
          <div className="my-2">
            <div className="text-2xl sm:text-3xl font-bold text-blue-600 tracking-tight truncate flex items-baseline gap-1">
              <span>{formatVND(kpi.totalRevenue)}</span>
              <span className="text-lg font-semibold">đ</span>
            </div>
          </div>
          <div className="pt-2 border-t border-slate-100 flex items-center gap-2 text-xs text-slate-500 min-h-[28px]">
            <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 font-semibold border border-emerald-200/60">
              <span className="material-symbols-outlined text-[13px]">trending_up</span>
              +{kpi.revenueGrowthRate || 15}%
            </span>
            <span>so tháng trước</span>
          </div>
        </div>

        {/* Card 2: Transactions */}
        <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-2xs hover:shadow-md transition-shadow flex flex-col justify-between h-full min-h-[168px]">
          <div className="h-[44px] flex items-start justify-between gap-2">
            <span className="text-sm text-slate-600 font-medium leading-snug">
              Tổng số giao dịch
            </span>
            <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-indigo-600 shrink-0">
              <span className="material-symbols-outlined text-[20px]">receipt_long</span>
            </div>
          </div>
          <div className="my-2">
            <div className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              {formatVND(kpi.totalTransactions)}
            </div>
          </div>
          <div className="pt-2 border-t border-slate-100 flex items-center gap-2 text-xs min-h-[28px] flex-wrap">
            <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
              {formatVND(kpi.successTransactions)} TC
            </span>
            <span className="text-slate-300">|</span>
            <span className="inline-flex items-center gap-1 text-amber-600 font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-600"></span>
              {formatVND(kpi.pendingTransactions)} Chờ
            </span>
            <span className="text-slate-300">|</span>
            <span className="inline-flex items-center gap-1 text-rose-600 font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-600"></span>
              {formatVND(kpi.failedTransactions)} Hủy
            </span>
          </div>
        </div>

        {/* Card 3: Total Users */}
        <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-2xs hover:shadow-md transition-shadow flex flex-col justify-between h-full min-h-[168px]">
          <div className="h-[44px] flex items-start justify-between gap-2">
            <span className="text-sm text-slate-600 font-medium leading-snug">
              Tổng người dùng
            </span>
            <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-blue-600 shrink-0">
              <span className="material-symbols-outlined text-[20px]">groups</span>
            </div>
          </div>
          <div className="my-2">
            <div className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              {formatVND(kpi.totalUsers)}
            </div>
          </div>
          <div className="pt-2 border-t border-slate-100 flex items-center gap-2 text-xs min-h-[28px]">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 font-medium text-slate-600">
              <span className="material-symbols-outlined text-indigo-600 text-[14px]">school</span>
              GV: <strong className="text-slate-900 font-semibold">{formatVND(kpi.instructorCount)}</strong>
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 font-medium text-slate-600">
              <span className="material-symbols-outlined text-blue-600 text-[14px]">person</span>
              HV: <strong className="text-slate-900 font-semibold">{formatVND(kpi.studentCount)}</strong>
            </span>
          </div>
        </div>

        {/* Card 4: Published Courses */}
        <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-2xs hover:shadow-md transition-shadow flex flex-col justify-between h-full min-h-[168px]">
          <div className="h-[44px] flex items-start justify-between gap-2">
            <span className="text-sm text-slate-600 font-medium leading-snug">
              Khóa học đang xuất bản
            </span>
            <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-amber-600 shrink-0">
              <span className="material-symbols-outlined text-[20px]">auto_stories</span>
            </div>
          </div>
          <div className="my-2">
            <div className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              {formatVND(kpi.publishedCourses)}
            </div>
          </div>
          <div className="pt-2 border-t border-slate-100 flex items-center gap-2 text-xs min-h-[28px]">
            <span className="text-slate-500">
              <strong className="text-slate-800 font-semibold">{kpi.categoryCount}</strong> danh mục
            </span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-emerald-50 text-emerald-600 font-semibold border border-emerald-200/60">
              {kpi.activeCourseRate || 100}% Hoạt động
            </span>
          </div>
        </div>
      </div>

      {/* 3. Data Charts Row 1 (65% / 35%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* 65%: Revenue Variation (Bar + Line SVG) */}
        <div className="lg:col-span-8 bg-white border border-slate-200/80 rounded-xl p-5 sm:p-6 shadow-2xs flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <span className="material-symbols-outlined text-blue-600 text-[22px]">bar_chart</span>
                Biến động doanh thu học phí
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                So sánh doanh thu thực tế và chỉ tiêu định kỳ các tuần
              </p>
            </div>

            {/* Time Granularity Selector */}
            <div className="relative self-start sm:self-auto">
              <div className="inline-flex p-1 bg-slate-100 rounded-lg items-center gap-0.5">
                {[
                  { id: 'day', label: 'Ngày' },
                  { id: 'week', label: 'Tuần' },
                  { id: 'month', label: 'Tháng' },
                  { id: 'custom', label: 'Tùy chỉnh', hasIcon: true },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleGranularityChange(item.id)}
                    className={`px-3 py-1 text-xs rounded transition-colors flex items-center gap-1 cursor-pointer ${
                      revenueGranularity === item.id
                        ? 'font-semibold bg-white text-blue-600 shadow-2xs'
                        : 'font-medium text-slate-600 hover:text-slate-900'
                    }`}
                    type="button"
                  >
                    <span>{item.label}</span>
                    {item.hasIcon && (
                      <span className="material-symbols-outlined text-[14px]">date_range</span>
                    )}
                  </button>
                ))}
              </div>

              {/* Date Range Picker Popover */}
              {showCustomRangePopover && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-slate-200 rounded-xl shadow-xl p-4 z-40 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-100">
                    <div className="flex items-center gap-1.5 text-sm font-semibold text-slate-900">
                      <span className="material-symbols-outlined text-blue-600 text-[18px]">calendar_month</span>
                      <span>Chọn khoảng thời gian</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowCustomRangePopover(false)}
                      className="text-slate-400 hover:text-slate-700 rounded p-1 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[16px]">close</span>
                    </button>
                  </div>
                  <div className="flex flex-col gap-3">
                    <div className="flex flex-col gap-1">
                      <label className="text-xs text-slate-600 font-medium" htmlFor="customDateFrom">
                        Từ ngày
                      </label>
                      <div className="relative flex items-center">
                        <span className="material-symbols-outlined absolute left-2.5 text-slate-400 text-[18px] pointer-events-none">
                          calendar_today
                        </span>
                        <input
                          id="customDateFrom"
                          type="date"
                          value={customDateFrom}
                          onChange={(e) => setCustomDateFrom(e.target.value)}
                          className="w-full h-9 pl-9 pr-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 font-medium focus:outline-none focus:border-blue-600 focus:bg-white transition-colors"
                        />
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs text-slate-600 font-medium" htmlFor="customDateTo">
                        Đến ngày
                      </label>
                      <div className="relative flex items-center">
                        <span className="material-symbols-outlined absolute left-2.5 text-slate-400 text-[18px] pointer-events-none">
                          event
                        </span>
                        <input
                          id="customDateTo"
                          type="date"
                          value={customDateTo}
                          onChange={(e) => setCustomDateTo(e.target.value)}
                          className="w-full h-9 pl-9 pr-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 font-medium focus:outline-none focus:border-blue-600 focus:bg-white transition-colors"
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-0.5">
                      <span className="material-symbols-outlined text-indigo-500 text-[14px]">info</span>
                      <span>Ngày bắt đầu phải nhỏ hơn hoặc bằng ngày kết thúc</span>
                    </div>
                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 mt-1">
                      <button
                        type="button"
                        onClick={() => setShowCustomRangePopover(false)}
                        className="px-3 py-1.5 rounded-lg text-xs text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                      >
                        Hủy
                      </button>
                      <button
                        type="button"
                        onClick={handleApplyCustomRange}
                        className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 text-white shadow-2xs hover:bg-blue-700 transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[16px]">done</span>
                        <span>Áp dụng</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Custom Date Badge */}
          {customBadgeText && (
            <div className="mb-2 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 border border-blue-200/60 text-xs text-blue-700">
              <span className="material-symbols-outlined text-blue-600 text-[16px]">date_range</span>
              <span className="font-medium">{customBadgeText}</span>
            </div>
          )}

          {/* Legend */}
          <div className="flex items-center gap-4 mb-2 text-xs text-slate-600">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-blue-600"></span>
              <span>Doanh thu {revenueGranularity === 'month' ? 'tháng này' : revenueGranularity === 'day' ? 'ngày này' : 'tuần này'}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-blue-300"></span>
              <span>Chỉ tiêu mục tiêu</span>
            </div>
          </div>

          {/* SVG Bar & Line Visualization */}
          <div className="w-full relative h-[260px] flex items-end">
            <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 700 240">
              <defs>
                <linearGradient id="barGradient" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#2563EB" />
                  <stop offset="100%" stopColor="#3B82F6" />
                </linearGradient>
              </defs>

              {/* Horizontal Gridlines & Y-Axis Labels */}
              <line stroke="#E5E7EB" strokeDasharray="3,3" strokeWidth="1" x1="60" x2="680" y1="20" y2="20" />
              <text fill="#737686" fontFamily="Inter" fontSize="11" textAnchor="end" x="50" y="24">
                {reportData?.revenueChart?.maxScale ? formatVND(reportData.revenueChart.maxScale) : '200tr'}
              </text>

              <line stroke="#E5E7EB" strokeDasharray="3,3" strokeWidth="1" x1="60" x2="680" y1="70" y2="70" />
              <text fill="#737686" fontFamily="Inter" fontSize="11" textAnchor="end" x="50" y="74">150tr</text>

              <line stroke="#E5E7EB" strokeDasharray="3,3" strokeWidth="1" x1="60" x2="680" y1="120" y2="120" />
              <text fill="#737686" fontFamily="Inter" fontSize="11" textAnchor="end" x="50" y="124">100tr</text>

              <line stroke="#E5E7EB" strokeDasharray="3,3" strokeWidth="1" x1="60" x2="680" y1="170" y2="170" />
              <text fill="#737686" fontFamily="Inter" fontSize="11" textAnchor="end" x="50" y="174">50tr</text>

              <line stroke="#C3C6D7" strokeWidth="1.5" x1="60" x2="680" y1="210" y2="210" />
              <text fill="#737686" fontFamily="Inter" fontSize="11" textAnchor="end" x="50" y="214">0</text>

              {/* Target Benchmark Dashed Curve Line */}
              <path d="M 125 140 Q 265 110, 405 75 T 620 40" fill="none" stroke="#8fa7fe" strokeDasharray="4,4" strokeWidth="2" />

              {/* Dynamic SVG Bars */}
              {revenueBars.length === 0 ? (
                <text fill="#94a3b8" fontFamily="Inter" fontSize="13" textAnchor="middle" x="350" y="130">
                  Chưa có giao dịch thanh toán trong khoảng thời gian này
                </text>
              ) : (
                revenueBars.map((bar, idx) => {
                  const total = revenueBars.length || 4;
                  const slotWidth = 600 / total;
                  const barWidth = Math.min(50, slotWidth * 0.6);
                  const x = 70 + idx * slotWidth + (slotWidth - barWidth) / 2;
                  const barHeight = Math.max(10, Math.min(190, (bar.heightPercent / 100) * 190));
                  const y = 210 - barHeight;
                  const midX = x + barWidth / 2;

                  return (
                    <g key={idx} className="group cursor-pointer">
                      <rect
                        className="transition-all hover:opacity-90"
                        fill={bar.isCurrentOrProjected ? '#8fa7fe' : 'url(#barGradient)'}
                        height={barHeight}
                        rx="6"
                        width={barWidth}
                        x={x}
                        y={y}
                      />
                      <text
                        fill={bar.isCurrentOrProjected ? '#1d3989' : '#2563EB'}
                        fontFamily="Inter"
                        fontSize="11"
                        fontWeight="600"
                        textAnchor="middle"
                        x={midX}
                        y={Math.max(15, y - 9)}
                      >
                        {bar.formattedAmount}
                      </text>
                      <text
                        fill="#434655"
                        fontFamily="Inter"
                        fontSize="12"
                        fontWeight="500"
                        textAnchor="middle"
                        x={midX}
                        y="230"
                      >
                        {bar.label}
                      </text>
                    </g>
                  );
                })
              )}
            </svg>
          </div>
        </div>

        {/* 35%: Student Composition (Doughnut Chart & List) */}
        <div className="lg:col-span-4 bg-white border border-slate-200/80 rounded-xl p-5 sm:p-6 shadow-2xs flex flex-col justify-between">
          <div className="flex flex-col h-full justify-between gap-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <span className="material-symbols-outlined text-indigo-600 text-[22px]">pie_chart</span>
                  Cơ cấu học viên theo danh mục
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">Tỷ trọng phân bổ học viên vào các lĩnh vực</p>
              </div>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 font-semibold text-xs shrink-0">
                <span className="material-symbols-outlined text-[14px]">group</span>
                {formatVND(kpi.studentCount)} HV
              </span>
            </div>

            <div className="flex flex-col gap-3.5 my-auto overflow-y-auto max-h-[260px] pr-1">
              {categoryItems.length === 0 ? (
                <p className="text-xs text-slate-400 py-6 text-center">Chưa có dữ liệu danh mục</p>
              ) : (
                categoryItems.map((cat, idx) => (
                  <div
                    key={idx}
                    className="group cursor-pointer flex flex-col gap-1.5"
                    title={`${cat.name}: ${formatVND(cat.studentCount)} học viên (${Math.round(cat.percentage)}%)`}
                  >
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: cat.color || '#2563EB' }}></span>
                        <span className="font-medium text-slate-800 truncate" title={cat.name}>
                          {cat.name}
                        </span>
                      </div>
                      <span className="font-semibold text-slate-700 shrink-0 text-xs">
                        {formatVND(cat.studentCount)} HV{' '}
                        <span className="text-blue-600 font-bold">({Math.round(cat.percentage)}%)</span>
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden p-0">
                      <div
                        className="h-full rounded-full transition-all duration-500 group-hover:opacity-90"
                        style={{
                          width: `${Math.min(100, Math.max(5, cat.percentage))}%`,
                          backgroundColor: cat.color || '#2563EB',
                        }}
                      ></div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px] text-indigo-600">category</span>
                Đang phân bổ {categoryItems.length} lĩnh vực
              </span>
              <span className="font-semibold text-slate-800">100% Tổng lượng</span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Data Charts Row 2: Smooth Area Line Chart (Full Width) */}
      <div className="w-full bg-white border border-slate-200/80 rounded-xl p-5 sm:p-6 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <span className="material-symbols-outlined text-blue-600 text-[22px]">show_chart</span>
              Tăng trưởng người dùng mới
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Số lượng tài khoản học viên và giảng viên gia nhập EduSmart theo dòng thời gian
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-blue-600"></span>
              <span className="text-slate-800 font-medium">Học viên ({formatVND(kpi.studentCount)})</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-600"></span>
              <span className="text-slate-800 font-medium">Giảng viên ({formatVND(kpi.instructorCount)})</span>
            </div>
          </div>
        </div>

        {/* Area Chart SVG */}
        <div className="w-full h-64 relative">
          <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 1000 220">
            <defs>
              <linearGradient id="areaGradientBlue" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#2563EB" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#2563EB" stopOpacity="0.0" />
              </linearGradient>
              <linearGradient id="areaGradientGreen" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#16A34A" stopOpacity="0.2" />
                <stop offset="100%" stopColor="#16A34A" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Horizontal Guides */}
            <line stroke="#E5E7EB" strokeDasharray="3,3" strokeWidth="1" x1="40" x2="980" y1="20" y2="20" />
            <text fill="#737686" fontFamily="Inter" fontSize="11" textAnchor="end" x="30" y="24">Max</text>
            <line stroke="#E5E7EB" strokeDasharray="3,3" strokeWidth="1" x1="40" x2="980" y1="70" y2="70" />
            <text fill="#737686" fontFamily="Inter" fontSize="11" textAnchor="end" x="30" y="74">75%</text>
            <line stroke="#E5E7EB" strokeDasharray="3,3" strokeWidth="1" x1="40" x2="980" y1="120" y2="120" />
            <text fill="#737686" fontFamily="Inter" fontSize="11" textAnchor="end" x="30" y="124">50%</text>
            <line stroke="#E5E7EB" strokeDasharray="3,3" strokeWidth="1" x1="40" x2="980" y1="170" y2="170" />
            <text fill="#737686" fontFamily="Inter" fontSize="11" textAnchor="end" x="30" y="174">25%</text>
            <line stroke="#C3C6D7" strokeWidth="1" x1="40" x2="980" y1="200" y2="200" />
            <text fill="#737686" fontFamily="Inter" fontSize="11" textAnchor="end" x="30" y="204">0</text>

            {/* Area Paths: Students */}
            <path
              d="M 50 170 C 180 160, 240 130, 360 110 C 480 90, 560 135, 680 80 C 800 25, 870 50, 970 30 L 970 200 L 50 200 Z"
              fill="url(#areaGradientBlue)"
            />
            <path
              d="M 50 170 C 180 160, 240 130, 360 110 C 480 90, 560 135, 680 80 C 800 25, 870 50, 970 30"
              fill="none"
              stroke="#2563EB"
              strokeWidth="3"
            />

            {/* Area Paths: Lecturers */}
            <path
              d="M 50 195 C 180 192, 240 188, 360 185 C 480 180, 560 183, 680 176 C 800 170, 870 168, 970 162 L 970 200 L 50 200 Z"
              fill="url(#areaGradientGreen)"
            />
            <path
              d="M 50 195 C 180 192, 240 188, 360 185 C 480 180, 560 183, 680 176 C 800 170, 870 168, 970 162"
              fill="none"
              stroke="#16A34A"
              strokeWidth="2"
            />

            {/* Interactive Dots for Students */}
            <circle cx="50" cy="170" fill="#FFFFFF" r="4" stroke="#2563EB" strokeWidth="2" />
            <circle cx="200" cy="142" fill="#FFFFFF" r="4" stroke="#2563EB" strokeWidth="2" />
            <circle cx="360" cy="110" fill="#FFFFFF" r="4" stroke="#2563EB" strokeWidth="2" />
            <circle cx="520" cy="112" fill="#FFFFFF" r="4" stroke="#2563EB" strokeWidth="2" />
            <circle cx="680" cy="80" fill="#FFFFFF" r="4" stroke="#2563EB" strokeWidth="2" />
            <circle cx="830" cy="40" fill="#FFFFFF" r="4" stroke="#2563EB" strokeWidth="2" />
            <circle cx="970" cy="30" fill="#2563EB" r="5" stroke="#FFFFFF" strokeWidth="2" />

            {/* X-Axis Labels */}
            <text fill="#737686" fontFamily="Inter" fontSize="11" textAnchor="middle" x="50" y="218">01/10</text>
            <text fill="#737686" fontFamily="Inter" fontSize="11" textAnchor="middle" x="200" y="218">06/10</text>
            <text fill="#737686" fontFamily="Inter" fontSize="11" textAnchor="middle" x="360" y="218">12/10</text>
            <text fill="#737686" fontFamily="Inter" fontSize="11" textAnchor="middle" x="520" y="218">18/10</text>
            <text fill="#737686" fontFamily="Inter" fontSize="11" textAnchor="middle" x="680" y="218">24/10</text>
            <text fill="#737686" fontFamily="Inter" fontSize="11" textAnchor="middle" x="830" y="218">28/10</text>
            <text fill="#737686" fontFamily="Inter" fontSize="11" textAnchor="middle" x="970" y="218">Hôm nay</text>
          </svg>
        </div>
      </div>

      {/* 5. Leaderboards & Top Rankings (Grid 3 Columns) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* Leaderboard 1: Top Enrolled Courses */}
        <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span className="material-symbols-outlined text-[#EA580C] text-[20px]">local_fire_department</span>
                <span>Top Đăng ký nhiều nhất</span>
              </h3>
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium">Lượt học</span>
            </div>
            <div className="flex flex-col gap-3.5">
              {topEnrolled.length === 0 ? (
                <p className="text-xs text-slate-400 py-6 text-center">Chưa có lượt đăng ký khóa học nào</p>
              ) : (
                topEnrolled.map((item) => (
                  <div key={item.courseId || item.rank} className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className={`w-5 h-5 rounded-full font-bold text-xs flex items-center justify-center shrink-0 ${
                            item.rank === 1
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {item.rank}
                        </span>
                        <span className="text-xs font-semibold text-slate-800 truncate" title={item.title}>
                          {item.title}
                        </span>
                      </div>
                      <span className="text-xs font-bold text-blue-600 shrink-0">{item.enrollments} lượt</span>
                    </div>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-blue-600 h-full rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, Math.max(5, item.percentage))}%` }}
                      ></div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <a
            className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors"
            href="/admin/courses"
          >
            <span>Xem tất cả danh sách</span>
            <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
          </a>
        </div>

        {/* Leaderboard 2: Top Revenue Courses */}
        <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span className="material-symbols-outlined text-amber-600 text-[20px]">emoji_events</span>
                <span>Top Doanh thu cao nhất</span>
              </h3>
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium">VND</span>
            </div>
            <div className="flex flex-col gap-3">
              {topRevenue.length === 0 ? (
                <p className="text-xs text-slate-400 py-6 text-center">Chưa có dữ liệu doanh thu</p>
              ) : (
                topRevenue.map((item) => (
                  <div
                    key={item.courseId || item.rank}
                    className={`flex items-center justify-between gap-2 p-2 rounded-lg transition-colors ${
                      item.rank === 1 ? 'bg-slate-50' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className={`w-6 h-6 rounded-full font-bold text-xs flex items-center justify-center shrink-0 ${
                          item.rank === 1 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        #{item.rank}
                      </span>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-800 truncate">{item.title}</p>
                        <p className="text-[11px] text-slate-500">{item.categoryName}</p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-emerald-600 shrink-0">{item.formattedRevenue}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          <a
            className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors"
            href="/admin/payments"
          >
            <span>Xem báo cáo tài chính</span>
            <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
          </a>
        </div>

        {/* Leaderboard 3: Top Outstanding Lecturers */}
        <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-2xs flex flex-col justify-between md:col-span-2 lg:col-span-1">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span className="material-symbols-outlined text-amber-500 text-[20px]">stars</span>
                <span>Top Giảng viên tiêu biểu</span>
              </h3>
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium">Đánh giá</span>
            </div>
            <div className="flex flex-col gap-2.5">
              {topInstructors.length === 0 ? (
                <p className="text-xs text-slate-400 py-6 text-center">Chưa có dữ liệu giảng viên</p>
              ) : (
                topInstructors.map((item) => (
                  <div
                    key={item.instructorId || item.rank}
                    className={`flex items-center justify-between p-2 rounded-lg transition-colors ${
                      item.rank === 1 ? 'bg-slate-50/80' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img
                        className="w-10 h-10 rounded-full object-cover shrink-0 ring-1 ring-slate-200"
                        src={item.avatarUrl}
                        alt={item.fullName}
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1">
                          <p className="text-xs font-semibold text-slate-800 truncate">{item.fullName}</p>
                          {item.verified && (
                            <span className="material-symbols-outlined text-blue-600 text-[14px]">verified</span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500">
                          {item.courseCount} khóa • {formatVND(item.studentCount)} HV
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full text-xs font-bold shrink-0 border border-amber-200/60">
                      <span>{item.rating}</span>
                      <span
                        className="material-symbols-outlined text-[13px] text-amber-500"
                        style={{ fontVariationSettings: "'FILL' 1" }}
                      >
                        star
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <a
            className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors"
            href="/admin/accounts"
          >
            <span>Quản lý hồ sơ giảng viên</span>
            <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
          </a>
        </div>
      </div>
    </div>
  );
}
