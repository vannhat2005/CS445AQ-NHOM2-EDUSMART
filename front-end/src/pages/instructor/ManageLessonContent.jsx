import React, { useState } from 'react';

const ManageLessonContent = () => {
  // Danh sách nội dung bài học mẫu
  const [contents, setContents] = useState([
    { id: 1, title: "Giới thiệu bài học", type: "text", status: "active" },
    { id: 2, title: "Video bài giảng", type: "video", status: "active" },
    { id: 3, title: "Tài liệu học tập", type: "pdf", status: "inactive" },
  ]);

  // Trạng thái trắc nghiệm bài học: 'none' (chưa có) | 'draft' (bản nháp) | 'published' (đã xuất bản)
  const [quizState, setQuizState] = useState('none');
  const [quizTitle, setQuizTitle] = useState("Trắc nghiệm kiểm tra kiến thức bài 1: Cú pháp cơ bản");

  // State quản lý Modal
  const [showContentModal, setShowContentModal] = useState(false);
  const [showQuizMethodModal, setShowQuizMethodModal] = useState(false);
  const [showPublishConfirmModal, setShowPublishConfirmModal] = useState(false);

  // Dữ liệu form nội dung
  const [editContentData, setEditContentData] = useState({ id: null, title: '', type: 'text', status: 'active' });

  const handleOpenAddContent = () => {
    setEditContentData({ id: null, title: '', type: 'text', status: 'active' });
    setShowContentModal(true);
  };

  const handleOpenEditContent = (item) => {
    setEditContentData(item);
    setShowContentModal(true);
  };

  const handleMoveContent = (index, direction) => {
    const newContents = [...contents];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newContents.length) return;
    const temp = newContents[index];
    newContents[index] = newContents[targetIndex];
    newContents[targetIndex] = temp;
    setContents(newContents);
  };

  return (
    <div className="flex flex-col w-full px-2 pt-4 pb-12 gap-6">
      {/* 1. Top Navigation & Breadcrumb */}
      <div className="flex items-center justify-between gap-4">
        <nav className="flex items-center flex-wrap gap-2 text-xs text-gray-500">
          <a href="/instructor/courses" className="hover:text-blue-600 transition-colors">Khóa học được phân công</a>
          <span className="material-symbols-outlined text-[14px] text-gray-400">chevron_right</span>
          <a href="/instructor/courses/detail" className="hover:text-blue-600 transition-colors">Chi tiết khóa học</a>
          <span className="material-symbols-outlined text-[14px] text-gray-400">chevron_right</span>
          <a href="/instructor/chapters" className="hover:text-blue-600 transition-colors">Quản lý chương học</a>
          <span className="material-symbols-outlined text-[14px] text-gray-400">chevron_right</span>
          <a href="/instructor/lessons" className="hover:text-blue-600 transition-colors">Quản lý bài học</a>
          <span className="material-symbols-outlined text-[14px] text-gray-400">chevron_right</span>
          <span className="text-blue-600 font-semibold">Quản lý nội dung bài học</span>
        </nav>
        <button 
          className="w-9 h-9 rounded-full bg-white shadow-sm border border-gray-200 flex items-center justify-center text-gray-600 hover:text-blue-600 hover:bg-gray-50 transition-all shrink-0" 
          onClick={() => window.history.back()} 
          title="Quay lại" 
          type="button"
        >
          <span className="material-symbols-outlined text-[20px]">arrow_back</span>
        </button>
      </div>

      {/* Page Header & Course Context */}
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Quản lý nội dung bài học</h1>
        <div className="inline-flex items-center flex-wrap gap-2 px-4 py-1.5 rounded-full bg-gray-50 w-fit border border-gray-200 text-xs text-gray-600">
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-blue-600">Khóa học:</span>
            <span>Lập trình C (C Programming Fundamentals)</span>
          </div>
          <span className="text-gray-400">•</span>
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-blue-600">Chương:</span>
            <span>Chương 1: Giới thiệu</span>
          </div>
          <span className="text-gray-400">•</span>
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-blue-600">Bài học:</span>
            <span>Giới thiệu tổng quan</span>
          </div>
        </div>
      </div>

      {/* KHU VỰC 1: Quản lý nội dung bài học */}
      <section className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
        <div className="p-6 flex items-center justify-between flex-wrap gap-4 border-b border-gray-100 bg-white">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-blue-600">
              <span className="material-symbols-outlined text-[20px]">layers</span>
            </div>
            <h2 className="text-base font-bold text-gray-900">Nội dung bài học</h2>
          </div>
          <button 
            className="h-10 px-4 rounded-lg bg-blue-600 text-white font-semibold text-sm flex items-center gap-1.5 hover:bg-blue-700 transition-colors shadow-sm" 
            onClick={handleOpenAddContent} 
            type="button"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            <span>Thêm nội dung</span>
          </button>
        </div>

        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-600 font-medium text-xs uppercase tracking-wider border-b border-gray-200">
                <th className="py-3 px-6 w-16">ID</th>
                <th className="py-3 px-6 min-w-[240px]">Tiêu đề nội dung</th>
                <th className="py-3 px-6 w-36">Loại nội dung</th>
                <th className="py-3 px-6 w-32">Thứ tự</th>
                <th className="py-3 px-6 w-40">Trạng thái</th>
                <th className="py-3 px-6 w-28 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="text-sm text-gray-900 divide-y divide-gray-100">
              {contents.map((item, idx) => (
                <tr key={item.id} className="hover:bg-gray-50/60 transition-colors">
                  <td className="py-4 px-6 font-medium text-gray-400">{item.id}</td>
                  <td className="py-4 px-6 font-semibold text-gray-900">{item.title}</td>
                  <td className="py-4 px-6">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-gray-100 text-blue-700 uppercase">
                      {item.type}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <div className="inline-flex items-center gap-1.5 bg-gray-50 px-2 py-1 rounded-md border border-gray-200">
                      <span className="w-4 text-center font-semibold text-xs">{idx + 1}</span>
                      <div className="flex flex-col gap-0.5">
                        <button onClick={() => handleMove(idx, 'up')} disabled={idx === 0} className="text-gray-400 hover:text-blue-600 leading-none disabled:opacity-30" type="button">
                          <span className="material-symbols-outlined text-[14px]">expand_less</span>
                        </button>
                        <button onClick={() => handleMove(idx, 'down')} disabled={idx === contents.length - 1} className="text-gray-400 hover:text-blue-600 leading-none disabled:opacity-30" type="button">
                          <span className="material-symbols-outlined text-[14px]">expand_more</span>
                        </button>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    {item.status === 'active' ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700">
                        <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                        Hoạt động
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-rose-50 text-rose-700">
                        <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                        Không hoạt động
                      </span>
                    )}
                  </td>
                  <td className="py-4 px-6 text-right">
                    <button 
                      className="px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-blue-600 text-xs font-medium inline-flex items-center gap-1 transition-colors" 
                      onClick={() => handleOpenEditContent(item)} 
                      type="button"
                    >
                      <span className="material-symbols-outlined text-[16px]">edit</span>
                      <span>Sửa</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* KHU VỰC 2: Quản lý trắc nghiệm bài học */}
      <section className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200 flex flex-col">
        <div className="p-6 flex items-center justify-between flex-wrap gap-4 border-b border-gray-100 bg-white">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-blue-600">
              <span className="material-symbols-outlined text-[20px]">quiz</span>
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">Trắc nghiệm bài học</h2>
              <p className="text-xs text-gray-500">Mỗi bài học được phân công tối đa 01 bộ trắc nghiệm duy nhất[cite: 16]</p>
            </div>
          </div>

          {/* Logic hiển thị nút Thêm trắc nghiệm nếu chưa có */}
          {quizState === 'none' && (
            <button 
              className="h-10 px-4 rounded-lg bg-blue-600 text-white font-semibold text-sm flex items-center gap-1.5 hover:bg-blue-700 transition-colors shadow-sm" 
              onClick={() => setShowQuizMethodModal(true)} 
              type="button"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              <span>Thêm trắc nghiệm</span>
            </button>
          )}
        </div>

        {/* Nội dung khi CHƯA CÓ TRẮC NGHIỆM */}
        

        {/* Nội dung khi ĐÃ CÓ TRẮC NGHIỆM (Draft hoặc Published) */}
        {quizState !== 'none' && (
          <div className="p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between flex-wrap gap-4 p-4 rounded-xl bg-gray-50 border border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                  <span className="material-symbols-outlined text-[22px]">assignment</span>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900">{quizTitle}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    {quizState === 'draft' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                        Bản nháp (Draft)
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                        Đã xuất bản (Published)
                      </span>
                    )}
                    <span className="text-xs text-gray-500">• 4 câu hỏi</span>
                  </div>
                </div>
              </div>

              {/* Thao tác tương ứng theo quy định 2.3 & 2.4 */}
              <div className="flex items-center gap-2">
                <button 
                  className="px-3 py-1.5 rounded-lg bg-white hover:bg-gray-100 text-gray-700 text-xs font-semibold border border-gray-200 transition-colors" 
                  onClick={() => alert('Đang xem trước bộ trắc nghiệm...')}
                  type="button"
                >
                  Xem
                </button>

                {quizState === 'draft' && (
                  <>
                    <button 
                      className="px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 text-xs font-semibold transition-colors" 
                      onClick={() => alert('Mở giao diện tiếp tục chỉnh sửa câu hỏi...')}
                      type="button"
                    >
                      Tiếp tục chỉnh sửa
                    </button>
                    <button 
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-colors" 
                      onClick={() => setShowPublishConfirmModal(true)}
                      type="button"
                    >
                      Xuất bản
                    </button>
                    <button 
                      className="px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-semibold transition-colors" 
                      onClick={() => {
                        if (confirm('Bạn có chắc chắn muốn xóa bản nháp bộ trắc nghiệm này?')) {
                          setQuizState('none');
                        }
                      }}
                      type="button"
                    >
                      Xóa bản nháp
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </section>

      {/* MODAL 1: Thêm/Sửa nội dung bài học */}
      {showContentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="relative w-full max-w-lg bg-white rounded-xl shadow-xl flex flex-col overflow-hidden border border-gray-200">
            <div className="px-6 py-4 bg-gray-50 flex items-center justify-between border-b border-gray-200">
              <h3 className="text-base font-bold text-gray-900">
                {editContentData.id ? 'Chỉnh sửa nội dung' : 'Thêm nội dung bài học'}
              </h3>
              <button onClick={() => setShowContentModal(false)} className="text-gray-400 hover:text-gray-700">
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            <form className="p-6 flex flex-col gap-4" onSubmit={(e) => { e.preventDefault(); setShowContentModal(false); }}>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-700">Tiêu đề nội dung <span className="text-red-500">*</span></label>
                <input 
                  className="h-10 px-3 rounded-lg bg-gray-50 text-gray-900 border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600" 
                  defaultValue={editContentData.title}
                  placeholder="Nhập tiêu đề..." 
                  required 
                  type="text" 
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-700">Loại nội dung <span className="text-red-500">*</span></label>
                <select className="h-10 px-3 rounded-lg bg-gray-50 text-gray-900 border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600">
                  <option value="text">Văn bản</option>
                  <option value="video">Video</option>
                  <option value="pdf">PDF</option>
                </select>
              </div>
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-200">
                <button type="button" onClick={() => setShowContentModal(false)} className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 text-sm font-semibold">Hủy</button>
                <button type="submit" className="px-5 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold shadow-sm">Lưu</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Chọn phương thức tạo trắc nghiệm (Thủ công hoặc AI) */}
      {showQuizMethodModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="relative w-full max-w-xl bg-white rounded-xl shadow-xl flex flex-col overflow-hidden border border-gray-200">
            <div className="px-6 py-4 bg-gray-50 flex items-center justify-between border-b border-gray-200">
              <h3 className="text-base font-bold text-gray-900">Chọn phương thức tạo trắc nghiệm</h3>
              <button onClick={() => setShowQuizMethodModal(false)} className="text-gray-400 hover:text-gray-700">
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            <div className="p-6 grid grid-cols-2 gap-4">
              <div 
                className="p-4 rounded-xl border border-gray-200 hover:border-blue-600 hover:bg-blue-50/40 transition-all cursor-pointer flex flex-col justify-between"
                onClick={() => {
                  setQuizState('draft');
                  setShowQuizMethodModal(false);
                }}
              >
                <div>
                  <span className="material-symbols-outlined text-[32px] text-blue-600 mb-2">edit_document</span>
                  <h4 className="font-bold text-gray-900 text-sm">Tạo thủ công</h4>
                  <p className="text-xs text-gray-500 mt-1">Tự biên soạn câu hỏi và thiết lập đáp án.</p>
                </div>
                <span className="text-xs font-semibold text-blue-600 mt-4">Chọn tạo thủ công →</span>
              </div>
              <div 
                className="p-4 rounded-xl border-2 border-blue-600/40 hover:border-blue-600 hover:bg-blue-50/40 transition-all cursor-pointer flex flex-col justify-between relative"
                onClick={() => {
                  setQuizState('draft');
                  setShowQuizMethodModal(false);
                }}
              >
                <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-100 text-blue-700">Khuyên dùng</span>
                <div>
                  <span className="material-symbols-outlined text-[32px] text-blue-600 mb-2">smart_toy</span>
                  <h4 className="font-bold text-gray-900 text-sm">Tạo bằng AI</h4>
                  <p className="text-xs text-gray-500 mt-1">Tải tài liệu để AI tự động trích xuất câu hỏi.</p>
                </div>
                <span className="text-xs font-semibold text-blue-600 mt-4">Chọn tạo bằng AI →</span>
              </div>
            </div>
            <div className="px-6 py-3 bg-gray-50 flex justify-end border-t border-gray-200">
              <button onClick={() => setShowQuizMethodModal(false)} className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 text-sm font-semibold">Hủy</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Xác nhận xuất bản bộ trắc nghiệm */}
      {showPublishConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="relative w-full max-w-md bg-white rounded-xl shadow-xl flex flex-col overflow-hidden p-6 text-center border border-gray-200">
            <div className="w-14 h-14 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-4 shadow-sm">
              <span className="material-symbols-outlined text-[32px]">rocket_launch</span>
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Xuất bản bộ trắc nghiệm?</h3>
            <p className="text-sm text-gray-600 mb-4">
              Bạn đang xuất bản bộ trắc nghiệm <strong className="text-gray-900">"{quizTitle}"</strong> với tổng cộng <strong className="text-blue-600">4 câu hỏi</strong>.
            </p>
            <div className="flex items-center justify-end gap-3 w-full pt-3 border-t border-gray-100">
              <button onClick={() => setShowPublishConfirmModal(false)} className="flex-1 h-10 rounded-lg bg-gray-100 text-gray-700 text-sm font-semibold">Hủy</button>
              <button 
                onClick={() => {
                  setQuizState('published');
                  setShowPublishConfirmModal(false);
                }} 
                className="flex-1 h-10 rounded-lg bg-blue-600 text-white text-sm font-semibold shadow-sm"
              >
                Xác nhận xuất bản
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageLessonContent;