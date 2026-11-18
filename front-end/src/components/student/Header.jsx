
import React, {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  Link,
  NavLink,
  useLocation,
  useNavigate,
} from "react-router-dom";

import { useAuth } from "../../context/AuthContext";
import LogoutButton from "../auth/LogoutButton";

const API_URL = "/api/courses/search";

const MY_COURSES_PATH = "/student/my-courses";

// ========================================
// HEADER STUDENT
// ========================================

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();

  const { user, isAuthenticated } = useAuth();

  // ========================================
  // STATES
  // ========================================

  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const [keyword, setKeyword] = useState("");
  const [suggestions, setSuggestions] = useState([]);

  const [showSuggestions, setShowSuggestions] =
    useState(false);

  const [searchLoading, setSearchLoading] =
    useState(false);

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
    `h-full flex items-center font-title-sm text-title-sm transition-colors border-b-2 ${
      isActive
        ? "text-primary border-primary"
        : "text-on-surface-variant hover:text-primary border-transparent"
    }`;

  // ========================================
  // ĐÓNG MENU KHI CHUYỂN TRANG
  // ========================================

  useEffect(() => {
    setMenuOpen(false);
    setProfileOpen(false);
    setShowSuggestions(false);
  }, [location.pathname, location.search]);

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
    const value = keyword.trim();

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

        if (currentRequest === requestId.current) {
          setSuggestions(
            Array.isArray(result)
              ? result
              : []
          );
        }
      } catch (error) {
        console.error(
          "Lỗi tìm kiếm khóa học:",
          error
        );

        if (currentRequest === requestId.current) {
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

    navigate(
      `/student/search?keyword=${encodeURIComponent(
        title
      )}&page=1`
    );
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
  // RENDER
  // ========================================

  return (
    <>
      {/* ========================================
          HEADER
      ======================================== */}

      <header className="fixed left-0 right-0 top-0 z-50 h-20 border-b border-surface-variant bg-surface-container-lowest shadow-[0_1px_8px_rgba(0,0,0,0.06)]">

        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-space-md px-margin-mobile md:px-margin-tablet lg:px-margin">

          {/* ========================================
              LOGO + DESKTOP NAV
          ======================================== */}

          <div className="flex flex-shrink-0 items-center gap-space-lg">

            {/* LOGO */}
            <Link
              to="/student"
              onClick={() => {
                setMenuOpen(false);
                setProfileOpen(false);
              }}
              className="group flex items-center gap-space-sm focus:outline-none"
            >
              <img
                alt="EduSmart Logo"
                className="h-8 w-auto object-contain"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBjEn4LuRxFdKzCHfhDAhJSJAM-8J3t2lti012G4lFKPra8G0HL27HRMzZBOkRzMRrD9DcFIJWv8iONjYYGe5EPb_sb9N--02vRRmeWnmIQILUYdkDwbVt9IAyR-zD0TyOhFSaRI5Fu7OQZaXquxx-8Sy0kwyJ8JqBcaMO07GAUHEMARjjsSceMiRtTYxQOmdEKEzLRyJTpUTmH-306dT5-aGLTdhoZs2XjFF4nfXJC"
              />

              <span className="font-headline-sm text-headline-sm font-extrabold tracking-tight text-primary">
                EduSmart
              </span>
            </Link>

            {/* DESKTOP MENU */}
            <nav className="hidden h-20 items-center gap-space-lg xl:flex">

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
            className="relative mx-space-sm hidden max-w-md flex-1 items-center md:flex"
          >
            <form
              onSubmit={handleSearch}
              className="relative w-full"
            >
              <span className="material-symbols-outlined pointer-events-none absolute left-space-md top-1/2 -translate-y-1/2 select-none text-[20px] text-outline">
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
                className="w-full rounded-full border border-transparent bg-surface-container-low py-space-sm pl-11 pr-space-md font-body-sm text-body-sm text-on-surface outline-none transition-all placeholder:text-outline hover:bg-surface-container focus:border-primary focus:bg-surface-container-lowest"
                placeholder="Tìm kiếm khóa học, giảng viên..."
                type="search"
                autoComplete="off"
                aria-label="Tìm kiếm khóa học"
              />
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
                            className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-indigo-50"
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
                  className="flex w-full items-center justify-center gap-2 border-t border-slate-100 px-4 py-3 text-sm font-semibold text-indigo-600 transition-colors hover:bg-indigo-50"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    search
                  </span>

                  Xem tất cả kết quả cho "
                  {keyword.trim()}"
                </button>

              </div>
            )}
          </div>

          {/* ========================================
              RIGHT ACTIONS
          ======================================== */}

          <div className="flex flex-shrink-0 items-center gap-space-sm lg:gap-space-md">

            {/* NOTIFICATIONS */}
            <button
              aria-label="Thông báo"
              type="button"
              className="relative rounded-full p-space-sm text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-on-surface"
            >
              <span className="material-symbols-outlined text-[24px]">
                notifications
              </span>

              <span className="absolute right-1.5 top-1.5 h-2.5 w-2.5 rounded-full bg-error ring-2 ring-surface-container-lowest" />
            </button>

            {/* AI ASSISTANT */}
            <a
              className="hidden items-center gap-space-xs rounded-full bg-secondary-fixed px-3 py-1.5 font-label-md text-label-md text-on-secondary-fixed transition-colors hover:bg-secondary-fixed-dim sm:inline-flex"
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
                className="flex items-center gap-space-xs rounded-full p-1 transition-colors hover:bg-surface-container"
              >
                <img
                  alt="Profile"
                  className="h-8 w-8 rounded-full object-cover ring-1 ring-outline-variant"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuCHi4t6EzvBCeJMQWLU4uXSE1qyGan5XZq0H74MkCuxeZGJo40h5SQ6DZggL5lau6zQAEbJ0_rbLz0gaKubjCl3DnkLwstSRhtOgic3Y09rhTyEh8h_x4GJIe20KzAOGSkcPW3wMT2ZmEZPcAAeDG3KTDt0FYyGdYbJu-QV1zuF2nZrbYpxvWfv1_tYf6fINjo15GONdFx5AUegiUW9FbGudy"
                />

                <span className="hidden max-w-[120px] truncate font-label-lg text-label-lg text-on-surface lg:block">
                  {isAuthenticated
                    ? displayName
                    : "Tài khoản"}
                </span>

                <span
                  className={`material-symbols-outlined text-[20px] text-outline transition-transform duration-200 ${
                    profileOpen
                      ? "rotate-180"
                      : ""
                  }`}
                >
                  expand_more
                </span>
              </button>

              {/* ========================================
                  PROFILE DROPDOWN
              ======================================== */}

              {profileOpen && (
                <div className="absolute right-0 top-full z-50 mt-2 w-56 rounded-xl border border-surface-variant bg-surface-container-lowest py-2 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.1)]">

                  {/* ACCOUNT INFO */}
                  <div className="border-b border-surface-variant px-4 py-2">
                    <p className="truncate font-label-lg text-label-lg font-bold text-on-surface">
                      {isAuthenticated
                        ? displayName
                        : "Khách"}
                    </p>

                    {isAuthenticated &&
                      displayEmail && (
                        <p className="truncate font-label-sm text-label-sm text-outline">
                          {displayEmail}
                        </p>
                      )}
                  </div>

                  {/* PROFILE */}
                  <a
                    href="#"
                    onClick={() =>
                      setProfileOpen(false)
                    }
                    className="flex items-center gap-space-sm px-4 py-2.5 font-body-sm text-body-sm text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-on-surface"
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      person
                    </span>

                    <span>Hồ sơ cá nhân</span>
                  </a>

                  {/* PAYMENT HISTORY */}
                  <a
                    href="#"
                    onClick={() =>
                      setProfileOpen(false)
                    }
                    className="flex items-center gap-space-sm px-4 py-2.5 font-body-sm text-body-sm text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-on-surface"
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
                    className="flex w-full items-center gap-space-sm px-4 py-2.5 text-left font-body-sm text-body-sm text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-on-surface"
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      menu_book
                    </span>

                    <span>Khóa học của tôi</span>
                  </button>

                  {/* ========================================
                      LOGOUT
                  ======================================== */}

                  {isAuthenticated ? (
                    <div className="border-t border-surface-variant pt-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setProfileOpen(false);

                          document
                            .getElementById(
                              "student-logout-trigger"
                            )
                            ?.click();
                        }}
                        className="flex w-full items-center gap-space-sm px-4 py-2.5 text-left font-body-sm text-body-sm text-error transition-colors hover:bg-error-container hover:text-on-error-container"
                      >
                        <span className="material-symbols-outlined text-[20px]">
                          logout
                        </span>

                        <span>Đăng xuất</span>
                      </button>
                    </div>
                  ) : (
                    <div className="border-t border-surface-variant pt-1.5">

                      <Link
                        to="/login"
                        onClick={() =>
                          setProfileOpen(false)
                        }
                        className="flex items-center gap-space-sm px-4 py-2.5 font-body-sm text-body-sm text-on-surface-variant transition-colors hover:bg-surface-container-high"
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
                        className="flex items-center gap-space-sm px-4 py-2.5 font-body-sm text-body-sm text-on-surface-variant transition-colors hover:bg-surface-container-high"
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
              className="rounded-lg p-space-sm text-on-surface-variant hover:bg-surface-container xl:hidden"
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
        <nav className="fixed left-0 right-0 top-20 z-40 flex flex-col gap-4 bg-white p-5 shadow-lg xl:hidden">

          <Link
            to="/student"
            onClick={closeMobileMenu}
          >
            Trang chủ
          </Link>

          <Link
            to="/student/courses"
            onClick={closeMobileMenu}
          >
            Khám phá khóa học
          </Link>

          <Link
            to={MY_COURSES_PATH}
            onClick={closeMobileMenu}
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
              className="min-w-0 flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-500"
            />

            <button
              type="submit"
              className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white"
            >
              Tìm
            </button>
          </form>

        </nav>
      )}

      {/* ========================================
          LOGOUT BUTTON DÙNG CHUNG
          
          Luôn được mount ngoài dropdown.
          Khi dropdown đóng, LogoutModal
          vẫn tồn tại và hiển thị bình thường.
      ======================================== */}

      {isAuthenticated && (
        <div className="hidden">
          <LogoutButton
            className="hidden"
          >
            <span id="student-logout-trigger">
              Đăng xuất
            </span>
          </LogoutButton>
        </div>
      )}

    </>
  );
}
