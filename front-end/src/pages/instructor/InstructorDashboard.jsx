import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BookOpen, Users, FileQuestion, ClipboardCheck,
  FilePenLine, ChevronRight, Loader2, RefreshCw
} from "lucide-react";

import { useAuth } from "../../context/AuthContext";
import { getInstructorDashboard } from "../../services/instructorDashboardService";
import api from "../../services/api";

// ==========================================
// DỮ LIỆU DASHBOARD BAN ĐẦU
// ==========================================

const INITIAL_DASHBOARD = {
  totalCourses: 0,
  totalStudents: 0,
  totalLessonQuizzes: 0,
  totalChapterQuizzes: 0,
  totalDrafts: 0,
  recentCourses: [],
};

// ==========================================
// ĐỊNH DẠNG SỐ LIỆU THỐNG KÊ
// ==========================================

const formatNumber = (value) => {
  return Number(value ?? 0).toLocaleString("vi-VN");
};

// ==========================================
// XỬ LÝ ĐƯỜNG DẪN ẢNH KHÓA HỌC
// ==========================================

const getCourseImageUrl = (imageUrl) => {
  if (!imageUrl) return "";

  // Giữ nguyên đường dẫn ảnh tuyệt đối
  if (/^https?:\/\//i.test(imageUrl)) {
    return imageUrl;
  }

  // Lấy địa chỉ Backend từ cấu hình Axios
  const baseUrl = api.defaults.baseURL || "/api";
  const backendUrl = new URL(baseUrl, window.location.origin);

  // Ghép đường dẫn ảnh với địa chỉ Backend
  return new URL(imageUrl, `${backendUrl.origin}/`).href;
};

// ==========================================
// COMPONENT THẺ THỐNG KÊ
// ==========================================

const StatisticCard = ({ title, value, unit, icon: Icon }) => {
  return (
    <div className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm">

      {/* Tiêu đề và biểu tượng */}
      <div className="mb-3 flex items-start justify-between gap-2">
        <span className="text-xs font-medium text-slate-600">
          {title}
        </span>
        <Icon size={20} className="shrink-0 text-blue-600" />
      </div>

      {/* Giá trị thống kê */}
      <div>
        <div className="text-4xl font-bold leading-none text-slate-900">
          {formatNumber(value)}
        </div>
        <p className="mt-2 text-[13px] text-slate-500">
          {unit}
        </p>
      </div>

    </div>
  );
};

// ==========================================
// COMPONENT THẺ KHÓA HỌC GẦN ĐÂY
// ==========================================

const RecentCourseCard = ({ course, index, onViewDetail }) => {

  // Trạng thái ảnh không tải được
  const [imageError, setImageError] = useState(false);

  // Đường dẫn ảnh khóa học
  const imageUrl = getCourseImageUrl(course.imageUrl);

  // Màu nền mặc định khi khóa học chưa có ảnh
  const gradients = [
    "from-blue-600 to-indigo-800",
    "from-indigo-700 to-blue-900",
    "from-blue-800 to-purple-800",
  ];

  // Đặt lại trạng thái khi đường dẫn ảnh thay đổi
  useEffect(() => {
    setImageError(false);
  }, [imageUrl]);

  return (
    <div className="flex flex-col justify-between overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-all hover:shadow-md">

      {/* ========================================
          ẢNH ĐẠI DIỆN KHÓA HỌC
      ======================================== */}

      <div className={`relative h-36 overflow-hidden bg-gradient-to-br ${gradients[index % gradients.length]}`}>

        {imageUrl && !imageError ? (
          <img
            src={imageUrl}
            alt={course.title}
            onError={() => setImageError(true)}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="pointer-events-none absolute -bottom-5 -right-3 text-white/20">
            <BookOpen size={120} strokeWidth={1.5} />
          </div>
        )}

      </div>

      {/* ========================================
          THÔNG TIN KHÓA HỌC
      ======================================== */}

      <div className="flex flex-1 flex-col justify-between gap-4 p-4">

        <div className="flex flex-col gap-2">

          {/* Tên khóa học */}
          <h3
            title={course.title}
            className="line-clamp-1 text-base font-semibold text-slate-900"
          >
            {course.title}
          </h3>

          {/* Số học viên */}
          <div className="flex items-center gap-1.5 text-slate-600">
            <Users size={18} className="text-blue-600" />
            <span className="text-[13px]">
              {formatNumber(course.studentCount)} học viên
            </span>
          </div>

        </div>

        {/* ========================================
            SỐ CHƯƠNG, BÀI HỌC VÀ XEM CHI TIẾT
        ======================================== */}

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3">

          <span className="text-xs text-slate-500">
            {formatNumber(course.chapterCount)} chương •{" "}
            {formatNumber(course.lessonCount)} bài học
          </span>

          <button
            type="button"
            onClick={() => onViewDetail(course.courseId)}
            className="flex items-center gap-1 rounded-lg bg-blue-50 px-3 py-1.5 text-sm font-semibold text-blue-600 transition-all hover:bg-blue-600 hover:text-white"
          >
            Xem chi tiết
            <ChevronRight size={16} />
          </button>

        </div>

      </div>
    </div>
  );
};

// ==========================================
// TRANG CHỦ GIẢNG VIÊN
// ==========================================

