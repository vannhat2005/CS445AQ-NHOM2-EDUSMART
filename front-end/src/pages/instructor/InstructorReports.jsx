import React, { useState, useEffect, useRef } from 'react';
import {
  Users, Award, CheckCircle2, FileText, ChevronDown,
  RotateCcw, FilterX, GraduationCap, ClipboardList,
  Loader2, AlertCircle
} from 'lucide-react';
import {
  getCurrentUser, getReportCourses,
  getReportChapters, getInstructorReport
} from '../../services/instructorReportService';

// ==================== 1. KHAI BÁO DỮ LIỆU MẶC ĐỊNH ====================

// Giá trị mặc định của bộ lọc
const DEFAULT_FILTERS = {
  courseId: 'all',
  chapterId: 'all',
  assessmentType: 'all',
  timeRange: 'all',
  fromDate: '',
  toDate: ''
};

// Danh sách màu sắc phân loại điểm
const SCORE_LEVELS = [
  { label: 'Kém (0-4)', color: '#ba1a1a' },
  { label: 'Trung bình (5-6)', color: '#757684' },
  { label: 'Khá (7-8)', color: '#0051d5' },
  { label: 'Giỏi (9-10)', color: '#00288e' }
];

// Xác định màu sắc tương ứng với mức điểm
const getScoreColor = (score) => {
  if (score <= 4) return '#ba1a1a';
  if (score <= 6) return '#757684';
  if (score <= 8) return '#0051d5';
  return '#00288e';
};

// Định dạng số liệu thống kê
const formatNumber = (value) => Number(value ?? 0).toLocaleString('en-US');

// Định dạng số thập phân
const formatDecimal = (value) => Number(value ?? 0).toFixed(1);

// Lấy ngày hiện tại theo múi giờ Việt Nam
const getToday = () => {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(new Date());

  const year = parts.find(part => part.type === 'year').value;
  const month = parts.find(part => part.type === 'month').value;
  const day = parts.find(part => part.type === 'day').value;

  return `${year}-${month}-${day}`;
};

// Lấy thông báo lỗi trả về từ Backend
const getErrorMessage = (error, defaultMessage) => {
  return error?.response?.data?.message || defaultMessage;
};

// ==================== 2. COMPONENT BỘ LỌC ====================

