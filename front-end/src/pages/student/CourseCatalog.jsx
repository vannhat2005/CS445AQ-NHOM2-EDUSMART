import React, { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import CourseCard from "../../components/student/CourseCard.jsx";
import { getSearchResults } from "../../services/student/courseSearchService.js";
import { getCourses } from "../../services/student/courseService.js";

const PAGE_SIZE = 8;
const formatNumber = (n) => new Intl.NumberFormat("vi-VN").format(n);

export default function CourseCatalog() {
  const [params, setParams] = useSearchParams();
  const keyword = (params.get("keyword") || "").trim();
  const [page, setPage] = useState(1);
  const loaderRef = useRef(null);
  const requestLock = useRef(false);
  const [hasMore, setHasMore] = useState(true);
  const [retry, setRetry] = useState(0);
  const [input, setInput] = useState(keyword);
  const [courses, setCourses] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [category, setCategory] = useState("all");
  const [priceFilter, setPriceFilter] = useState("all");
  const [sort, setSort] = useState("newest");
  const [suggestions, setSuggestions] = useState([]);
  const [suggestionLoading, setSuggestionLoading] = useState(false);
  const [suggestionOpen, setSuggestionOpen] = useState(false);
  const suggestionRef = useRef(null);

  useEffect(() => setInput(keyword), [keyword]);

  // Khi đổi từ khóa, bắt đầu lại từ trang đầu.
  useEffect(() => {
    setPage(1);
    setCourses([]);
    setTotalElements(0);
    setTotalPages(1);
    setHasMore(true);
    setError("");
    requestLock.current = false;
  }, [keyword]);

  useEffect(() => {
    let active = true;
    requestLock.current = true;
    setLoading(true);
    setError("");

    const fetchPage = async () => {
      try {
        // Tìm kiếm dùng API search; khám phá dùng featured PageResponse.
        const result = keyword
          ? await getSearchResults(keyword, page, PAGE_SIZE)
          : (await getCourses(page, PAGE_SIZE)).result;
        if (!active) return;
        const incoming = keyword ? result.courses : result.content;
        if (!Array.isArray(incoming)) throw new Error("API trả về danh sách không hợp lệ");
        setCourses((previous) => {
          const merged = page === 1 ? incoming : [...previous, ...incoming];
          return [...new Map(merged.map((course) => [course.courseId ?? course.id, course])).values()];
        });
        const pages = Math.max(0, Number(result.totalPages) || 0);
        setTotalPages(pages);
        setTotalElements(Number(result.totalElements) || 0);
        setHasMore(page < pages && incoming.length > 0);
      } catch (err) {
        if (!active) return;
        setError(err?.response?.data?.message || err.message || "Không thể tải khóa học.");
      } finally {
        if (active) {
          setLoading(false);
          requestLock.current = false;
        }
      }
    };
    fetchPage();
    return () => { active = false; };
  }, [keyword, page, retry]);

  // Cuộn gần cuối danh sách để tải trang tiếp theo.
  useEffect(() => {
    const element = loaderRef.current;
    if (!element || !hasMore || loading || error) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !requestLock.current) {
        requestLock.current = true;
        setPage((current) => current + 1);
      }
    }, { rootMargin: "250px" });
    observer.observe(element);
    return () => observer.disconnect();
  }, [hasMore, loading, error, page]);

  // Gợi ý khóa học sau 350ms, tránh gửi yêu cầu ở mỗi lần gõ.
  useEffect(() => {
    const value = input.trim();
    if (!value || !suggestionOpen) {
      setSuggestions([]);
      setSuggestionLoading(false);
      return;
    }
    let active = true;
    const timer = setTimeout(async () => {
      setSuggestionLoading(true);
      try {
        const result = await getSearchResults(value, 1, 5);
        if (active) setSuggestions(result.courses);
      } catch {
        if (active) setSuggestions([]);
      } finally {
        if (active) setSuggestionLoading(false);
      }
    }, 350);
    return () => { active = false; clearTimeout(timer); };
  }, [input, suggestionOpen]);

  useEffect(() => {
    const close = (event) => {
      if (!suggestionRef.current?.contains(event.target)) setSuggestionOpen(false);
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, []);

  const submitSearch = (value = input) => {
    setSuggestionOpen(false);
    setParams(value.trim() ? { keyword: value.trim() } : {});
  };

  // Các bộ lọc dưới đây áp dụng cho các khóa học ĐÃ TẢI.
  // Để lọc toàn bộ database, backend cần bổ sung tham số categoryId, price và sort.
  const visibleCourses = useMemo(() => {
    const list = courses.filter((course) => {
      const courseCategory = course.categoryId ?? course.category?.categoryId;
      const amount = Number(course.price ?? 0);
      if (category !== "all" && String(courseCategory) !== category) return false;
      if (priceFilter === "free" && amount !== 0) return false;
      if (priceFilter === "under_500k" && amount >= 500000) return false;
      if (priceFilter === "500k_1m" && (amount < 500000 || amount > 1000000)) return false;
      if (priceFilter === "over_1m" && amount <= 1000000) return false;
      return true;
    });
    return [...list].sort((a, b) => {
      if (sort === "price_asc") return Number(a.price ?? 0) - Number(b.price ?? 0);
      if (sort === "price_desc") return Number(b.price ?? 0) - Number(a.price ?? 0);
      if (sort === "popular") return Number(b.totalStudents ?? 0) - Number(a.totalStudents ?? 0);
      return Number(b.courseId ?? 0) - Number(a.courseId ?? 0);
    });
  }, [courses, category, priceFilter, sort]);

  const categoryOptions = useMemo(() => {
    const map = new Map();
    courses.forEach((c) => {
      const id = c.categoryId ?? c.category?.categoryId;
      const name = c.categoryName ?? c.category?.name ?? c.category?.categoryName;
      if (id != null && name) map.set(String(id), name);
    });
    return [...map.entries()];
  }, [courses]);

  return (
    <main className="min-h-screen bg-[#f8faff] pt-28 pb-20">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="mb-8">
          <p className="text-sm font-semibold text-indigo-600 mb-2">EDUSMART / KHÁM PHÁ</p>
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900">Khám phá khóa học</h1>
          <p className="text-slate-500 mt-2">Tìm kiếm và lựa chọn khóa học phù hợp với bạn.</p>
        </div>

        <section aria-label="Bộ lọc và sắp xếp" className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4 sm:p-5 mb-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-4 items-end">
            <div className="lg:col-span-3">
              <label htmlFor="category-filter" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">Danh mục khóa học</label>
              <select id="category-filter" value={category} onChange={(e) => setCategory(e.target.value)} className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-xl px-3.5 py-2.5 h-11 focus:outline-none focus:ring-2 focus:ring-indigo-500/20">
                <option value="all">Tất cả danh mục</option>
                {categoryOptions.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
              </select>
            </div>
            <div className="lg:col-span-2">
              <label htmlFor="price-filter" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">Lọc theo mức giá</label>
              <select id="price-filter" value={priceFilter} onChange={(e) => setPriceFilter(e.target.value)} className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-xl px-3.5 py-2.5 h-11 focus:outline-none focus:ring-2 focus:ring-indigo-500/20">
                <option value="all">Tất cả mức giá</option>
                <option value="under_500k">Dưới 500.000đ</option>
                <option value="500k_1m">500.000đ - 1.000.000đ</option>
                <option value="over_1m">Trên 1.000.000đ</option>
                <option value="free">Miễn phí</option>
              </select>
            </div>
            <div className="lg:col-span-2">
              <label htmlFor="sort-order" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">Sắp xếp theo</label>
              <select id="sort-order" value={sort} onChange={(e) => setSort(e.target.value)} className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-xl px-3.5 py-2.5 h-11 focus:outline-none focus:ring-2 focus:ring-indigo-500/20">
                <option value="newest">Mới nhất</option>
                <option value="popular">Phổ biến nhất</option>
                <option value="price_asc">Giá từ thấp đến cao</option>
                <option value="price_desc">Giá từ cao đến thấp</option>
              </select>
            </div>
            <div className="lg:col-span-5" ref={suggestionRef}>
              <label htmlFor="catalog-search" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">Tìm theo từ khóa</label>
              <form onSubmit={(e) => { e.preventDefault(); submitSearch(); }} className="flex items-center gap-2">
                <div className="relative flex-1 min-w-0">
                  <svg aria-hidden="true" className="w-4 h-4 absolute left-3 top-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m21 21-6-6m2-5a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z" /></svg>
                  <input id="catalog-search" autoComplete="off" value={input} onChange={(e) => { setInput(e.target.value); setSuggestionOpen(true); }} onFocus={() => setSuggestionOpen(true)} onKeyDown={(e) => { if (e.key === "Escape") setSuggestionOpen(false); }} placeholder="Tên khóa học, Java, React..." className="w-full h-11 bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-xl pl-9 pr-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
                  {suggestionOpen && input.trim() && (
                    <div className="absolute top-full left-0 right-0 mt-2 z-30 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden" role="listbox" aria-label="Gợi ý khóa học">
                      {suggestionLoading ? <p className="px-4 py-3 text-sm text-slate-500">Đang tìm gợi ý...</p> : suggestions.length ? suggestions.map((course) => (
                        <button key={course.courseId} type="button" role="option" aria-selected={false} onClick={() => { setInput(course.title); submitSearch(course.title); }} className="w-full px-4 py-3 text-left text-sm text-slate-700 hover:bg-indigo-50 border-b last:border-b-0 border-slate-100">🔎 {course.title}</button>
                      )) : <p className="px-4 py-3 text-sm text-slate-500">Không có gợi ý phù hợp.</p>}
                    </div>
                  )}
                </div>
                <button type="submit" className="h-11 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm shrink-0">Tìm kiếm</button>
              </form>
            </div>
          </div>
          <div className="flex justify-end mt-3">
            <button type="button" onClick={() => { setCategory("all"); setPriceFilter("all"); setSort("newest"); setInput(""); setSuggestionOpen(false); setParams({}); }} className="text-sm font-medium text-indigo-600 hover:underline">Đặt lại bộ lọc</button>
          </div>
        </section>

        <div className="flex flex-wrap items-center justify-between gap-2 mb-6">
          <h2 className="text-xl font-bold text-slate-900">{keyword ? `Kết quả cho “${keyword}”` : "Tất cả khóa học"}</h2>
          <p className="text-sm text-slate-500">{formatNumber(totalElements)} khóa học từ API</p>
        </div>
        {loading && courses.length === 0 ? (
          <p className="py-16 text-center text-slate-500">Đang tải khóa học...</p>
        ) : visibleCourses.length === 0 ? (
          <p className="py-16 text-center text-slate-500">Chưa có khóa học phù hợp trong danh sách đã tải.</p>
        ) : (
          <section aria-label="Danh sách khóa học" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {visibleCourses.map((course) => <CourseCard key={course.courseId ?? course.id} course={course} />)}
          </section>
        )}

        <div ref={loaderRef} className="text-center py-8" aria-live="polite">
          {loading && courses.length > 0 && <p className="text-slate-500">Đang tải thêm khóa học...</p>}
          {error && (
            <div role="alert" className="text-red-600">
              <p>{error}</p>
              <button type="button" onClick={() => setRetry((value) => value + 1)} className="mt-3 px-4 py-2 rounded-lg border border-red-200 hover:bg-red-50">Thử lại</button>
            </div>
          )}
          {!loading && !error && !hasMore && courses.length > 0 && (
            <p className="text-slate-400 text-sm">Đã tải hết khóa học.</p>
          )}
        </div>
        <p className="text-xs text-slate-400 text-center mt-2">Lọc danh mục, giá và sắp xếp chỉ áp dụng trên các khóa học đã tải. Backend cần hỗ trợ bộ lọc để áp dụng trên toàn bộ dữ liệu.</p>
      </div>
    </main>
  );
}
