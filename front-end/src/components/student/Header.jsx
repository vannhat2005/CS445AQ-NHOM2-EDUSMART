import React, {
  useEffect,
  useRef,
  useState,
} from "react";
import { UserRound } from "lucide-react";
import {
  Link,
  NavLink,
  useLocation,
  useNavigate,
} from "react-router-dom";
import toast from "react-hot-toast";

import { useAuth } from "../../context/AuthContext";
import LogoutModal from "../common/LogoutModal";
import api from "../../services/api";

const MY_COURSES_PATH = "/student/my-courses";

// ========================================
// HEADER STUDENT
// ========================================

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();

  const { user, isAuthenticated, logout } = useAuth();

  // ========================================
  // STATES
  // ========================================

  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const [keyword, setKeyword] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);

  const [logoutModalOpen, setLogoutModalOpen] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);

  const searchRef = useRef(null);
  const profileRef = useRef(null);
  const requestId = useRef(0);

  // ========================================
  // THÔNG TIN TÀI KHOẢN
  // ========================================

  const displayName =
    user?.fullName ||
    user?.username ||
    "Học viên";

  const displayEmail =
    user?.email ||
    "";

  // ========================================
  // STYLE NAVIGATION
  // ========================================

  const navClass = ({ isActive }) =>
    `h-full flex items-center font-semibold text-sm transition-colors border-b-2 px-1 ${
      isActive
        ? "text-blue-700 border-blue-700 font-bold"
        : "text-slate-600 hover:text-blue-700 border-transparent"
    }`;

  // ========================================
  // ĐÓNG MENU KHI CHUYỂN TRANG & ĐỒNG BỘ TỪ KHÓA
  // ========================================

  const searchParams = new URLSearchParams(location.search);
  const keywordFromUrl = (searchParams.get("keyword") || "").trim().replace(/\s+/g, " ");

  useEffect(() => {
    setMenuOpen(false);
    setProfileOpen(false);
    setShowSuggestions(false);
  }, [location.pathname, location.search]);

  useEffect(() => {
    if (location.pathname === "/student/search") {
      setKeyword(keywordFromUrl);
    }
  }, [location.pathname, keywordFromUrl]);

  useEffect(() => {
    const handleSync = (e) => {
      if (e.detail?.keyword !== undefined) {
        setKeyword(e.detail.keyword);
      }
    };
    window.addEventListener("edusmart-search-sync", handleSync);
    return () => window.removeEventListener("edusmart-search-sync", handleSync);
  }, []);

  // ========================================
  // ĐÓNG DROPDOWN KHI CLICK BÊN NGOÀI
  // ========================================

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target)
      ) {
        setShowSuggestions(false);
      }

      if (
        profileRef.current &&
        !profileRef.current.contains(event.target)
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
  // API GỢI Ý TÌM KIẾM
  // ========================================

  useEffect(() => {
    const value = keyword.trim().replace(/\s+/g, " ");

    if (!value) {
      requestId.current += 1;
      setSuggestions([]);
      setSearchLoading(false);
      setShowSuggestions(false);
      return;
    }

    const currentRequest = ++requestId.current;

    const timer = setTimeout(async () => {
      setSearchLoading(true);

      try {
        const response = await api.get("/courses/search", {
          params: {
            keyword: value,
            pageNo: 1,
            pageSize: 5,
          },
        });

        const data = response?.data;
        const result =
          data?.result?.items ??
          data?.result?.content ??
          data?.items ??
          data?.content ??
          data?.data?.items ??
          data?.data?.content ??
          [];

        if (currentRequest === requestId.current) {
          setSuggestions(
            Array.isArray(result)
              ? result
              : []
          );
        }
      } catch (error) {
        if (currentRequest === requestId.current) {
          console.error(
            "Lỗi tìm kiếm gợi ý:",
            error
          );
          setSuggestions([]);
        }
      } finally {
        if (currentRequest === requestId.current) {
          setSearchLoading(false);
        }
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [keyword]);

  // ========================================
  // TÌM KIẾM KHÓA HỌC
  // ========================================

  const handleSearch = (event) => {
    event?.preventDefault();

    const value = keyword.trim().replace(/\s+/g, " ");

    setShowSuggestions(false);
    setMenuOpen(false);

    if (!value) {
      navigate("/student/courses");
      return;
    }

    const triggerId = Date.now();
    navigate(
      `/student/search?keyword=${encodeURIComponent(
        value
      )}&page=1`,
      { state: { searchTrigger: triggerId } }
    );

    window.dispatchEvent(
      new CustomEvent("edusmart-search-sync", { detail: { keyword: value } })
    );

    setTimeout(() => {
      document.getElementById("courses-section")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 80);
  };

  // ========================================
  // CHỌN GỢI Ý KHÓA HỌC
  // ========================================

  const handleSuggestionClick = (course) => {
    const title =
      course.title ||
      course.courseTitle ||
      "";

    setKeyword(title);
    setShowSuggestions(false);

    const triggerId = Date.now();
    navigate(
      `/student/search?keyword=${encodeURIComponent(
        title
      )}&page=1`,
      { state: { searchTrigger: triggerId } }
    );

    window.dispatchEvent(
      new CustomEvent("edusmart-search-sync", { detail: { keyword: title } })
    );

    setTimeout(() => {
      document.getElementById("courses-section")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 80);
  };

  // ========================================
  // KHÓA HỌC CỦA TÔI
  // ========================================

  const handleMyCourses = () => {
    setMenuOpen(false);
    setProfileOpen(false);
    setShowSuggestions(false);

    navigate(MY_COURSES_PATH);
  };

  // ========================================
  // ĐÓNG MOBILE MENU
  // ========================================

  const closeMobileMenu = () => {
    setMenuOpen(false);
  };

  // ========================================
  // ĐĂNG XUẤT
  // ========================================

  const handleConfirmLogout = async () => {
    if (logoutLoading) return;
    setLogoutLoading(true);

    try {
      await logout();
      setLogoutModalOpen(false);
      toast.success("Đăng xuất thành công!");
      navigate("/login", { replace: true });
    } catch (error) {
      console.error("Lỗi đăng xuất:", error);
      toast.error("Không thể đăng xuất. Vui lòng thử lại.");
    } finally {
      setLogoutLoading(false);
    }
  };

  // ========================================
  // RENDER
  // ========================================

  return (
    <>
      {/* ========================================
          HEADER CONTAINER
      ======================================== */}
      <header className="fixed left-0 right-0 top-0 z-50 h-20 border-b border-slate-200 border-surface-variant bg-white/95 bg-surface-container-lowest backdrop-blur-md shadow-[0_1px_8px_rgba(0,0,0,0.06)]">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">

          {/* ========================================
              LOGO + DESKTOP NAV
          ======================================== */}
          <div className="flex flex-shrink-0 items-center gap-6">

            {/* LOGO */}
            <Link
              to="/student"
              onClick={() => {
                setMenuOpen(false);
                setProfileOpen(false);
              }}
              className="group flex items-center gap-2.5 focus:outline-none"
            >
              <img
                alt="EduSmart Logo"
                className="h-8 w-auto object-contain"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBjEn4LuRxFdKzCHfhDAhJSJAM-8J3t2lti012G4lFKPra8G0HL27HRMzZBOkRzMRrD9DcFIJWv8iONjYYGe5EPb_sb9N--02vRRmeWnmIQILUYdkDwbVt9IAyR-zD0TyOhFSaRI5Fu7OQZaXquxx-8Sy0kwyJ8JqBcaMO07GAUHEMARjjsSceMiRtTYxQOmdEKEzLRyJTpUTmH-306dT5-aGLTdhoZs2XjFF4nfXJC"
              />

              <span className="text-xl font-extrabold tracking-tight text-blue-700 text-primary">
                EduSmart
              </span>
            </Link>

            {/* DESKTOP MENU */}
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

              <NavLink
                to={MY_COURSES_PATH}
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
            className="relative mx-3 hidden max-w-md flex-1 items-center md:flex"
          >
            <form
              onSubmit={handleSearch}
              className="relative w-full"
            >
              <span className="material-symbols-outlined pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 select-none text-[20px] text-slate-400">
                search
              </span>

              <input
                value={keyword}
                onChange={(event) => {
                  setKeyword(event.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => {
                  if (keyword.trim()) {
                    setShowSuggestions(true);
                  }
                }}
                className="w-full rounded-full border border-slate-200 bg-slate-50 py-2 pl-11 pr-10 text-sm text-slate-800 outline-none transition-all placeholder:text-slate-400 hover:bg-slate-100 focus:border-blue-600 focus:bg-white"
                placeholder="Tìm kiếm khóa học, giảng viên..."
                type="search"
                autoComplete="off"
                aria-label="Tìm kiếm khóa học"
              />

              <button
                type="submit"
                aria-label="Tìm kiếm"
                className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center justify-center w-7 h-7 rounded-full bg-blue-600 hover:bg-blue-700 text-white transition-colors cursor-pointer shadow-sm"
              >
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </button>
            </form>

            {/* SEARCH SUGGESTIONS */}
            {showSuggestions && keyword.trim() && (
              <div className="absolute left-0 right-0 top-full z-[60] mt-3 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
                <div className="border-b border-slate-100 px-4 py-3">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                    Gợi ý khóa học
                  </p>
                </div>

                {searchLoading ? (
                  <div className="px-4 py-5 text-sm text-slate-500">
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
                              handleSuggestionClick(course)
                            }
                            className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-blue-50"
                          >
                            <span className="material-symbols-outlined text-[20px] text-slate-400">
                              search
                            </span>

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
                  className="flex w-full items-center justify-center gap-2 border-t border-slate-100 px-4 py-3 text-sm font-semibold text-blue-600 transition-colors hover:bg-blue-50"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    search
                  </span>
                  Xem tất cả kết quả cho "{keyword.trim()}"
                </button>
              </div>
            )}
          </div>

          {/* ========================================
              RIGHT ACTIONS
          ======================================== */}
          <div className="flex flex-shrink-0 items-center gap-2 sm:gap-3 lg:gap-4">

            {/* NOTIFICATIONS */}
            <button
              aria-label="Thông báo"
              type="button"
              className="relative rounded-full p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
            >
              <span className="material-symbols-outlined text-[24px]">
                notifications
              </span>

              <span className="absolute right-1.5 top-1.5 h-2.5 w-2.5 rounded-full bg-red-600 ring-2 ring-white" />
            </button>

            {/* AI ASSISTANT */}
            <a
              className="hidden items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 transition-colors hover:bg-blue-100 sm:inline-flex"
              href="#"
            >
              <span className="material-symbols-outlined text-[18px]">
                smart_toy
              </span>
              <span>Trợ lý AI</span>
            </a>

            {/* ========================================
                PROFILE
            ======================================== */}
            <div
              ref={profileRef}
              className="relative group"
            >
              {/* PROFILE BUTTON */}
              <button
                type="button"
                onClick={() =>
                  setProfileOpen((prev) => !prev)
                }
                aria-expanded={profileOpen}
                aria-haspopup="true"
                className="flex items-center gap-2 rounded-full p-1 transition-colors hover:bg-slate-100"
              >
                {/* ẢNH ĐẠI DIỆN HỌC VIÊN */}
                {user?.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt="Ảnh đại diện"
                    className="h-8 w-8 shrink-0 rounded-full object-cover ring-1 ring-slate-200"
                  />
                ) : (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                    <UserRound size={19} />
                  </div>
                )}

                <span className="hidden max-w-[120px] truncate text-sm font-semibold text-slate-700 lg:block">
                  {isAuthenticated
                    ? displayName
                    : "Tài khoản"}
                </span>

                <span
                  className={`material-symbols-outlined text-[20px] text-slate-400 transition-transform duration-200 ${
                    profileOpen
                      ? "rotate-180"
                      : ""
                  }`}
                >
                  expand_more
                </span>
              </button>

              {/* PROFILE DROPDOWN */}
              {profileOpen && (
                <div className="absolute right-0 top-full z-50 mt-2 w-56 rounded-xl border border-slate-200 bg-white py-2 shadow-lg">

                  {/* ACCOUNT INFO */}
                  <div className="border-b border-slate-100 px-4 py-2">
                    <p className="truncate text-sm font-bold text-slate-800">
                      {isAuthenticated
                        ? displayName
                        : "Khách"}
                    </p>

                    {isAuthenticated &&
                      displayEmail && (
                        <p className="truncate text-xs text-slate-500">
                          {displayEmail}
                        </p>
                      )}
                  </div>

                  {/* QUẢN LÝ THÔNG TIN CÁ NHÂN */}
                  <Link
                    to={isAuthenticated ? "/student/profile" : "/login"}
                    onClick={() => setProfileOpen(false)}
                    className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900"
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      person
                    </span>
                    <span>Hồ sơ cá nhân</span>
                  </Link>

                  {/* PAYMENT HISTORY */}
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      setProfileOpen(false);
                    }}
                    className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900"
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      receipt_long
                    </span>
                    <span>Lịch sử thanh toán</span>
                  </a>

                  {/* MY COURSES */}
                  <button
                    type="button"
                    onClick={handleMyCourses}
                    className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900"
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      menu_book
                    </span>
                    <span>Khóa học của tôi</span>
                  </button>

                  {/* LOGOUT / AUTH LINKS */}
                  {isAuthenticated ? (
                    <div className="border-t border-slate-100 pt-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setProfileOpen(false);
                          setLogoutModalOpen(true);
                        }}
                        className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-red-600 transition-colors hover:bg-red-50 hover:text-red-700"
                      >
                        <span className="material-symbols-outlined text-[20px]">
                          logout
                        </span>
                        <span>Đăng xuất</span>
                      </button>
                    </div>
                  ) : (
                    <div className="border-t border-slate-100 pt-1.5">
                      <Link
                        to="/login"
                        onClick={() =>
                          setProfileOpen(false)
                        }
                        className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-600 transition-colors hover:bg-slate-50"
                      >
                        <span className="material-symbols-outlined text-[20px]">
                          login
                        </span>
                        Đăng nhập
                      </Link>

                      <Link
                        to="/register"
                        onClick={() =>
                          setProfileOpen(false)
                        }
                        className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-600 transition-colors hover:bg-slate-50"
                      >
                        <span className="material-symbols-outlined text-[20px]">
                          person_add
                        </span>
                        Đăng ký
                      </Link>
                    </div>
                  )}

                </div>
              )}
            </div>

            {/* MOBILE MENU BUTTON */}
            <button
              type="button"
              onClick={() =>
                setMenuOpen((prev) => !prev)
              }
              aria-label="Menu điều hướng"
              aria-expanded={menuOpen}
              className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 xl:hidden"
            >
              <span className="material-symbols-outlined text-[26px]">
                {menuOpen
                  ? "close"
                  : "menu"}
              </span>
            </button>

          </div>
        </div>
      </header>

      {/* ========================================
          MOBILE MENU
      ======================================== */}
      {menuOpen && (
        <nav className="fixed left-0 right-0 top-20 z-40 flex flex-col gap-4 border-b border-slate-200 bg-white p-5 shadow-lg xl:hidden">
          <Link
            to="/student"
            onClick={closeMobileMenu}
            className="text-sm font-semibold text-slate-700 hover:text-blue-700"
          >
            Trang chủ
          </Link>

          <Link
            to="/student/courses"
            onClick={closeMobileMenu}
            className="text-sm font-semibold text-slate-700 hover:text-blue-700"
          >
            Khám phá khóa học
          </Link>

          <Link
            to={MY_COURSES_PATH}
            onClick={closeMobileMenu}
            className="text-sm font-semibold text-slate-700 hover:text-blue-700"
          >
            Khóa học của tôi
          </Link>

          {/* MOBILE SEARCH */}
          <form
            onSubmit={(event) => {
              handleSearch(event);
              closeMobileMenu();
            }}
            className="flex gap-2 border-t border-slate-100 pt-3 md:hidden"
          >
            <input
              value={keyword}
              onChange={(event) =>
                setKeyword(event.target.value)
              }
              type="search"
              placeholder="Tìm kiếm khóa học..."
              className="min-w-0 flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
            />

            <button
              type="submit"
              className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white"
            >
              Tìm
            </button>
          </form>
        </nav>
      )}

      {/* ========================================
          LOGOUT MODAL
      ======================================== */}
      <LogoutModal
        isOpen={logoutModalOpen}
        onClose={() => {
          if (!logoutLoading) setLogoutModalOpen(false);
        }}
        onConfirm={handleConfirmLogout}
        loading={logoutLoading}
      />
    </>
  );
}
