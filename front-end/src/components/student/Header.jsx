
import React, { useEffect, useRef, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import LogoutModal from '../common/LogoutModal';

const API_URL = "/api/courses/search";

export default function Header() {
  const navigate = useNavigate();

  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const [keyword, setKeyword] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);

  const searchRef = useRef(null);
  const requestId = useRef(0);

  const navClass = ({ isActive }) =>
    `h-full flex items-center font-title-sm text-title-sm transition-colors border-b-2 ${
      isActive
        ? "text-primary border-primary"
        : "text-on-surface-variant hover:text-primary border-transparent"
    }`;

  // Gọi API gợi ý sau khi người dùng ngừng nhập 350ms
  useEffect(() => {
    const value = keyword.trim();

    if (!value) {
      requestId.current += 1;
      setSuggestions([]);
      setLoading(false);
      setShowSuggestions(false);
      return;
    }

    const currentRequest = ++requestId.current;

    const timer = setTimeout(async () => {
      setLoading(true);

      try {
        const params = new URLSearchParams({
          keyword: value,
          pageNo: "1",
          pageSize: "5",
        });

        const response = await fetch(`${API_URL}?${params}`);

        if (!response.ok) {
          throw new Error("Không thể tải gợi ý khóa học");
        }

        const data = await response.json();

        // Tương thích với các kiểu PageResponse thường gặp
        const result =
          data?.items ??
          data?.content ??
          data?.data?.items ??
          data?.data?.content ??
          [];

        if (currentRequest === requestId.current) {
          setSuggestions(Array.isArray(result) ? result : []);
        }
      } catch (error) {
        console.error("Lỗi tìm kiếm gợi ý:", error);

        if (currentRequest === requestId.current) {
          setSuggestions([]);
        }
      } finally {
        if (currentRequest === requestId.current) {
          setLoading(false);
        }
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [keyword]);

  // Đóng gợi ý khi click bên ngoài
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSearch = (event) => {
    event?.preventDefault();

    const value = keyword.trim();

    if (!value) {
      navigate("/student/courses");
      return;
    }

    setShowSuggestions(false);
    navigate(`/student/search?keyword=${encodeURIComponent(value)}&page=1`);
  };

  const handleSuggestionClick = (course) => {
    const title = course.title || course.courseTitle || "";

    setKeyword(title);
    setShowSuggestions(false);

    navigate(
      `/student/search?keyword=${encodeURIComponent(title)}&page=1`
    );
  };

  const closeMobileMenu = () => setMenuOpen(false);

  return (
    <>
      <header className="fixed top-0 left-0 right-0 h-20 z-50 bg-surface-container-lowest shadow-[0_1px_8px_rgba(0,0,0,0.06)] border-b border-surface-variant">
        <div className="h-20 max-w-7xl mx-auto px-margin-mobile md:px-margin-tablet lg:px-margin flex items-center justify-between gap-space-md">

          {/* LOGO VÀ MENU DESKTOP */}
          <div className="flex items-center gap-space-lg flex-shrink-0">
            <Link
              className="flex items-center gap-space-sm group focus:outline-none"
              to="/student"
            >
              <img
                alt="EduSmart Logo"
                className="h-8 w-auto object-contain"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBjEn4LuRxFdKzCHfhDAhJSJAM-8J3t2lti012G4lFKPra8G0HL27HRMzZBOkRzMRrD9DcFIJWv8iONjYYGe5EPb_sb9N--02vRRmeWnmIQILUYdkDwbVt9IAyR-zD0TyOhFSaRI5Fu7OQZaXquxx-8Sy0kwyJ8JqBcaMO07GAUHEMARjjsSceMiRtTYxQOmdEKEzLRyJTpUTmH-306dT5-aGLTdhoZs2XjFF4nfXJC"
              />

              <span className="font-headline-sm text-headline-sm text-primary tracking-tight font-extrabold">
                EduSmart
              </span>
            </Link>

            <nav className="hidden xl:flex items-center gap-space-lg h-20">
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

              <a
                className="h-full flex items-center text-on-surface-variant hover:text-primary font-title-sm text-title-sm transition-colors border-b-2 border-transparent"
                href="#courses"
              >
                Khóa học của tôi
              </a>
            </nav>
          </div>

          {/* THANH TÌM KIẾM */}
          <div
            ref={searchRef}
            className="hidden md:flex flex-1 max-w-md mx-space-sm items-center relative"
          >
            <form
              onSubmit={handleSearch}
              className="w-full relative"
            >
              <span className="material-symbols-outlined absolute left-space-md top-1/2 -translate-y-1/2 text-outline pointer-events-none select-none text-[20px]">
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
                className="w-full pl-11 pr-space-md py-space-sm bg-surface-container-low hover:bg-surface-container text-on-surface placeholder:text-outline font-body-sm text-body-sm rounded-full border border-transparent focus:border-primary focus:bg-surface-container-lowest focus:outline-none transition-all"
                placeholder="Tìm kiếm khóa học, giảng viên..."
                type="search"
                autoComplete="off"
                aria-label="Tìm kiếm khóa học"
              />
            </form>

            {/* GỢI Ý TÌM KIẾM */}
            {showSuggestions && keyword.trim() && (
              <div className="absolute top-full left-0 right-0 mt-3 bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden z-[60]">

                <div className="px-4 py-3 border-b border-slate-100">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                    Gợi ý khóa học
                  </p>
                </div>

                {loading ? (
                  <div className="px-4 py-5 text-sm text-slate-500">
                    Đang tìm kiếm...
                  </div>
                ) : suggestions.length > 0 ? (
                  <div className="max-h-80 overflow-y-auto">
                    {suggestions.map((course, index) => {
                      const title =
                        course.title ||
                        course.courseTitle ||
                        "Khóa học";

                      return (
                        <button
                          key={course.courseId ?? course.id ?? index}
                          type="button"
                          onClick={() => handleSuggestionClick(course)}
                          className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-indigo-50 transition-colors"
                        >
                          <span className="material-symbols-outlined text-slate-400 text-[20px]">
                            search
                          </span>

                          <span className="text-sm font-medium text-slate-700 line-clamp-2">
                            {title}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="px-4 py-5 text-sm text-slate-500">
                    Không tìm thấy khóa học phù hợp
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleSearch}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 border-t border-slate-100 text-sm font-semibold text-indigo-600 hover:bg-indigo-50 transition-colors"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    search
                  </span>
                  Xem tất cả kết quả cho "{keyword.trim()}"
                </button>
              </div>
            )}
          </div>

          {/* CÁC NÚT BÊN PHẢI */}
          <div className="flex items-center gap-space-sm lg:gap-space-md flex-shrink-0">

            {/* THÔNG BÁO */}
            <button
              aria-label="Thông báo"
              className="relative p-space-sm rounded-full text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors focus:outline-none"
              type="button"
            >
              <span className="material-symbols-outlined text-[24px]">
                notifications
              </span>

              <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-error rounded-full ring-2 ring-surface-container-lowest" />
            </button>

            {/* TRỢ LÝ AI */}
            <a
              className="hidden sm:inline-flex items-center gap-space-xs px-3 py-1.5 rounded-full bg-secondary-fixed text-on-secondary-fixed hover:bg-secondary-fixed-dim transition-colors font-label-md text-label-md"
              href="#"
            >
              <span className="material-symbols-outlined text-[18px]">
                smart_toy
              </span>
              <span>Trợ lý AI</span>
            </a>

            {/* PROFILE */}
            <div className="relative group">
              <button
                onClick={() => setProfileOpen((prev) => !prev)}
                aria-expanded={profileOpen}
                aria-haspopup="true"
                className="flex items-center gap-space-xs p-1 rounded-full hover:bg-surface-container transition-colors focus:outline-none"
                type="button"
              >
                <img
                  alt="Profile"
                  className="w-8 h-8 rounded-full object-cover ring-1 ring-outline-variant"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuCHi4t6EzvBCeJMQWLU4uXSE1qyGan5XZq0H74MkCuxeZGJo40h5SQ6DZggL5lau6zQAEbJ0_rbLz0gaKubjCl3DnkLwstSRhtOgic3Y09rhTyEh8h_x4GJIe20KzAOGSkcPW3wMT2ZmEZPcAAeDG3KTDt0FYyGdYbJu-QV1zuF2nZrbYpxvWfv1_tYf6fINjo15GONdFx5AUegiUW9FbGudy"
                />

                <span className="hidden lg:block font-label-lg text-label-lg text-on-surface max-w-[120px] truncate">
                  Nguyễn Văn A
                </span>

                <span className="material-symbols-outlined text-outline text-[20px] group-hover:rotate-180 transition-transform duration-200">
                  expand_more
                </span>
              </button>

              {/* DROPDOWN PROFILE */}
              {profileOpen && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-surface-container-lowest rounded-xl shadow-[0_10px_25px_-5px_rgba(0,0,0,0.1)] border border-surface-variant py-2 z-50">

                  <div className="px-4 py-2 border-b border-surface-variant lg:hidden">
                    <p className="font-label-lg text-label-lg text-on-surface font-bold truncate">
                      Nguyễn Văn A
                    </p>
                    <p className="font-label-sm text-label-sm text-outline truncate">
                      student@edusmart.edu.vn
                    </p>
                  </div>

                  <a
                    className="flex items-center gap-space-sm px-4 py-2.5 font-body-sm text-body-sm text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors"
                    href="#"
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      person
                    </span>
                    <span>Hồ sơ cá nhân</span>
                  </a>

                  <a
                    className="flex items-center gap-space-sm px-4 py-2.5 font-body-sm text-body-sm text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors"
                    href="#"
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      receipt_long
                    </span>
                    <span>Lịch sử thanh toán</span>
                  </a>

                  <div className="my-1.5 border-t border-surface-variant" />

                  <a
                    className="flex items-center gap-space-sm px-4 py-2.5 font-body-sm text-body-sm text-error hover:bg-error-container hover:text-on-error-container transition-colors"
                    href="#"
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      logout
                    </span>
                    <span>Đăng xuất</span>
                  </a>
                </div>
              )}
            </div>

            {/* NÚT MENU MOBILE */}
            <button
              onClick={() => setMenuOpen((prev) => !prev)}
              aria-label="Menu điều hướng"
              aria-expanded={menuOpen}
              className="xl:hidden p-space-sm rounded-lg text-on-surface-variant hover:bg-surface-container focus:outline-none"
              type="button"
            >
              <span className="material-symbols-outlined text-[26px]">
                {menuOpen ? "close" : "menu"}
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* MENU MOBILE */}
      {menuOpen && (
        <nav className="fixed top-20 left-0 right-0 z-40 bg-white shadow-lg p-5 flex flex-col gap-4 xl:hidden">
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

          <a
            href="#courses"
            onClick={closeMobileMenu}
          >
            Khóa học của tôi
          </a>

          {/* TÌM KIẾM TRÊN MOBILE */}
          <form
            onSubmit={(event) => {
              handleSearch(event);
              closeMobileMenu();
            }}
            className="md:hidden flex gap-2 pt-3 border-t border-slate-100"
          >
            <input
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              type="search"
              placeholder="Tìm kiếm khóa học..."
              className="min-w-0 flex-1 px-3 py-2 rounded-xl border border-slate-200 outline-none focus:border-indigo-500 text-sm"
            />

            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium"
            >
              Tìm
            </button>
          </form>
        </nav>
      )}
    </>
  );
}
