
import React from "react";
import { Link } from "react-router-dom";

const API_BASE = (
  import.meta.env.VITE_API_BASE_URL ||
  "http://localhost:8080"
).replace(/\/+$/, "");

const formatPrice = (value) => {
  if (value == null) return "Liên hệ";

  const price = Number(value);

  if (!Number.isFinite(price)) return "Liên hệ";

  return `${price.toLocaleString("vi-VN")}₫`;
};

const getImageUrl = (imageUrl) => {
  if (!imageUrl || typeof imageUrl !== "string") {
    return null;
  }

  if (/^(https?:|data:|blob:)/i.test(imageUrl)) {
    return imageUrl;
  }

  if (imageUrl.startsWith("//")) {
    return `https:${imageUrl}`;
  }

  return `${API_BASE}/${imageUrl.replace(/^\/+/, "")}`;
};

export default function CourseCard({ course }) {
  if (!course) return null;

  const courseId = course.courseId;

  const rating =
    course.averageRating == null
      ? null
      : Number(course.averageRating);

  const totalReviews = Number(course.totalReviews ?? 0);
  const totalStudents = Number(course.totalStudents ?? 0);

  const imageUrl = getImageUrl(course.imageUrl);

  const detailUrl =
    courseId != null
      ? `/student/courses/${encodeURIComponent(courseId)}`
      : null;

  return (
    <article className="group relative flex flex-col bg-surface-container-lowest rounded-2xl shadow-sm hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1.5 overflow-hidden">

      {/* Ảnh khóa học */}
      <div className="relative w-full aspect-video overflow-hidden bg-surface-container">
        {imageUrl ? (
          <img
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            src={imageUrl}
            alt={course.title || "Ảnh khóa học"}
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-on-surface-variant">
            Chưa có ảnh khóa học
          </div>
        )}
      </div>

      {/* Thông tin khóa học */}
      <div className="p-space-md flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-1.5 text-outline mb-1.5">
            <span className="material-symbols-outlined text-[16px]">
              school
            </span>

            <span className="font-label-sm text-label-sm font-semibold">
              Khóa học nổi bật
            </span>
          </div>

          <h3 className="font-title-md text-title-md text-on-surface group-hover:text-primary font-bold line-clamp-2 transition-colors leading-snug">
            {course.title || "Khóa học chưa có tiêu đề"}
          </h3>

          <p className="font-body-sm text-body-sm text-on-surface-variant mt-2 truncate">
            {course.instructorName ||
              "Đang cập nhật giảng viên"}
          </p>
        </div>

        {/* Đánh giá và giá */}
        <div className="mt-4 pt-3 border-t border-surface-container">
          <div className="flex items-center justify-between mb-2 gap-2">
            <div className="flex items-center gap-1">
              <span
                className="material-symbols-outlined text-tertiary text-[18px]"
                style={{
                  fontVariationSettings: "'FILL' 1",
                }}
              >
                star
              </span>

              <span className="font-title-sm text-title-sm text-on-surface font-bold">
                {rating != null && Number.isFinite(rating)
                  ? rating.toFixed(1)
                  : "Chưa có"}
              </span>

              <span className="font-label-sm text-label-sm text-outline">
                ({totalReviews.toLocaleString("vi-VN")})
              </span>
            </div>

            <span className="font-label-sm text-label-sm text-on-surface-variant font-medium whitespace-nowrap">
              {totalStudents.toLocaleString("vi-VN")} học viên
            </span>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="font-headline-sm text-headline-sm text-tertiary font-extrabold">
              {formatPrice(course.price)}
            </span>
          </div>
        </div>
      </div>

      {/* Nút xem chi tiết */}
      <div className="absolute inset-x-0 bottom-0 p-space-md bg-gradient-to-t from-surface-container-lowest via-surface-container-lowest/95 to-transparent opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 group-focus-within:opacity-100 group-focus-within:translate-y-0 transition-all duration-300 flex items-center justify-center">

        {detailUrl ? (
          <Link
            to={detailUrl}
            className="w-full py-2.5 rounded-xl bg-primary hover:bg-primary-container text-on-primary font-title-sm text-title-sm font-bold text-center shadow-lg transition-colors flex items-center justify-center gap-2"
          >
            Xem chi tiết

            <span className="material-symbols-outlined text-[18px]">
              arrow_forward
            </span>
          </Link>
        ) : (
          <span className="w-full py-2.5 rounded-xl bg-surface-container text-on-surface-variant font-title-sm text-title-sm font-bold text-center">
            Chưa có thông tin chi tiết
          </span>
        )}

      </div>
    </article>
  );
}