const FilterSelect = ({ label, value, onChange, options, disabled = false }) => {
  return (
    <div className="flex flex-col gap-2 min-w-0">
      <label className="text-xs font-medium text-slate-700">
        {label}
      </label>
      <div className="relative">
        <select
          value={value}
          onChange={onChange}
          disabled={disabled}
          className="w-full h-10 pl-3 pr-8 rounded-lg bg-white text-xs text-slate-700 appearance-none outline-none cursor-pointer hover:bg-[#f5f7fc] focus:bg-[#f5f7fc] transition-colors disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed"
        >
          {options.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown
          size={15}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"
        />
      </div>
    </div>
  );
};

// ==================== 3. COMPONENT THẺ THỐNG KÊ ====================

const StatisticCard = ({ title, value, unit, icon: Icon, progress }) => {
  return (
    <div className="bg-white rounded-xl p-5 min-h-[138px] flex flex-col justify-between">

      {/* Tiêu đề và biểu tượng thống kê */}
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-xs font-medium text-slate-700 leading-relaxed max-w-[145px]">
          {title}
        </h3>

        {/* Biểu đồ tròn dành cho tỷ lệ hoàn thành khóa học */}
        {progress !== undefined ? (
          <div className="relative w-10 h-10 shrink-0">
            <svg viewBox="0 0 40 40" className="w-full h-full -rotate-90">
              <circle
                cx="20" cy="20" r="16"
                fill="none"
                stroke="#e5ebfa"
                strokeWidth="3.5"
              />
              <circle
                cx="20" cy="20" r="16"
                fill="none"
                stroke="#0051d5"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 16}`}
                strokeDashoffset={`${2 * Math.PI * 16 * (1 - Math.min(100, Math.max(0, progress)) / 100)}`}
              />
              <circle
                cx="20" cy="20" r="6"
                fill="none"
                stroke="#0051d5"
                strokeWidth="1.5"
              />
            </svg>
          </div>
        ) : (
          <div className="w-10 h-10 rounded-xl bg-[#eff4ff] flex items-center justify-center text-[#00288e] shrink-0">
            <Icon size={21} strokeWidth={1.8} />
          </div>
        )}
      </div>

      {/* Giá trị thống kê */}
      <div className="flex items-baseline flex-wrap gap-1.5 mt-4">
        <span className="text-3xl font-bold tracking-tight text-[#0b1c30]">
          {value}
        </span>
        {unit && (
          <span className="text-[10px] font-medium text-slate-500">
            {unit}
          </span>
        )}
      </div>
    </div>
  );
};

// ==================== 4. COMPONENT BIỂU ĐỒ PHÂN BỐ ĐIỂM ====================

const ScoreDistributionChart = ({ data, totalSubmissions, averageScore }) => {

  // Xác định số lượt nộp lớn nhất trên biểu đồ
  const maxCount = Math.max(0, ...data.map(item => Number(item.count)));

  // Tự động xác định khoảng cách giữa các mốc trục tung
  const rawStep = Math.max(1, maxCount / 6);
  const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)));
  const normalizedStep = rawStep / magnitude;
  const step = (normalizedStep <= 1 ? 1 : normalizedStep <= 2 ? 2 : normalizedStep <= 5 ? 5 : 10) * magnitude;
  const maxValue = step * 6;

  // Tạo 7 mốc giá trị trên trục tung
  const yAxisValues = Array.from(
    { length: 7 },
    (_, index) => maxValue - index * step
  );

  return (
    <div className="bg-white rounded-xl p-6">

      {/* Tiêu đề và chú thích biểu đồ */}
      <div className="flex flex-col xl:flex-row xl:items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-lg font-bold text-[#0b1c30]">
            Phân bố điểm bài kiểm tra
          </h2>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            Dựa trên {formatNumber(totalSubmissions)} lượt nộp bài
            <span className="mx-2">•</span>
            Điểm trung bình:
            <span className="ml-1 font-semibold text-[#0051d5]">
              {formatDecimal(averageScore)} / 10
            </span>
          </p>
        </div>

        {/* Chú thích màu sắc phân loại điểm */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 bg-[#f1f4fc] px-3 py-2 rounded-lg shrink-0">
          {SCORE_LEVELS.map(level => (
            <div key={level.label} className="flex items-center gap-1.5">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: level.color }}
              />
              <span className="text-[10px] font-medium text-slate-600 whitespace-nowrap">
                {level.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Khu vực hiển thị biểu đồ */}
      <div className="overflow-x-auto mt-4">
        <div className="min-w-[620px] px-1 pt-8">

          <div className="flex gap-4 h-[240px] lg:h-[260px]">

            {/* Trục tung hiển thị số lượt nộp bài */}
            <div className="relative w-9 shrink-0">
              {yAxisValues.map((value, index) => (
                <span
                  key={value}
                  className="absolute right-1 -translate-y-1/2 text-[11px] text-slate-500"
                  style={{ top: `${index / (yAxisValues.length - 1) * 100}%` }}
                >
                  {formatNumber(value)}
                </span>
              ))}
            </div>

            {/* Khu vực chứa các cột điểm */}
            <div className="relative flex-1 flex items-end justify-between gap-3">

              {/* Các đường lưới ngang của biểu đồ */}
              <div className="absolute inset-0 pointer-events-none">
                {yAxisValues.map((value, index) => (
                  <div
                    key={value}
                    className={`absolute w-full h-px ${value === 0 ? 'bg-[#dce5f8]' : 'bg-[#f0f2f7]'}`}
                    style={{ top: `${index / (yAxisValues.length - 1) * 100}%` }}
                  />
                ))}
              </div>

              {/* Hiển thị 11 cột điểm từ 0 đến 10 */}
              {data.map(item => {

                // Tính chiều cao cột biểu đồ
                const height = Number(item.count) / maxValue * 100;

                // Tính tỷ lệ lượt nộp của mức điểm hiện tại
                const percentage = totalSubmissions > 0
                  ? (Number(item.count) / totalSubmissions * 100).toFixed(1)
                  : '0.0';

                return (
                  <div
                    key={item.score}
                    className="relative flex-1 h-full flex items-end justify-center group"
                  >

                    {/* Cột biểu đồ */}
                    <div
                      className="relative w-[58%] max-w-[46px] rounded-t-[3px] transition-all duration-300 group-hover:brightness-110"
                      style={{
                        height: `${height}%`,
                        backgroundColor: getScoreColor(item.score)
                      }}
                    >

                      {/* Số lượt nộp hiển thị phía trên cột */}
                      <span
                        className="absolute -top-5 left-1/2 -translate-x-1/2 text-[11px] font-semibold whitespace-nowrap"
                        style={{
                          color: item.score >= 7 ? getScoreColor(item.score) : '#64748b'
                        }}
                      >
                        {formatNumber(item.count)}
                      </span>
                    </div>

                    {/* Tooltip hiển thị thông tin khi di chuột */}
                    <div
                      className={`absolute z-30 hidden group-hover:block pointer-events-none ${
                        item.score <= 1
                          ? 'left-0'
                          : item.score >= 9
                            ? 'right-0'
                            : 'left-1/2 -translate-x-1/2'
                      }`}
                      style={{ bottom: `${Math.min(height + 10, 70)}%` }}
                    >
                      <div className="bg-slate-900 text-white text-xs rounded-lg px-3 py-2 shadow-lg whitespace-nowrap">
                        <p className="font-semibold mb-1">
                          {item.score === 10
                            ? 'Điểm: 10/10'
                            : `Điểm: ${item.score} đến dưới ${item.score + 1}`}
                        </p>
                        <p>Số lượt nộp: {formatNumber(item.count)}</p>
                        <p>Tỷ lệ: {percentage}%</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Trục hoành hiển thị điểm số */}
          <div className="flex items-center gap-4 mt-12 mb-2">
            <div className="w-9 shrink-0 text-[11px] text-slate-500">
              Điểm:
            </div>
            <div className="flex-1 flex justify-between gap-3">
              {data.map(item => (
                <span
                  key={item.score}
                  className="flex-1 text-center text-xs font-semibold text-[#0b1c30]"
                >
                  {item.score}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ==================== 5. COMPONENT TRẠNG THÁI RỖNG ====================

const EmptyState = ({ type, onReset }) => {

  // Nội dung thông báo tương ứng với từng trường hợp
  const states = {
    noCourses: {
      icon: GraduationCap,
      title: 'Bạn hiện chưa được phân công khóa học nào',
      description: 'Tài khoản giảng viên của bạn chưa được phân công quản lý khóa học.'
    },
    noStatistics: {
      icon: ClipboardList,
      title: 'Chưa có dữ liệu thống kê',
      description: 'Các khóa học được phân công chưa ghi nhận kết quả bài kiểm tra của học viên.'
    },
    noResults: {
      icon: FilterX,
      title: 'Không có dữ liệu thống kê phù hợp với điều kiện đã chọn',
      description: 'Vui lòng thay đổi điều kiện lọc hoặc đặt lại bộ lọc để xem dữ liệu.'
    }
  };

  const state = states[type];
  const Icon = state.icon;

  return (
    <div className="bg-white rounded-xl py-20 px-6 flex flex-col items-center justify-center text-center">

      {/* Biểu tượng thông báo */}
      <div className="w-16 h-16 rounded-2xl bg-[#eff4ff] text-[#00288e] flex items-center justify-center mb-4">
        <Icon size={32} strokeWidth={1.7} />
      </div>

      <h3 className="text-base font-bold text-slate-800 mb-2">
        {state.title}
      </h3>
      <p className="text-sm text-slate-500 max-w-md">
        {state.description}
      </p>

      {/* Nút đặt lại bộ lọc */}
      {type === 'noResults' && (
        <button
          type="button"
          onClick={onReset}
          className="mt-6 inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#00288e] hover:bg-[#1e40af] text-white text-sm font-semibold transition-colors"
        >
          <RotateCcw size={16} />
          Đặt lại bộ lọc
        </button>
      )}
    </div>
  );
};

// ==================== 6. COMPONENT LOADING ====================

const LoadingState = ({ message = 'Đang tải dữ liệu thống kê...' }) => {
  return (
    <div className="bg-white rounded-xl py-20 px-6 flex flex-col items-center justify-center">
      <Loader2 size={32} className="animate-spin text-[#0051d5] mb-4" />
      <p className="text-sm text-slate-500">{message}</p>
    </div>
  );
};

// ==================== 7. COMPONENT THÔNG BÁO LỖI ====================

const ErrorState = ({ message, onRetry }) => {
  return (
    <div className="bg-white rounded-xl py-16 px-6 flex flex-col items-center justify-center text-center">
      <div className="w-14 h-14 rounded-xl bg-red-50 text-red-600 flex items-center justify-center mb-4">
        <AlertCircle size={28} />
      </div>
      <h3 className="text-base font-bold text-slate-800 mb-2">
        Không thể tải dữ liệu thống kê
      </h3>
      <p className="text-sm text-slate-500 max-w-md">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-5 inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#00288e] hover:bg-[#1e40af] text-white text-sm font-semibold"
      >
        <RotateCcw size={15} />
        Thử lại
      </button>
    </div>
  );
};

// ==================== 8. TRANG BÁO CÁO THỐNG KÊ ====================

const InstructorReports = () => {

  // ID giảng viên đang đăng nhập
  const [instructorId, setInstructorId] = useState(null);

  // Danh sách khóa học và chương học lấy từ Backend
  const [courses, setCourses] = useState([]);
  const [chapters, setChapters] = useState([]);

  // Dữ liệu báo cáo thống kê lấy từ Backend
  const [statistics, setStatistics] = useState(null);

  // State quản lý bộ lọc
  const [filters, setFilters] = useState({ ...DEFAULT_FILTERS });

  // State quản lý trạng thái tải dữ liệu
  const [initialLoading, setInitialLoading] = useState(true);
  const [chapterLoading, setChapterLoading] = useState(false);
  const [reportLoading, setReportLoading] = useState(false);

  // State quản lý thông báo lỗi
  const [initialError, setInitialError] = useState('');
  const [chapterError, setChapterError] = useState('');
  const [reportError, setReportError] = useState('');

  // State hỗ trợ tải lại dữ liệu khi xảy ra lỗi
  const [initialRetry, setInitialRetry] = useState(0);
  const [chapterRetry, setChapterRetry] = useState(0);
  const [reportRetry, setReportRetry] = useState(0);

  // Ref lưu mã yêu cầu để tránh API cũ ghi đè dữ liệu mới
  const reportRequestRef = useRef(0);
  const chapterRequestRef = useRef(0);

  // Lấy ngày hiện tại để giới hạn bộ lọc thời gian
  const today = getToday();

  // ==================== 9. KIỂM TRA KHOẢNG THỜI GIAN ====================

  // Kiểm tra chưa nhập đầy đủ khoảng ngày
  const incompleteDateRange =
    filters.timeRange === 'custom' &&
    (!filters.fromDate || !filters.toDate);

  // Kiểm tra ngày bắt đầu lớn hơn ngày kết thúc
  const invalidDateRange =
    filters.timeRange === 'custom' &&
    !!filters.fromDate &&
    !!filters.toDate &&
    filters.fromDate > filters.toDate;

  // Kiểm tra có chọn ngày trong tương lai hay không
  const futureDateRange =
    filters.timeRange === 'custom' &&
    (filters.fromDate > today || filters.toDate > today);

  // Kiểm tra khoảng thời gian có hợp lệ hay không
  const canLoadReport =
    !incompleteDateRange && !invalidDateRange && !futureDateRange;

  // ==================== 10. LẤY ID VÀ DANH SÁCH KHÓA HỌC ====================

  useEffect(() => {
    let cancelled = false;

    // Lấy thông tin ban đầu khi truy cập trang báo cáo
    const initializePage = async () => {
      setInitialLoading(true);
      setInitialError('');
      setInstructorId(null);
      setCourses([]);
      setChapters([]);
      setStatistics(null);

      try {
        // Lấy ID giảng viên đang đăng nhập
        const currentInstructorId = Number(await getCurrentUser());

        // Kiểm tra ID giảng viên hợp lệ
        if (!Number.isInteger(currentInstructorId) || currentInstructorId <= 0) {
          throw new Error('Không xác định được ID giảng viên.');
        }

        // Lấy danh sách khóa học được phân công
        const response = await getReportCourses(currentInstructorId);

        // Không cập nhật state nếu component đã bị hủy
        if (cancelled) return;

        // Kiểm tra cấu trúc dữ liệu trả về
        if (!Array.isArray(response.result)) {
          throw new Error('Dữ liệu danh sách khóa học không hợp lệ.');
        }

        setCourses(response.result);
        setInstructorId(currentInstructorId);
      } catch (error) {
        if (cancelled) return;

        setInitialError(
          getErrorMessage(error, error.message || 'Không thể tải thông tin giảng viên.')
        );
      } finally {
        if (!cancelled) setInitialLoading(false);
      }
    };

    initializePage();

    // Hủy cập nhật dữ liệu khi rời khỏi trang
    return () => {
      cancelled = true;
    };
  }, [initialRetry]);

  // ==================== 11. LẤY DANH SÁCH CHƯƠNG HỌC ====================

  useEffect(() => {

    // Tạo mã yêu cầu mới
    const requestId = ++chapterRequestRef.current;

    // Xóa danh sách chương và lỗi của khóa học trước đó
    setChapters([]);
    setChapterError('');

    // Không tải chương nếu chưa chọn khóa học cụ thể
    if (!instructorId || filters.courseId === 'all') {
      setChapterLoading(false);
      return;
    }

    // Lấy danh sách chương thuộc khóa học được chọn
    const fetchChapters = async () => {
      setChapterLoading(true);

      try {
        const response = await getReportChapters(
          instructorId, Number(filters.courseId)
        );

        // Bỏ qua kết quả nếu người dùng đã đổi khóa học
        if (requestId !== chapterRequestRef.current) return;

        if (!Array.isArray(response.result)) {
          throw new Error('Dữ liệu danh sách chương học không hợp lệ.');
        }

        setChapters(response.result);
      } catch (error) {
        if (requestId !== chapterRequestRef.current) return;

        setChapterError(
          getErrorMessage(error, 'Không thể tải danh sách chương học.')
        );
      } finally {
        if (requestId === chapterRequestRef.current) {
          setChapterLoading(false);
        }
      }
    };

    fetchChapters();

    // Vô hiệu hóa yêu cầu cũ khi thay đổi khóa học hoặc rời trang
    return () => {
      chapterRequestRef.current += 1;
    };
  }, [instructorId, filters.courseId, chapterRetry]);

  // ==================== 12. LẤY DỮ LIỆU BÁO CÁO ====================

  useEffect(() => {

    // Tạo mã yêu cầu mới để tránh dữ liệu cũ ghi đè dữ liệu mới
    const requestId = ++reportRequestRef.current;

    // Xóa lỗi của yêu cầu trước đó
    setReportError('');

    // Không gọi API khi chưa xác định ID giảng viên
    // Hoặc khoảng thời gian tùy chỉnh chưa hợp lệ
    if (!instructorId || !canLoadReport) {
      setReportLoading(false);
      setStatistics(null);
      return;
    }

    // Lấy báo cáo thống kê theo bộ lọc hiện tại
    const fetchReport = async () => {
      setReportLoading(true);
      setStatistics(null);

      try {
        const response = await getInstructorReport(instructorId, filters);

        // Bỏ qua kết quả nếu bộ lọc đã thay đổi
        if (requestId !== reportRequestRef.current) return;

        // Kiểm tra dữ liệu báo cáo trả về
        if (!response.result || !Array.isArray(response.result.scoreDistribution)) {
          throw new Error('Dữ liệu báo cáo thống kê không hợp lệ.');
        }

        // Lưu dữ liệu báo cáo thực tế từ Backend
        setStatistics(response.result);
      } catch (error) {
        if (requestId !== reportRequestRef.current) return;

        setReportError(
          getErrorMessage(error, 'Không thể tải báo cáo thống kê.')
        );
      } finally {
        if (requestId === reportRequestRef.current) {
          setReportLoading(false);
        }
      }
    };

    fetchReport();

    // Vô hiệu hóa yêu cầu cũ khi thay đổi bộ lọc hoặc rời trang
    return () => {
      reportRequestRef.current += 1;
    };
  }, [instructorId, filters, canLoadReport, reportRetry]);

  // ==================== 13. XỬ LÝ THAY ĐỔI BỘ LỌC ====================

  // Thay đổi giá trị của bộ lọc
  const handleFilterChange = (field, value) => {

    // Không xử lý nếu giá trị không thay đổi
    if (filters[field] === value) return;

    // Vô hiệu hóa yêu cầu báo cáo cũ ngay khi thay đổi bộ lọc
    reportRequestRef.current += 1;
    setStatistics(null);
    setReportError('');
    setReportLoading(true);

    // Xóa chương học cũ khi thay đổi khóa học
    if (field === 'courseId') {
      chapterRequestRef.current += 1;
      setChapters([]);
      setChapterError('');
      setChapterLoading(value !== 'all');
    }

    setFilters(prev => ({
      ...prev,
      [field]: value,

      // Đặt lại chương học khi thay đổi khóa học
      ...(field === 'courseId' ? { chapterId: 'all' } : {}),

      // Xóa khoảng ngày khi không chọn thời gian tùy chỉnh
      ...(field === 'timeRange' && value !== 'custom'
        ? { fromDate: '', toDate: '' }
        : {})
    }));
  };

  // Đặt lại toàn bộ bộ lọc về mặc định
  const handleResetFilters = () => {
    reportRequestRef.current += 1;
    setStatistics(null);
    setReportError('');
    setReportLoading(true);

    // Xóa danh sách chương học nếu đang chọn khóa học cụ thể
    if (filters.courseId !== 'all') {
      chapterRequestRef.current += 1;
      setChapters([]);
      setChapterError('');
      setChapterLoading(false);
    }

    setFilters({ ...DEFAULT_FILTERS });
  };

  // ==================== 14. XỬ LÝ DỮ LIỆU THỐNG KÊ ====================

  // Kiểm tra các trạng thái dữ liệu do Backend trả về
  const hasCourses = statistics?.hasCourses ?? courses.length > 0;
  const hasStatistics = statistics?.hasStatistics ?? false;
  const hasResults = statistics?.hasResults ?? false;

  // Tổng số học viên lấy trực tiếp từ Backend
  const totalStudents = Number(statistics?.totalStudents ?? 0);

  // Tỷ lệ hoàn thành khóa học lấy trực tiếp từ Backend
  // Không tính lại dựa trên điểm số hoặc dữ liệu biểu đồ
  const completionRate = Number(statistics?.completionRate ?? 0);

  // Điểm trung bình thực tế lấy trực tiếp từ Backend
  const averageScore = Number(statistics?.averageScore ?? 0);

  // Tổng số lượt nộp bài lấy trực tiếp từ Backend
  const totalSubmissions = Number(statistics?.totalSubmissions ?? 0);

  // Chuẩn hóa biểu đồ để luôn có đầy đủ 11 mức điểm từ 0 đến 10
  const chartData = Array.from({ length: 11 }, (_, score) => {
    const item = statistics?.scoreDistribution?.find(
      row => Number(row.score) === score
    );

    return {
      score,
      count: Number(item?.count ?? 0),
      lessonQuiz: Number(item?.lessonQuiz ?? 0),
      chapterExam: Number(item?.chapterExam ?? 0)
    };
  });

  // Danh sách 4 thẻ thống kê
  const statisticCards = [
    {
      title: 'Tổng số học viên',
      value: formatNumber(totalStudents),
      unit: 'học viên',
      icon: Users
    },
    {
      title: 'Tỷ lệ hoàn thành khóa',
      value: `${formatDecimal(completionRate)}%`,
      progress: completionRate
    },
    {
      title: 'Điểm trung bình',
      value: hasResults ? formatDecimal(averageScore) : '—',
      unit: '/ 10',
      icon: Award
    },
    {
      title: 'Lượt hoàn thành đánh giá',
      value: formatNumber(totalSubmissions),
      unit: 'lượt nộp',
      icon: CheckCircle2
    }
  ];

  // ==================== 15. XUẤT BÁO CÁO PDF ====================

  // Kiểm tra điều kiện cho phép xuất báo cáo
  const canExport =
    !!statistics &&
    hasCourses &&
    hasResults &&
    canLoadReport &&
    !initialLoading &&
    !reportLoading &&
    !initialError &&
    !reportError;

  // Sử dụng chức năng in và lưu PDF của trình duyệt
  const handleExportPDF = () => {
    if (!canExport) return;
    window.print();
  };

  // ==================== 16. GIAO DIỆN BÁO CÁO THỐNG KÊ ====================

  return (
    <div className="flex flex-col w-full gap-6 pb-8">

      {/* ==================== TIÊU ĐỀ TRANG ==================== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <h1 className="text-2xl font-bold tracking-tight text-[#0b1c30]">
            Báo cáo thống kê
          </h1>
          <p className="text-sm text-slate-500">
            Theo dõi và đánh giá kết quả học tập của học viên trong các khóa học được phân công.
          </p>
        </div>

        {/* Nút xuất báo cáo PDF */}
        <button
          type="button"
          onClick={handleExportPDF}
          disabled={!canExport}
          className="inline-flex items-center justify-center gap-2 px-4 h-10 rounded-lg bg-white text-slate-800 text-xs font-semibold hover:bg-[#eff4ff] transition-colors shrink-0 disabled:opacity-50 disabled:cursor-not-allowed print:hidden"
        >
          <div className="w-6 h-6 rounded bg-red-100 flex items-center justify-center text-[#ba1a1a]">
            <FileText size={16} strokeWidth={1.8} />
          </div>
          Xuất báo cáo PDF
        </button>
      </div>

      {/* ==================== BỘ LỌC THỐNG KÊ ==================== */}
      <div className="bg-white rounded-xl px-5 py-5 print:hidden">

        {/* Bốn bộ lọc nằm trên cùng một hàng */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">

          {/* Lọc theo khóa học */}
          <FilterSelect
            label="Khóa học"
            value={filters.courseId}
            disabled={initialLoading || !!initialError || courses.length === 0}
            onChange={e => handleFilterChange('courseId', e.target.value)}
            options={[
              { value: 'all', label: 'Tất cả khóa học' },
              ...courses.map(course => ({
                value: String(course.courseId),
                label: course.title
              }))
            ]}
          />

          {/* Lọc theo chương học - bắt buộc chọn khóa học trước */}
          <FilterSelect
            label="Chương học"
            value={filters.chapterId}
            disabled={
              initialLoading ||
              !!initialError ||
              filters.courseId === 'all' ||
              chapterLoading ||
              !!chapterError ||
              chapters.length === 0
            }
            onChange={e => handleFilterChange('chapterId', e.target.value)}
            options={[
              {
                value: 'all',
                label: filters.courseId === 'all'
                  ? 'Chọn khóa học trước'
                  : chapterLoading
                    ? 'Đang tải chương học...'
                    : chapterError
                      ? 'Không thể tải chương học'
                      : chapters.length === 0
                        ? 'Chưa có chương học'
                        : 'Tất cả chương'
              },
              ...chapters.map(chapter => ({
                value: String(chapter.chapterId),
                label: chapter.title
              }))
            ]}
          />

          {/* Lọc theo loại đánh giá */}
          <FilterSelect
            label="Loại đánh giá"
            value={filters.assessmentType}
            disabled={initialLoading || !!initialError || courses.length === 0}
            onChange={e => handleFilterChange('assessmentType', e.target.value)}
            options={[
              { value: 'all', label: 'Tất cả đánh giá' },
              { value: 'quiz', label: 'Trắc nghiệm bài học' },
              { value: 'final', label: 'Kiểm tra cuối chương' }
            ]}
          />

          {/* Lọc theo thời gian */}
          <FilterSelect
            label="Thời gian"
            value={filters.timeRange}
            disabled={initialLoading || !!initialError || courses.length === 0}
            onChange={e => handleFilterChange('timeRange', e.target.value)}
            options={[
              { value: 'all', label: 'Toàn thời gian' },
              { value: '7d', label: '7 ngày qua' },
              { value: '30d', label: '30 ngày qua' },
              { value: '90d', label: '90 ngày qua' },
              { value: 'custom', label: 'Tùy chỉnh khoảng ngày' }
            ]}
          />
        </div>

        {/* Khoảng thời gian tùy chỉnh và nút đặt lại bộ lọc */}
        <div className="flex flex-wrap items-center justify-between gap-4 mt-5">

          {/* Chỉ hiển thị khi chọn tùy chỉnh khoảng ngày */}
          {filters.timeRange === 'custom' && (
            <div className="flex flex-wrap items-center gap-4">

              {/* Ngày bắt đầu */}
              <div className="flex items-center gap-2">
                <label className="text-xs font-medium text-slate-600">
                  Từ ngày:
                </label>
                <input
                  type="date"
                  value={filters.fromDate}
                  max={filters.toDate && filters.toDate < today ? filters.toDate : today}
                  onChange={e => handleFilterChange('fromDate', e.target.value)}
                  className="h-9 px-3 rounded-lg bg-[#eff4ff] text-xs text-slate-700 outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              {/* Ngày kết thúc */}
              <div className="flex items-center gap-2">
                <label className="text-xs font-medium text-slate-600">
                  Đến ngày:
                </label>
                <input
                  type="date"
                  value={filters.toDate}
                  min={filters.fromDate || undefined}
                  max={today}
                  onChange={e => handleFilterChange('toDate', e.target.value)}
                  className="h-9 px-3 rounded-lg bg-[#eff4ff] text-xs text-slate-700 outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            </div>
          )}

          {/* Nút đặt lại bộ lọc */}
          <button
            type="button"
            onClick={handleResetFilters}
            disabled={initialLoading || !!initialError || courses.length === 0}
            className="ml-auto inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-slate-600 hover:bg-[#eff4ff] hover:text-[#00288e] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RotateCcw size={14} strokeWidth={1.8} />
            Đặt lại bộ lọc
          </button>
        </div>

        {/* Thông báo lỗi khi tải danh sách chương học */}
        {chapterError && (
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-red-600">
            <AlertCircle size={14} />
            <span>{chapterError}</span>
            <button
              type="button"
              onClick={() => setChapterRetry(prev => prev + 1)}
              className="font-semibold underline"
            >
              Thử lại
            </button>
          </div>
        )}

        {/* Thông báo lỗi ngày bắt đầu lớn hơn ngày kết thúc */}
        {invalidDateRange && (
          <p className="mt-3 text-xs text-red-600">
            Ngày bắt đầu không được lớn hơn ngày kết thúc.
          </p>
        )}

        {/* Thông báo lỗi chọn ngày trong tương lai */}
        {futureDateRange && (
          <p className="mt-3 text-xs text-red-600">
            Không được chọn ngày trong tương lai.
          </p>
        )}
      </div>

      {/* ==================== NỘI DUNG THỐNG KÊ ==================== */}

      {/* Đang tải thông tin ban đầu */}
      {initialLoading ? (
        <LoadingState message="Đang tải thông tin báo cáo..." />

      /* Lỗi tải thông tin giảng viên hoặc khóa học */
      ) : initialError ? (
        <ErrorState
          message={initialError}
          onRetry={() => setInitialRetry(prev => prev + 1)}
        />

      /* Giảng viên chưa được phân công khóa học */
      ) : !hasCourses ? (
        <EmptyState
          type="noCourses"
          onReset={handleResetFilters}
        />

      /* Khoảng thời gian tùy chỉnh chưa hợp lệ */
      ) : !canLoadReport ? (
        <div className="bg-white rounded-xl py-16 px-6 text-center">
          <p className="text-sm text-slate-500">
            Vui lòng chọn khoảng thời gian hợp lệ để xem báo cáo thống kê.
          </p>
        </div>

      /* Đang tải dữ liệu báo cáo */
      ) : reportLoading ? (
        <LoadingState />

      /* Lỗi tải dữ liệu báo cáo */
      ) : reportError ? (
        <ErrorState
          message={reportError}
          onRetry={() => setReportRetry(prev => prev + 1)}
        />

      /* Chờ dữ liệu báo cáo được tải */
      ) : !statistics ? (
        <LoadingState />

      /* Đã tải dữ liệu báo cáo thành công */
      ) : (
        <>

          {/* ==================== 4 THẺ THỐNG KÊ ==================== */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
            {statisticCards.map(card => (
              <StatisticCard
                key={card.title}
                title={card.title}
                value={card.value}
                unit={card.unit}
                icon={card.icon}
                progress={card.progress}
              />
            ))}
          </div>

          {/* ==================== BIỂU ĐỒ PHÂN BỐ ĐIỂM ==================== */}

          {/* Chưa có dữ liệu đánh giá trong toàn bộ khóa học */}
          {!hasStatistics ? (
            <EmptyState
              type="noStatistics"
              onReset={handleResetFilters}
            />

          /* Không có dữ liệu phù hợp với bộ lọc */
          ) : !hasResults ? (
            <EmptyState
              type="noResults"
              onReset={handleResetFilters}
            />

          /* Có dữ liệu thống kê phù hợp */
          ) : (
            <ScoreDistributionChart
              data={chartData}
              totalSubmissions={totalSubmissions}
              averageScore={averageScore}
            />
          )}
        </>
      )}
    </div>
  );
};

export default InstructorReports;