
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { getAssignedCourseDetail, publishCourse } from '../../services/courseService';

// 1. Khai báo hằng số
const INSTRUCTOR_ID = 2; // ID giảng viên dùng để test API

const CourseDetailInstructor = () => {
  // Khởi tạo điều hướng và lấy courseId từ URL
  const navigate = useNavigate();
  const { courseId } = useParams();

  // 2. Khai báo State
  const [course, setCourse] = useState(null); // Thông tin khóa học
  const [loading, setLoading] = useState(false); // Trạng thái tải dữ liệu
  const [error, setError] = useState(''); // Thông báo lỗi tải chi tiết khóa học
  const [showModal, setShowModal] = useState(false); // Hiển thị modal xuất bản
  const [isSubmitting, setIsSubmitting] = useState(false); // Trạng thái xác nhận xuất bản

  // 3. Gọi API lấy chi tiết khóa học
  useEffect(() => {
    const fetchCourseDetail = async () => {
      try {
        setLoading(true);
        setError('');

        // Gọi API với instructorId và courseId lấy từ URL
        const data = await getAssignedCourseDetail(INSTRUCTOR_ID, courseId);

        // Lấy thông tin khóa học từ ApiResponse
        setCourse(data.result);
      } catch (err) {
        console.error('Lỗi lấy chi tiết khóa học:', err);
        setError(err.response?.data?.message || 'Không thể tải thông tin khóa học.');
      } finally {
        setLoading(false);
      }
    };

    fetchCourseDetail();
  }, [courseId]);

  // 4. Hàm định dạng học phí: 500000 -> 500.000 VNĐ
  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN').format(price || 0) + ' VNĐ';
  };

  // 5. Hàm xử lý trạng thái khóa học
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

  // 6. Hàm xử lý xác nhận xuất bản khóa học
  // Gọi API Backend và sử dụng Toast để thông báo kết quả
  const handleConfirmPublish = async () => {
    try {
      // 1. Bật trạng thái đang xử lý và tránh gửi nhiều request
      setIsSubmitting(true);

      // 2. Gọi API xuất bản khóa học
      const response = await publishCourse(INSTRUCTOR_ID, courseId);

      // 3. Cập nhật trạng thái khóa học sau khi xuất bản thành công
      setCourse(prev => ({
        ...prev,
        status: 'Published'
      }));

      // 4. Đóng modal xác nhận
      setShowModal(false);

      // 5. Hiển thị thông báo thành công bằng Toast
      toast.success(
        response.data?.message || 'Xuất bản khóa học thành công!'
      );

    } catch (err) {
      // 6. Lấy thông báo lỗi do Backend trả về
      const message =
        err.response?.data?.message ||
        'Không thể xuất bản khóa học. Vui lòng thử lại.';

      // 7. Hiển thị thông báo lỗi bằng Toast
      toast.error(message);

      // Ghi lỗi vào Console để lập trình viên kiểm tra
      console.error('Lỗi xuất bản khóa học:', err);

    } finally {
      // 8. Kết thúc trạng thái xử lý dù thành công hay thất bại
      setIsSubmitting(false);
    }
  };

  // 7. Xử lý trạng thái đang tải dữ liệu
  if (loading) {
    return (
      <div className="w-full py-20 text-center text-gray-500">
        Đang tải thông tin khóa học...
      </div>
    );
  }

  // 8. Xử lý khi API xảy ra lỗi
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

  // Kiểm tra dữ liệu khóa học
  if (!course) {
    return (
      <div className="w-full py-20 text-center text-gray-500">
        Không tìm thấy thông tin khóa học.
      </div>
    );
  }

  // Lấy trạng thái và danh sách chương từ dữ liệu Backend
  const status = getStatus(course.status);
  const chapters = course.chapters || [];

  // 9. Giao diện chi tiết khóa học
  return (
    <div className="flex flex-col w-full max-w-6xl mx-auto pt-6 pb-12">
      {/* Thanh điều hướng và nút quay lại */}
      <div className="flex items-center justify-between gap-4 mb-4">
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm text-gray-500">
          <button
            className="hover:text-blue-600 transition-colors font-medium"
            onClick={() => navigate('/instructor/courses')}
            type="button"
          >
            Khóa học
          </button>
          <span className="material-symbols-outlined text-[14px] text-gray-400">chevron_right</span>
          <span className="text-blue-600 font-semibold">Chi tiết khóa học</span>
        </nav>
        <button
          className="group flex items-center justify-center w-10 h-10 rounded-xl bg-white text-gray-600 shadow-sm hover:bg-gray-50 hover:text-blue-600 transition-all active:scale-95 shrink-0 border border-gray-100"
          onClick={() => navigate('/instructor/courses')}
          title="Quay lại danh sách khóa học"
          type="button"
        >
          <span className="material-symbols-outlined text-[20px] transition-transform group-hover:-translate-x-0.5">arrow_back</span>
        </button>
      </div>

      {/* Header tiêu đề trang */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Chi tiết khóa học</h1>
          <p className="text-sm text-gray-600 mt-0.5">Thông tin chi tiết và nội dung các chương học được phân công giảng dạy.</p>
        </div>
      </div>

      {/* 10. Thông tin chính của khóa học */}
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
                  <span className="material-symbols-outlined text-6xl">image</span>
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-blue-900/60 via-transparent to-transparent opacity-70"></div>
            </div>
          </div>

          {/* Thông tin cơ bản khóa học */}
          <div className="lg:col-span-8 flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between gap-4 mb-3">
                <h2 className="text-xl font-bold text-gray-900 tracking-tight">{course.title}</h2>
                <div className="flex items-center gap-3 shrink-0 flex-wrap">
                  <button
                    type="button"
                    onClick={() => alert('Chức năng danh sách sinh viên sẽ được kết nối sau.')}
                    className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-gray-50 hover:bg-gray-100 text-blue-600 font-medium text-sm border border-gray-200 shadow-xs transition-colors active:scale-95"
                  >
                    <span className="material-symbols-outlined text-[18px]">group</span>
                    <span>Danh sách sinh viên</span>
                  </button>
                  {/* Hiển thị trạng thái lấy từ Backend */}
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${status.style}`}>
                    <span className={`w-2 h-2 rounded-full ${status.dot}`}></span>
                    {status.label}
                  </span>
                </div>
              </div>

              {/* Mô tả khóa học */}
              <div className="p-4 rounded-xl bg-gray-50 mb-4 border border-gray-100">
                <h3 className="text-sm font-semibold text-gray-900 mb-1 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[18px] text-blue-600">description</span>
                  Mô tả khóa học
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {course.description || 'Chưa có mô tả khóa học.'}
                </p>
              </div>

              {/* Học phí khóa học */}
              <div className="inline-flex items-center gap-4 p-4 rounded-xl bg-gray-50 border border-gray-100 max-w-sm">
                <div className="w-11 h-11 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 shrink-0 shadow-xs">
                  <span className="material-symbols-outlined text-[22px]">payments</span>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Học phí khóa học</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-lg font-bold text-blue-600">{formatPrice(course.price)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 11. Danh sách các chương học */}
      <div className="w-full bg-white rounded-xl shadow-sm p-6 mb-6 border border-gray-100">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gray-50 flex items-center justify-center text-blue-600">
              <span className="material-symbols-outlined text-[20px]">view_list</span>
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">Danh sách các chương</h3>
              <p className="text-xs text-gray-500">Nội dung cấu trúc chương trình học của học phần ({chapters.length} chương)</p>
            </div>
          </div>
        </div>

        {/* Hiển thị danh sách chương lấy từ Backend */}
        <div className="flex flex-col gap-3">
          {chapters.length > 0 ? (
            chapters.map((chapter, index) => (
              <div
                key={chapter.chapterId || index}
                className="flex items-center justify-between gap-4 p-4 rounded-xl bg-gray-50 hover:bg-gray-100/70 transition-colors border border-gray-100"
              >
                <div className="flex items-start gap-4 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center font-bold text-blue-600 shrink-0 shadow-xs text-sm border border-gray-100">
                    {String(index + 1).padStart(2, '0')}
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-sm font-semibold text-gray-900">{chapter.title}</h4>
                    <p className="text-xs text-gray-600 mt-0.5 truncate">{chapter.description || 'Chưa có mô tả chương.'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 shrink-0">
                  <span className="px-2.5 py-1 rounded bg-white text-gray-600 text-xs border border-gray-200">
                    {chapter.lessonCount ?? 0} bài học
                  </span>
                  <button
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white hover:bg-gray-50 text-blue-600 text-xs font-semibold border border-gray-200 shadow-xs transition-colors active:scale-95"
                    onClick={() => alert(`Quản lý ${chapter.title}`)}
                    type="button"
                  >
                    <span>Quản lý chương</span>
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="py-10 text-center text-sm text-gray-500">
              Chưa có dữ liệu chương học từ Backend.
            </div>
          )}
        </div>
      </div>

      {/* 12. Khối điều kiện xuất bản: chỉ hiện khi khóa học ở trạng thái Draft */}
      {course.status === 'Draft' && (
        <div className="w-full bg-white rounded-xl shadow-sm p-6 flex flex-col md:flex-row items-center justify-between gap-4 border border-gray-100">
          <div className="flex items-start gap-3 max-w-xl">
            <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 shrink-0 mt-0.5">
              <span className="material-symbols-outlined text-[18px]">info</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900 mb-1">Điều kiện xuất bản khóa học</p>
              <p className="text-xs text-gray-600 mb-2">Để xuất bản khóa học công khai cho học viên, cần đáp ứng các điều kiện sau:</p>
              <ul className="flex flex-col gap-1.5 text-xs text-gray-600">
                <li className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-blue-600 text-[16px]">check_circle</span>
                  <span>Khóa học có ít nhất một chương học đang hoạt động.</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-blue-600 text-[16px]">check_circle</span>
                  <span>Có ít nhất một bài học đang hoạt động.</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-blue-600 text-[16px]">check_circle</span>
                  <span>Các bài học phải có nội dung học tập khả dụng cho học viên.</span>
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
              <span className="material-symbols-outlined text-[20px]">rocket_launch</span>
              <span>Xuất bản khóa học</span>
            </button>
          </div>
        </div>
      )}

      {/* 13. Modal xác nhận xuất bản */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-lg mx-4 bg-white rounded-xl shadow-xl p-6 border border-gray-100">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                  <span className="material-symbols-outlined text-[22px]">publish</span>
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">Xác nhận xuất bản khóa học</h3>
                  <p className="text-xs text-gray-500">Mã khóa học: {course.courseId}</p>
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-3 mb-6">
              <p className="text-sm text-gray-700 leading-relaxed">
                Bạn có chắc chắn muốn xuất bản khóa học <strong className="text-blue-600 font-semibold">"{course.title}"</strong> không?
              </p>
            </div>
            <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-100">
              {/* Nút Hủy: Không cho đóng modal khi đang gửi yêu cầu */}
              <button
                className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 font-semibold text-sm transition-colors"
                onClick={() => setShowModal(false)}
                disabled={isSubmitting}
                type="button"
              >
                Hủy
              </button>

              {/* Nút xác nhận: Gọi API xuất bản và khóa khi đang xử lý */}
              <button
                className="inline-flex items-center gap-1.5 px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed text-white font-semibold text-sm shadow-sm transition-all"
                onClick={handleConfirmPublish}
                disabled={isSubmitting}
                type="button"
              >
                <span className="material-symbols-outlined text-[18px]">
                  {isSubmitting ? 'progress_activity' : 'verified'}
                </span>
                <span>{isSubmitting ? 'Đang xuất bản...' : 'Xác nhận xuất bản'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseDetailInstructor;
