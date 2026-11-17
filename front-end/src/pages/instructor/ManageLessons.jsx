
import React, { useCallback, useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  getLessonsByChapterId,
  createLesson,
  updateLesson,
  moveLesson
} from '../../services/lessonService';

// Dữ liệu mặc định của form bài học
const EMPTY_FORM = { title: '', status: 'Active' };

// Lấy thông báo lỗi từ Backend
const getErrorMessage = (error) => {
  return error.response?.data?.message || 'Đã xảy ra lỗi. Vui lòng thử lại.';
};

const ManageLessons = () => {
  const { courseId, chapterId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  // Thông tin được truyền từ trang quản lý chương
  const courseTitle = location.state?.courseTitle;
  const chapterTitle = location.state?.chapterTitle;

  // Danh sách bài học
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [movingId, setMovingId] = useState(null);

  // Modal thêm và sửa bài học
  const [showModal, setShowModal] = useState(false);
  const [editingLesson, setEditingLesson] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);

  // Chức năng trắc nghiệm chưa triển khai Backend
  const quizCreated = false;

  // GET: Lấy danh sách bài học thuộc chương
  const fetchLessons = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const response = await getLessonsByChapterId(courseId, chapterId);
      const result = response.result;

      setLessons(result?.content || []);
    } catch (err) {
      console.error('Lỗi lấy danh sách bài học:', err);

      const message = getErrorMessage(err);
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [courseId, chapterId]);

  // Tải danh sách khi vào trang hoặc thay đổi chương
  useEffect(() => {
    fetchLessons();
  }, [fetchLessons]);

  // Mở Modal thêm bài học
  const handleOpenAdd = () => {
    setEditingLesson(null);
    setFormData({ ...EMPTY_FORM });
    setShowModal(true);
  };

  // Mở Modal sửa và hiển thị dữ liệu bài học
  const handleOpenEdit = (lesson) => {
    setEditingLesson(lesson);
    setFormData({
      title: lesson.title || '',
      status: lesson.status || 'Active'
    });
    setShowModal(true);
  };

  // Đóng Modal
  const handleCloseModal = () => {
    if (saving) return;

    setShowModal(false);
    setEditingLesson(null);
    setFormData({ ...EMPTY_FORM });
  };

  // POST/PUT: Thêm hoặc sửa bài học, lấy message từ Backend
  const handleSubmit = async (event) => {
    event.preventDefault();

    if (saving) return;

    const payload = {
      title: formData.title.trim(),
      status: formData.status
    };

    try {
      setSaving(true);

      if (editingLesson) {
        const response = await updateLesson(
          courseId,
          chapterId,
          editingLesson.lessonId,
          payload
        );

        toast.success(response.message || 'Cập nhật bài học thành công.');
      } else {
        const response = await createLesson(courseId, chapterId, payload);

        toast.success(response.message || 'Thêm bài học thành công.');
      }

      // Đóng Modal và tải lại danh sách sau khi lưu
      setShowModal(false);
      setEditingLesson(null);
      setFormData({ ...EMPTY_FORM });

      await fetchLessons();
    } catch (err) {
      console.error('Lỗi lưu bài học:', err);
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  // PATCH: Di chuyển bài học lên hoặc xuống một vị trí
  const handleMove = async (lessonId, direction) => {
    if (movingId !== null) return;

    try {
      setMovingId(lessonId);

      const response = await moveLesson(
        courseId,
        chapterId,
        lessonId,
        direction
      );

      toast.success(response.message || 'Thay đổi thứ tự bài học thành công.');

      await fetchLessons();
    } catch (err) {
      console.error('Lỗi thay đổi thứ tự bài học:', err);
      toast.error(getErrorMessage(err));
    } finally {
      setMovingId(null);
    }
  };

  return (
    <div className="flex flex-col w-full px-2 pt-4 pb-12">

      {/* ================= HEADER & BREADCRUMB ================= */}
      <div className="flex flex-col gap-2 mb-6">
        <div className="flex items-center justify-between w-full gap-3">
          <nav
            aria-label="Breadcrumb"
            className="flex items-center flex-wrap gap-2 text-sm text-gray-500"
          >
            <Link
              to="/instructor/courses"
              className="hover:text-blue-600 transition-colors"
            >
              Khóa học
            </Link>

            <span className="material-symbols-outlined text-[14px] text-gray-400">
              chevron_right
            </span>

            <Link
              to={`/instructor/courses/${courseId}`}
              className="hover:text-blue-600 transition-colors"
            >
              Chi tiết khóa học
            </Link>

            <span className="material-symbols-outlined text-[14px] text-gray-400">
              chevron_right
            </span>

            <Link
              to={`/instructor/courses/${courseId}/chapters`}
              className="hover:text-blue-600 transition-colors"
            >
              Quản lý chương học
            </Link>

            <span className="material-symbols-outlined text-[14px] text-gray-400">
              chevron_right
            </span>

            <span className="text-blue-600 font-semibold">
              Quản lý bài học
            </span>
          </nav>

          <button
            type="button"
            onClick={() => navigate(`/instructor/courses/${courseId}/chapters`)}
            title="Quay lại danh sách chương"
            className="w-9 h-9 rounded-full bg-white shadow-sm flex items-center justify-center text-gray-600 hover:text-blue-600 hover:bg-gray-50 border border-gray-100 shrink-0"
          >
            <span className="material-symbols-outlined text-[20px]">
              arrow_back
            </span>
          </button>
        </div>

        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            Quản lý bài học
          </h1>

          <div className="flex items-center flex-wrap gap-2 text-sm text-gray-600">
            <span className="inline-flex items-center px-3 py-0.5 rounded-full bg-gray-100 text-blue-700 font-medium">
              Khóa học: {courseTitle || `#${courseId}`}
            </span>

            <span className="text-gray-400">•</span>

            <span className="inline-flex items-center px-3 py-0.5 rounded-full bg-gray-50 text-gray-700 font-medium">
              Chương: {chapterTitle || lessons[0]?.chapterTitle || `#${chapterId}`}
            </span>
          </div>
        </div>
      </div>

      {/* ================= THANH CÔNG CỤ ================= */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between flex-wrap gap-4 px-1">
          <div className="flex items-center gap-3">
            <h2 className="text-base font-semibold text-gray-900">
              Danh sách phân phối bài học
            </h2>

            <span className="px-3 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold">
              {lessons.length} bài học • {quizCreated ? 1 : 0} bài kiểm tra
            </span>
          </div>

          <button
            type="button"
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-sm transition-all"
          >
            <span className="material-symbols-outlined text-[19px]">
              add
            </span>
            Thêm bài học
          </button>
        </div>

        {/* Thông báo khi không tải được danh sách */}
        {error && (
          <div className="p-4 bg-red-50 text-red-600 border border-red-100 rounded-xl text-sm">
            {error}

            <button
              type="button"
              onClick={fetchLessons}
              className="ml-3 font-semibold underline"
            >
              Thử lại
            </button>
          </div>
        )}

        {/* ================= BẢNG BÀI HỌC ================= */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100 w-full">
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-600 text-xs border-b border-gray-100">
                  <th className="py-3.5 px-4 font-semibold w-16 text-center">
                    ID
                  </th>

                  <th className="py-3.5 px-6 font-semibold">
                    Tên bài học
                  </th>

                  <th className="py-3.5 px-6 font-semibold w-48 text-center">
                    Thứ tự bài học
                  </th>

                  <th className="py-3.5 px-6 font-semibold w-40">
                    Trạng thái
                  </th>

                  <th className="py-3.5 px-6 font-semibold w-80 text-right">
                    Thao tác
                  </th>
                </tr>
              </thead>

              <tbody className="text-sm text-gray-900 divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="py-12 text-center text-gray-500"
                    >
                      Đang tải danh sách bài học...
                    </td>
                  </tr>
                ) : (
                  <>
                    {/* Danh sách trống */}
                    {lessons.length === 0 && (
                      <tr>
                        <td
                          colSpan={5}
                          className="py-12 text-center text-gray-500"
                        >
                          {error
                            ? 'Không thể hiển thị danh sách bài học.'
                            : 'Chương học chưa có bài học nào.'}
                        </td>
                      </tr>
                    )}

                    {/* Hiển thị từng bài học */}
                    {lessons.map((lesson, index) => (
                      <tr
                        key={lesson.lessonId}
                        className="hover:bg-gray-50/50 transition-colors"
                      >
                        {/* ID bài học */}
                        <td className="py-4 px-4 text-center font-medium text-gray-500">
                          {lesson.lessonId}
                        </td>

                        {/* Tên bài học */}
                        <td className="py-4 px-6 font-semibold text-gray-900">
                          {lesson.title}
                        </td>

                        {/* Thứ tự và di chuyển */}
                        <td className="py-4 px-6 text-center">
                          <div className="inline-flex items-center gap-2 bg-gray-50 px-2 py-1 rounded-lg border border-gray-200">
                            <span className="w-6 h-6 rounded bg-white text-blue-600 font-bold flex items-center justify-center text-xs border border-gray-100">
                              {lesson.orderNum ?? index + 1}
                            </span>

                            <div className="flex flex-col gap-0.5">
                              <button
                                type="button"
                                title="Di chuyển lên"
                                disabled={index === 0 || movingId !== null}
                                onClick={() => handleMove(lesson.lessonId, 'up')}
                                className="w-4 h-4 rounded text-gray-400 hover:text-blue-600 hover:bg-gray-200 flex items-center justify-center disabled:opacity-30"
                              >
                                <span className="material-symbols-outlined text-[14px]">
                                  expand_less
                                </span>
                              </button>

                              <button
                                type="button"
                                title="Di chuyển xuống"
                                disabled={index === lessons.length - 1 || movingId !== null}
                                onClick={() => handleMove(lesson.lessonId, 'down')}
                                className="w-4 h-4 rounded text-gray-400 hover:text-blue-600 hover:bg-gray-200 flex items-center justify-center disabled:opacity-30"
                              >
                                <span className="material-symbols-outlined text-[14px]">
                                  expand_more
                                </span>
                              </button>
                            </div>
                          </div>
                        </td>

                        {/* Trạng thái bài học */}
                        <td className="py-4 px-6 whitespace-nowrap">
                          {lesson.status === 'Active' ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium">
                              <span className="w-2 h-2 rounded-full bg-emerald-500" />
                              Hoạt động
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 text-xs font-medium">
                              <span className="w-2 h-2 rounded-full bg-rose-500" />
                              Không hoạt động
                            </span>
                          )}
                        </td>

                        {/* Nút thao tác */}
                        <td className="py-4 px-6 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(lesson)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 hover:text-blue-600 text-xs font-medium"
                            >
                              <span className="material-symbols-outlined text-[16px]">
                                edit
                              </span>
                              Sửa
                            </button>

                            <Link
                              to={`/instructor/courses/${courseId}/chapters/${chapterId}/lessons/${lesson.lessonId}`}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 text-xs font-medium"
                            >
                              <span className="material-symbols-outlined text-[16px]">
                                article
                              </span>
                              Quản lý nội dung bài học
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))}

                    {/* ================= KIỂM TRA CUỐI CHƯƠNG ================= */}
                    <tr className="bg-gray-50/60 hover:bg-gray-50 border-t border-gray-200">
                      <td className="py-4 px-4 text-center font-medium text-gray-500">
                        —
                      </td>

                      <td className="py-4 px-6 font-semibold text-blue-600">
                        Kiểm tra cuối chương
                      </td>

                      <td className="py-4 px-6 text-center text-gray-400">
                        —
                      </td>

                      <td className="py-4 px-6 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-100 text-gray-600 text-xs font-medium">
                          <span className="w-2 h-2 rounded-full bg-gray-400" />
                          Chưa tạo
                        </span>
                      </td>

                      <td className="py-4 px-6 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => toast('Chức năng tạo trắc nghiệm sẽ được triển khai sau.')}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium"
                        >
                          <span className="material-symbols-outlined text-[16px]">
                            add_circle
                          </span>
                          Tạo trắc nghiệm
                        </button>
                      </td>
                    </tr>
                  </>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ================= MODAL THÊM / SỬA BÀI HỌC ================= */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="lesson-modal-title"
            className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden border border-gray-100"
          >
            {/* Header Modal */}
            <div className="px-6 py-4 bg-gray-50 flex items-center justify-between border-b border-gray-100">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-blue-600 text-[22px]">
                  {editingLesson ? 'edit_note' : 'post_add'}
                </span>

                <h3
                  id="lesson-modal-title"
                  className="text-base font-semibold text-gray-900"
                >
                  {editingLesson ? 'Chỉnh sửa bài học' : 'Thêm bài học mới'}
                </h3>
              </div>

              <button
                type="button"
                disabled={saving}
                onClick={handleCloseModal}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-200 disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[20px]">
                  close
                </span>
              </button>
            </div>

            {/* Form không dùng validation của trình duyệt.
                Backend sẽ kiểm tra và trả message cho Toast. */}
            <form
              className="p-6 flex flex-col gap-4"
              onSubmit={handleSubmit}
              noValidate
            >
              {/* Tên bài học */}
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="lesson-title"
                  className="text-xs font-semibold text-gray-700"
                >
                  Tên bài học <span className="text-red-500">*</span>
                </label>

                <input
                  id="lesson-title"
                  type="text"
                  value={formData.title}
                  onChange={(event) =>
                    setFormData({
                      ...formData,
                      title: event.target.value
                    })
                  }
                  placeholder="Nhập tên bài học..."
                  className="w-full h-10 px-3.5 rounded-lg bg-gray-50 text-gray-900 text-sm border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />

                <span className={`text-xs text-right ${
                  formData.title.length > 255
                    ? 'text-red-500'
                    : 'text-gray-400'
                }`}>
                  {formData.title.length}/255 ký tự
                </span>
              </div>

              {/* Trạng thái bài học */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-gray-700">
                  Trạng thái <span className="text-red-500">*</span>
                </label>

                <div className="grid grid-cols-2 gap-3">
                  {[
                    {
                      value: 'Active',
                      label: 'Hoạt động',
                      color: 'bg-emerald-500'
                    },
                    {
                      value: 'Inactive',
                      label: 'Không hoạt động',
                      color: 'bg-rose-500'
                    }
                  ].map((option) => (
                    <label
                      key={option.value}
                      className={`flex items-center gap-2.5 p-3 rounded-lg cursor-pointer border transition-colors ${
                        formData.status === option.value
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 bg-gray-50 hover:bg-gray-100'
                      }`}
                    >
                      <input
                        type="radio"
                        name="lesson-status"
                        value={option.value}
                        checked={formData.status === option.value}
                        onChange={() =>
                          setFormData({
                            ...formData,
                            status: option.value
                          })
                        }
                        className="w-4 h-4 accent-blue-600"
                      />

                      <span className={`w-2 h-2 rounded-full ${option.color}`} />

                      <span className="text-sm font-medium text-gray-900">
                        {option.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Ghi chú thứ tự khi thêm bài học */}
              {!editingLesson && (
                <div className="flex items-start gap-2.5 p-3 rounded-lg bg-gray-50 text-gray-600 text-xs border border-gray-200">
                  <span className="material-symbols-outlined text-[18px] text-blue-600 shrink-0">
                    info
                  </span>

                  <span>
                    Thứ tự bài học sẽ được tự động xếp ở cuối danh sách.
                    Giảng viên có thể thay đổi thứ tự bằng mũi tên sau khi lưu.
                  </span>
                </div>
              )}

              {/* Cảnh báo khi vô hiệu hóa bài học */}
              {editingLesson?.status === 'Active' &&
                formData.status === 'Inactive' && (
                  <div className="flex items-start gap-2.5 p-3 rounded-lg bg-amber-50 text-amber-800 text-xs border border-amber-200">
                    <span className="material-symbols-outlined text-[18px] shrink-0">
                      info
                    </span>

                    <span>
                      Khi chuyển sang trạng thái không hoạt động,
                      bài học này sẽ không còn hiển thị cho học viên.
                      Nếu đây là bài học hoạt động cuối cùng của khóa học
                      đã xuất bản, hệ thống có thể không cho phép lưu.
                    </span>
                  </div>
                )}

              {/* Nút lưu và hủy */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  disabled={saving}
                  onClick={handleCloseModal}
                  className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold disabled:opacity-50"
                >
                  Hủy
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-sm disabled:opacity-60"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {editingLesson ? 'check' : 'save'}
                  </span>

                  {saving
                    ? 'Đang lưu...'
                    : editingLesson
                      ? 'Lưu thay đổi'
                      : 'Lưu bài học'}
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
