import React, { useState } from 'react';

const CourseDetailInstructor = () => {
  // State quản lý trạng thái xuất bản của khóa học (true: đã xuất bản, false: bản nháp)
  const [isPublished, setIsPublished] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Xử lý khi xác nhận xuất bản
  const handleConfirmPublish = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setIsPublished(true);
      setShowModal(false);
      alert('Khóa học "Lập trình C" đã được xuất bản thành công!');
    }, 800);
  };

  return (
    <div className="flex flex-col w-full max-w-6xl mx-auto pt-6 pb-12">
      {/* Top Navigation & Breadcrumb */}
      <div className="flex items-center justify-between gap-4 mb-4">
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm text-gray-500">
          <a className="hover:text-blue-600 transition-colors font-medium" href="/instructor/courses">Khóa học</a>
          <span className="material-symbols-outlined text-[14px] text-gray-400">chevron_right</span>
          <span className="text-blue-600 font-semibold">Chi tiết khóa học</span>
        </nav>
        <button 
          className="group flex items-center justify-center w-10 h-10 rounded-xl bg-white text-gray-600 shadow-sm hover:bg-gray-50 hover:text-blue-600 transition-all active:scale-95 shrink-0 border border-gray-100" 
          onClick={() => window.history.back()} 
          title="Quay lại danh sách khóa học" 
          type="button"
        >
          <span className="material-symbols-outlined text-[20px] transition-transform group-hover:-translate-x-0.5">arrow_back</span>
        </button>
      </div>

      {/* Title Header */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Chi tiết khóa học</h1>
          <p className="text-sm text-gray-600 mt-0.5">Thông tin chi tiết và nội dung các chương học được phân công giảng dạy.</p>
        </div>
      </div>

      {/* Main Course Detail Card */}
      <div className="w-full bg-white rounded-xl shadow-sm p-6 mb-6 relative overflow-hidden border border-gray-100">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left: Course Thumbnail */}
          <div className="lg:col-span-4 flex flex-col">
            <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden shadow-sm group border border-gray-100">
              <img 
                className="w-full h-full object-cover transform transition-transform duration-500 group-hover:scale-105" 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDMuORxYBaOGEps5h2qzx2Mx9ADsdUP0c1quUzIAoSDDJeBI171F0Py3bmDgESd0ezTGX_LCF1JGTXOHUwgg5oiVcxnESHTBR74ZkPlRpZ7UIRDCKV_QwIpd-UbMFaAAzMR4GrY_XKDm3tRhyJJuV9vjRArZlR6MaqF2C3a3llsGHFA_QiH3-zsswYQ75dkhfCJubzTFlcOJEDnKL16tpQ_LkFqB0xLb6S13VIeIhI" 
                alt="Course Thumbnail"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-blue-900/60 via-transparent to-transparent opacity-70"></div>
            </div>
          </div>

          {/* Right: Course Core Details */}
          <div className="lg:col-span-8 flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between gap-4 mb-3">
                <h2 className="text-xl font-bold text-gray-900 tracking-tight">Lập trình C (C Programming Fundamentals)</h2>
                <div className="flex items-center gap-3 shrink-0">
                  <button 
                    type="button" 
                    onClick={() => alert('Xem danh sách sinh viên khóa học Lập trình C')} 
                    className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-gray-50 hover:bg-gray-100 text-blue-600 font-medium text-sm border border-gray-200 shadow-xs transition-colors active:scale-95"
                  >
                    <span className="material-symbols-outlined text-[18px]">group</span>
                    <span>Danh sách sinh viên</span>
                  </button>

                  {/* Hiển thị Badge trạng thái linh hoạt */}
                  {isPublished ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium">
                      <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
                      Đã xuất bản
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-100 text-gray-700 text-xs font-medium">
                      <span className="w-2 h-2 rounded-full bg-gray-400"></span>
                      Bản nháp
                    </span>
                  )}
                </div>
              </div>

              {/* Course Description */}
              <div className="p-4 rounded-xl bg-gray-50 mb-4 border border-gray-100">
                <h3 className="text-sm font-semibold text-gray-900 mb-1 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[18px] text-blue-600">description</span>
                  Mô tả khóa học
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Khóa học cung cấp kiến thức nền tảng vững chắc về ngôn ngữ lập trình C, từ cấu trúc điều khiển, mảng, con trỏ đến quản lý bộ nhớ động và cấu trúc dữ liệu cơ bản. Khóa học được chuẩn hóa theo khung chương trình đào tạo kỹ sư công nghệ phần mềm hiện đại.
                </p>
              </div>

              {/* Tuition Fee Card */}
              <div className="inline-flex items-center gap-4 p-4 rounded-xl bg-gray-50 border border-gray-100 max-w-sm">
                <div className="w-11 h-11 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 shrink-0 shadow-xs">
                  <span className="material-symbols-outlined text-[22px]">payments</span>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Học phí khóa học</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-lg font-bold text-blue-600">500.000</span>
                    <span className="text-xs text-blue-500 font-semibold">VNĐ</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Course Chapters Section */}
      <div className="w-full bg-white rounded-xl shadow-sm p-6 mb-6 border border-gray-100">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gray-50 flex items-center justify-center text-blue-600">
              <span className="material-symbols-outlined text-[20px]">view_list</span>
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">Danh sách các chương</h3>
              <p className="text-xs text-gray-500">Nội dung cấu trúc chương trình học của học phần (4 chương)</p>
            </div>
          </div>
        </div>

        {/* Chapter Cards List */}
        <div className="flex flex-col gap-3">
          {[
            { id: "01", title: "Chương 1: Giới thiệu về ngôn ngữ C và Môi trường lập trình", desc: "Tổng quan lịch sử, cài đặt compiler GCC/Clang, cấu trúc một chương trình C tiêu chuẩn và cú pháp cơ bản.", lessons: "5 bài học" },
            { id: "02", title: "Chương 2: Kiểu dữ liệu, Biến và Toán tử", desc: "Khai báo biến, hằng số, ép kiểu dữ liệu nguyên thủy, các phép toán số học, logic và bitwise.", lessons: "7 bài học" },
            { id: "03", title: "Chương 3: Cấu trúc điều khiển và Vòng lặp", desc: "Mệnh đề rẽ nhánh if-else, switch-case, vòng lặp for, while, do-while và các lệnh ngắt break, continue.", lessons: "6 bài học" },
            { id: "04", title: "Chương 4: Mảng và Con trỏ", desc: "Mảng một chiều và đa chiều, bản chất địa chỉ bộ nhớ, con trỏ căn bản và cấp phát động malloc, free.", lessons: "8 bài học" }
          ].map((ch, idx) => (
            <div key={idx} className="flex items-center justify-between gap-4 p-4 rounded-xl bg-gray-50 hover:bg-gray-100/70 transition-colors border border-gray-100">
              <div className="flex items-start gap-4 min-w-0">
                <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center font-bold text-blue-600 shrink-0 shadow-xs text-sm border border-gray-100">
                  {ch.id}
                </div>
                <div className="min-w-0">
                  <h4 className="text-sm font-semibold text-gray-900">{ch.title}</h4>
                  <p className="text-xs text-gray-600 mt-0.5 truncate">{ch.desc}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 shrink-0">
                <span className="px-2.5 py-1 rounded bg-white text-gray-600 text-xs border border-gray-200">{ch.lessons}</span>
                <button 
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white hover:bg-gray-50 text-blue-600 text-xs font-semibold border border-gray-200 shadow-xs transition-colors active:scale-95" 
                  onClick={() => alert(`Quản lý ${ch.title}`)} 
                  type="button"
                >
                  <span>Quản lý chương</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CHỈ HIỂN THỊ KHỐI XUẤT BẢN KHI KHÓA HỌC CHƯA ĐƯỢC XUẤT BẢN */}
      {!isPublished && (
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

      {/* Modal Xác nhận xuất bản */}
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
                  <p className="text-xs text-gray-500">Khóa học: EDU-PROG-C</p>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3 mb-6">
              <p className="text-sm text-gray-700 leading-relaxed">
                Bạn có chắc chắn muốn xuất bản khóa học <strong className="text-blue-600 font-semibold">"Lập trình C (C Programming Fundamentals)"</strong> không?
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-100">
              <button 
                className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-sm transition-colors" 
                onClick={() => setShowModal(false)} 
                type="button"
              >
                Hủy
              </button>
              <button 
                className="inline-flex items-center gap-1.5 px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-sm transition-all" 
                onClick={handleConfirmPublish} 
                disabled={isSubmitting}
                type="button"
              >
                <span className="material-symbols-outlined text-[18px]">verified</span>
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