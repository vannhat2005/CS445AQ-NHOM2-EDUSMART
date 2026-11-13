import  react from 'react';
import { useNavigate } from 'react-router-dom';

import React, { useEffect, useState } from 'react';
import { getAssignedCourses } from '../../services/courseService';

// 1. Khai báo hằng số
const INSTRUCTOR_ID = 2; // ID giảng viên dùng để test API
const PAGE_SIZE = 10; // Số khóa học hiển thị trên mỗi trang

const TeacherCourses = () => {
  // Khởi tạo điều hướng giữa các trang
  const navigate = useNavigate();

  // 2. Khai báo State
  const [courses, setCourses] = useState([]); // Danh sách khóa học
  const [loading, setLoading] = useState(false); // Trạng thái tải dữ liệu
  const [error, setError] = useState(''); // Thông báo lỗi
  const [pageNo, setPageNo] = useState(1); // Trang hiện tại
  const [totalPages, setTotalPages] = useState(0); // Tổng số trang
  const [totalElements, setTotalElements] = useState(0); // Tổng số khóa học

  // 3. Gọi API lấy danh sách khóa học
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoading(true);
        setError('');

        // Gọi API với instructorId, pageNo và pageSize
        const data = await getAssignedCourses(INSTRUCTOR_ID, pageNo, PAGE_SIZE);

        // Lấy dữ liệu phân trang từ ApiResponse
        const pageData = data.result;

        // Cập nhật danh sách khóa học và thông tin phân trang
        setCourses(pageData.content || []);
        setTotalPages(pageData.totalPages || 0);
        setTotalElements(pageData.totalElements || 0);

      } catch (err) {
        console.error('Lỗi lấy danh sách khóa học:', err);
        setError(err.response?.data?.message || 'Không thể tải danh sách khóa học.');
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, [pageNo]);

  // 4. Hàm định dạng học phí: 549000 -> 549.000 VNĐ
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
          style: 'bg-gray-100 text-gray-600',
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

  // 6. Giao diện danh sách khóa học
  return (
    <div className="flex flex-col w-full">
      <div className="py-4 flex flex-col gap-6">

        {/* Header tiêu đề trang */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Khóa học được phân công</h1>
            </div>
            <p className="text-sm text-gray-600">Danh sách các khóa học được Admin phân công phụ trách giảng dạy.</p>
          </div>
        </div>

        {/* Bảng danh sách khóa học */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden flex flex-col border border-gray-100">
          <div className="px-6 py-4 bg-white flex items-center justify-between flex-wrap gap-3 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-blue-600"></div>
              <span className="font-semibold text-sm text-gray-800">Bảng phân công giảng dạy</span>
            </div>
          </div>

          <div className="w-full overflow-x-auto">
            <table className="w-full text-left border-collapse">
              {/* Tiêu đề các cột */}
              <thead>
                <tr className="bg-gray-50 text-gray-600 font-medium text-xs border-b border-gray-100">
                  <th className="py-3.5 px-4 text-center w-16 font-semibold" scope="col">ID</th>
                  <th className="py-3.5 px-6 font-semibold min-w-[220px]" scope="col">Tên khóa học</th>
                  <th className="py-3.5 px-6 font-semibold min-w-[280px]" scope="col">Mô tả</th>
                  <th className="py-3.5 px-6 font-semibold min-w-[150px]" scope="col">Học phí</th>
                  <th className="py-3.5 px-6 font-semibold min-w-[160px]" scope="col">Trạng thái</th>
                  <th className="py-3.5 px-6 text-right font-semibold min-w-[140px] whitespace-nowrap" scope="col">Thao tác</th>
                </tr>
              </thead>

              {/* Nội dung bảng */}
              <tbody className="divide-y divide-gray-100 text-sm">

                {/* Trường hợp đang tải dữ liệu */}
                {loading && (
                  <tr>
                    <td colSpan="6" className="py-10 text-center text-gray-500">Đang tải danh sách khóa học...</td>
                  </tr>
                )}

                {/* Trường hợp xảy ra lỗi */}
                {!loading && error && (
                  <tr>
                    <td colSpan="6" className="py-10 text-center text-red-500">{error}</td>
                  </tr>
                )}

                {/* Trường hợp không có khóa học */}
                {!loading && !error && courses.length === 0 && (
                  <tr>
                    <td colSpan="6" className="py-10 text-center text-gray-500">Chưa có khóa học được phân công.</td>
                  </tr>
                )}

                {/* Hiển thị danh sách khóa học lấy từ Backend */}
                {!loading && !error && courses.map((course, index) => {
                  const status = getStatus(course.status);

                  return (
                    <tr key={course.courseId} className="hover:bg-gray-50/60 transition-colors group">
                      {/* ID khóa học */}
                      <td className="py-4 px-4 text-center font-medium text-gray-500">{index + 1}</td>

                      {/* Tên khóa học */}
                      <td className="py-4 px-6">
                        <span className="font-semibold text-gray-900 group-hover:text-blue-700 transition-colors">{course.title}</span>
                      </td>

                      {/* Mô tả: Backend hiện chưa trả trường description */}
                      <td className="py-4 px-6">
                        <p className="text-gray-600 truncate max-w-xs">Chưa có mô tả</p>
                      </td>

                      {/* Học phí */}
                      <td className="py-4 px-6">
                        <span className="font-semibold text-gray-900">{formatPrice(course.price)}</span>
                      </td>

                      {/* Trạng thái khóa học */}
                      <td className="py-4 px-6">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${status.style}`}>
                          <span className={`w-2 h-2 rounded-full ${status.dot}`}></span>
                          {status.label}
                        </span>
                      </td>

                      {/* Nút xem chi tiết */}
                      <td className="py-4 px-6 text-right whitespace-nowrap">
                        <button
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-blue-600 hover:text-blue-800 hover:bg-blue-50 text-xs font-semibold transition-all whitespace-nowrap"
                          type="button"
                          onClick={() => console.log('Course ID:', course.courseId)}
                        >
                          <span className="material-symbols-outlined text-[18px]">visibility</span>
                          <span>Xem chi tiết</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* 7. Phân trang */}
          <div className="px-6 py-3 bg-white border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
            <div>
              <span>
                Hiển thị {totalElements === 0 ? 0 : (pageNo - 1) * PAGE_SIZE + 1}
                {' - '}
                {Math.min(pageNo * PAGE_SIZE, totalElements)}
                {' trên tổng số '}
                {totalElements} khóa học
              </span>
            </div>

            <div className="flex items-center gap-1">
              {/* Nút chuyển về trang trước */}
              <button
                className="p-1 rounded text-gray-400 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-50 flex items-center justify-center"
                disabled={pageNo <= 1 || loading}
                onClick={() => setPageNo(prev => prev - 1)}
                type="button"
              >
                <span className="material-symbols-outlined text-[18px]">chevron_left</span>
              </button>

              {/* Hiển thị trang hiện tại */}
              <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-600 font-semibold">{pageNo}</span>

              {/* Nút chuyển sang trang tiếp theo */}
              <button
                className="p-1 rounded text-gray-400 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-50 flex items-center justify-center"
                disabled={pageNo >= totalPages || loading}
                onClick={() => setPageNo(prev => prev + 1)}
                type="button"
              >
                <span className="material-symbols-outlined text-[18px]">chevron_right</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherCourses;