const InstructorDashboard = () => {

  const navigate = useNavigate();
  const { user } = useAuth();

  // ========================================
  // STATES
  // ========================================

  const [dashboard, setDashboard] = useState(INITIAL_DASHBOARD);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  // Họ tên giảng viên đang đăng nhập
  const displayName = user?.fullName || user?.username || "";

  // ========================================
  // LẤY DỮ LIỆU DASHBOARD TỪ BACKEND
  // ========================================

  useEffect(() => {

    let active = true;

    const fetchDashboard = async () => {
      setLoading(true);
      setError("");

      try {
        const response = await getInstructorDashboard();

        // Kiểm tra dữ liệu Backend trả về
        if (!response?.result) {
          throw new Error("Không nhận được dữ liệu thống kê");
        }

        // Chỉ cập nhật state khi component còn hoạt động
        if (active) {
          setDashboard({
            ...INITIAL_DASHBOARD,
            ...response.result,
            recentCourses: Array.isArray(response.result.recentCourses)
              ? response.result.recentCourses.slice(0, 3)
              : [],
          });
        }

      } catch (error) {

        if (active) {
          setError(
            error.response?.data?.message ||
            error.message ||
            "Không thể tải dữ liệu trang chủ giảng viên."
          );
        }

        console.error("Lỗi tải Dashboard giảng viên:", error);

      } finally {
        if (active) setLoading(false);
      }
    };

    fetchDashboard();

    return () => {
      active = false;
    };

  }, [reloadKey, user?.userId]);

  // ========================================
  // ĐIỀU HƯỚNG CHI TIẾT KHÓA HỌC
  // ========================================

  const handleViewCourse = (courseId) => {
    navigate(`/instructor/courses/${courseId}`);
  };

  // ========================================
  // DANH SÁCH THẺ THỐNG KÊ
  // ========================================

  const statistics = [
    {
      title: "Khóa học được phân công",
      value: dashboard.totalCourses,
      unit: "khóa học",
      icon: BookOpen,
    },
    {
      title: "Tổng số học viên",
      value: dashboard.totalStudents,
      unit: "học viên",
      icon: Users,
    },
    {
      title: "Tổng số bài trắc nghiệm",
      value: dashboard.totalLessonQuizzes,
      unit: "bài trắc nghiệm",
      icon: FileQuestion,
    },
    {
      title: "Kiểm tra cuối chương",
      value: dashboard.totalChapterQuizzes,
      unit: "bài kiểm tra",
      icon: ClipboardCheck,
    },
    {
      title: "Tổng số bản nháp",
      value: dashboard.totalDrafts,
      unit: "bản nháp",
      icon: FilePenLine,
    },
  ];

  // ========================================
  // GIAO DIỆN DASHBOARD
  // ========================================

  return (
    <div className="flex w-full flex-col gap-6 py-4">

      {/* ========================================
          LỜI CHÀO GIẢNG VIÊN
      ======================================== */}

      <div className="flex flex-col justify-between gap-4 pb-2 md:flex-row md:items-center">
        <div>
          <h1 className="text-[28px] font-semibold tracking-tight text-slate-900">
            Xin chào, Giảng viên{" "}
            <span className="font-bold text-blue-800">
              {displayName}!
            </span>
          </h1>

          <p className="mt-1 text-sm text-slate-600">
            Chào mừng bạn quay trở lại. Chúc bạn có một ngày làm việc và giảng dạy hiệu quả.
          </p>
        </div>
      </div>

      {/* ========================================
          TRẠNG THÁI ĐANG TẢI
      ======================================== */}

      {loading ? (
        <div className="flex min-h-[300px] flex-col items-center justify-center gap-3">
          <Loader2 size={32} className="animate-spin text-blue-600" />
          <p className="text-sm text-slate-500">
            Đang tải dữ liệu thống kê...
          </p>
        </div>

      ) : error ? (

        /* Trạng thái tải dữ liệu thất bại */
        <div className="flex min-h-[250px] flex-col items-center justify-center gap-4 rounded-xl border border-slate-200 bg-white p-6">

          <p className="text-center text-sm text-red-600">
            {error}
          </p>

          <button
            type="button"
            onClick={() => setReloadKey((prev) => prev + 1)}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            <RefreshCw size={16} />
            Thử lại
          </button>

        </div>

      ) : (
        <>

          {/* ========================================
              5 THẺ THỐNG KÊ
          ======================================== */}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {statistics.map((item) => (
              <StatisticCard
                key={item.title}
                title={item.title}
                value={item.value}
                unit={item.unit}
                icon={item.icon}
              />
            ))}
          </div>

          {/* ========================================
              KHÓA HỌC GẦN ĐÂY
          ======================================== */}

          <section className="mt-2 flex flex-col gap-4">

            {/* Tiêu đề danh sách khóa học */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold tracking-tight text-slate-900">
                  Khóa học gần đây
                </h2>
                <p className="mt-1 text-[13px] text-slate-600">
                  Danh sách các khóa học được phân công giảng dạy gần đây
                </p>
              </div>
            </div>

            {/* Kiểm tra danh sách khóa học */}
            {dashboard.recentCourses.length === 0 ? (

              <div className="flex min-h-[200px] flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-slate-300 bg-white p-6">

                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                  <BookOpen size={28} />
                </div>

                <p className="text-sm font-semibold text-slate-700">
                  Chưa có khóa học được phân công
                </p>

                <p className="text-center text-xs text-slate-500">
                  Các khóa học sẽ xuất hiện khi bạn được phân công giảng dạy.
                </p>

              </div>

            ) : (

              /* Hiển thị tối đa 3 khóa học gần đây */
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                {dashboard.recentCourses.map((course, index) => (
                  <RecentCourseCard
                    key={course.courseId}
                    course={course}
                    index={index}
                    onViewDetail={handleViewCourse}
                  />
                ))}
              </div>

            )}

          </section>

        </>
      )}

    </div>
  );
};

export default InstructorDashboard;