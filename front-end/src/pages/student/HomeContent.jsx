import React, { useEffect, useState } from "react";
import CourseCard from "../../components/student/CourseCard.jsx";
import { getCourses, getTopCategories } from "../../services/student/courseService.js";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { getSearchResults } from "../../services/student/courseSearchService.js";

/** Nội dung trang chủ EduSmart: hero, danh mục, khóa học, AI và footer. */
const TAILWIND_CONFIG = { darkMode: "class", theme: { extend: { colors: { "error": "#ba1a1a", "on-surface-variant": "#434655", "tertiary-fixed-dim": "#ffb95f", "secondary-fixed": "#c9e6ff", "surface-bright": "#f9f9ff", "surface-container-highest": "#dce2f7", "surface-container": "#e9edff", "on-secondary": "#ffffff", "tertiary-container": "#996100", "outline": "#737686", "on-primary-container": "#eeefff", "secondary-fixed-dim": "#89ceff", "on-tertiary-fixed-variant": "#653e00", "on-background": "#141b2b", "outline-variant": "#c3c6d7", "surface-variant": "#dce2f7", "error-container": "#ffdad6", "on-primary-fixed": "#00174b", "on-secondary-fixed": "#001e2f", "primary-fixed-dim": "#b4c5ff", "on-tertiary-container": "#ffeedd", "primary-container": "#2563eb", "tertiary-fixed": "#ffddb8", "on-error": "#ffffff", "secondary-container": "#39b8fd", "surface": "#f9f9ff", "on-secondary-container": "#004666", "inverse-surface": "#293040", "on-secondary-fixed-variant": "#004c6e", "on-surface": "#141b2b", "tertiary": "#784b00", "surface-container-high": "#e1e8fd", "inverse-primary": "#b4c5ff", "on-primary": "#ffffff", "on-error-container": "#93000a", "on-primary-fixed-variant": "#003ea8", "primary": "#004ac6", "surface-container-lowest": "#ffffff", "surface-tint": "#0053db", "inverse-on-surface": "#edf0ff", "surface-container-low": "#f1f3ff", "background": "#f9f9ff", "surface-dim": "#d3daef", "secondary": "#006591", "on-tertiary-fixed": "#2a1700", "primary-fixed": "#dbe1ff", "on-tertiary": "#ffffff" }, borderRadius: { "DEFAULT": "0.25rem", "lg": "0.5rem", "xl": "0.75rem", "full": "9999px" }, spacing: { "margin-tablet": "2rem", "space-md": "1rem", "gutter": "1.5rem", "margin": "3rem", "space-xs": "0.25rem", "gutter-mobile": "1rem", "space-xl": "2rem", "margin-mobile": "1rem", "space-lg": "1.5rem", "space-sm": "0.5rem" }, fontFamily: { "headline-xl-mobile": ["Plus Jakarta Sans"], "headline-xl": ["Plus Jakarta Sans"], "title-md": ["Plus Jakarta Sans"], "display-lg": ["Plus Jakarta Sans"], "label-sm": ["Plus Jakarta Sans"], "headline-lg-mobile": ["Plus Jakarta Sans"], "label-lg": ["Plus Jakarta Sans"], "body-lg": ["Inter"], "headline-sm": ["Plus Jakarta Sans"], "headline-md": ["Plus Jakarta Sans"], "body-sm": ["Inter"], "headline-lg": ["Plus Jakarta Sans"], "title-sm": ["Plus Jakarta Sans"], "label-md": ["Plus Jakarta Sans"], "display-lg-mobile": ["Plus Jakarta Sans"], "body-md": ["Inter"] }, fontSize: { "headline-xl-mobile": ["28px", { "lineHeight": "36px", "letterSpacing": "-0.02em", "fontWeight": "700" }], "headline-xl": ["40px", { "lineHeight": "48px", "letterSpacing": "-0.02em", "fontWeight": "700" }], "title-md": ["18px", { "lineHeight": "26px", "letterSpacing": "-0.005em", "fontWeight": "600" }], "display-lg": ["56px", { "lineHeight": "64px", "letterSpacing": "-0.03em", "fontWeight": "800" }], "label-sm": ["11px", { "lineHeight": "14px", "letterSpacing": "0.04em", "fontWeight": "700" }], "headline-lg-mobile": ["24px", { "lineHeight": "32px", "letterSpacing": "-0.01em", "fontWeight": "700" }], "label-lg": ["14px", { "lineHeight": "20px", "letterSpacing": "0.01em", "fontWeight": "600" }], "body-lg": ["18px", { "lineHeight": "28px", "fontWeight": "400" }], "headline-sm": ["20px", { "lineHeight": "28px", "letterSpacing": "-0.01em", "fontWeight": "600" }], "headline-md": ["24px", { "lineHeight": "32px", "letterSpacing": "-0.01em", "fontWeight": "600" }], "body-sm": ["14px", { "lineHeight": "20px", "fontWeight": "400" }], "headline-lg": ["32px", { "lineHeight": "40px", "letterSpacing": "-0.02em", "fontWeight": "700" }], "title-sm": ["16px", { "lineHeight": "24px", "fontWeight": "600" }], "label-md": ["12px", { "lineHeight": "16px", "letterSpacing": "0.02em", "fontWeight": "600" }], "display-lg-mobile": ["36px", { "lineHeight": "44px", "letterSpacing": "-0.02em", "fontWeight": "800" }], "body-md": ["16px", { "lineHeight": "24px", "fontWeight": "400" }] } } } };

