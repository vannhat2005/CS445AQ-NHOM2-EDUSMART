
import React from "react";

const getInitials = (name = "") => {
  return (
    name
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(-2)
      .map((word) => word.charAt(0))
      .join("")
      .toUpperCase() || "GV"
  );
};

const MyCourseCard = ({ course, onOpen }) => {
  const {
    courseId,
    title,
    description,
    imageUrl,
    instructorName,
    categoryName,
    totalQuizzes = 0,
    completedQuizzes = 0,
    progressPercent = 0,
    learningStatus,
  } = course;

  const progress = Math.min(
    100,
    Math.max(0, Number(progressPercent) || 0)
  );

  const isCompleted = learningStatus === "COMPLETED";
  const isNotStarted = learningStatus === "NOT_STARTED";
  const isInProgress = learningStatus === "IN_PROGRESS";

  const statusLabel = isCompleted
    ? "Đã hoàn thành"
    : isNotStarted
    ? "Chưa bắt đầu"
    : "Đang học";

  const buttonLabel = isCompleted
    ? "Xem lại khóa học"
    : isNotStarted
    ? "Bắt đầu học ngay"
    : "Tiếp tục học";

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-100 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
      {/* ẢNH KHÓA HỌC */}
      <div className="relative aspect-video overflow-hidden bg-gradient-to-br from-indigo-100 via-sky-100 to-purple-100">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-6xl">
            📚
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

        {/* TRẠNG THÁI */}
        <span
          className={`absolute left-3 top-3 rounded-full px-3 py-1 text-xs font-semibold shadow-sm ${
            isCompleted
              ? "bg-emerald-100 text-emerald-700"
              : isNotStarted
              ? "bg-amber-100 text-amber-700"
              : "bg-indigo-100 text-indigo-700"
          }`}
        >
          {isCompleted ? "✓ " : isInProgress ? "▶ " : "◷ "}
          {statusLabel}
        </span>

        {/* DANH MỤC */}
        {categoryName && (
          <span className="absolute bottom-3 left-3 max-w-[80%] truncate rounded-md bg-white/95 px-3 py-1 text-xs font-semibold text-indigo-700">
            {categoryName}
          </span>
        )}
      </div>

      {/* NỘI DUNG */}
      <div className="flex flex-1 flex-col gap-4 p-5">
        <div className="space-y-3">
          {/* TÊN KHÓA HỌC */}
          <h3 className="line-clamp-2 min-h-12 text-lg font-bold leading-6 text-slate-900 transition-colors group-hover:text-indigo-700">
            {title}
          </h3>

          {/* MÔ TẢ */}
          {description && (
            <p className="line-clamp-2 text-sm text-slate-500">
              {description}
            </p>
          )}

          {/* GIẢNG VIÊN */}
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700">
              {getInitials(instructorName || "")}
            </div>

            <div className="min-w-0">
              <p className="text-xs text-slate-400">
                Giảng viên
              </p>

              <p className="truncate text-sm font-medium text-slate-700">
                {instructorName || "Chưa cập nhật"}
              </p>
            </div>
          </div>
        </div>

        {/* TIẾN ĐỘ QUIZ */}
        <div className="mt-auto space-y-3">
          <div className="flex items-center justify-between gap-2">
            <span
              className={`text-sm font-semibold ${
                isCompleted
                  ? "text-emerald-700"
                  : "text-slate-800"
              }`}
            >
              {progress}% hoàn thành
            </span>

            <span className="text-xs text-slate-500">
              {completedQuizzes}/{totalQuizzes} Quiz
            </span>
          </div>

          {/* THANH TIẾN ĐỘ */}
          <div
            className="h-2.5 overflow-hidden rounded-full bg-slate-100"
            role="progressbar"
            aria-label={`Tiến độ khóa học ${title}`}
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                isCompleted
                  ? "bg-emerald-500"
                  : isNotStarted
                  ? "bg-slate-300"
                  : "bg-indigo-600"
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* GHI CHÚ TRẠNG THÁI */}
          <div
            className={`rounded-xl p-3 text-sm ${
              isCompleted
                ? "bg-emerald-50 text-emerald-700"
                : "bg-slate-50 text-slate-600"
            }`}
          >
            {isCompleted
              ? "🎉 Bạn đã hoàn thành tất cả Quiz!"
              : isNotStarted
              ? "🚀 Bắt đầu học và hoàn thành Quiz đầu tiên."
              : "▶ Tiếp tục học để hoàn thành các Quiz còn lại."}
          </div>
        </div>

        {/* NÚT HỌC */}
        <button
          type="button"
          onClick={() => onOpen?.(courseId)}
          className={`w-full rounded-xl px-4 py-3 text-sm font-semibold transition-colors ${
            isCompleted
              ? "bg-emerald-600 text-white hover:bg-emerald-700"
              : "bg-indigo-700 text-white hover:bg-indigo-800"
          }`}
        >
          {buttonLabel} →
        </button>
      </div>
    </article>
  );
};

export default MyCourseCard;
