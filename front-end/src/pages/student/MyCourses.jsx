

import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";


import MyCourseCard from "../../components/student/MyCourseCard";
import { getMyCourses, getMyCourseSummary } from "../../services/student/myCourseService";



const PAGE_SIZE = 6;

const FILTERS = [
  {
    key: "ALL",
    label: "Tất cả khóa học",
  },
  {
    key: "IN_PROGRESS",
    label: "Đang học",
  },
  {
    key: "COMPLETED",
    label: "Đã hoàn thành",
  },
  {
    key: "NOT_STARTED",
    label: "Chưa bắt đầu",
  },
];

const initialPage = {
  content: [],
  pageNo: 1,
  pageSize: PAGE_SIZE,
  totalElements: 0,
  totalPages: 0,
  last: true,
};

// Component thống kê
const StatCard = ({ icon, title, value }) => {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-4">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-2xl">
        {icon}
      </div>

      <div>
        <p className="text-xs text-slate-500">{title}</p>
        <p className="text-2xl font-bold text-slate-900">
          {value}
        </p>
      </div>
    </div>
  );
};

export default function MyCourses() {
  const navigate = useNavigate();

  // Dữ liệu Backend
  const [pageData, setPageData] = useState(initialPage);

  // Phân trang
  const [pageNo, setPageNo] = useState(1);

  // Tìm kiếm, lọc, sắp xếp
  const [activeFilter, setActiveFilter] = useState("ALL");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [sortBy, setSortBy] = useState("ALL_NEWEST");
  const [debouncedKeyword, setDebouncedKeyword] = useState("");

  // Loading và lỗi
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  // Thống kê tổng quan cố định (tất cả khóa học của học viên)
  const [summary, setSummary] = useState({
    total: 0,
    inProgress: 0,
    completed: 0,
    notStarted: 0,
  });

  // Tham chiếu vùng danh sách khóa học để cuộn mượt không giật
  const courseSectionRef = useRef(null);

  // Chờ người dùng ngừng gõ 350ms mới gọi API (chuẩn hóa khoảng trắng dư thừa)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedKeyword(searchKeyword.trim().replace(/\s+/g, " "));
    }, 350);
    return () => clearTimeout(timer);
  }, [searchKeyword]);

  // Lấy thống kê tổng quan cố định khi load trang hoặc reload
  useEffect(() => {
    let active = true;

    const fetchSummary = async () => {
      try {
        const data = await getMyCourseSummary();
        if (active && data) {
          setSummary({
            total: Number(data.total) || 0,
            inProgress: Number(data.inProgress) || 0,
            completed: Number(data.completed) || 0,
            notStarted: Number(data.notStarted) || 0,
          });
        }
      } catch (err) {
        console.error("[MyCourses] Lỗi khi tải thống kê tổng quan:", err);
      }
    };

    fetchSummary();

    return () => {
      active = false;
    };
  }, [reloadKey]);

  // Dự phòng: cập nhật tổng khóa học nếu summary chưa kịp lấy
  useEffect(() => {
    if (
      activeFilter === "ALL" &&
      !debouncedKeyword &&
      pageData.totalElements > 0 &&
      summary.total === 0
    ) {
      setSummary((prev) => ({
        ...prev,
        total: pageData.totalElements,
      }));
    }
  }, [pageData.totalElements, activeFilter, debouncedKeyword, summary.total]);

  // ==========================================
  // 1. GỌI API BACKEND
  // ==========================================
  useEffect(() => {
    let active = true;

    const fetchMyCourses = async () => {
      setLoading(true);
      setError("");

      try {
        const result = await getMyCourses(
          pageNo,
          PAGE_SIZE,
          activeFilter,
          debouncedKeyword,
          sortBy
        );

        if (!active) return;

        setPageData(result || initialPage);
      } catch (err) {
        if (!active) return;

        const message =
          err.response?.status === 401
            ? "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại."
            : err.response?.data?.message ||
            err.message ||
            "Không thể tải danh sách khóa học.";

        setError(message);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    fetchMyCourses();

    return () => {
      active = false;
    };
  }, [pageNo, activeFilter, debouncedKeyword, sortBy, reloadKey]);

  // ==========================================
  // 2. DANH SÁCH KHÓA HỌC
  // ==========================================
  const courses = pageData.content || [];

  // Backend đã lọc, tìm kiếm, sắp xếp và phân trang.
  // Không lọc lại trên 6 khóa học của trang hiện tại.
  const filteredCourses = courses;

  const changeFilter = (filter) => {
    setPageNo(1);
    setActiveFilter(filter);
  };

  const changeKeyword = (value) => {
    setPageNo(1);
    setSearchKeyword(value);
  };

  const changeSort = (value) => {
    setPageNo(1);
    setSortBy(value);
  };

  // ==========================================
  // 5. CHUYỂN ĐẾN TRANG HỌC
  // ==========================================
  const handleOpenCourse = (courseId) => {
    console.log("[MyCourses] ID khóa học được chọn:", courseId);

    const selectedCourse = courses.find(
      (course) => String(course.courseId) === String(courseId)
    );

    console.log("[MyCourses] Thông tin khóa học:", selectedCourse);

    if (courseId === null || courseId === undefined || courseId === "") {
      console.error("Không tìm thấy ID khóa học");
      return;
    }

    navigate(`/student/courses/${courseId}`);
  };

  // ==========================================
  // 6. ĐỔI TRANG (KHÔNG GIẬT LÊN ĐỈNH TRANG)
  // ==========================================
  const handleChangePage = (newPage) => {
    if (
      newPage < 1 ||
      newPage > pageData.totalPages ||
      newPage === pageNo
    ) {
      return;
    }

    setPageNo(newPage);

    // Chỉ cuộn nhẹ nhàng đến đầu danh sách khóa học nếu người dùng đang ở quá thấp
    // KHÔNG dùng window.scrollTo({ top: 0 }) vì sẽ giật mạnh lên tận đỉnh trang
    if (courseSectionRef.current) {
      const rect = courseSectionRef.current.getBoundingClientRect();
      if (rect.top < 80) {
        courseSectionRef.current.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
    }
  };

  // ==========================================
  // 7. HIỂN THỊ GIAO DIỆN
  // ==========================================
  return (
    <main className="min-h-screen bg-slate-50 px-4 pb-8 pt-24 md:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-7">

        {/* ================= HEADER ================= */}
        <section className="relative overflow-hidden rounded-2xl bg-white p-6 shadow-sm md:p-9">
          <div className="pointer-events-none absolute -right-20 -top-20 h-80 w-80 rounded-full bg-indigo-100/70 blur-3xl" />

          <div className="relative flex flex-col justify-between gap-6 lg:flex-row lg:items-center">

            {/* Tiêu đề */}
            <div className="max-w-xl">
              <span className="inline-flex rounded-full bg-indigo-100 px-3 py-1 text-xs font-bold uppercase tracking-wider text-indigo-700">
                Student Workspace
              </span>

              <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900 md:text-4xl">
                Khóa học của tôi
              </h1>

              <p className="mt-3 text-sm leading-7 text-slate-600 md:text-base">
                Quản lý các khóa học đã đăng ký,
                theo dõi tiến độ hoàn thành Quiz
                và tiếp tục hành trình học tập
                của bạn.
              </p>
            </div>

            {/* Thống kê */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <StatCard
                icon="📚"
                title="Tổng khóa học"
                value={summary.total}
              />

              <StatCard
                icon="⏳"
                title="Đang học"
                value={summary.inProgress}
              />

              <StatCard
                icon="🏆"
                title="Hoàn thành"
                value={summary.completed}
              />
            </div>
          </div>
        </section>

        {/* ================= TOOLBAR ================= */}
        <section ref={courseSectionRef} className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">

          {/* Tabs */}
          <div className="flex flex-wrap gap-2 rounded-xl bg-slate-100 p-1">
            {FILTERS.map((filter) => {
              let count = 0;

              if (filter.key === "ALL") {
                count = summary.total;
              } else if (filter.key === "IN_PROGRESS") {
                count = summary.inProgress;
              } else if (filter.key === "COMPLETED") {
                count = summary.completed;
              } else {
                count = summary.notStarted;
              }

              return (
                <button
                  key={filter.key}
                  type="button"
                  onClick={() => changeFilter(filter.key)}
                  className={`rounded-lg px-4 py-2 text-sm font-semibold transition-all ${activeFilter === filter.key
                      ? "bg-white text-indigo-700 shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                    }`}
                >
                  {filter.label}

                  <span className="ml-2 rounded-full bg-indigo-50 px-2 py-0.5 text-xs text-indigo-700">
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Tìm kiếm + sắp xếp */}
          <div className="flex flex-col gap-3 sm:flex-row">

            <input
              type="text"
              value={searchKeyword}
              onChange={(e) =>
                changeKeyword(e.target.value)
              }
              placeholder="🔎 Tìm khóa học của bạn..."
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-indigo-500 sm:w-64"
            />

            <select
              value={sortBy}
              onChange={(e) =>
                changeSort(e.target.value)
              }
              className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-indigo-500"
            >
              <option value="ALL_NEWEST">
                Mới đăng ký
              </option>

              <option value="PROGRESS_DESC">
                Tiến độ cao nhất
              </option>

              <option value="TITLE_ASC">
                Tên khóa học A-Z
              </option>
            </select>
          </div>
        </section>

        {/* ================= ERROR ================= */}
        {error ? (
          <section className="rounded-2xl bg-white p-10 text-center shadow-sm">
            <div className="mb-4 text-5xl">⚠️</div>

            <h2 className="text-xl font-bold text-slate-900">
              Không thể tải khóa học
            </h2>

            <p role="alert" className="mt-3 text-sm text-red-600">
              {error}
            </p>

            <button
              type="button"
              onClick={() =>
                setReloadKey((prev) => prev + 1)
              }
              className="mt-6 rounded-xl bg-indigo-700 px-6 py-3 font-semibold text-white transition hover:bg-indigo-800"
            >
              Thử lại
            </button>
          </section>
        ) : loading ? (

          /* ================= LOADING ================= */
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 min-h-[420px]">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="h-[360px] animate-pulse rounded-2xl bg-slate-200/80"
              />
            ))}
          </div>
        ) : filteredCourses.length > 0 ? (

          /* ================= COURSE GRID ================= */
          <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 min-h-[420px]">
            {filteredCourses.map((course) => (
              <MyCourseCard
                key={course.courseId}
                course={course}
                onOpen={handleOpenCourse}
              />
            ))}
          </section>
        ) : (

          /* ================= EMPTY STATE ================= */
          <section className="flex flex-col items-center justify-center rounded-2xl bg-white px-6 py-16 text-center shadow-sm">

            <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-indigo-50 text-5xl">
              🎒
            </div>

            <h2 className="mt-6 text-2xl font-bold text-slate-900">
              {pageData.totalElements === 0 && activeFilter === "ALL" && !debouncedKeyword
                ? "Bạn chưa có khóa học đã thanh toán"
                : "Không tìm thấy khóa học phù hợp"}
            </h2>

            <p className="mt-3 max-w-lg text-sm leading-7 text-slate-600">
              {pageData.totalElements === 0 && activeFilter === "ALL" && !debouncedKeyword
                ? "Khám phá các khóa học và bắt đầu hành trình học tập ngay hôm nay."
                : "Không có khóa học nào phù hợp với bộ lọc hoặc từ khóa tìm kiếm hiện tại."}
            </p>

            {pageData.totalElements === 0 && activeFilter === "ALL" && !debouncedKeyword ? (
              <button
                type="button"
                onClick={() =>
                  navigate("/explore-courses")
                }
                className="mt-6 rounded-xl bg-indigo-700 px-6 py-3 font-semibold text-white transition hover:bg-indigo-800"
              >
                Khám phá khóa học ngay →
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  changeFilter("ALL");
                  changeKeyword("");
                }}
                className="mt-6 rounded-xl bg-indigo-700 px-6 py-3 font-semibold text-white transition hover:bg-indigo-800"
              >
                Xóa bộ lọc
              </button>
            )}
          </section>
        )}

        {/* ================= PAGINATION ================= */}
        {!loading &&
          !error &&
          pageData.totalPages > 1 && (
            <nav
              aria-label="Phân trang khóa học"
              className="flex items-center justify-center gap-4"
            >
              <button
                type="button"
                disabled={pageNo <= 1}
                onClick={() =>
                  handleChangePage(pageNo - 1)
                }
                className="rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-indigo-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                ← Trước
              </button>

              <span className="text-sm font-medium text-slate-600">
                Trang {pageNo} / {pageData.totalPages}
              </span>

              <button
                type="button"
                disabled={
                  pageNo >= pageData.totalPages
                }
                onClick={() =>
                  handleChangePage(pageNo + 1)
                }
                className="rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-indigo-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Sau →
              </button>
            </nav>
          )}

        {/* ================= MOTIVATION ================= */}
        <section className="flex flex-col justify-between gap-4 rounded-2xl bg-gradient-to-r from-white to-indigo-50 p-6 shadow-sm md:flex-row md:items-center">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-2xl">
              🏆
            </div>

            <div>
              <h3 className="font-bold text-slate-900">
                Học đều đặn mỗi ngày!
              </h3>

              <p className="mt-1 text-sm text-slate-600">
                Hoàn thành các Quiz để nâng cao
                tiến độ học tập của bạn.
              </p>
            </div>
          </div>

          <span className="text-sm font-semibold text-indigo-700">
            Cố gắng lên! ✨
          </span>
        </section>
      </div>
    </main>
  );
}
