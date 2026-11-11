import React from 'react';

const TeacherCourses = () => {
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
              <tbody className="divide-y divide-gray-100 text-sm">
                {/* Dòng 1 */}
                <tr className="hover:bg-gray-50/60 transition-colors group">
                  <td className="py-4 px-4 text-center font-medium text-gray-500">1</td>
                  <td className="py-4 px-6">
                    <span className="font-semibold text-gray-900 group-hover:text-blue-700 transition-colors">Lập trình C</span>
                  </td>
                  <td className="py-4 px-6">
                    <p className="text-gray-600 truncate max-w-xs" title="Kiến thức cơ bản về ngôn ngữ C">Kiến thức cơ bản về ngôn ngữ C</p>
                  </td>
                  <td className="py-4 px-6">
                    <span className="font-semibold text-gray-900">500.000 VNĐ</span>
                  </td>
                  <td className="py-4 px-6">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium">
                      <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
                      Đã xuất bản
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right whitespace-nowrap">
                    <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-blue-600 hover:text-blue-800 hover:bg-blue-50 text-xs font-semibold transition-all whitespace-nowrap" type="button">
                      <span className="material-symbols-outlined text-[18px]">visibility</span>
                      <span>Xem chi tiết</span>
                    </button>
                  </td>
                </tr>

                {/* Dòng 2 */}
                <tr className="hover:bg-gray-50/60 transition-colors group">
                  <td className="py-4 px-4 text-center font-medium text-gray-500">2</td>
                  <td className="py-4 px-6">
                    <span className="font-semibold text-gray-900 group-hover:text-blue-700 transition-colors">Cơ sở dữ liệu</span>
                  </td>
                  <td className="py-4 px-6">
                    <p className="text-gray-600 truncate max-w-xs" title="Thiết kế và quản lý cơ sở dữ liệu">Thiết kế và quản lý cơ sở dữ liệu</p>
                  </td>
                  <td className="py-4 px-6">
                    <span className="font-semibold text-gray-900">450.000 VNĐ</span>
                  </td>
                  <td className="py-4 px-6">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-100 text-gray-600 text-xs font-medium">
                      <span className="w-2 h-2 rounded-full bg-gray-400"></span>
                      Bản nháp
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right whitespace-nowrap">
                    <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-blue-600 hover:text-blue-800 hover:bg-blue-50 text-xs font-semibold transition-all whitespace-nowrap" type="button">
                      <span className="material-symbols-outlined text-[18px]">visibility</span>
                      <span>Xem chi tiết</span>
                    </button>
                  </td>
                </tr>

                {/* Dòng 3 */}
                <tr className="hover:bg-gray-50/60 transition-colors group">
                  <td className="py-4 px-4 text-center font-medium text-gray-500">3</td>
                  <td className="py-4 px-6">
                    <span className="font-semibold text-gray-900 group-hover:text-blue-700 transition-colors">Công nghệ Web</span>
                  </td>
                  <td className="py-4 px-6">
                    <p className="text-gray-600 truncate max-w-xs" title="Xây dựng ứng dụng Web">Xây dựng ứng dụng Web</p>
                  </td>
                  <td className="py-4 px-6">
                    <span className="font-semibold text-gray-900">600.000 VNĐ</span>
                  </td>
                  <td className="py-4 px-6">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-800 text-xs font-medium">
                      <span className="w-2 h-2 rounded-full bg-amber-600"></span>
                      Đã ẩn
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right whitespace-nowrap">
                    <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-blue-600 hover:text-blue-800 hover:bg-blue-50 text-xs font-semibold transition-all whitespace-nowrap" type="button">
                      <span className="material-symbols-outlined text-[18px]">visibility</span>
                      <span>Xem chi tiết</span>
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Phân trang */}
          <div className="px-6 py-3 bg-white border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
            <div>
              <span>Hiển thị 1 - 3 trên tổng số 3 khóa học</span>
            </div>
            <div className="flex items-center gap-1">
              <button className="p-1 rounded text-gray-400 cursor-not-allowed opacity-50 flex items-center justify-center" disabled type="button">
                <span className="material-symbols-outlined text-[18px]">chevron_left</span>
              </button>
              <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-600 font-semibold">1</span>
              <button className="p-1 rounded text-gray-400 cursor-not-allowed opacity-50 flex items-center justify-center" disabled type="button">
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