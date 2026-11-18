
import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  Link,
  NavLink,
  useNavigate,
} from "react-router-dom";

import {
  Search,
  Bell,
  ChevronDown,
  Menu,
  X,
  GraduationCap,
  UserRound,
  LogOut,
  BookOpen,
  Bot,
  LoaderCircle,
  LogIn,
  UserPlus,
} from "lucide-react";

import { useAuth } from "../../context/AuthContext";

// ========================================
// API TÌM KIẾM KHÓA HỌC
// ========================================

const API_URL = "/api/courses/search";

// ========================================
// NAV LINK STYLE
// ========================================

const navClass = ({ isActive }) =>
  [
    "flex h-full items-center border-b-2",
    "text-sm font-semibold transition-colors",
    isActive
      ? "border-blue-600 text-blue-600"
      : "border-transparent text-slate-600 hover:text-blue-600",
  ].join(" ");

// ========================================
// HEADER
// ========================================

export default function Header() {
  const navigate = useNavigate();

  const {
    user,
    isAuthenticated,
    logout,
  } = useAuth();

  const [menuOpen, setMenuOpen] =
    useState(false);

  const [profileOpen, setProfileOpen] =
    useState(false);

  const [keyword, setKeyword] =
    useState("");

  const [suggestions, setSuggestions] =
    useState([]);

  const [showSuggestions, setShowSuggestions] =
    useState(false);

  const [searchLoading, setSearchLoading] =
    useState(false);

  const [loggingOut, setLoggingOut] =
    useState(false);

  const searchRef = useRef(null);
  const profileRef = useRef(null);
  const requestId = useRef(0);

  // ========================================
  // TÌM KIẾM GỢI Ý
  // ========================================

  useEffect(() => {
    const value = keyword.trim();

    if (!value) {
      requestId.current += 1;
      setSuggestions([]);
      setSearchLoading(false);
      setShowSuggestions(false);
      return;
    }

    const currentRequest =
      ++requestId.current;

    const timer = setTimeout(async () => {
      setSearchLoading(true);

      try {
        const params = new URLSearchParams({
          keyword: value,
          pageNo: "1",
          pageSize: "5",
        });

        const response = await fetch(
          `${API_URL}?${params}`
        );

        if (!response.ok) {
          throw new Error(
            "Không thể tải gợi ý khóa học"
          );
        }

        const data = await response.json();

        const result =
          data?.result?.items ??
          data?.result?.content ??
          data?.items ??
          data?.content ??
          data?.data?.items ??
          data?.data?.content ??
          [];

        if (
          currentRequest === requestId.current
        ) {
          setSuggestions(
            Array.isArray(result)
              ? result
              : []
          );
        }
      } catch (error) {
        console.error(
          "Lỗi tìm kiếm gợi ý:",
          error
        );

        if (
          currentRequest === requestId.current
        ) {
          setSuggestions([]);
        }
      } finally {
        if (
          currentRequest === requestId.current
        ) {
          setSearchLoading(false);
        }
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [keyword]);

  // ========================================
  // ĐÓNG MENU KHI CLICK BÊN NGOÀI
  // ========================================

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(
          event.target
        )
      ) {
        setShowSuggestions(false);
      }

      if (
        profileRef.current &&
        !profileRef.current.contains(
          event.target
        )
      ) {
        setProfileOpen(false);
      }
    };

    document.addEventListener(
      "mousedown",
      handleClickOutside
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );
    };
  }, []);

  // ========================================
  // TÌM KIẾM
  // ========================================

  const handleSearch = (event) => {
    event?.preventDefault();

    const value = keyword.trim();

    setShowSuggestions(false);
    setMenuOpen(false);

    if (!value) {
      navigate("/student/courses");
      return;
    }

    navigate(
      `/student/search?keyword=${encodeURIComponent(
        value
      )}&page=1`
    );
  };

  const handleSuggestionClick = (course) => {
    const title =
      course.title ||
      course.courseTitle ||
      "";

    setKeyword(title);
    setShowSuggestions(false);

    navigate(
      `/student/search?keyword=${encodeURIComponent(
        title
      )}&page=1`
    );
  };

  // ========================================
  // ĐĂNG XUẤT
  // ========================================

  const handleLogout = async () => {
    if (loggingOut) return;

    setLoggingOut(true);

    try {
      await logout();
    } catch (error) {
      console.error(
        "Lỗi khi đăng xuất:",
        error
      );
    } finally {
      setLoggingOut(false);
      setProfileOpen(false);
      setMenuOpen(false);
      navigate("/login", {
        replace: true,
      });
    }
  };

  // ========================================
  // ĐI ĐẾN KHÓA HỌC CỦA TÔI
  // ========================================

  const handleMyCourses = () => {
    setMenuOpen(false);
    setProfileOpen(false);

    if (!isAuthenticated) {
      navigate("/login", {
        state: {
          from: {
            pathname: "/student/my-courses",
          },
        },
      });

      return;
    }

    navigate("/student/my-courses");
  };

  // ========================================
  // GIAO DIỆN HEADER
  // ========================================

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50 h-20 border-b border-slate-200 bg-white shadow-sm">

        <div className="mx-auto flex h-full w-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">

          {/* LOGO + NAVIGATION */}
          <div className="flex shrink-0 items-center gap-7">

            <Link
              to="/student"
              onClick={() => {
                setMenuOpen(false);
              }}
              className="flex items-center gap-2"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white">
                <GraduationCap size={22} />
              </div>

              <span className="text-xl font-extrabold tracking-tight text-blue-700">
                EduSmart
              </span>
            </Link>

            {/* MENU DESKTOP */}
            <nav className="hidden h-20 items-center gap-6 xl:flex">

              <NavLink
                to="/student"
                end
                className={navClass}
              >
                Trang chủ
              </NavLink>

              <NavLink
                to="/student/courses"
                className={navClass}
              >
                Khám phá khóa học
              </NavLink>

              {/* KHÓA HỌC CỦA TÔI */}
              <NavLink
                to="/student/my-courses"
                onClick={(event) => {
                  if (!isAuthenticated) {
                    event.preventDefault();
                    handleMyCourses();
                  }
                }}
                className={navClass}
              >
                Khóa học của tôi
              </NavLink>

            </nav>
          </div>

          {/* ========================================
              SEARCH DESKTOP
          ======================================== */}

          <div
            ref={searchRef}
            className="relative mx-2 hidden max-w-md flex-1 md:block"
          >
            <form
              onSubmit={handleSearch}
              className="relative"
            >
              <Search
                size={19}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
              />

              <input
                type="search"
                value={keyword}
                onChange={(event) => {
                  setKeyword(
                    event.target.value
                  );
                  setShowSuggestions(true);
                }}
                onFocus={() => {
                  if (keyword.trim()) {
                    setShowSuggestions(true);
                  }
                }}
                placeholder="Tìm kiếm khóa học, giảng viên..."
                autoComplete="off"
                className="h-11 w-full rounded-full border border-slate-100 bg-[#f2f3ff] pl-11 pr-4 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
              />
            </form>

            {/* GỢI Ý */}
            {showSuggestions &&
              keyword.trim() && (
                <div className="absolute left-0 right-0 top-full z-[60] mt-3 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">

                  <div className="border-b border-slate-100 px-4 py-3">
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                      Gợi ý khóa học
                    </p>
                  </div>

                  {searchLoading ? (
                    <div className="flex items-center gap-2 px-4 py-5 text-sm text-slate-500">
                      <LoaderCircle
                        size={17}
                        className="animate-spin"
                      />
                      Đang tìm kiếm...
                    </div>
                  ) : suggestions.length > 0 ? (
                    <div className="max-h-80 overflow-y-auto">

                      {suggestions.map(
                        (course, index) => {
                          const title =
                            course.title ||
                            course.courseTitle ||
                            "Khóa học";

                          return (
                            <button
                              key={
                                course.courseId ??
                                course.id ??
                                index
                              }
                              type="button"
                              onClick={() =>
                                handleSuggestionClick(
                                  course
                                )
                              }
                              className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-blue-50"
                            >
                              <Search
                                size={18}
                                className="shrink-0 text-slate-400"
                              />

                              <span className="line-clamp-2 text-sm font-medium text-slate-700">
                                {title}
                              </span>
                            </button>
                          );
                        }
                      )}

                    </div>
                  ) : (
                    <div className="px-4 py-5 text-sm text-slate-500">
                      Không tìm thấy khóa học phù hợp
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handleSearch}
                    className="w-full border-t border-slate-100 px-4 py-3 text-center text-sm font-semibold text-blue-600 transition hover:bg-blue-50"
                  >
                    Xem tất cả kết quả cho "
                    {keyword.trim()}"
                  </button>

                </div>
              )}
          </div>

          {/* ========================================
              RIGHT ACTIONS
          ======================================== */}

          <div className="flex shrink-0 items-center gap-2 sm:gap-3">

            {/* THÔNG BÁO */}
            <button
              type="button"
              aria-label="Thông báo"
              className="relative rounded-full p-2 text-slate-600 transition hover:bg-slate-100 hover:text-blue-600"
            >
              <Bell size={22} />

              <span className="absolute right-2 top-1.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
            </button>

            {/* TRỢ LÝ AI - GIAO DIỆN */}
            <span className="hidden items-center gap-1.5 rounded-full bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 lg:inline-flex">
              <Bot size={17} />
              Trợ lý AI
            </span>

            {/* ========================================
                PROFILE
            ======================================== */}

            <div
              ref={profileRef}
              className="relative"
            >
              <button
                type="button"
                onClick={() =>
                  setProfileOpen(
                    (previous) => !previous
                  )
                }
                aria-expanded={profileOpen}
                aria-haspopup="true"
                className="flex items-center gap-2 rounded-full p-1 transition hover:bg-slate-100"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-blue-700">
                  <UserRound size={21} />
                </div>

                <span className="hidden max-w-[110px] truncate text-sm font-semibold text-slate-700 lg:block">
                  {isAuthenticated
                    ? user?.fullName ||
                      user?.username ||
                      "Học viên"
                    : "Tài khoản"}
                </span>

                <ChevronDown
                  size={17}
                  className={`text-slate-500 transition-transform ${
                    profileOpen
                      ? "rotate-180"
                      : ""
                  }`}
                />
              </button>

              {/* PROFILE DROPDOWN */}
              {profileOpen && (
                <div className="absolute right-0 top-full z-[60] mt-3 w-60 overflow-hidden rounded-xl border border-slate-200 bg-white py-2 shadow-xl">

                  {isAuthenticated ? (
                    <>
                      <div className="border-b border-slate-100 px-4 py-3">

                        <p className="truncate text-sm font-bold text-slate-800">
                          {user?.fullName ||
                            user?.username}
                        </p>

                        <p className="mt-1 truncate text-xs text-slate-500">
                          @{user?.username}
                        </p>

                      </div>

                      <Link
                        to="/student/my-courses"
                        onClick={() =>
                          setProfileOpen(false)
                        }
                        className="flex items-center gap-3 px-4 py-3 text-sm text-slate-700 transition hover:bg-blue-50"
                      >
                        <BookOpen size={18} />
                        Khóa học của tôi
                      </Link>

                      <button
                        type="button"
                        onClick={handleLogout}
                        disabled={loggingOut}
                        className="flex w-full items-center gap-3 border-t border-slate-100 px-4 py-3 text-left text-sm text-red-600 transition hover:bg-red-50 disabled:opacity-60"
                      >
                        {loggingOut ? (
                          <LoaderCircle
                            size={18}
                            className="animate-spin"
                          />
                        ) : (
                          <LogOut size={18} />
                        )}

                        Đăng xuất
                      </button>
                    </>
                  ) : (
                    <>
                      <Link
                        to="/login"
                        onClick={() =>
                          setProfileOpen(false)
                        }
                        className="flex items-center gap-3 px-4 py-3 text-sm text-slate-700 hover:bg-blue-50"
                      >
                        <LogIn size={18} />
                        Đăng nhập
                      </Link>

                      <Link
                        to="/register"
                        onClick={() =>
                          setProfileOpen(false)
                        }
                        className="flex items-center gap-3 px-4 py-3 text-sm text-slate-700 hover:bg-blue-50"
                      >
                        <UserPlus size={18} />
                        Đăng ký
                      </Link>
                    </>
                  )}

                </div>
              )}
            </div>

            {/* ========================================
                MOBILE MENU BUTTON
            ======================================== */}

            <button
              type="button"
              onClick={() =>
                setMenuOpen(
                  (previous) => !previous
                )
              }
              aria-label="Menu điều hướng"
              aria-expanded={menuOpen}
              className="rounded-lg p-2 text-slate-700 transition hover:bg-slate-100 xl:hidden"
            >
              {menuOpen ? (
                <X size={23} />
              ) : (
                <Menu size={23} />
              )}
            </button>

          </div>
        </div>
      </header>

      {/* ========================================
          MOBILE MENU
      ======================================== */}

      {menuOpen && (
        <nav className="fixed inset-x-0 top-20 z-40 flex flex-col gap-1 border-b border-slate-200 bg-white p-4 shadow-lg xl:hidden">

          <NavLink
            to="/student"
            end
            onClick={() =>
              setMenuOpen(false)
            }
            className="rounded-lg px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-blue-50"
          >
            Trang chủ
          </NavLink>

          <NavLink
            to="/student/courses"
            onClick={() =>
              setMenuOpen(false)
            }
            className="rounded-lg px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-blue-50"
          >
            Khám phá khóa học
          </NavLink>

          <button
            type="button"
            onClick={handleMyCourses}
            className="rounded-lg px-4 py-3 text-left text-sm font-semibold text-slate-700 hover:bg-blue-50"
          >
            Khóa học của tôi
          </button>

          {/* MOBILE SEARCH */}
          <form
            onSubmit={handleSearch}
            className="mt-2 flex gap-2 border-t border-slate-100 pt-3 md:hidden"
          >
            <input
              type="search"
              value={keyword}
              onChange={(event) =>
                setKeyword(event.target.value)
              }
              placeholder="Tìm kiếm khóa học..."
              className="min-w-0 flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
            />

            <button
              type="submit"
              className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white"
            >
              Tìm
            </button>
          </form>

        </nav>
      )}
    </>
  );
}
