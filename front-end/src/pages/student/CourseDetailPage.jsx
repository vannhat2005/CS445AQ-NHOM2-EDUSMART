
import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import {
  getCourseDetail,
  getCourseCurriculum,
  getCourseReviews,
} from "../../services/student/courseDetailService";

import { createCourseReview } from "../../services/student/courseReviewService";

// ==========================================
// HELPERS
// ==========================================

const API_BASE = (
  import.meta.env.VITE_API_BASE_URL ||
  "http://localhost:8080"
).replace(/\/+$/, "");

const formatNumber = (value) =>
  Number(value ?? 0).toLocaleString("vi-VN");

const formatPrice = (value) => {
  if (value == null) return "Liên hệ";

  const price = Number(value);

  return Number.isFinite(price)
    ? `${price.toLocaleString("vi-VN")}₫`
    : "Liên hệ";
};

const dateLabel = (value) => {
  if (!value) return "";

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? ""
    : date.toLocaleDateString("vi-VN");
};

const assetUrl = (value) => {
  if (!value || typeof value !== "string") return "";

  if (/^(https?:|data:|blob:)/i.test(value)) {
    return value;
  }

  if (value.startsWith("//")) {
    return `https:${value}`;
  }

  return `${API_BASE}/${value.replace(/^\/+/, "")}`;
};

const parseOutcomes = (value) => {
  if (Array.isArray(value)) {
    return value.filter(Boolean);
  }

  if (!value || typeof value !== "string") {
    return [];
  }

  try {
    const parsed = JSON.parse(value);

    if (Array.isArray(parsed)) {
      return parsed.filter(Boolean);
    }
  } catch {
    // Không phải JSON
  }

  return value
    .split(/\r?\n|;/)
    .map((item) => item.trim())
    .filter(Boolean);
};

// ==========================================
// ICON
// ==========================================

function Icon({ children, className = "" }) {
  return (
    <span
      aria-hidden="true"
      className={`material-symbols-outlined ${className}`}
    >
      {children}
    </span>
  );
}

// ==========================================
// STARS
// ==========================================

function Stars({ rating = 0, size = "text-lg" }) {
  const score = Math.max(
    0,
    Math.min(5, Number(rating) || 0)
  );

  return (
    <span
      className={`inline-flex items-center gap-0.5 ${size}`}
      aria-label={`${score}/5 sao`}
    >
      {Array.from({ length: 5 }, (_, index) => {
        const difference = score - index;

        const fillPercent = Math.max(
          0,
          Math.min(100, difference * 100)
        );

        return (
          <span
            key={index}
            className="relative inline-block leading-none"
            aria-hidden="true"
          >
            <span className="text-slate-300">☆</span>

            <span
              className="absolute inset-0 overflow-hidden whitespace-nowrap text-amber-400"
              style={{ width: `${fillPercent}%` }}
            >
              ★
            </span>
          </span>
        );
      })}
    </span>
  );
}

// ==========================================
// MAIN COMPONENT
// ==========================================

