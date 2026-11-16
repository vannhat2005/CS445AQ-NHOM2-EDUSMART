
import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';

import {
  getChaptersByCourseId,
  createChapter,
  updateChapter,
  moveChapter
} from '../../services/chapterService';

const ManageChapters = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { courseId } = useParams();

  const courseTitle = location.state?.courseTitle || '';

  // Danh sách chương
  const [chapters, setChapters] = useState([]);
  const [totalChapters, setTotalChapters] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingChapter, setEditingChapter] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form thêm chương
  const [createForm, setCreateForm] = useState({
    title: '',
    description: '',
    status: 'Inactive'
  });

  // Form sửa chương
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    status: 'Inactive'
  });

  // Lấy danh sách chương
  const fetchChapters = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await getChaptersByCourseId(courseId);
      const result = response.result;

      setChapters(result?.content || []);
      setTotalChapters(result?.totalElements || 0);
    } catch (err) {
      console.error('Lỗi lấy danh sách chương:', err);

      const message =
        err.response?.data?.message ||
        'Không thể tải danh sách chương.';

      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (courseId) {
      fetchChapters();
    }
  }, [courseId]);

  // Mở modal thêm
  const handleOpenCreate = () => {
    setCreateForm({
      title: '',
      description: '',
      status: 'Inactive'
    });

    setShowCreateModal(true);
  };

  const handleCloseCreate = () => {
    if (isSubmitting) return;
    setShowCreateModal(false);
  };

  // Mở modal sửa
  const handleOpenEdit = (chapter) => {
    setEditingChapter(chapter);

    setEditForm({
      title: chapter.title || '',
      description: chapter.description || '',
      status: chapter.status || 'Inactive'
    });

    setShowEditModal(true);
  };

  const handleCloseEdit = () => {
    if (isSubmitting) return;

    setShowEditModal(false);
    setEditingChapter(null);
  };

  // Validate form
  const validateChapterForm = (form) => {
    if (!form.title.trim()) {
      toast.error('Vui lòng nhập tên chương học.');
      return false;
    }

    if (form.title.trim().length > 255) {
      toast.error('Tên chương không được vượt quá 255 ký tự.');
      return false;
    }

    if (form.description.length > 5000) {
      toast.error('Mô tả không được vượt quá 5000 ký tự.');
      return false;
    }

    if (!['Active', 'Inactive'].includes(form.status)) {
      toast.error('Trạng thái chương không hợp lệ.');
      return false;
    }

    return true;
  };

  // Thêm chương
  const handleCreateChapter = async (e) => {
    e.preventDefault();

    if (isSubmitting) return;
    if (!validateChapterForm(createForm)) return;

    try {
      setIsSubmitting(true);

      const response = await createChapter(courseId, {
        title: createForm.title.trim(),
        description: createForm.description.trim(),
        status: createForm.status
      });

      toast.success(
        response.message || 'Thêm chương học thành công!'
      );

      setShowCreateModal(false);
      await fetchChapters();
    } catch (err) {
      console.error('Lỗi thêm chương:', err);

      toast.error(
        err.response?.data?.message ||
        'Không thể thêm chương học.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Cập nhật chương
  const handleUpdateChapter = async (e) => {
    e.preventDefault();

    if (isSubmitting) return;
    if (!editingChapter) return;
    if (!validateChapterForm(editForm)) return;

    try {
      setIsSubmitting(true);

      const response = await updateChapter(
        courseId,
        editingChapter.chapterId,
        {
          title: editForm.title.trim(),
          description: editForm.description.trim(),
          status: editForm.status
        }
      );

      toast.success(
        response.message || 'Cập nhật chương học thành công!'
      );

      setShowEditModal(false);
      setEditingChapter(null);

      await fetchChapters();
    } catch (err) {
      console.error('Lỗi cập nhật chương:', err);

      toast.error(
        err.response?.data?.message ||
        'Không thể cập nhật chương học.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Thay đổi thứ tự chương - chưa có API
  
const handleMove = async (index, direction) => {
  const targetIndex =
    direction === 'up' ? index - 1 : index + 1;

  if (targetIndex < 0 || targetIndex >= chapters.length) {
    return;
  }

  if (isSubmitting) return;

  const chapter = chapters[index];

  try {
    setIsSubmitting(true);

    const response = await moveChapter(
      courseId,
      chapter.chapterId,
      direction
    );

    toast.success(
      response.message ||
      'Thay đổi thứ tự chương học thành công!'
    );

    await fetchChapters();
  } catch (err) {
    console.error('Lỗi thay đổi thứ tự chương:', err);

    toast.error(
      err.response?.data?.message ||
      'Không thể thay đổi thứ tự chương học.'
    );
  } finally {
    setIsSubmitting(false);
  }
};


  // Chỉ hiện cảnh báo khi chuyển Active -> Inactive
  const isDeactivatingChapter =
    editingChapter?.status === 'Active' &&
    editForm.status === 'Inactive';

  return (
    <div className="flex flex-col w-full px-2 pt-4 pb-12">

      {/* BREADCRUMB & HEADER */}
      <div className="flex flex-col gap-2 mb-6">
        <div className="flex items-center justify-between gap-2 mb-1">
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

            <button
              className="hover:text-blue-600 transition-colors font-medium"
              onClick={() =>
                navigate(`/instructor/courses/${courseId}`)
              }
              type="button"
            >
              Chi tiết khóa học
            </button>

            <span className="material-symbols-outlined text-[14px] text-gray-400">
              chevron_right
            </span>

            <span className="text-blue-600 font-semibold">
              Quản lý chương học
            </span>
          </nav>

          <button
            className="group flex items-center justify-center w-10 h-10 rounded-xl bg-white text-gray-600 shadow-sm hover:bg-gray-50 hover:text-blue-600 transition-all active:scale-95 shrink-0 border border-gray-100"
            onClick={() =>
              navigate(`/instructor/courses/${courseId}`)
            }
            title="Quay lại chi tiết khóa học"
            type="button"
          >
            <span className="material-symbols-outlined text-[20px]">
              arrow_back
            </span>
          </button>
        </div>

        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            Quản lý chương học
          </h1>

          <div className="flex items-center gap-2 mt-1 text-sm text-gray-600">
            <span>
              Khóa học:{' '}
              <strong className="text-gray-900 font-semibold">
                {courseTitle ||
                  chapters[0]?.courseTitle ||
                  `Khóa học #${courseId}`}
              </strong>
            </span>
          </div>
        </div>
      </div>

      {/* TOOLBAR */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white p-4 rounded-xl shadow-sm mb-6 border border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-blue-600"></div>

          <span className="font-semibold text-sm text-gray-800">
            Danh sách phân phối chương
          </span>

          <span className="px-3 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold">
            {totalChapters} chương học
          </span>
        </div>

        <button
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-sm transition-all"
          onClick={handleOpenCreate}
          type="button"
        >
          <span className="material-symbols-outlined text-[20px]">
            add
          </span>
          <span>Thêm chương</span>
        </button>
      </div>

      {/* THÔNG BÁO LỖI */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 text-red-600 border border-red-100 rounded-xl text-sm">
          {error}

          <button
            className="ml-3 font-semibold underline"
            onClick={fetchChapters}
            type="button"
          >
            Thử lại
          </button>
        </div>
      )}

      {/* BẢNG DANH SÁCH CHƯƠNG */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100 w-full">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-600 font-medium text-xs border-b border-gray-100">
                <th className="py-4 px-6 w-20 text-center">
                  ID
                </th>

                <th className="py-4 px-6 min-w-[220px]">
                  Tên chương
                </th>

                <th className="py-4 px-6 min-w-[300px]">
                  Mô tả
                </th>

                <th className="py-4 px-6 w-44 text-center">
                  Thứ tự chương
                </th>

                <th className="py-4 px-6 min-w-[180px] text-center">
                  Trạng thái
                </th>

                <th className="py-4 px-6 min-w-[260px] text-center">
                  Thao tác
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100 text-sm">
              {loading ? (
                <tr>
                  <td
                    colSpan={6}
                    className="py-12 text-center text-gray-500"
                  >
                    Đang tải danh sách chương học...
                  </td>
                </tr>
              ) : chapters.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="py-12 text-center text-gray-500"
                  >
                    {error
                      ? 'Không thể hiển thị danh sách chương.'
                      : 'Khóa học chưa có chương học nào.'}
                  </td>
                </tr>
              ) : (
                chapters.map((chap, idx) => (
                  <tr
                    key={chap.chapterId}
                    className="hover:bg-gray-50/60 transition-colors group"
                  >
                    {/* ID */}
                    <td className="py-4 px-6 text-center font-medium text-gray-500">
                      {idx + 1}
                    </td>

                    {/* Tên chương */}
                    <td className="py-4 px-6 font-semibold text-blue-600">
                      {chap.title}
                    </td>

                    {/* Mô tả */}
                    <td className="py-4 px-6 text-gray-600">
                      {chap.description || 'Chưa có mô tả'}
                    </td>

                    {/* Thứ tự */}
                    <td className="py-4 px-6">
                      <div className="flex items-center justify-center gap-2">
                        <span className="w-7 h-7 flex items-center justify-center font-semibold rounded bg-gray-100 text-blue-600 text-xs">
                          {chap.orderNum ?? idx + 1}
                        </span>

                        <div className="flex items-center gap-0.5">
                          <button
                            className="p-1 rounded text-gray-400 hover:text-blue-600 hover:bg-gray-100 transition-colors disabled:opacity-30"
                            disabled={idx === 0}
                            onClick={() => handleMove(idx, 'up')}
                            title="Di chuyển lên"
                            type="button"
                          >
                            <span className="material-symbols-outlined text-[18px]">
                              arrow_upward
                            </span>
                          </button>

                          <button
                            className="p-1 rounded text-gray-400 hover:text-blue-600 hover:bg-gray-100 transition-colors disabled:opacity-30"
                            disabled={idx === chapters.length - 1}
                            onClick={() => handleMove(idx, 'down')}
                            title="Di chuyển xuống"
                            type="button"
                          >
                            <span className="material-symbols-outlined text-[18px]">
                              arrow_downward
                            </span>
                          </button>
                        </div>
                      </div>
                    </td>

                    {/* Trạng thái */}
                    <td className="py-4 px-6 text-center">
                      {chap.status === 'Active' ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                          Hoạt động
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-rose-50 text-rose-700">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                          Không hoạt động
                        </span>
                      )}
                    </td>

                    {/* Thao tác */}
                    <td className="py-4 px-6 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gray-100 text-gray-800 hover:text-blue-600 hover:bg-gray-200 transition-colors text-xs font-semibold shadow-xs"
                          onClick={() => handleOpenEdit(chap)}
                          type="button"
                        >
                          <span className="material-symbols-outlined text-[16px]">
                            edit
                          </span>
                          <span>Sửa</span>
                        </button>

                        <button
                          className="inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors text-xs font-semibold shadow-xs whitespace-nowrap"
                          onClick={() =>
                            navigate(
                              `/instructor/courses/${courseId}/chapters/${chap.chapterId}`
                            )
                          }
                          title="Quản lý bài học"
                          type="button"
                        >
                          Quản lý bài học
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ================= MODAL THÊM CHƯƠNG ================= */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="relative w-full max-w-lg bg-white rounded-xl shadow-xl overflow-hidden border border-gray-100">

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 bg-gray-50 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center">
                  <span className="material-symbols-outlined text-[20px]">
                    add
                  </span>
                </div>

                <h2 className="text-base font-semibold text-gray-900">
                  Thêm chương học mới
                </h2>
              </div>

              <button
                className="p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-200"
                onClick={handleCloseCreate}
                disabled={isSubmitting}
                type="button"
              >
                <span className="material-symbols-outlined text-[20px]">
                  close
                </span>
              </button>
            </div>

            {/* Form thêm */}
            <form
              className="p-6 flex flex-col gap-4"
              onSubmit={handleCreateChapter}
              noValidate
            >
              {/* Tên chương */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-700">
                  Tên chương <span className="text-red-500">*</span>
                </label>

                <input
                  className="w-full px-3 py-2 rounded-lg bg-gray-50 text-gray-900 border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                  placeholder="Nhập tên chương học..."
                  value={createForm.title}
                  onChange={(e) =>
                    setCreateForm({
                      ...createForm,
                      title: e.target.value
                    })
                  }
                  maxLength={255}
                  type="text"
                />
              </div>

              {/* Mô tả */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-700">
                  Mô tả
                </label>

                <textarea
                  className="w-full px-3 py-2 rounded-lg bg-gray-50 text-gray-900 border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 resize-none"
                  placeholder="Mô tả nội dung chương..."
                  value={createForm.description}
                  onChange={(e) =>
                    setCreateForm({
                      ...createForm,
                      description: e.target.value
                    })
                  }
                  maxLength={5000}
                  rows={3}
                />
              </div>

              {/* Trạng thái */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-700">
                  Trạng thái chương
                </label>

                <select
                  className="w-full px-3 py-2 rounded-lg bg-gray-50 text-gray-900 border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                  value={createForm.status}
                  onChange={(e) =>
                    setCreateForm({
                      ...createForm,
                      status: e.target.value
                    })
                  }
                >
                  <option value="Inactive">
                    Không hoạt động
                  </option>

                  <option value="Active">
                    Hoạt động
                  </option>
                </select>
              </div>

              {/* Nút thao tác */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
                <button
                  className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold disabled:opacity-50"
                  onClick={handleCloseCreate}
                  disabled={isSubmitting}
                  type="button"
                >
                  Hủy
                </button>

                <button
                  className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-sm disabled:opacity-50"
                  disabled={isSubmitting}
                  type="submit"
                >
                  {isSubmitting ? 'Đang lưu...' : 'Lưu'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL SỬA CHƯƠNG ================= */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="relative w-full max-w-lg bg-white rounded-xl shadow-xl overflow-hidden border border-gray-100">

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 bg-gray-50 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center">
                  <span className="material-symbols-outlined text-[20px]">
                    edit
                  </span>
                </div>

                <h2 className="text-base font-semibold text-gray-900">
                  Chỉnh sửa chương học
                </h2>
              </div>

              <button
                className="p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-200"
                onClick={handleCloseEdit}
                disabled={isSubmitting}
                type="button"
              >
                <span className="material-symbols-outlined text-[20px]">
                  close
                </span>
              </button>
            </div>

            {/* Form sửa */}
            <form
              className="p-6 flex flex-col gap-4"
              onSubmit={handleUpdateChapter}
              noValidate
            >
              {/* Tên chương */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-700">
                  Tên chương <span className="text-red-500">*</span>
                </label>

                <input
                  className="w-full px-3 py-2 rounded-lg bg-gray-50 text-gray-900 border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                  placeholder="Nhập tên chương học..."
                  value={editForm.title}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      title: e.target.value
                    })
                  }
                  maxLength={255}
                  type="text"
                />
              </div>

              {/* Mô tả */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-700">
                  Mô tả
                </label>

                <textarea
                  className="w-full px-3 py-2 rounded-lg bg-gray-50 text-gray-900 border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 resize-none"
                  placeholder="Mô tả nội dung chương..."
                  value={editForm.description}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      description: e.target.value
                    })
                  }
                  maxLength={5000}
                  rows={3}
                />
              </div>

              {/* Trạng thái */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-700">
                  Trạng thái chương
                </label>

                <select
                  className="w-full px-3 py-2 rounded-lg bg-gray-50 text-gray-900 border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                  value={editForm.status}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      status: e.target.value
                    })
                  }
                >
                  <option value="Inactive">
                    Không hoạt động
                  </option>

                  <option value="Active">
                    Hoạt động
                  </option>
                </select>

                {/* CẢNH BÁO MỚI KHI TẮT CHƯƠNG */}
                {isDeactivatingChapter && (
                  <div
                    role="alert"
                    className="mt-2 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50/70 px-4 py-3"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
                      <span className="material-symbols-outlined text-[20px]">
                        info
                      </span>
                    </div>

                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-amber-900">
                        Lưu ý khi tắt chương học
                      </p>

                      <p className="mt-1 text-xs leading-5 text-amber-800">
                        Khi chuyển sang trạng thái không hoạt động,
                        chương này và các bài học liên quan sẽ không
                        còn hiển thị cho học viên. Bạn có thể kích
                        hoạt lại chương khi cần.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Nút thao tác */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
                <button
                  className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold disabled:opacity-50"
                  onClick={handleCloseEdit}
                  disabled={isSubmitting}
                  type="button"
                >
                  Hủy
                </button>

                <button
                  className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-sm disabled:opacity-50"
                  disabled={isSubmitting}
                  type="submit"
                >
                  {isSubmitting ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageChapters;
