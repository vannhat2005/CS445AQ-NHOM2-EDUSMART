
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getCurrentUser } from '../../services/authService';
import { toast } from 'react-hot-toast';
import {
  getAssignedCourseDetail,
  publishCourse
} from '../../services/courseService';

const CourseDetailInstructor = () => {
  const navigate = useNavigate();
  const { courseId } = useParams();

  // State thông tin khóa học
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // State modal xuất bản
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Lấy chi tiết khóa học
  useEffect(() => {
    const fetchCourseDetail = async () => {
      try {
        setLoading(true);
        setError('');

        const instructorId = await getCurrentUser();

        const data = await getAssignedCourseDetail(
          instructorId,
          courseId
        );

        setCourse(data.result);
      } catch (err) {
        console.error('Lỗi lấy chi tiết khóa học:', err);

        setError(
          err.response?.data?.message ||
          'Không thể tải thông tin khóa học.'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchCourseDetail();
  }, [courseId]);

  // Định dạng học phí
  const formatPrice = (price) => {
    return (
      new Intl.NumberFormat('vi-VN').format(price || 0) +
      ' VNĐ'
    );
  };

  // Hiển thị trạng thái khóa học
  const getStatus = (status) => {
    switch (status) {
      case 'Published':
        return {
          label: 'Đã xuất bản',
          style: 'bg-emerald-50 text-emerald-700',
          dot: 'bg-emerald-600 animate-pulse'
        };

      case 'Draft':
        return {
          label: 'Bản nháp',
          style: 'bg-gray-100 text-gray-700',
          dot: 'bg-gray-400'
        };

      case 'Hidden':
        return {
          label: 'Đã ẩn',
          style: 'bg-amber-50 text-amber-800',
          dot: 'bg-amber-600'
        };

      default:
        return {
          label: status || 'Chưa xác định',
          style: 'bg-gray-100 text-gray-600',
          dot: 'bg-gray-400'
        };
    }
  };

  // Xác nhận xuất bản khóa học
  const handleConfirmPublish = async () => {
    if (isSubmitting) return;

    try {
      setIsSubmitting(true);

      const instructorId = await getCurrentUser();

      const response = await publishCourse(
        instructorId,
        courseId
      );

      setCourse((prev) => ({
        ...prev,
        status: 'Published'
      }));

      setShowModal(false);

      toast.success(
        response.data?.message ||
        'Xuất bản khóa học thành công!'
      );
    } catch (err) {
      const message =
        err.response?.data?.message ||
        'Không thể xuất bản khóa học. Vui lòng thử lại.';

      toast.error(message);
      console.error('Lỗi xuất bản khóa học:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Điều hướng đến trang quản lý chương
  const handleManageChapters = () => {
    navigate(
      `/instructor/courses/${course.courseId}/chapters`,
      {
        state: {
          courseTitle: course.title,
          courseStatus: course.status
        }
      }
    );
  };

  // Điều hướng đến trang danh sách sinh viên của khóa học
  const handleViewStudents = () => {
    navigate(`/instructor/courses/${course.courseId}/students`, {
      state: {
        courseTitle: course.title,
        courseStatus: course.status
      }
    });
  };
  // Trạng thái đang tải
  if (loading) {
    return (
      <div className="w-full py-20 text-center text-gray-500">
        Đang tải thông tin khóa học...
      </div>
    );
  }

  // Trạng thái lỗi
  if (error) {
    return (
      <div className="w-full py-20 text-center">
        <p className="text-red-500 mb-4">{error}</p>

        <button
          className="px-4 py-2 rounded-lg bg-blue-600 text-white"
          onClick={() => navigate('/instructor/courses')}
          type="button"
        >
          Quay lại danh sách khóa học
        </button>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="w-full py-20 text-center text-gray-500">
        Không tìm thấy thông tin khóa học.
      </div>
    );
  }

  const status = getStatus(course.status);
  // Sắp xếp chương theo orderNum tăng dần
  const chapters = [...(course.chapters || [])].sort((a, b) => a.orderNum - b.orderNum);

  return (
    <div className="flex flex-col w-full max-w-6xl mx-auto pt-6 pb-12">

      {/* ================= BREADCRUMB ================= */}
      <div className="flex items-center justify-between gap-4 mb-4">
        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-2 text-sm text-gray-500"
        >
          <button
            className="hover:text-blue-600 transition-colors font-medium"
            onClick={() => navigate('/instructor/courses')}
            type="button"
          >
            Khóa học
          </button>

          <span className="material-symbols-outlined text-[14px] text-gray-400">
            chevron_right
          </span>

          <span className="text-blue-600 font-semibold">
            Chi tiết khóa học
          </span>
        </nav>

        <button
          className="group flex items-center justify-center w-10 h-10 rounded-xl bg-white text-gray-600 shadow-sm hover:bg-gray-50 hover:text-blue-600 transition-all active:scale-95 shrink-0 border border-gray-100"
          onClick={() => navigate('/instructor/courses')}
          title="Quay lại danh sách khóa học"
          type="button"
        >
          <span className="material-symbols-outlined text-[20px] transition-transform group-hover:-translate-x-0.5">
            arrow_back
          </span>
        </button>
      </div>

      {/* ================= TIÊU ĐỀ TRANG ================= */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            Chi tiết khóa học
          </h1>

          <p className="text-sm text-gray-600 mt-0.5">
            Thông tin chi tiết và nội dung các chương học được phân công giảng dạy.
          </p>
        </div>
      </div>

      {/* ================= THÔNG TIN KHÓA HỌC ================= */}
      <div className="w-full bg-white rounded-xl shadow-sm p-6 mb-6 relative overflow-hidden border border-gray-100">

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* Ảnh đại diện khóa học */}
          <div className="lg:col-span-4 flex flex-col">
            <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden shadow-sm group border border-gray-100">

              {course.imageUrl ? (
                <img
                  className="w-full h-full object-cover transform transition-transform duration-500 group-hover:scale-105"
                  src={course.imageUrl}
                  alt={course.title}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400">
                  <span className="material-symbols-outlined text-6xl">
                    image
                  </span>
                </div>
              )}

              <div className="absolute inset-0 bg-gradient-to-t from-blue-900/60 via-transparent to-transparent opacity-70"></div>
            </div>
          </div>

          {/* Thông tin cơ bản */}
          <div className="lg:col-span-8 flex flex-col justify-between">
            <div>

              {/* Tên khóa học, sinh viên và trạng thái */}
              <div className="flex items-start justify-between gap-4 mb-3">

                <h2 className="text-xl font-bold text-gray-900 tracking-tight">
                  {course.title}
                </h2>

                <div className="flex items-center gap-3 shrink-0 flex-wrap">

                  {/* Nút chuyển đến trang danh sách sinh viên */}
                  <button
                    type="button"
                    onClick={handleViewStudents}
                    className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-gray-50 hover:bg-gray-100 text-blue-600 font-medium text-sm border border-gray-200 shadow-xs transition-colors active:scale-95"
                  >
                    <span className="material-symbols-outlined text-[18px]">group</span>
                    <span>Danh sách sinh viên</span>
                  </button>
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${status.style}`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${status.dot}`}
                    ></span>
                    {status.label}
                  </span>

                </div>
              </div>

              {/* Mô tả khóa học */}
              <div className="p-4 rounded-xl bg-gray-50 mb-4 border border-gray-100">

                <h3 className="text-sm font-semibold text-gray-900 mb-1 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[18px] text-blue-600">
                    description
                  </span>
                  Mô tả khóa học
                </h3>

                <p className="text-sm text-gray-600 leading-relaxed">
                  {course.description || 'Chưa có mô tả khóa học.'}
                </p>
              </div>

              {/* Học phí */}
              <div className="inline-flex items-center gap-4 p-4 rounded-xl bg-gray-50 border border-gray-100 max-w-sm">

                <div className="w-11 h-11 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 shrink-0 shadow-xs">
                  <span className="material-symbols-outlined text-[22px]">
                    payments
                  </span>
                </div>

                <div>
                  <p className="text-xs text-gray-500">
                    Học phí khóa học
                  </p>

                  <div className="flex items-baseline gap-1">
                    <span className="text-lg font-bold text-blue-600">
                      {formatPrice(course.price)}
                    </span>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ================= DANH SÁCH CÁC CHƯƠNG ================= */}
      <div className="w-full bg-white rounded-xl shadow-sm p-6 mb-6 border border-gray-100">

        {/* Header danh sách chương */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-4 border-b border-gray-100">

          <div className="flex items-center gap-3">

            <div className="w-9 h-9 rounded-lg bg-gray-50 flex items-center justify-center text-blue-600">
              <span className="material-symbols-outlined text-[20px]">
                view_list
              </span>
            </div>

            <div>
              <h3 className="text-base font-bold text-gray-900">
                Danh sách các chương
              </h3>

              <p className="text-xs text-gray-500">
                Nội dung cấu trúc chương trình học của học phần ({chapters.length} chương)
              </p>
            </div>
          </div>

          {/* CHỈ MỘT NÚT QUẢN LÝ CHƯƠNG */}
          <button
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-white hover:bg-blue-50 text-blue-600 text-sm font-semibold border border-gray-200 shadow-sm transition-colors active:scale-95"
            onClick={handleManageChapters}
            type="button"
          >
            <span>Quản lý chương</span>
          </button>

        </div>

        {/* Danh sách chương */}
        <div className="flex flex-col gap-3">

          {chapters.length > 0 ? (
            chapters.map((chapter, index) => (
              <div
                key={chapter.chapterId || index}
                className="flex items-center justify-between gap-4 p-4 rounded-xl bg-gray-50 hover:bg-gray-100/70 transition-colors border border-gray-100"
              >

                {/* Thông tin chương */}
                <div className="flex items-start gap-4 min-w-0">

                  <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center font-bold text-blue-600 shrink-0 shadow-xs text-sm border border-gray-100">
                    {String(index + 1).padStart(2, '0')}
                  </div>

                  <div className="min-w-0">

                    <h4 className="text-sm font-semibold text-gray-900">
                      {chapter.title}
                    </h4>

                    <p className="text-xs text-gray-600 mt-0.5 truncate">
                      {chapter.description || 'Chưa có mô tả chương.'}
                    </p>

                  </div>
                </div>

                {/* Chỉ hiển thị số lượng bài học */}
                <div className="flex items-center shrink-0">

                  <span className="px-2.5 py-1 rounded bg-white text-gray-600 text-xs border border-gray-200">
                    {chapter.lessonCount ?? 0} bài học
                  </span>

                </div>
              </div>
            ))
          ) : (
            <div className="py-10 text-center text-sm text-gray-500">
              Khóa học này chưa có chương học.
            </div>
          )}

        </div>
      </div>

      {/* ================= ĐIỀU KIỆN XUẤT BẢN ================= */}
      {course.status === 'Draft' && (
        <div className="w-full bg-white rounded-xl shadow-sm p-6 flex flex-col md:flex-row items-center justify-between gap-4 border border-gray-100">

          <div className="flex items-start gap-3 max-w-xl">

            <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 shrink-0 mt-0.5">
              <span className="material-symbols-outlined text-[18px]">
                info
              </span>
            </div>

            <div>
              <p className="text-sm font-semibold text-gray-900 mb-1">
                Điều kiện xuất bản khóa học
              </p>

              <p className="text-xs text-gray-600 mb-2">
                Để xuất bản khóa học công khai cho học viên, cần đáp ứng các điều kiện sau:
              </p>

              <ul className="flex flex-col gap-1.5 text-xs text-gray-600">

                <li className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-blue-600 text-[16px]">
                    check_circle
                  </span>
                  <span>
                    Khóa học có ít nhất một chương học đang hoạt động.
                  </span>
                </li>

                <li className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-blue-600 text-[16px]">
                    check_circle
                  </span>
                  <span>
                    Có ít nhất một bài học đang hoạt động.
                  </span>
                </li>

                <li className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-blue-600 text-[16px]">
                    check_circle
                  </span>
                  <span>
                    Các bài học phải có nội dung học tập khả dụng cho học viên.
                  </span>
                </li>

              </ul>
            </div>
          </div>

          <div className="w-full md:w-auto shrink-0 flex justify-end">

            <button
              className="w-full md:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition-all shadow-md"
              onClick={() => setShowModal(true)}
              type="button"
            >
              <span className="material-symbols-outlined text-[20px]">
                rocket_launch
              </span>

              <span>Xuất bản khóa học</span>
            </button>

          </div>
        </div>
      )}

      {/* ================= MODAL XÁC NHẬN XUẤT BẢN ================= */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">

          <div className="w-full max-w-lg mx-4 bg-white rounded-xl shadow-xl p-6 border border-gray-100">

            {/* Header modal */}
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-gray-100">

              <div className="flex items-center gap-3">

                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                  <span className="material-symbols-outlined text-[22px]">
                    publish
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-bold text-gray-900">
                    Xác nhận xuất bản khóa học
                  </h3>

                  <p className="text-xs text-gray-500">
                    Mã khóa học: {course.courseId}
                  </p>
                </div>

              </div>
            </div>

            {/* Nội dung xác nhận */}
            <div className="flex flex-col gap-3 mb-6">

              <p className="text-sm text-gray-700 leading-relaxed">
                Bạn có chắc chắn muốn xuất bản khóa học{' '}
                <strong className="text-blue-600 font-semibold">
                  "{course.title}"
                </strong>{' '}
                không?
              </p>

            </div>

            {/* Nút thao tác */}
            <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-100">

              <button
                className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 font-semibold text-sm transition-colors"
                onClick={() => setShowModal(false)}
                disabled={isSubmitting}
                type="button"
              >
                Hủy
              </button>

              <button
                className="inline-flex items-center gap-1.5 px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed text-white font-semibold text-sm shadow-sm transition-all"
                onClick={handleConfirmPublish}
                disabled={isSubmitting}
                type="button"
              >
                <span className="material-symbols-outlined text-[18px]">
                  {isSubmitting ? 'progress_activity' : 'verified'}
                </span>

                <span>
                  {isSubmitting
                    ? 'Đang xuất bản...'
                    : 'Xác nhận xuất bản'}
                </span>
              </button>

            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default CourseDetailInstructor;