export default function CourseDetailPage({
  courseId,
  onEnroll,
  onStartLearning,
  onPreviewLesson,
}) {
  const navigate = useNavigate();

  // ========================================
  // STATES
  // ========================================

  const [course, setCourse] = useState(null);
  const [curriculum, setCurriculum] = useState(null);
  const [reviews, setReviews] = useState(null);

  const [reviewPage, setReviewPage] = useState(1);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");

  const [reviewSubmitting, setReviewSubmitting] =
    useState(false);

  const [reviewMessage, setReviewMessage] = useState("");

  const [loading, setLoading] = useState(true);
  const [reviewsLoading, setReviewsLoading] = useState(false);

  const [error, setError] = useState("");
  const [reviewError, setReviewError] = useState("");

  const [expandedChapters, setExpandedChapters] =
    useState([]);

  const [
    descriptionExpanded,
    setDescriptionExpanded,
  ] = useState(false);

  const [actionMessage, setActionMessage] = useState("");

  // ========================================
  // LOAD COURSE + CURRICULUM
  // ========================================

  useEffect(() => {
    if (!courseId) {
      setError("Không tìm thấy ID khóa học.");
      setLoading(false);
      return;
    }

    const controller = new AbortController();

    setLoading(true);
    setError("");
    setCourse(null);
    setCurriculum(null);
    setExpandedChapters([]);
    setDescriptionExpanded(false);
    setActionMessage("");
    setReviewPage(1);
    setReviewMessage("");
    setReviewComment("");

    Promise.all([
      getCourseDetail(courseId, controller.signal),
      getCourseCurriculum(courseId, controller.signal),
    ])
      .then(([detail, syllabus]) => {
        if (controller.signal.aborted) return;

        setCourse(detail);
        setCurriculum(syllabus);

        const firstChapter = syllabus?.chapters?.[0];

        setExpandedChapters(
          firstChapter ? [firstChapter.chapterId] : []
        );
      })
      .catch((err) => {
        if (controller.signal.aborted) return;

        setError(
          err?.message ||
          "Không thể tải thông tin khóa học."
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      });

    return () => controller.abort();
  }, [courseId]);

  // ========================================
  // LOAD REVIEWS
  // ========================================

  useEffect(() => {
    if (!courseId) return;

    const controller = new AbortController();

    setReviewsLoading(true);
    setReviewError("");
    setReviews(null);

    getCourseReviews(
      courseId,
      reviewPage,
      5,
      controller.signal
    )
      .then((data) => {
        if (!controller.signal.aborted) {
          setReviews(data);
        }
      })
      .catch((err) => {
        if (!controller.signal.aborted) {
          setReviewError(
            err?.message || "Không thể tải đánh giá."
          );
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setReviewsLoading(false);
        }
      });

    return () => controller.abort();
  }, [courseId, reviewPage]);

  // ========================================
  // COMPUTED DATA
  // ========================================

  const outcomes = useMemo(
    () => parseOutcomes(course?.learningOutcomes),
    [course?.learningOutcomes]
  );

  const chapters = curriculum?.chapters || [];

  const allExpanded =
    chapters.length > 0 &&
    chapters.every((chapter) =>
      expandedChapters.includes(chapter.chapterId)
    );

  // Backend quyết định học viên đã mua hay chưa
  const isEnrolled =
    course?.enrolled === true ||
    course?.isEnrolled === true;

  const canReview =
    isEnrolled && course?.canReview === true;

  // ========================================
  // LEARNING NAVIGATION
  // ========================================

  const openLesson = (lesson) => {
    setActionMessage("");

    if (!courseId) {
      setActionMessage("Không tìm thấy khóa học.");
      return;
    }

    if (!lesson?.lessonId) {
      setActionMessage(
        "Không tìm thấy mã bài học để truy cập."
      );
      return;
    }

    navigate(
      `/student/courses/${courseId}/lessons/${lesson.lessonId}`
    );
  };

  // ========================================
  // START LEARNING / ENROLL
  // ========================================

  const handleAction = () => {
    setActionMessage("");

    if (!course) return;

    if (isEnrolled) {
      const firstLesson = chapters
        .flatMap((chapter) => chapter.lessons || [])
        .find((lesson) => lesson?.lessonId != null);

      if (!firstLesson) {
        setActionMessage(
          "Khóa học hiện chưa có bài học để bắt đầu."
        );
        return;
      }

      // Điều hướng trực tiếp vào bài đầu tiên.
      // Không cần callback từ App.jsx.
      openLesson(firstLesson);
      return;
    }

    navigate(`/student/courses/${courseId}/checkout`, {
      state: {
        course: {
          courseId: Number(courseId),
          title: course.title,
          instructor: course.instructorName,
          amount: course.price,
          imageUrl: course.imageUrl,
        },
      },
    });
  };

  // ========================================
  // CLICK LESSON
  // ========================================

  const handleLesson = (lesson) => {
    setActionMessage("");

    if (isEnrolled) {
      // Mở đúng bài học mà người dùng đã bấm
      openLesson(lesson);
      return;
    }

    if (
      lesson?.isPreview === true &&
      typeof onPreviewLesson === "function"
    ) {
      onPreviewLesson(lesson, course);
      return;
    }

    setActionMessage(
      lesson?.isPreview === true
        ? "Chưa kết nối trang xem thử bài học."
        : "Bạn cần mua khóa học để truy cập bài học."
    );
  };

  // ========================================
  // CHAPTER ACCORDION
  // ========================================

  const toggleChapter = (chapterId) => {
    setExpandedChapters((previous) =>
      previous.includes(chapterId)
        ? previous.filter((id) => id !== chapterId)
        : [...previous, chapterId]
    );
  };

  const toggleAllChapters = () => {
    setExpandedChapters(
      allExpanded
        ? []
        : chapters.map((chapter) => chapter.chapterId)
    );
  };

  // ========================================
  // SUBMIT REVIEW
  // ========================================

  const handleSubmitReview = async (event) => {
    event.preventDefault();

    if (!canReview || reviewSubmitting) return;

    setReviewSubmitting(true);
    setReviewMessage("");

    try {
      await createCourseReview(courseId, {
        rating: Number(reviewRating),
        comment: reviewComment.trim(),
      });

      setReviewMessage(
        "Đánh giá của bạn đã được gửi thành công!"
      );

      setReviewComment("");

      setCourse((prev) =>
        prev ? { ...prev, canReview: false } : prev
      );

      try {
        const [detail, updatedReviews] =
          await Promise.all([
            getCourseDetail(courseId),
            getCourseReviews(courseId, 1, 5),
          ]);

        setCourse(detail);
        setReviewPage(1);
        setReviews(updatedReviews);
      } catch {
        setReviewMessage(
          "Đánh giá đã gửi thành công. Hãy tải lại trang để xem dữ liệu mới nhất."
        );
      }
    } catch (err) {
      if (err?.status === 409) {
        setCourse((prev) =>
          prev ? { ...prev, canReview: false } : prev
        );

        setReviewMessage(
          "Bạn đã đánh giá khóa học này rồi."
        );
      } else {
        setReviewMessage(
          err?.message ||
          "Không thể gửi đánh giá. Vui lòng thử lại."
        );
      }
    } finally {
      setReviewSubmitting(false);
    }
  };

  // ========================================
  // LOADING
  // ========================================

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-5 py-16 text-slate-600">
        Đang tải thông tin khóa học...
      </div>
    );
  }

  // ========================================
  // ERROR
  // ========================================

  if (error) {
    return (
      <div
        className="max-w-3xl mx-auto m-8 p-6 rounded-xl bg-red-50 text-red-700"
        role="alert"
      >
        {error}
      </div>
    );
  }

  if (!course) {
    return (
      <div className="max-w-7xl mx-auto px-5 py-16 text-slate-600">
        Không tìm thấy thông tin khóa học.
      </div>
    );
  }

  // ========================================
  // UI
  // ========================================

  return (
    <div
      className={`min-h-screen bg-slate-50 text-slate-800 ${isEnrolled ? "pb-0" : "pb-24 lg:pb-0"
        }`}
    >
      {/* ===================================
          HERO
      =================================== */}

      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-sky-950 text-white py-10 lg:py-14">
        <div className="absolute -top-28 -left-20 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-5 lg:px-8 relative z-10">
          {/* Breadcrumb */}

          <nav className="text-sm text-slate-300 flex flex-wrap items-center gap-2 mb-7">
            <Link
              to="/student"
              className="hover:text-white"
            >
              Trang chủ
            </Link>

            <Icon className="text-base">
              chevron_right
            </Icon>

            <Link
              to="/student/courses"
              className="hover:text-white"
            >
              Khám phá khóa học
            </Link>

            <Icon className="text-base">
              chevron_right
            </Icon>

            <span>
              {course.categoryName || "Khóa học"}
            </span>
          </nav>

          <div
            className={`space-y-4 ${isEnrolled ? "lg:w-full" : "lg:w-2/3"
              }`}
          >
            <h1 className="text-3xl lg:text-5xl leading-tight font-extrabold tracking-tight">
              {course.title}
            </h1>

            <p className="text-slate-200 leading-relaxed">
              {course.description}
            </p>

            {/* Rating và học viên */}

            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-slate-200">
              <span className="inline-flex items-center gap-2">
                <strong className="text-amber-400">
                  {Number(
                    course.averageRating || 0
                  ).toFixed(1)}
                </strong>

                <Stars
                  rating={course.averageRating}
                  size="text-base"
                />

                <a
                  href="#reviews"
                  className="underline"
                >
                  ({formatNumber(course.totalReviews)} đánh giá)
                </a>
              </span>

              <span className="inline-flex items-center gap-1">
                <Icon className="text-lg">
                  group
                </Icon>

                {formatNumber(course.totalStudents)} học viên
              </span>

              {course.updatedAt && (
                <span className="inline-flex items-center gap-1">
                  <Icon className="text-lg">
                    update
                  </Icon>

                  Cập nhật {dateLabel(course.updatedAt)}
                </span>
              )}
            </div>

            {/* Giảng viên */}

            <div className="flex items-center gap-3 pt-3">
              <div className="h-11 w-11 rounded-full bg-blue-600 flex items-center justify-center font-bold text-lg">
                {(course.instructorName || "G").slice(0, 1)}
              </div>

              <div>
                <div className="font-semibold">
                  {course.instructorName || "Giảng viên"}
                </div>

                <div className="text-sm text-slate-300">
                  Giảng viên khóa học
                </div>
              </div>
            </div>

            {/* Đã mua */}

            {isEnrolled && (
              <div className="flex flex-wrap items-center gap-3 pt-3">
                <div className="inline-flex items-center gap-2 rounded-xl bg-emerald-500/15 border border-emerald-400/30 px-4 py-3 text-emerald-200 font-semibold">
                  <Icon>verified</Icon>
                  Bạn đã sở hữu khóa học này
                </div>

                <button
                  type="button"
                  onClick={handleAction}
                  className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-5 py-3 rounded-xl font-semibold text-white transition-colors"
                >
                  <Icon>play_circle</Icon>
                  Bắt đầu học
                  <Icon>arrow_forward</Icon>
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ===================================
          MAIN
      =================================== */}

      <main className="max-w-7xl mx-auto px-5 lg:px-8 py-8 space-y-7">
        {/* =================================
            LEARNING OUTCOMES
        ================================= */}

        <section className="bg-white border border-slate-100 rounded-2xl p-6 lg:p-8 shadow-sm">
          <h2 className="font-bold text-xl mb-5 flex items-center gap-2">
            <Icon className="text-blue-600">
              checklist
            </Icon>

            Bạn sẽ học được gì trong khóa học này?
          </h2>

          {outcomes.length > 0 ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {outcomes.map((item, index) => (
                <div
                  key={index}
                  className="flex gap-3 rounded-xl bg-slate-50 p-4 text-sm"
                >
                  <Icon className="text-blue-600">
                    check_circle
                  </Icon>

                  <span>{item}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-500">
              Khóa học chưa cập nhật mục tiêu học tập.
            </p>
          )}
        </section>

        <div className="grid lg:grid-cols-12 gap-7 items-start">
          {/* =================================
              LEFT CONTENT
          ================================= */}

          <div
            className={`space-y-7 min-w-0 ${isEnrolled
                ? "lg:col-span-12"
                : "lg:col-span-8"
              }`}
          >
            {/* =============================
                DESCRIPTION
            ============================= */}

            <section className="bg-white rounded-2xl shadow-sm p-6 lg:p-8 border border-slate-200">
              <h2 className="text-xl font-bold mb-5 text-slate-900">
                Mô tả khóa học chi tiết
              </h2>

              <div
                className={`whitespace-pre-line text-[15px] sm:text-base leading-8 text-slate-800 font-normal ${descriptionExpanded
                    ? ""
                    : "line-clamp-6"
                  }`}
              >
                {course.description ||
                  "Chưa có mô tả khóa học."}
              </div>

              {course.description?.length > 220 && (
                <button
                  type="button"
                  onClick={() =>
                    setDescriptionExpanded(
                      (value) => !value
                    )
                  }
                  className="mt-5 inline-flex items-center gap-2 text-blue-700 hover:text-blue-900 font-semibold transition-colors"
                >
                  {descriptionExpanded
                    ? "Thu gọn mô tả"
                    : "Xem toàn bộ mô tả khóa học"}

                  <Icon className="text-xl">
                    {descriptionExpanded
                      ? "expand_less"
                      : "expand_more"}
                  </Icon>
                </button>
              )}
            </section>

            {/* =============================
                CURRICULUM
            ============================= */}

            <section className="bg-white rounded-2xl shadow-sm p-6 lg:p-8">
              <div className="flex flex-wrap justify-between items-center gap-3 mb-5">
                <div>
                  <h2 className="text-xl font-bold">
                    Nội dung khóa học
                  </h2>

                  <p className="text-sm text-slate-500 mt-1">
                    {formatNumber(
                      curriculum?.totalChapters
                    )}{" "}
                    chương
                    {" • "}
                    {formatNumber(
                      curriculum?.totalLessons
                    )}{" "}
                    bài học
                  </p>
                </div>

                {chapters.length > 0 && (
                  <button
                    type="button"
                    className="text-sm text-blue-700 font-semibold hover:underline"
                    onClick={toggleAllChapters}
                  >
                    {allExpanded
                      ? "Thu gọn tất cả các chương"
                      : "Mở rộng tất cả các chương"}
                  </button>
                )}
              </div>

              <div className="space-y-3">
                {chapters.length === 0 && (
                  <p className="text-slate-500">
                    Chưa có chương hoặc bài học được công bố.
                  </p>
                )}

                {chapters.map((chapter) => {
                  const expanded =
                    expandedChapters.includes(
                      chapter.chapterId
                    );

                  return (
                    <div
                      key={chapter.chapterId}
                      className="rounded-xl border border-slate-100 overflow-hidden"
                    >
                      {/* Chapter header */}

                      <button
                        type="button"
                        aria-expanded={expanded}
                        className="w-full bg-slate-100 hover:bg-slate-200 p-4 flex items-center justify-between gap-3 text-left"
                        onClick={() =>
                          toggleChapter(
                            chapter.chapterId
                          )
                        }
                      >
                        <div className="flex items-center gap-3">
                          <Icon className="text-slate-500">
                            {expanded
                              ? "expand_less"
                              : "expand_more"}
                          </Icon>

                          <div>
                            <h3 className="font-semibold">
                              {chapter.title}
                            </h3>

                            <p className="text-xs text-slate-500 mt-1">
                              {formatNumber(
                                chapter.totalLessons ??
                                chapter.lessons?.length
                              )}{" "}
                              bài học
                            </p>
                          </div>
                        </div>
                      </button>

                      {/* Lessons */}

                      {expanded && (
                        <div className="p-2 sm:p-3 bg-white space-y-1">
                          {(chapter.lessons || []).length >
                            0 ? (
                            chapter.lessons.map(
                              (lesson, index) => (
                                <button
                                  key={lesson.lessonId}
                                  type="button"
                                  className="w-full text-left flex justify-between items-center gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors"
                                  onClick={() =>
                                    handleLesson(lesson)
                                  }
                                >
                                  <div className="flex gap-3 items-start">
                                    <Icon className="text-blue-600 text-xl">
                                      {isEnrolled
                                        ? "play_circle"
                                        : lesson.isPreview
                                          ? "visibility"
                                          : "lock"}
                                    </Icon>

                                    <span className="text-sm">
                                      {lesson.orderNum ??
                                        index + 1}
                                      . {lesson.title}
                                    </span>
                                  </div>

                                  {isEnrolled ? (
                                    <span className="shrink-0 text-blue-700 text-xs font-semibold">
                                      Vào học
                                    </span>
                                  ) : lesson.isPreview ===
                                    true ? (
                                    <span className="shrink-0 text-blue-700 text-xs font-semibold">
                                      Học thử
                                    </span>
                                  ) : (
                                    <Icon className="text-slate-400 text-lg">
                                      lock
                                    </Icon>
                                  )}
                                </button>
                              )
                            )
                          ) : (
                            <p className="p-3 text-sm text-slate-500">
                              Chương chưa có bài học.
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Thông báo thao tác */}

              {actionMessage && (
                <p
                  role="status"
                  className="mt-5 text-sm text-amber-700 bg-amber-50 rounded-lg p-3"
                >
                  {actionMessage}
                </p>
              )}
            </section>

            {/* =============================
                REVIEWS
            ============================= */}

            <section
              id="reviews"
              className="bg-white rounded-2xl shadow-sm p-6 lg:p-8 scroll-mt-24"
            >
              <h2 className="text-xl font-bold mb-5">
                Đánh giá từ học viên
              </h2>

              {/* Review form */}

              {isEnrolled && (
                <div className="mb-6 rounded-xl border border-blue-100 bg-blue-50 p-5">
                  {canReview ? (
                    <form
                      onSubmit={handleSubmitReview}
                      className="space-y-4"
                    >
                      <h3 className="font-bold text-slate-900">
                        Viết đánh giá của bạn
                      </h3>

                      <p className="text-sm text-slate-600">
                        Bạn đã mua khóa học. Hãy chia sẻ
                        trải nghiệm học tập của mình.
                      </p>

                      <div
                        className="flex flex-wrap items-center gap-2"
                        aria-label="Chọn số sao đánh giá"
                      >
                        {[1, 2, 3, 4, 5].map(
                          (star) => (
                            <button
                              key={star}
                              type="button"
                              aria-label={`${star} sao`}
                              aria-pressed={
                                reviewRating === star
                              }
                              onClick={() =>
                                setReviewRating(star)
                              }
                              className={`text-3xl transition-colors ${star <= reviewRating
                                  ? "text-amber-400"
                                  : "text-slate-300"
                                }`}
                            >
                              ★
                            </button>
                          )
                        )}

                        <span className="ml-2 text-sm font-semibold">
                          {reviewRating}/5 sao
                        </span>
                      </div>

                      <textarea
                        value={reviewComment}
                        onChange={(event) =>
                          setReviewComment(
                            event.target.value
                          )
                        }
                        maxLength={5000}
                        rows={4}
                        placeholder="Nhập cảm nhận của bạn về khóa học..."
                        className="w-full rounded-lg border border-slate-200 p-3 outline-none focus:ring-2 focus:ring-blue-500"
                      />

                      <button
                        type="submit"
                        disabled={reviewSubmitting}
                        className="rounded-lg bg-blue-700 px-5 py-3 font-semibold text-white hover:bg-blue-800 disabled:opacity-50"
                      >
                        {reviewSubmitting
                          ? "Đang gửi..."
                          : "Gửi đánh giá"}
                      </button>
                    </form>
                  ) : (
                    <p className="text-sm font-medium text-blue-800">
                      Bạn đã đánh giá khóa học này
                      hoặc hiện chưa đủ điều kiện
                      gửi đánh giá mới.
                    </p>
                  )}

                  {reviewMessage && (
                    <p
                      role="status"
                      className="mt-3 text-sm font-medium text-blue-800"
                    >
                      {reviewMessage}
                    </p>
                  )}
                </div>
              )}

              {reviewError ? (
                <p className="text-red-600">
                  {reviewError}
                </p>
              ) : (
                <>
                  {/* Review statistics */}

                  <div className="grid sm:grid-cols-12 gap-6 bg-slate-50 rounded-xl p-5 mb-6">
                    <div className="sm:col-span-4 flex flex-col items-center justify-center sm:border-r border-slate-200">
                      <div className="text-5xl font-black text-blue-700">
                        {Number(
                          reviews?.averageRating ??
                          course.averageRating ??
                          0
                        ).toFixed(1)}
                      </div>

                      <Stars
                        rating={
                          reviews?.averageRating ??
                          course.averageRating
                        }
                      />

                      <p className="text-sm text-slate-500 mt-2">
                        {formatNumber(
                          reviews?.totalReviews ??
                          course.totalReviews
                        )}{" "}
                        đánh giá
                      </p>
                    </div>

                    <div className="sm:col-span-8 space-y-2">
                      {[5, 4, 3, 2, 1].map(
                        (star) => {
                          const count = Number(
                            reviews
                              ?.ratingDistribution?.[
                            star
                            ] || 0
                          );

                          const total = Number(
                            reviews?.totalReviews || 0
                          );

                          const percent = total
                            ? Math.round(
                              (count / total) * 100
                            )
                            : 0;

                          return (
                            <div
                              key={star}
                              className="flex items-center gap-3 text-sm"
                            >
                              <span className="w-11 shrink-0">
                                {star} sao
                              </span>

                              <div className="flex-1 bg-slate-200 h-2.5 rounded-full overflow-hidden">
                                <div
                                  className="bg-blue-600 h-full rounded-full"
                                  style={{
                                    width: `${percent}%`,
                                  }}
                                />
                              </div>

                              <span className="w-10 text-right font-medium">
                                {percent}%
                              </span>
                            </div>
                          );
                        }
                      )}
                    </div>
                  </div>

                  {reviewsLoading && (
                    <p className="text-slate-500">
                      Đang tải đánh giá...
                    </p>
                  )}

                  {/* Review list */}

                  <div className="space-y-3">
                    {(
                      reviews?.reviews?.content || []
                    ).map((review) => (
                      <article
                        key={review.reviewId}
                        className="p-5 bg-slate-50 rounded-xl"
                      >
                        <div className="flex flex-wrap justify-between items-start gap-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center">
                              {(
                                review.studentName ||
                                "H"
                              ).slice(0, 1)}
                            </div>

                            <div>
                              <div className="font-semibold">
                                {review.studentName ||
                                  "Học viên"}
                              </div>

                              <div className="text-xs text-slate-500">
                                {dateLabel(
                                  review.createdAt
                                )}
                              </div>
                            </div>
                          </div>

                          <Stars
                            rating={review.rating}
                            size="text-base"
                          />
                        </div>

                        <p className="mt-3 text-sm leading-6 text-slate-700 whitespace-pre-line">
                          {review.comment ||
                            "Không có nhận xét bằng văn bản."}
                        </p>
                      </article>
                    ))}
                  </div>

                  {!reviewsLoading &&
                    !reviews?.reviews?.content
                      ?.length && (
                      <p className="text-slate-500">
                        Chưa có đánh giá nào.
                      </p>
                    )}

                  {/* Pagination */}

                  {(reviews?.reviews?.totalPages ||
                    0) > 1 && (
                      <div className="flex items-center justify-center gap-4 mt-6">
                        <button
                          type="button"
                          className="border rounded-lg px-3 py-2 disabled:opacity-40"
                          disabled={reviewPage <= 1}
                          onClick={() =>
                            setReviewPage(
                              (page) => page - 1
                            )
                          }
                        >
                          Trước
                        </button>

                        <span className="text-sm">
                          Trang {reviewPage}/
                          {reviews.reviews.totalPages}
                        </span>

                        <button
                          type="button"
                          className="border rounded-lg px-3 py-2 disabled:opacity-40"
                          disabled={
                            reviewPage >=
                            reviews.reviews.totalPages
                          }
                          onClick={() =>
                            setReviewPage(
                              (page) => page + 1
                            )
                          }
                        >
                          Sau
                        </button>
                      </div>
                    )}
                </>
              )}
            </section>
          </div>

          {/* =================================
              PURCHASE CARD
              Chỉ hiện khi chưa mua
          ================================= */}

          {!isEnrolled && (
            <aside className="lg:col-span-4 lg:sticky lg:top-24">
              <div className="bg-white rounded-2xl shadow-lg p-5 space-y-4">
                <div className="aspect-video rounded-xl overflow-hidden bg-slate-200 flex items-center justify-center">
                  {course.imageUrl ? (
                    <img
                      src={assetUrl(course.imageUrl)}
                      alt={course.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Icon className="text-6xl text-slate-400">
                      school
                    </Icon>
                  )}
                </div>

                <div className="text-3xl font-black text-blue-700">
                  {formatPrice(course.price)}
                </div>

                <button
                  type="button"
                  onClick={handleAction}
                  className="w-full bg-blue-700 hover:bg-blue-800 text-white font-bold py-3.5 px-4 rounded-xl flex justify-center items-center gap-2"
                >
                  <Icon>bolt</Icon>
                  ĐĂNG KÝ NGAY
                </button>

                {actionMessage && (
                  <p
                    role="status"
                    className="text-sm text-amber-700 bg-amber-50 rounded-lg p-3"
                  >
                    {actionMessage}
                  </p>
                )}
              </div>
            </aside>
          )}
        </div>
      </main>

      {/* ===================================
          MOBILE PURCHASE BAR
      =================================== */}

      {!isEnrolled && (
        <div className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-slate-200 shadow-xl px-4 py-3 flex items-center justify-between gap-3">
          <div className="font-bold text-blue-700 text-xl">
            {formatPrice(course.price)}
          </div>

          <button
            type="button"
            onClick={handleAction}
            className="bg-blue-700 text-white rounded-lg px-4 py-3 font-semibold"
          >
            Đăng ký ngay
          </button>
        </div>
      )}
    </div>
  );
}
