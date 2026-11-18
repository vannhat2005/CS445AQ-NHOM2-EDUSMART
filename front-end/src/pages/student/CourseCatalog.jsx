
import React, { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";

import CourseCard from "../../components/student/CourseCard.jsx";

import {
  getExploreCategories,
  getExploreCourses,
} from "../../services/student/exploreCourseService.js";

const PAGE_SIZE = 8;

const formatNumber = (value) =>
  new Intl.NumberFormat("vi-VN").format(value);

function getPriceRange(priceFilter) {
  switch (priceFilter) {
    case "free":
      return { minPrice: 0, maxPrice: 0 };

    case "under_500k":
      return { minPrice: 0, maxPrice: 499999 };

    case "500k_1m":
      return { minPrice: 500000, maxPrice: 1000000 };

    case "over_1m":
      return { minPrice: 1000001, maxPrice: null };

    default:
      return { minPrice: null, maxPrice: null };
  }
}

export default function CourseCatalog() {
  const [params, setParams] = useSearchParams();

  const keyword = (params.get("keyword") || "").trim();
  const category = params.get("categoryId") || "all";
  const priceFilter = params.get("price") || "all";
  const sort = params.get("sort") || "newest";

  const [input, setInput] = useState(keyword);

  const [categories, setCategories] = useState([]);
  const [categoryError, setCategoryError] = useState("");

  const [courses, setCourses] = useState([]);
  const [page, setPage] = useState(1);

  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);

  const [suggestions, setSuggestions] = useState([]);
  const [suggestionLoading, setSuggestionLoading] =
    useState(false);
  const [suggestionOpen, setSuggestionOpen] = useState(false);

  const suggestionRef = useRef(null);
  const loaderRef = useRef(null);

  const filterKey = [
    keyword,
    category,
    priceFilter,
    sort,
  ].join("|");

  // Đồng bộ ô tìm kiếm với URL
  useEffect(() => {
    setInput(keyword);
  }, [keyword]);

  // Lấy danh mục trực tiếp từ Database
  useEffect(() => {
    const controller = new AbortController();

    async function loadCategories() {
      try {
        setCategoryError("");

        const result = await getExploreCategories(
          controller.signal
        );

        setCategories(result);
      } catch (err) {
        if (controller.signal.aborted) return;

        setCategoryError(
          err.message || "Không thể tải danh mục."
        );
      }
    }

    loadCategories();

    return () => controller.abort();
  }, []);

  // Khi đổi bộ lọc, reset về trang 1
  useEffect(() => {
    setPage(1);
    setCourses([]);
    setTotalElements(0);
    setTotalPages(0);
    setError("");
  }, [filterKey]);

  // Tải danh sách từ API Backend
  useEffect(() => {
    const controller = new AbortController();

    async function loadCourses() {
      try {
        setLoading(true);
        setError("");

        const { minPrice, maxPrice } =
          getPriceRange(priceFilter);

        const result = await getExploreCourses({
          keyword,
          categoryId:
            category === "all" ? null : Number(category),
          minPrice,
          maxPrice,
          sort,
          page,
          size: PAGE_SIZE,
          signal: controller.signal,
        });

        if (controller.signal.aborted) return;

        const incoming = result.content;

        setCourses((previous) => {
          if (page === 1) {
            return incoming;
          }

          const combined = [...previous, ...incoming];

          return [
            ...new Map(
              combined.map((course) => [
                course.courseId ?? course.id,
                course,
              ])
            ).values(),
          ];
        });

        setTotalElements(
          Number(result.totalElements) || 0
        );

        setTotalPages(
          Number(result.totalPages) || 0
        );
      } catch (err) {
        if (controller.signal.aborted) return;

        setError(
          err.message || "Không thể tải danh sách khóa học."
        );
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadCourses();

    return () => controller.abort();
  }, [keyword, category, priceFilter, sort, page, retry]);

  // Tải thêm khi cuộn xuống cuối
  const hasMore = page < totalPages;

  useEffect(() => {
    const element = loaderRef.current;

    if (!element || loading || error || !hasMore) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setPage((current) => current + 1);
        }
      },
      {
        rootMargin: "250px",
      }
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [loading, error, hasMore, page]);

  // Gợi ý tìm kiếm sử dụng API Explore
  useEffect(() => {
    const value = input.trim();

    if (!value || !suggestionOpen) {
      setSuggestions([]);
      setSuggestionLoading(false);
      return;
    }

    const controller = new AbortController();

    const timer = setTimeout(async () => {
      try {
        setSuggestionLoading(true);

        const result = await getExploreCourses({
          keyword: value,
          page: 1,
          size: 5,
          signal: controller.signal,
        });

        if (!controller.signal.aborted) {
          setSuggestions(result.content);
        }
      } catch {
        if (!controller.signal.aborted) {
          setSuggestions([]);
        }
      } finally {
        if (!controller.signal.aborted) {
          setSuggestionLoading(false);
        }
      }
    }, 350);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [input, suggestionOpen]);

  // Đóng gợi ý khi click bên ngoài
  useEffect(() => {
    function handleOutsideClick(event) {
      if (
        suggestionRef.current &&
        !suggestionRef.current.contains(event.target)
      ) {
        setSuggestionOpen(false);
      }
    }

    document.addEventListener(
      "pointerdown",
      handleOutsideClick
    );

    return () =>
      document.removeEventListener(
        "pointerdown",
        handleOutsideClick
      );
  }, []);

  // Cập nhật bộ lọc vào URL
  function updateFilter(key, value) {
    const next = new URLSearchParams(params);

    if (
      value === "all" ||
      (key === "sort" && value === "newest") ||
      !value
    ) {
      next.delete(key);
    } else {
      next.set(key, value);
    }

    setPage(1);
    setParams(next);
  }

  function submitSearch(value = input) {
    setSuggestionOpen(false);

    const next = new URLSearchParams(params);

    if (value.trim()) {
      next.set("keyword", value.trim());
    } else {
      next.delete("keyword");
    }

    setPage(1);
    setParams(next);
  }

  function resetFilters() {
    setInput("");
    setSuggestionOpen(false);
    setSuggestions([]);
    setPage(1);
    setParams({});
    setRetry((current) => current + 1);
  }

  return (
    <main className="min-h-screen bg-[#f8faff] pt-28 pb-20">
      <div className="max-w-7xl mx-auto px-4 md:px-8">

        {/* Tiêu đề */}
        <div className="mb-8">
          <p className="text-sm font-semibold text-indigo-600 mb-2">
            EDUSMART / KHÁM PHÁ
          </p>

          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900">
            Khám phá khóa học
          </h1>

          <p className="text-slate-500 mt-2">
            Tìm kiếm và lựa chọn khóa học phù hợp với bạn.
          </p>
        </div>

        {/* Bộ lọc */}
        <section
          aria-label="Bộ lọc và sắp xếp"
          className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4 sm:p-5 mb-8"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-4 items-end">

            {/* Danh mục */}
            <div className="lg:col-span-3">
              <label
                htmlFor="category-filter"
                className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5"
              >
                Danh mục khóa học
              </label>

              <select
                id="category-filter"
                value={category}
                onChange={(e) =>
                  updateFilter("categoryId", e.target.value)
                }
                className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-xl px-3.5 py-2.5 h-11 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="all">
                  Tất cả danh mục
                </option>

                {categories.map((item) => (
                  <option
                    key={item.categoryId}
                    value={String(item.categoryId)}
                  >
                    {item.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Giá */}
            <div className="lg:col-span-2">
              <label
                htmlFor="price-filter"
                className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5"
              >
                Lọc theo mức giá
              </label>

              <select
                id="price-filter"
                value={priceFilter}
                onChange={(e) =>
                  updateFilter("price", e.target.value)
                }
                className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-xl px-3.5 py-2.5 h-11 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="all">
                  Tất cả mức giá
                </option>

                <option value="free">
                  Miễn phí
                </option>

                <option value="under_500k">
                  Dưới 500.000đ
                </option>

                <option value="500k_1m">
                  500.000đ - 1.000.000đ
                </option>

                <option value="over_1m">
                  Trên 1.000.000đ
                </option>
              </select>
            </div>

            {/* Sắp xếp */}
            <div className="lg:col-span-2">
              <label
                htmlFor="sort-order"
                className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5"
              >
                Sắp xếp theo
              </label>

              <select
                id="sort-order"
                value={sort}
                onChange={(e) =>
                  updateFilter("sort", e.target.value)
                }
                className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-xl px-3.5 py-2.5 h-11 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="newest">
                  Mới nhất
                </option>

                <option value="oldest">
                  Cũ nhất
                </option>

                <option value="price_asc">
                  Giá từ thấp đến cao
                </option>

                <option value="price_desc">
                  Giá từ cao đến thấp
                </option>
              </select>
            </div>

            {/* Tìm kiếm */}
            <div
              className="lg:col-span-5"
              ref={suggestionRef}
            >
              <label
                htmlFor="catalog-search"
                className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5"
              >
                Tìm theo từ khóa
              </label>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  submitSearch();
                }}
                className="flex items-center gap-2"
              >
                <div className="relative flex-1 min-w-0">

                  <svg
                    aria-hidden="true"
                    className="w-4 h-4 absolute left-3 top-3.5 text-slate-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="m21 21-6-6m2-5a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z"
                    />
                  </svg>

                  <input
                    id="catalog-search"
                    autoComplete="off"
                    value={input}
                    onChange={(e) => {
                      setInput(e.target.value);
                      setSuggestionOpen(true);
                    }}
                    onFocus={() =>
                      setSuggestionOpen(true)
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Escape") {
                        setSuggestionOpen(false);
                      }
                    }}
                    placeholder="Tên khóa học, Java, React..."
                    className="w-full h-11 bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-xl pl-9 pr-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />

                  {/* Gợi ý */}
                  {suggestionOpen && input.trim() && (
                    <div
                      className="absolute top-full left-0 right-0 mt-2 z-30 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden"
                      role="listbox"
                      aria-label="Gợi ý khóa học"
                    >
                      {suggestionLoading ? (
                        <p className="px-4 py-3 text-sm text-slate-500">
                          Đang tìm gợi ý...
                        </p>
                      ) : suggestions.length > 0 ? (
                        suggestions.map((course) => (
                          <button
                            key={course.courseId ?? course.id}
                            type="button"
                            role="option"
                            aria-selected={false}
                            onClick={() => {
                              setInput(course.title);
                              submitSearch(course.title);
                            }}
                            className="w-full px-4 py-3 text-left text-sm text-slate-700 hover:bg-indigo-50 border-b last:border-b-0 border-slate-100"
                          >
                            🔎 {course.title}
                          </button>
                        ))
                      ) : (
                        <p className="px-4 py-3 text-sm text-slate-500">
                          Không có gợi ý phù hợp.
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  className="h-11 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm shrink-0"
                >
                  Tìm kiếm
                </button>
              </form>
            </div>
          </div>

          <div className="flex justify-end mt-3">
            <button
              type="button"
              onClick={resetFilters}
              className="text-sm font-medium text-indigo-600 hover:underline"
            >
              Đặt lại bộ lọc
            </button>
          </div>

          {categoryError && (
            <p className="mt-3 text-sm text-red-600">
              Không tải được danh mục: {categoryError}
            </p>
          )}
        </section>

        {/* Thống kê */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-6">
          <h2 className="text-xl font-bold text-slate-900">
            {keyword
              ? `Kết quả cho “${keyword}”`
              : "Tất cả khóa học"}
          </h2>

          <p className="text-sm text-slate-500">
            {formatNumber(totalElements)} khóa học từ API
          </p>
        </div>

        {/* Danh sách khóa học */}
        {loading && courses.length === 0 ? (
          <p className="py-16 text-center text-slate-500">
            Đang tải khóa học...
          </p>
        ) : courses.length === 0 && !error ? (
          <div className="py-16 text-center">
            <p className="text-slate-600 font-medium">
              Không tìm thấy khóa học phù hợp.
            </p>

            <p className="text-sm text-slate-400 mt-2">
              Hãy thử thay đổi danh mục, mức giá hoặc từ khóa.
            </p>
          </div>
        ) : (
          <section
            aria-label="Danh sách khóa học"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {courses.map((course) => (
              <CourseCard
                key={course.courseId ?? course.id}
                course={course}
              />
            ))}
          </section>
        )}

        {/* Cuộn tải thêm */}
        <div
          ref={loaderRef}
          className="text-center py-8"
          aria-live="polite"
        >
          {loading && courses.length > 0 && (
            <p className="text-slate-500">
              Đang tải thêm khóa học...
            </p>
          )}

          {error && (
            <div role="alert" className="text-red-600">
              <p>{error}</p>

              <button
                type="button"
                onClick={() =>
                  setRetry((value) => value + 1)
                }
                className="mt-3 px-4 py-2 rounded-lg border border-red-200 hover:bg-red-50"
              >
                Thử lại
              </button>
            </div>
          )}

          {!loading &&
            !error &&
            !hasMore &&
            courses.length > 0 && (
              <p className="text-slate-400 text-sm">
                Đã tải hết khóa học.
              </p>
            )}
        </div>
      </div>
    </main>
  );
}