export default function HomeContent() {
  const navigate = useNavigate();
  const location = useLocation();
  const [params, setParams] = useSearchParams();
  const isSearchPage = location.pathname === "/student/search";
  const keyword = (params.get("keyword") || "").trim();
  const requestedPage = Number(params.get("page"));
  const page = Number.isSafeInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;
  const [searchCourses, setSearchCourses] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const handleSearch = (event) => {
    event.preventDefault();
    const keyword = search.trim();
    if (keyword) navigate(`/student/search?keyword=${encodeURIComponent(keyword)}`);
  };
  const [sort, setSort] = useState("newest");
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [topCategories, setTopCategories] = useState([]);
  const [categoriesError, setCategoriesError] = useState("");
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [homePage, setHomePage] = useState(1);
  const [homeTotalPages, setHomeTotalPages] = useState(1);
  const [homeTotalElements, setHomeTotalElements] = useState(0);
  const [search, setSearch] = useState(keyword);

  useEffect(() => { setSearch(keyword); }, [keyword]);

  useEffect(() => {
    if (!isSearchPage) return;
    if (!keyword) { setSearchCourses([]); setTotalPages(1); setTotalElements(0); return; }
    let cancelled = false;
    setSearchLoading(true);
    setSearchError("");
    getSearchResults(keyword, page, 8)
      .then((result) => {
        if (cancelled) return;
        setSearchCourses(result.courses);
        setTotalPages(Math.max(1, Number(result.totalPages) || 1));
        setTotalElements(Number(result.totalElements) || 0);
      })
      .catch((err) => {
        console.error("Lỗi tìm kiếm:", err);
        if (!cancelled) {
          setSearchCourses([]);
          setSearchError("Không thể tải kết quả tìm kiếm. Hãy kiểm tra API backend.");
        }
      })
      .finally(() => { if (!cancelled) setSearchLoading(false); });
    return () => { cancelled = true; };
  }, [isSearchPage, keyword, page]);

  const goToPage = (nextPage) => {
    if (searchLoading || nextPage < 1 || nextPage > totalPages || nextPage === page) return;
    setParams({ keyword, page: String(nextPage) });
    document.getElementById("courses")?.scrollIntoView({ behavior: "instant", block: "start" });
  };
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isSearchPage) return;
    const controller = new AbortController();
    setCategoriesLoading(true);
    setCategoriesError("");

    getTopCategories(controller.signal)
      .then((categories) => {
        if (controller.signal.aborted) return;
        setTopCategories(categories);
      })
      .catch((err) => {
        if (controller.signal.aborted || err.name === "AbortError") return;
        console.error("Lỗi tải danh mục:", err);
        setTopCategories([]);
        setCategoriesError(err.message || "Không thể tải danh mục.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setCategoriesLoading(false);
      });

    return () => controller.abort();
  }, [isSearchPage]);

  useEffect(() => {
    if (isSearchPage) return;
    const controller = new AbortController();
    setLoading(true);
    setError("");
    getCourses({
      categoryId: selectedCategoryId,
      sort,
      page: homePage,
      size: 4,
      signal: controller.signal,
    })
      .then(({ result }) => {
        if (controller.signal.aborted) return;
        setCourses(result.content);
        setHomeTotalPages(Math.max(1, Number(result.totalPages) || 1));
        setHomeTotalElements(Number(result.totalElements) || 0);
      })
      .catch((err) => {
        if (!controller.signal.aborted && err.name !== "AbortError") {
          console.error("Lỗi tải khóa học:", err);
          setError(err.message || "Không thể tải danh sách khóa học.");
          setCourses([]);
          setHomeTotalPages(1);
          setHomeTotalElements(0);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [isSearchPage, selectedCategoryId, sort, homePage]);

  const selectCategory = (categoryId) => {
    setSelectedCategoryId(categoryId);
    setHomePage(1);
  };

  const changeHomeSort = (nextSort) => {
    setSort(nextSort);
    setHomePage(1);
  };

  const goToHomePage = (nextPage) => {
    if (loading || nextPage < 1 || nextPage > homeTotalPages || nextPage === homePage) return;
    setHomePage(nextPage);
    document.getElementById("courses")?.scrollIntoView({ behavior: "instant", block: "start" });
  };

  useEffect(() => {
    const links = [
      "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@500;600;700;800&display=swap",
      "https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200"
    ];
    links.forEach((url) => {
      if (!document.querySelector(`link[href="${url}"]`)) {
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = url;
        document.head.appendChild(link);
      }
    });
    // Tailwind CDN chỉ dành cho bản demo; với Vite nên cấu hình Tailwind trong CSS.
    if (!document.querySelector('script[data-edusmart-tailwind]')) {
      const script = document.createElement("script");
      script.src = "https://cdn.tailwindcss.com";
      script.dataset.edusmartTailwind = "true";
      script.onload = () => {
        if (window.tailwind) window.tailwind.config = TAILWIND_CONFIG;
      };
      document.head.appendChild(script);
    }
  }, []);

  const handleClick = (event) => {
    const trend = event.target.closest("[data-trend]");
    if (trend) {
      const keyword = trend.dataset.trend;
      setSearch(keyword);
      navigate(`/student/search?keyword=${encodeURIComponent(keyword)}`);
    }
  };

  return (
    <>
      <main onClick={handleClick} className="w-full pt-20 bg-background flex-1"><div className="flex flex-col w-full">
        {/* SECTION 1: HERO BANNER */}
        <section className="relative w-full overflow-hidden bg-gradient-to-b from-surface-container-high/40 via-surface-container-low to-background py-space-xl lg:py-24">
          {/* Ambient glowing geometric shapes */}
          <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-primary/5 blur-3xl pointer-events-none"></div>
          <div className="absolute top-1/3 -right-20 w-[450px] h-[450px] rounded-full bg-secondary-container/10 blur-3xl pointer-events-none"></div>
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-80 h-80 rounded-full bg-tertiary-fixed/20 blur-3xl pointer-events-none"></div>
          <div className="max-w-7xl mx-auto px-margin-mobile md:px-margin-tablet lg:px-margin relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter items-center">
              {/* Hero Left Column */}
              <div className="lg:col-span-7 flex flex-col justify-center space-y-space-lg">
                {/* Tag line badge */}
                <div className="inline-flex items-center gap-2 self-start px-3.5 py-1.5 rounded-full bg-surface-container-lowest shadow-sm text-primary">
                  <span className="material-symbols-outlined text-[18px] text-tertiary">auto_awesome</span>
                  <span className="font-label-md text-label-md font-bold uppercase tracking-wider text-on-surface">Công nghệ Học tập Thế hệ mới</span>
                </div>
                {/* Main Headlines */}
                <div className="space-y-space-sm">
                  <h1 className="font-display-lg text-display-lg-mobile md:text-display-lg text-on-surface tracking-tight leading-tight">
                    Nâng tầm kiến thức, <br className="hidden sm:inline" />
                    <span className="text-primary bg-clip-text">Kiến tạo tương lai</span> cùng AI
                  </h1>
                  <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl leading-relaxed">
                    Học tập thông minh hơn với hệ thống bài giảng chuẩn quốc tế, lộ trình cá nhân hóa tự động và trợ lý AI thông minh đồng hành 24/7.
                  </p>
                </div>
                {/* Search Box */}
                <div className="w-full max-w-2xl pt-2">
                  <form onSubmit={handleSearch} className="relative flex flex-col sm:flex-row items-stretch sm:items-center bg-surface-container-lowest rounded-2xl p-2 shadow-xl focus-within:shadow-2xl transition-all duration-300">
                    <div className="flex items-center flex-1 pl-3 pr-2 py-2">
                      <span className="material-symbols-outlined text-outline text-[24px] mr-2">search</span>
                      <input className="w-full bg-transparent text-on-surface placeholder:text-outline font-body-sm text-body-sm focus:outline-none" value={search} onChange={(event) => setSearch(event.target.value)} id="hero-search-input" placeholder="Bạn muốn chinh phục kỹ năng gì hôm nay? (VD: Python, UI/UX, IELTS...)" type="text" />
                    </div>
                    <button className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-primary hover:bg-primary-container text-on-primary font-title-sm text-title-sm shadow-md hover:shadow-lg transition-all duration-200 flex-shrink-0 cursor-pointer" type="submit">
                      <span className="">Tìm kiếm</span>
                      <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
                    </button>
                  </form>
                  <div className="flex items-center gap-2 mt-3 pl-2 flex-wrap">
                    <span className="font-label-sm text-label-sm text-outline font-medium">Xu hướng:</span>
                    <button className="font-label-sm text-label-sm text-on-surface-variant hover:text-primary bg-surface-container px-2.5 py-1 rounded-full transition-colors" data-trend="Next.js 15" type="button">Next.js 15</button>
                    <button className="font-label-sm text-label-sm text-on-surface-variant hover:text-primary bg-surface-container px-2.5 py-1 rounded-full transition-colors" data-trend="Prompt Engineering" type="button">Prompt Engineering</button>
                    <button className="font-label-sm text-label-sm text-on-surface-variant hover:text-primary bg-surface-container px-2.5 py-1 rounded-full transition-colors" data-trend="Figma Design" type="button">Figma Design</button>
                    <button className="font-label-sm text-label-sm text-on-surface-variant hover:text-primary bg-surface-container px-2.5 py-1 rounded-full transition-colors" data-trend="IELTS 7.5+" type="button">IELTS 7.5+</button>
                  </div>
                </div>
                {/* Trust Badges & Metrics */}
                <div className="pt-4 grid grid-cols-3 gap-space-sm sm:gap-space-md max-w-xl">
                  <div className="flex flex-col bg-surface-container-lowest/80 p-3 sm:p-4 rounded-xl shadow-sm">
                    <span className="font-headline-md text-headline-md text-primary font-bold">50,000+</span>
                    <span className="font-body-sm text-body-sm text-on-surface-variant font-medium mt-0.5">Học viên tích cực</span>
                  </div>
                  <div className="flex flex-col bg-surface-container-lowest/80 p-3 sm:p-4 rounded-xl shadow-sm">
                    <span className="font-headline-md text-headline-md text-secondary font-bold">1,200+</span>
                    <span className="font-body-sm text-body-sm text-on-surface-variant font-medium mt-0.5">Khóa học chuẩn</span>
                  </div>
                  <div className="flex flex-col bg-surface-container-lowest/80 p-3 sm:p-4 rounded-xl shadow-sm">
                    <div className="flex items-center gap-1">
                      <span className="font-headline-md text-headline-md text-tertiary font-bold">98%</span>
                      <span className="material-symbols-outlined text-tertiary text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                    </div>
                    <span className="font-body-sm text-body-sm text-on-surface-variant font-medium mt-0.5">Đánh giá 5 sao</span>
                  </div>
                </div>
              </div>
              {/* Hero Right Column: Graphic Showcase */}
              <div className="lg:col-span-5 relative mt-8 lg:mt-0 flex justify-center items-center">
                <div className="relative w-full max-w-md lg:max-w-none aspect-square sm:aspect-[4/3] lg:aspect-square flex items-center justify-center">
                  {/* Background Radial Glow */}
                  <div className="absolute inset-4 rounded-3xl bg-gradient-to-tr from-primary-fixed to-secondary-fixed opacity-70 transform rotate-2 shadow-inner"></div>
                  {/* Student Center Image */}
                  <div className="relative w-[88%] h-[88%] rounded-2xl overflow-hidden shadow-2xl bg-surface-container-high">
                    <img className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAC68vQ-j8W07QVV5VgPbcUofIp7zp7AJ1iZGSvI_WQ-ufBI6E2ZGfEfmfq-oNhVGOLEnCX3kN5lHKsKpIFly0H0FTMzGKiT5lIBNzU2sPJov4yLGKOTZTIfi38cOo9AbMFV9Aqb23-lyqpb-jj6KgxQcBAurwZe4ZMjc_XEVqbXghwTKg2FoNnnYXbCr9Pu40ziEx8s1h7msAUGHXfZYqwaegN-HWHsasx2s4jXNgc" />
                    <div className="absolute inset-0 bg-gradient-to-t from-inverse-surface/30 via-transparent to-transparent"></div>
                  </div>
                  {/* Floating Badge 1: Python & React (Top Left) */}
                  <div className="absolute -top-3 -left-3 sm:left-2 bg-surface-container-lowest/90 backdrop-blur-md p-3 rounded-2xl shadow-xl flex items-center gap-3 transform -rotate-2 hover:rotate-0 transition-transform duration-300">
                    <div className="w-10 h-10 rounded-xl bg-primary-fixed flex items-center justify-center text-primary">
                      <span className="material-symbols-outlined text-[24px]">terminal</span>
                    </div>
                    <div className="pr-2">
                      <p className="font-label-sm text-label-sm text-outline font-semibold">Công nghệ Web</p>
                      <p className="font-title-sm text-title-sm text-on-surface font-bold">Python &amp; React</p>
                    </div>
                  </div>
                  {/* Floating Badge 2: AI Assistant (Top Right) */}
                  <div className="absolute top-8 -right-4 sm:-right-2 bg-surface-container-lowest/95 backdrop-blur-md p-3.5 rounded-2xl shadow-xl flex items-center gap-3 transform rotate-3 hover:rotate-0 transition-transform duration-300">
                    <div className="w-10 h-10 rounded-xl bg-secondary-fixed flex items-center justify-center text-secondary">
                      <span className="material-symbols-outlined text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>smart_toy</span>
                    </div>
                    <div className="pr-1">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                        <p className="font-label-sm text-label-sm text-outline font-semibold">Trợ lý AI</p>
                      </div>
                      <p className="font-title-sm text-title-sm text-on-surface font-bold">Hỗ trợ 24/7</p>
                    </div>
                  </div>
                  {/* Floating Badge 3: Growth Analytics (Bottom Left) */}
                  <div className="absolute -bottom-4 -left-2 bg-surface-container-lowest/95 backdrop-blur-md p-3.5 rounded-2xl shadow-xl flex items-center gap-3 transform rotate-1 hover:rotate-0 transition-transform duration-300">
                    <div className="w-10 h-10 rounded-xl bg-tertiary-fixed flex items-center justify-center text-tertiary">
                      <span className="material-symbols-outlined text-[24px]">trending_up</span>
                    </div>
                    <div className="pr-2">
                      <p className="font-label-sm text-label-sm text-outline font-semibold">Tốc độ tiếp thu</p>
                      <div className="flex items-center gap-1">
                        <p className="font-title-sm text-title-sm text-on-surface font-extrabold">+94%</p>
                        <span className="font-label-sm text-label-sm text-emerald-600 font-bold">Hiệu quả</span>
                      </div>
                    </div>
                  </div>
                  {/* Floating Badge 4: System Architecture (Bottom Right) */}
                  <div className="absolute bottom-6 -right-3 bg-surface-container-lowest/90 backdrop-blur-md p-3 rounded-2xl shadow-xl flex items-center gap-3 transform -rotate-3 hover:rotate-0 transition-transform duration-300 hidden sm:flex">
                    <div className="w-10 h-10 rounded-xl bg-surface-container-high flex items-center justify-center text-on-surface-variant">
                      <span className="material-symbols-outlined text-[24px]">architecture</span>
                    </div>
                    <div className="pr-2">
                      <p className="font-label-sm text-label-sm text-outline font-semibold">Chuẩn Quốc tế</p>
                      <p className="font-title-sm text-title-sm text-on-surface font-bold">System Design</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        {!isSearchPage && (<>
        {/* SECTION 2: DANH MỤC KHÓA HỌC (CATEGORIES) */}
        <section className="w-full bg-surface-container-lowest py-space-xl lg:py-20">
          <div className="max-w-7xl mx-auto px-margin-mobile md:px-margin-tablet lg:px-margin">
            {/* Section Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-space-xl gap-space-sm">
              <div>
                <div className="inline-flex items-center gap-1.5 text-primary mb-2">
                  <span className="material-symbols-outlined text-[20px]">category</span>
                  <span className="font-label-md text-label-md font-bold uppercase tracking-wider">Danh mục tuyển chọn</span>
                </div>
                <h2 className="font-headline-lg text-headline-lg text-on-surface">Khám phá các lĩnh vực</h2>
                <p className="font-body-md text-body-md text-on-surface-variant mt-1">Chọn hướng đi phù hợp với mục tiêu và định hướng nghề nghiệp của bạn</p>
              </div>
              <a className="inline-flex items-center gap-1 text-primary hover:text-primary-container font-title-sm text-title-sm group" href="#">
                <span className="">Xem tất cả 24+ lĩnh vực</span>
                <span className="material-symbols-outlined text-[20px] group-hover:translate-x-1 transition-transform">east</span>
              </a>
            </div>
            {/* Categories 6-Card Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-gutter">
              {/* Cat 1: Lập trình Web */}
              <a className="group flex items-center gap-space-md p-space-lg rounded-2xl bg-surface hover:bg-surface-container-lowest shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1" href="#">
                <div className="w-14 h-14 rounded-2xl bg-primary-fixed flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-on-primary transition-colors flex-shrink-0">
                  <span className="material-symbols-outlined text-[28px]">code</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-title-md text-title-md text-on-surface group-hover:text-primary font-bold truncate transition-colors">Lập trình Web</h3>
                  <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">Frontend, Backend &amp; Cloud</p>
                  <span className="inline-block mt-2 font-label-sm text-label-sm text-primary font-semibold bg-surface-container-high px-2.5 py-0.5 rounded-full">142+ khóa học</span>
                </div>
                <span className="material-symbols-outlined text-outline group-hover:text-primary group-hover:translate-x-1 transition-all">chevron_right</span>
              </a>
              {/* Cat 2: Trí tuệ nhân tạo */}
              <a className="group flex items-center gap-space-md p-space-lg rounded-2xl bg-surface hover:bg-surface-container-lowest shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1" href="#">
                <div className="w-14 h-14 rounded-2xl bg-secondary-fixed flex items-center justify-center text-secondary group-hover:bg-secondary group-hover:text-on-secondary transition-colors flex-shrink-0">
                  <span className="material-symbols-outlined text-[28px]">neurology</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-title-md text-title-md text-on-surface group-hover:text-primary font-bold truncate transition-colors">Trí tuệ nhân tạo</h3>
                  <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">LLM, NLP &amp; Deep Learning</p>
                  <span className="inline-block mt-2 font-label-sm text-label-sm text-secondary font-semibold bg-secondary-fixed/50 px-2.5 py-0.5 rounded-full">86+ khóa học</span>
                </div>
                <span className="material-symbols-outlined text-outline group-hover:text-primary group-hover:translate-x-1 transition-all">chevron_right</span>
              </a>
              {/* Cat 3: Thiết kế Đồ họa & UI/UX */}
              <a className="group flex items-center gap-space-md p-space-lg rounded-2xl bg-surface hover:bg-surface-container-lowest shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1" href="#">
                <div className="w-14 h-14 rounded-2xl bg-surface-variant flex items-center justify-center text-on-surface-variant group-hover:bg-primary group-hover:text-on-primary transition-colors flex-shrink-0">
                  <span className="material-symbols-outlined text-[28px]">palette</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-title-md text-title-md text-on-surface group-hover:text-primary font-bold truncate transition-colors">Thiết kế Đồ họa</h3>
                  <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">UI/UX, Figma &amp; Motion</p>
                  <span className="inline-block mt-2 font-label-sm text-label-sm text-outline font-semibold bg-surface-container-high px-2.5 py-0.5 rounded-full">95+ khóa học</span>
                </div>
                <span className="material-symbols-outlined text-outline group-hover:text-primary group-hover:translate-x-1 transition-all">chevron_right</span>
              </a>
              {/* Cat 4: Ngoại ngữ */}
              <a className="group flex items-center gap-space-md p-space-lg rounded-2xl bg-surface hover:bg-surface-container-lowest shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1" href="#">
                <div className="w-14 h-14 rounded-2xl bg-tertiary-fixed flex items-center justify-center text-tertiary group-hover:bg-tertiary-container group-hover:text-on-tertiary-container transition-colors flex-shrink-0">
                  <span className="material-symbols-outlined text-[28px]">translate</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-title-md text-title-md text-on-surface group-hover:text-primary font-bold truncate transition-colors">Ngoại ngữ</h3>
                  <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">IELTS, TOEIC &amp; Giao tiếp</p>
                  <span className="inline-block mt-2 font-label-sm text-label-sm text-tertiary font-semibold bg-tertiary-fixed/60 px-2.5 py-0.5 rounded-full">120+ khóa học</span>
                </div>
                <span className="material-symbols-outlined text-outline group-hover:text-primary group-hover:translate-x-1 transition-all">chevron_right</span>
              </a>
              {/* Cat 5: Kỹ năng mềm */}
              <a className="group flex items-center gap-space-md p-space-lg rounded-2xl bg-surface hover:bg-surface-container-lowest shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1" href="#">
                <div className="w-14 h-14 rounded-2xl bg-surface-container-highest flex items-center justify-center text-on-surface-variant group-hover:bg-primary group-hover:text-on-primary transition-colors flex-shrink-0">
                  <span className="material-symbols-outlined text-[28px]">lightbulb</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-title-md text-title-md text-on-surface group-hover:text-primary font-bold truncate transition-colors">Kỹ năng mềm</h3>
                  <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">Giao tiếp, Lãnh đạo &amp; Pitching</p>
                  <span className="inline-block mt-2 font-label-sm text-label-sm text-on-surface-variant font-semibold bg-surface-container-high px-2.5 py-0.5 rounded-full">64+ khóa học</span>
                </div>
                <span className="material-symbols-outlined text-outline group-hover:text-primary group-hover:translate-x-1 transition-all">chevron_right</span>
              </a>
              {/* Cat 6: Dữ liệu & Data Science */}
              <a className="group flex items-center gap-space-md p-space-lg rounded-2xl bg-surface hover:bg-surface-container-lowest shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1" href="#">
                <div className="w-14 h-14 rounded-2xl bg-secondary-fixed-dim flex items-center justify-center text-on-secondary-fixed-variant group-hover:bg-secondary group-hover:text-on-secondary transition-colors flex-shrink-0">
                  <span className="material-symbols-outlined text-[28px]">database</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-title-md text-title-md text-on-surface group-hover:text-primary font-bold truncate transition-colors">Dữ liệu &amp; Data Science</h3>
                  <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">SQL, Power BI &amp; Data Analyst</p>
                  <span className="inline-block mt-2 font-label-sm text-label-sm text-secondary font-semibold bg-secondary-fixed/50 px-2.5 py-0.5 rounded-full">78+ khóa học</span>
                </div>
                <span className="material-symbols-outlined text-outline group-hover:text-primary group-hover:translate-x-1 transition-all">chevron_right</span>
              </a>
            </div>
          </div>
        </section>
        </>)}
        {/* SECTION 3: KHÓA HỌC NỔI BẬT (FEATURED COURSES) */}
        <section className="w-full bg-background py-space-xl lg:py-24">
          <div className="max-w-7xl mx-auto px-margin-mobile md:px-margin-tablet lg:px-margin">
            {/* Section Title Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-space-lg gap-space-sm">
              <div>
                <div className="inline-flex items-center gap-1.5 text-tertiary mb-2">
                  <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                  <span className="font-label-md text-label-md font-bold uppercase tracking-wider">Chất lượng kiểm định</span>
                </div>
                <h2 className="font-headline-lg text-headline-lg text-on-surface">{isSearchPage ? `Kết quả tìm kiếm: ${keyword}` : "Khóa học được đánh giá cao"}</h2>
                <p className="font-body-md text-body-md text-on-surface-variant mt-1">{isSearchPage ? `Tìm thấy ${totalElements} khóa học` : "Được chọn lọc và kiểm định chất lượng bởi hội đồng chuyên gia hàng đầu"}</p>
              </div>
            </div>
            {!isSearchPage && (<>
            {/* Filter Tabs & Sort Controls Bar */}
            <div className="bg-surface-container-lowest p-space-sm rounded-2xl shadow-sm mb-space-xl flex flex-col lg:flex-row lg:items-center justify-between gap-space-md">
              {/* Category Filter Tabs - dữ liệu thật từ backend */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 lg:pb-0" id="filter-tab-container">
                {[{ categoryId: null, name: "Tất cả" }, ...topCategories].map((category) => {
                  const active = selectedCategoryId === category.categoryId;
                  return (
                    <button
                      key={category.categoryId ?? "all"}
                      type="button"
                      onClick={() => selectCategory(category.categoryId)}
                      aria-pressed={active}
                      className={`course-filter-tab px-5 py-2.5 rounded-xl font-title-sm text-title-sm transition-all flex-shrink-0 cursor-pointer ${active
                        ? "bg-primary text-on-primary shadow-sm"
                        : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"}`}
                    >
                      {category.name}
                    </button>
                  );
                })}
                {categoriesLoading && (
                  <span className="text-sm text-slate-500" role="status">Đang tải danh mục...</span>
                )}
                {categoriesError && (
                  <span className="text-red-600 text-sm" role="alert">{categoriesError}</span>
                )}
              </div>
              {/* Sorting Pills - sắp xếp tại backend */}
              <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
                <span className="font-label-md text-label-md text-outline font-semibold hidden sm:inline">Sắp xếp:</span>
                {[
                  { value: "newest", label: "Mới nhất" },
                  { value: "price_asc", label: "Giá thấp đến cao" },
                  { value: "price_desc", label: "Giá cao đến thấp" },
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => changeHomeSort(option.value)}
                    aria-pressed={sort === option.value}
                    className={`sort-btn px-3.5 py-2 rounded-xl font-label-md text-label-md font-bold transition-colors cursor-pointer ${sort === option.value
                      ? "bg-surface-container-high text-on-surface"
                      : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container"}`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
            </>)}
            {/* Khung gọn khoảng một hàng; trang chủ lấy 4 khóa học mỗi trang. */}
            <div
              id="courses"
              className="relative min-h-[340px] scroll-mt-24"
              aria-busy={isSearchPage ? searchLoading : loading}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-gutter content-start">
                {(isSearchPage ? searchError : error) ? (
                  <p className="col-span-full text-red-600" role="alert">
                    {isSearchPage ? searchError : error}
                  </p>
                ) : (isSearchPage ? searchCourses : courses).length === 0 ? (
                  <p className="col-span-full text-on-surface-variant">
                    {(isSearchPage ? searchLoading : loading)
                      ? "Đang tải khóa học..."
                      : "Chưa có khóa học phù hợp."}
                  </p>
                ) : (
                  (isSearchPage ? searchCourses : courses).map((course, index) => (
                    <CourseCard key={course.courseId ?? course.id ?? index} course={course} />
                  ))
                )}
              </div>
              {(isSearchPage ? searchLoading : loading) && (
                <div
                  className="absolute inset-0 z-10 flex items-start justify-center pt-10 rounded-xl bg-white/40 backdrop-blur-[1px]"
                  role="status"
                  aria-live="polite"
                >
                  <div className="flex items-center gap-2 rounded-xl bg-white px-5 py-3 shadow-lg border border-slate-200 text-slate-800 font-semibold">
                    <span className="inline-block w-4 h-4 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
                    Đang cập nhật khóa học...
                  </div>
                </div>
              )}
            </div>
            {/* Không tháo phân trang khi loading: tránh thay đổi chiều cao trang. */}
            {isSearchPage && !searchError && totalElements > 0 && (
              <SearchPagination
                page={page}
                totalPages={totalPages}
                onPageChange={goToPage}
              />
            )}
            {!isSearchPage && !error && homeTotalElements > 0 && (
              <SearchPagination
                page={homePage}
                totalPages={homeTotalPages}
                onPageChange={goToHomePage}
              />
            )}
          </div>
        </section>
        {/* SECTION 4: CALL TO ACTION (CTA) / GIỚI THIỆU TRỢ LÝ AI */}
        <section className="w-full relative overflow-hidden bg-[#0F172A] text-white py-space-xl lg:py-24">
          {/* Ambient Neon Cyber Accents */}
          <div className="absolute -top-32 left-1/4 w-96 h-96 rounded-full bg-blue-600/20 blur-[100px] pointer-events-none"></div>
          <div className="absolute -bottom-32 right-1/4 w-96 h-96 rounded-full bg-cyan-500/20 blur-[100px] pointer-events-none"></div>
          <div className="max-w-7xl mx-auto px-margin-mobile md:px-margin-tablet lg:px-margin relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter items-center">
              {/* CTA Left Column */}
              <div className="lg:col-span-8 space-y-space-md">
                {/* Sparkle Tag */}
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-400/20 text-cyan-300">
                  <span className="material-symbols-outlined text-[18px] animate-pulse">smart_toy</span>
                  <span className="font-label-md text-label-md font-bold uppercase tracking-wider">Trợ lý AI Độc quyền EduSmart</span>
                </div>
                {/* Heading */}
                <h2 className="font-headline-xl text-headline-xl-mobile md:text-headline-xl text-white font-extrabold tracking-tight leading-tight">
                  Gặp khó khăn khi học? <br className="hidden sm:inline" />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-300 to-sky-200">
                    Trợ lý AI luôn sẵn sàng đồng hành 24/7
                  </span>
                </h2>
                {/* Subtitle */}
                <p className="font-body-lg text-body-lg text-slate-300 max-w-2xl leading-relaxed">
                  Không còn bế tắc với những đoạn code hóc búa hay câu hỏi ngữ pháp phức tạp. EduSmart AI giải đáp thắc mắc, phân tích sai sót và phân bổ bài học chuẩn xác theo trình độ của riêng bạn.
                </p>
                {/* Feature Bullets */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-space-sm pt-2">
                  <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-800/60 border border-slate-700/50 backdrop-blur-sm">
                    <span className="material-symbols-outlined text-cyan-400 text-[20px] flex-shrink-0 mt-0.5">code_blocks</span>
                    <div>
                      <p className="font-title-sm text-title-sm text-white font-bold">Giải thích code</p>
                      <p className="font-body-sm text-body-sm text-slate-400">Từng dòng chi tiết, dễ hiểu</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-800/60 border border-slate-700/50 backdrop-blur-sm">
                    <span className="material-symbols-outlined text-cyan-400 text-[20px] flex-shrink-0 mt-0.5">bolt</span>
                    <div>
                      <p className="font-title-sm text-title-sm text-white font-bold">Tóm tắt bài học</p>
                      <p className="font-body-sm text-body-sm text-slate-400">Nắm trọn ý chính trong 30 giây</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-800/60 border border-slate-700/50 backdrop-blur-sm">
                    <span className="material-symbols-outlined text-cyan-400 text-[20px] flex-shrink-0 mt-0.5">route</span>
                    <div>
                      <p className="font-title-sm text-title-sm text-white font-bold">Lộ trình thích ứng</p>
                      <p className="font-body-sm text-body-sm text-slate-400">Cá nhân hóa mọi cấp độ</p>
                    </div>
                  </div>
                </div>
              </div>
              {/* CTA Right Column: Visual Button & Interactive preview */}
              <div className="lg:col-span-4 flex flex-col items-start lg:items-center justify-center pt-6 lg:pt-0">
                <div className="w-full max-w-sm p-6 rounded-2xl bg-gradient-to-b from-slate-800/90 to-slate-900/90 border border-cyan-500/20 shadow-2xl backdrop-blur-xl relative overflow-hidden group">
                  <div className="absolute -right-8 -top-8 w-28 h-28 bg-cyan-500/10 rounded-full blur-xl group-hover:scale-150 transition-transform duration-500"></div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-white shadow-lg shadow-cyan-500/25">
                      <span className="material-symbols-outlined text-[26px]">psychology</span>
                    </div>
                    <div>
                      <p className="font-title-sm text-title-sm font-bold text-white">EduSmart AI v2.5</p>
                      <p className="font-label-sm text-label-sm text-emerald-400 flex items-center gap-1 font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                        Trực tuyến &amp; Sẵn sàng
                      </p>
                    </div>
                  </div>
                  <p className="font-body-sm text-body-sm text-slate-300 italic mb-6 bg-slate-950/50 p-3 rounded-xl border border-slate-800">
                    “Xin chào! Tôi có thể giúp bạn giải bài tập, tối ưu mã nguồn hoặc lên kế hoạch ôn thi ngay lúc này.”
                  </p>
                  <a className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-blue-600 to-primary hover:from-blue-500 hover:to-primary-container text-white font-title-sm text-title-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 hover:shadow-cyan-500/30 transition-all duration-300 cursor-pointer" href="#">
                    <span className="">Trải nghiệm học thử ngay</span>
                    <span className="material-symbols-outlined text-[20px] group-hover:translate-x-1 transition-transform">rocket_launch</span>
                  </a>
                  <p className="font-label-sm text-label-sm text-slate-400 text-center mt-3">
                    Miễn phí 14 ngày dùng thử • Không cần thẻ tín dụng
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
      </main>
    </>
  );
}

/** Phân trang kết quả tìm kiếm, hiển thị cả khi chỉ có một trang. */
function SearchPagination({ page, totalPages, onPageChange }) {
  const visiblePages = Array.from({ length: totalPages }, (_, index) => index + 1)
    .filter((number) => number === 1 || number === totalPages || Math.abs(number - page) <= 1);

  const buttonClass = "min-w-9 h-9 px-2 rounded-lg text-sm font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600";

  return (
    <nav aria-label="Phân trang kết quả tìm kiếm" className="flex flex-wrap justify-center items-center gap-2 mt-10 mb-4">
      <button
        type="button"
        aria-label="Trang trước"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
        className={`${buttonClass} bg-white border border-slate-200 text-slate-700 hover:bg-blue-50 disabled:opacity-40 disabled:cursor-not-allowed`}
      >
        ‹
      </button>

      {visiblePages.map((number, index) => (
        <React.Fragment key={number}>
          {index > 0 && number - visiblePages[index - 1] > 1 && (
            <span className="px-1 text-slate-400" aria-hidden="true">…</span>
          )}
          <button
            type="button"
            aria-label={`Trang ${number}`}
            aria-current={number === page ? "page" : undefined}
            onClick={() => onPageChange(number)}
            className={`${buttonClass} ${number === page
              ? "bg-blue-600 text-white shadow-md"
              : "bg-white border border-slate-200 text-slate-700 hover:bg-blue-50"}`}
          >
            {number}
          </button>
        </React.Fragment>
      ))}

      <button
        type="button"
        aria-label="Trang sau"
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
        className={`${buttonClass} bg-white border border-slate-200 text-slate-700 hover:bg-blue-50 disabled:opacity-40 disabled:cursor-not-allowed`}
      >
        ›
      </button>
    </nav>
  );
}
