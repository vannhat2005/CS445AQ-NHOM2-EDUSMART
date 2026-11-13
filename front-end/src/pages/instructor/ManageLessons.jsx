import React, { useState } from 'react';

const ManageLessons = () => {
  // Danh sách bài học mẫu
  const [lessons, setLessons] = useState([
    { id: 1, title: "Giới thiệu tổng quan", status: "active" },
    { id: 2, title: "Khái niệm cơ bản", status: "active" },
    { id: 3, title: "Bài học nâng cao", status: "inactive" },
  ]);

  // Trạng thái kiểm tra cuối chương (chưa tạo hoặc đã tạo)
  const [quizCreated, setQuizCreated] = useState(false);

  // State quản lý Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showQuizModal, setShowQuizModal] = useState(false);

  // Dữ liệu form chỉnh sửa bài học
  const [editData, setEditData] = useState({ id: null, title: '', status: 'active' });

  // Mở modal sửa bài học
  const handleOpenEdit = (id, title, status) => {
    setEditData({ id, title, status });
    setShowEditModal(true);
  };

  // Di chuyển thứ tự bài học lên/xuống
  const handleMove = (index, direction) => {
    const newLessons = [...lessons];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newLessons.length) return;

    const temp = newLessons[index];
    newLessons[index] = newLessons[targetIndex];
    newLessons[targetIndex] = temp;
    setLessons(newLessons);
  };

  return (
    <div className="flex flex-col w-full px-2 pt-4 pb-12">
      {/* Header Context & Breadcrumbs */}
      <div className="flex flex-col gap-2 mb-6">
        <div className="flex items-center justify-between w-full">
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm text-gray-500">
            <a className="hover:text-blue-600 transition-colors" href="/instructor/courses">Khóa học</a>
            <span className="material-symbols-outlined text-[14px] text-gray-400">chevron_right</span>
            <a className="hover:text-blue-600 transition-colors" href="/instructor/courses/detail">Chi tiết khóa học</a>
            <span className="material-symbols-outlined text-[14px] text-gray-400">chevron_right</span>
            <a className="hover:text-blue-600 transition-colors" href="/instructor/chapters">Quản lý chương học</a>
            <span className="material-symbols-outlined text-[14px] text-gray-400">chevron_right</span>
            <span className="text-blue-600 font-semibold">Quản lý bài học</span>
          </nav>
          {/* Return Button */}
          <button 
            className="w-9 h-9 rounded-full bg-white shadow-sm flex items-center justify-center text-gray-600 hover:text-blue-600 hover:bg-gray-50 transition-all border border-gray-100" 
            onClick={() => window.history.back()} 
            title="Quay lại danh sách chương" 
            type="button"
          >
            <span className="material-symbols-outlined text-[20px]">arrow_back</span>
          </button>
        </div>

        {/* Title & Metadata Tagline */}
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Quản lý bài học</h1>
          <div className="flex items-center flex-wrap gap-2 text-sm text-gray-600">
            <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-gray-100 text-blue-700 font-medium">
              Khóa học: Lập trình C (C Programming Fundamentals)
            </span>
            <span className="text-gray-400">•</span>
            <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-gray-50 text-gray-700 font-medium">
              Chương: Chương 1: Giới thiệu
            </span>
          </div>
        </div>
      </div>

      {/* Primary Content Area */}
      <div className="flex flex-col gap-4">
        {/* Action Toolbar Header */}
        <div className="flex items-center justify-between flex-wrap gap-4 px-1">
          <div className="flex items-center gap-3">
            <h2 className="text-base font-semibold text-gray-900">Danh sách phân phối bài học</h2>
            <span className="px-3 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold tracking-wide">
              {lessons.length} bài học • {quizCreated ? '1 bài kiểm tra' : '0 bài kiểm tra'}
            </span>
          </div>
          <button 
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-sm transition-all active:scale-[0.98]" 
            onClick={() => setShowAddModal(true)} 
            type="button"
          >
            <span className="material-symbols-outlined text-[19px]">add</span>
            <span>Thêm bài học</span>
          </button>
        </div>

        {/* Lessons Table Card */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100 w-full">
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-600 font-medium text-xs border-b border-gray-100">
                  <th className="py-3.5 px-4 font-semibold w-16 text-center" scope="col">ID</th>
                  <th className="py-3.5 px-6 font-semibold" scope="col">Tên bài học</th>
                  <th className="py-3.5 px-6 font-semibold w-48 text-center" scope="col">Thứ tự bài học</th>
                  <th className="py-3.5 px-6 font-semibold w-40" scope="col">Trạng thái</th>
                  <th className="py-3.5 px-6 font-semibold w-80 text-right" scope="col">Thao tác</th>
                </tr>
              </thead>
              <tbody className="text-sm text-gray-900 divide-y divide-gray-100">
                {lessons.map((lesson, idx) => (
                  <tr key={lesson.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="py-4 px-4 text-center font-medium text-gray-500">{lesson.id}</td>
                    <td className="py-4 px-6 font-semibold text-gray-900">
                      <div className="flex items-center gap-2">
                        <span>{lesson.title}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <div className="inline-flex items-center gap-2 bg-gray-50 px-2 py-1 rounded-lg border border-gray-200">
                        <span className="w-6 h-6 rounded bg-white text-blue-600 font-bold flex items-center justify-center text-xs shadow-xs border border-gray-100">{idx + 1}</span>
                        <div className="flex flex-col gap-0.5">
                          <button 
                            className="w-4 h-4 rounded text-gray-400 hover:text-blue-600 hover:bg-gray-200 flex items-center justify-center transition-colors disabled:opacity-30" 
                            disabled={idx === 0} 
                            onClick={() => handleMove(idx, 'up')}
                            title="Di chuyển lên" 
                            type="button"
                          >
                            <span className="material-symbols-outlined text-[14px]">expand_less</span>
                          </button>
                          <button 
                            className="w-4 h-4 rounded text-gray-400 hover:text-blue-600 hover:bg-gray-200 flex items-center justify-center transition-colors disabled:opacity-30" 
                            disabled={idx === lessons.length - 1} 
                            onClick={() => handleMove(idx, 'down')}
                            title="Di chuyển xuống" 
                            type="button"
                          >
                            <span className="material-symbols-outlined text-[14px]">expand_more</span>
                          </button>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6 whitespace-nowrap">
                      {lesson.status === 'active' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium">
                          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                          Hoạt động
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 text-xs font-medium">
                          <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                          Không hoạt động
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-2">
                        <button 
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 hover:text-blue-600 text-xs font-medium transition-colors" 
                          onClick={() => handleOpenEdit(lesson.id, lesson.title, lesson.status)} 
                          type="button"
                        >
                          <span className="material-symbols-outlined text-[16px]">edit</span>
                          <span>Sửa</span>
                        </button>
                        <a 
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 text-xs font-medium transition-colors" 
                          href="/instructor/lesson-content"
                        >
                          <span className="material-symbols-outlined text-[16px]">article</span>
                          <span>Quản lý nội dung bài học</span>
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}

                {/* Dòng Kiểm tra cuối chương */}
                <tr className="bg-gray-50/60 hover:bg-gray-50 transition-colors border-t border-gray-200">
                  <td className="py-4 px-4 text-center font-medium text-gray-500">{lessons.length + 1}</td>
                  <td className="py-4 px-6 font-semibold text-gray-900">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-blue-600">Kiểm tra cuối chương</span>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-center"><span className="text-gray-400 font-medium">—</span></td>
                  <td className="py-4 px-6 whitespace-nowrap">
                    {quizCreated ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                        Đã tạo
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-100 text-gray-600 text-xs font-medium">
                        <span className="w-2 h-2 rounded-full bg-gray-400"></span>
                        Chưa tạo
                      </span>
                    )}
                  </td>
                  <td className="py-4 px-6 text-right whitespace-nowrap">
                    <div className="inline-flex items-center gap-2">
                      <button 
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium shadow-xs transition-all" 
                        type="button" 
                        onClick={() => setShowQuizModal(true)}
                      >
                        <span className="material-symbols-outlined text-[16px]">add_circle</span>
                        <span>{quizCreated ? 'Cấu hình trắc nghiệm' : 'Tạo trắc nghiệm'}</span>
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* MODAL 1: Thêm bài học mới */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 overflow-hidden border border-gray-100">
            <div className="px-6 py-4 bg-gray-50 flex items-center justify-between border-b border-gray-100">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-blue-600 text-[22px]">post_add</span>
                <h3 className="text-base font-semibold text-gray-900">Thêm bài học mới</h3>
              </div>
              <button className="p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-200 transition-colors" onClick={() => setShowAddModal(false)} type="button">
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            <form className="p-6 flex flex-col gap-4" onSubmit={(e) => { e.preventDefault(); setShowAddModal(false); }}>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-700 flex items-center gap-1">
                  <span>Tên bài học</span>
                  <span className="text-red-500">*</span>
                </label>
                <input className="w-full h-10 px-3.5 rounded-lg bg-gray-50 text-gray-900 text-sm border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-600" placeholder="Nhập tên bài học..." required type="text" />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-gray-700">Trạng thái</label>
                <div className="grid grid-cols-2 gap-3">
                  <label className="flex items-center gap-2.5 p-3 rounded-lg bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors border border-gray-200">
                    <input defaultChecked className="w-4 h-4 text-blue-600 accent-blue-600" name="new-lesson-status" type="radio" value="active" />
                    <div className="flex items-center gap-1.5 text-sm font-medium text-gray-900">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      <span>Hoạt động</span>
                    </div>
                  </label>
                  <label className="flex items-center gap-2.5 p-3 rounded-lg bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors border border-gray-200">
                    <input className="w-4 h-4 text-blue-600 accent-blue-600" name="new-lesson-status" type="radio" value="inactive" />
                    <div className="flex items-center gap-1.5 text-sm font-medium text-gray-900">
                      <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                      <span>Không hoạt động</span>
                    </div>
                  </label>
                </div>
              </div>
              <div className="flex items-start gap-2.5 p-3 rounded-lg bg-gray-50 text-gray-600 text-xs border border-gray-200">
                <span>Thứ tự bài học sẽ được tự động xếp ở cuối danh sách. Giảng viên có thể đổi thứ tự bằng mũi tên sau khi lưu.</span>
              </div>
              <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-100">
                <button className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold transition-colors" onClick={() => setShowAddModal(false)} type="button">Hủy</button>
                <button className="inline-flex items-center gap-1.5 px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-sm transition-all" type="submit">
                  <span className="material-symbols-outlined text-[18px]">save</span>
                  <span>Lưu bài học</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Chỉnh sửa bài học */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 overflow-hidden border border-gray-100">
            <div className="px-6 py-4 bg-gray-50 flex items-center justify-between border-b border-gray-100">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-blue-600 text-[22px]">edit_note</span>
                <h3 className="text-base font-semibold text-gray-900">Chỉnh sửa bài học</h3>
              </div>
              <button className="p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-200 transition-colors" onClick={() => setShowEditModal(false)} type="button">
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            <form className="p-6 flex flex-col gap-4" onSubmit={(e) => { e.preventDefault(); setShowEditModal(false); }}>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-700 flex items-center gap-1">
                  <span>Tên bài học</span>
                  <span className="text-red-500">*</span>
                </label>
                <input 
                  className="w-full h-10 px-3.5 rounded-lg bg-gray-50 text-gray-900 text-sm border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-600" 
                  value={editData.title}
                  onChange={(e) => setEditData({...editData, title: e.target.value})}
                  required 
                  type="text" 
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-gray-700">Trạng thái</label>
                <div className="grid grid-cols-2 gap-3">
                  <label className="flex items-center gap-2.5 p-3 rounded-lg bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors border border-gray-200">
                    <input 
                      checked={editData.status === 'active'} 
                      onChange={() => setEditData({...editData, status: 'active'})}
                      className="w-4 h-4 text-blue-600 accent-blue-600" 
                      name="edit-lesson-status" 
                      type="radio" 
                      value="active" 
                    />
                    <div className="flex items-center gap-1.5 text-sm font-medium text-gray-900">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      <span>Hoạt động</span>
                    </div>
                  </label>
                  <label className="flex items-center gap-2.5 p-3 rounded-lg bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors border border-gray-200">
                    <input 
                      checked={editData.status === 'inactive'} 
                      onChange={() => setEditData({...editData, status: 'inactive'})}
                      className="w-4 h-4 text-blue-600 accent-blue-600" 
                      name="edit-lesson-status" 
                      type="radio" 
                      value="inactive" 
                    />
                    <div className="flex items-center gap-1.5 text-sm font-medium text-gray-900">
                      <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                      <span>Không hoạt động</span>
                    </div>
                  </label>
                </div>
              </div>
              <div className="pt-2 flex items-center justify-between border-t border-gray-100 mt-1">
                <a className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-800 text-sm font-semibold" href="/instructor/lesson-content">
                  <span className="material-symbols-outlined text-[18px]">launch</span>
                  <span>Quản lý nội dung bài học</span>
                </a>
                <div className="flex items-center gap-2">
                  <button className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold transition-colors" onClick={() => setShowEditModal(false)} type="button">Hủy</button>
                  <button className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-sm transition-all" type="submit">
                    <span className="material-symbols-outlined text-[18px]">check</span>
                    <span>Lưu thay đổi</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Cấu hình trắc nghiệm cuối chương */}
      {showQuizModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 overflow-hidden border border-gray-100">
            <div className="px-6 py-4 bg-gray-50 flex items-center justify-between border-b border-gray-100">
              <div>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-blue-600 text-[22px]">quiz</span>
                  <h3 className="text-base font-semibold text-gray-900">Cấu hình kiểm tra cuối chương</h3>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">Thiết lập thông tin cho bài kiểm tra cuối chương.</p>
              </div>
              <button className="p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-200 transition-colors shrink-0" onClick={() => setShowQuizModal(false)} type="button">
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            <form className="p-6 flex flex-col gap-4" onSubmit={(e) => { e.preventDefault(); setQuizCreated(true); setShowQuizModal(false); }}>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-700 flex items-center justify-between">
                  <span>Thời gian làm bài <span className="text-red-500">*</span></span>
                  <span className="text-gray-400 text-xs font-normal">Tối đa 180 phút</span>
                </label>
                <div className="relative flex items-center">
                  <input className="w-full h-10 pl-3.5 pr-16 rounded-lg bg-gray-50 text-gray-900 text-sm border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-600" max="180" min="1" required type="number" defaultValue="15" />
                  <span className="absolute right-3.5 text-gray-500 text-sm pointer-events-none select-none">phút</span>
                </div>
                <p className="text-xs text-gray-500">Thời gian đếm ngược khi sinh viên bắt đầu làm bài trắc nghiệm.</p>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-700 flex items-center justify-between">
                  <span>Điểm đạt yêu cầu <span className="text-red-500">*</span></span>
                  <span className="text-gray-400 text-xs font-normal">Thang điểm 10.0</span>
                </label>
                <div className="relative flex items-center">
                  <input className="w-full h-10 pl-3.5 pr-28 rounded-lg bg-gray-50 text-gray-900 text-sm border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-600" max="10" min="0" required step="0.1" type="number" defaultValue="5.0" />
                  <span className="absolute right-3.5 text-gray-500 text-sm pointer-events-none select-none">điểm / 10.0</span>
                </div>
                <p className="text-xs text-gray-500">Điểm số tối thiểu sinh viên cần đạt để hoàn thành chương học này.</p>
              </div>
              <div className="flex items-start gap-2.5 p-3 rounded-lg bg-gray-50 text-gray-600 text-xs border border-gray-200">
                <span className="material-symbols-outlined text-[18px] text-blue-600 shrink-0">info</span>
                <span>Sau khi lưu cấu hình, hệ thống sẽ mở giao diện soạn thảo danh sách câu hỏi trắc nghiệm cho bài kiểm tra.</span>
              </div>
              <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-100 mt-1">
                <button className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold transition-colors" onClick={() => setShowQuizModal(false)} type="button">Hủy</button>
                <button className="inline-flex items-center gap-1.5 px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-sm transition-all active:scale-[0.98]" type="submit">
                  <span className="material-symbols-outlined text-[18px]">check</span>
                  <span>Lưu</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageLessons;