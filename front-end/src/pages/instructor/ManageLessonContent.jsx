
import React, { useEffect, useState } from 'react';
import lessonContentService, { getLessonContentFileUrl } from '../../services/lessonContentService';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';

// Dữ liệu mặc định khi thêm nội dung
const EMPTY_FORM = {
  title: '',
  contentType: 'Text',
  contentData: '',
  status: 'Active'
};

// Các loại nội dung theo enum Backend
const CONTENT_TYPES = [
  { value: 'Text', label: 'Văn bản' },
  { value: 'Video', label: 'Video' },
  { value: 'PDF', label: 'Tài liệu PDF' }
];

// Lấy thông báo từ Backend
const getSuccessMessage = (response) =>
  response?.data?.message ||
  response?.message;

const getErrorMessage = (error) =>
  error?.response?.data?.message ||
  error?.data?.message ||
  error?.message ||
  'Có lỗi xảy ra';

// Hỗ trợ dữ liệu trả về từ Axios hoặc Service đã tách response
const getResponseData = (response) => {
  const data = response?.data ?? response;
  return data?.result ?? data;
};

const ManageLessonContent = () => {
  const { courseId, chapterId, lessonId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const courseTitle = location.state?.courseTitle || `Khóa học #${courseId}`;
  const chapterTitle = location.state?.chapterTitle || `Chương #${chapterId}`;
  const lessonTitle = location.state?.lessonTitle || `Bài học #${lessonId}`;
  const lessonPath = `/instructor/courses/${courseId}/chapters/${chapterId}`;

  // State quản lý nội dung bài học
  const [contents, setContents] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingContent, setEditingContent] = useState(null);
  const [formData, setFormData] = useState({ ...EMPTY_FORM });
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewContent, setPreviewContent] = useState(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [movingId, setMovingId] = useState(null);

  // Trắc nghiệm: giữ nguyên chức năng hiện tại
  const [quizState, setQuizState] = useState('none');
  const [quizTitle, setQuizTitle] = useState(
    'Trắc nghiệm kiểm tra kiến thức bài học'
  );
  const [showQuizMethodModal, setShowQuizMethodModal] = useState(false);
  const [showPublishModal, setShowPublishModal] = useState(false);

  // Lấy danh sách nội dung bài học từ Backend
  useEffect(() => {
    let active = true;

    const loadContents = async () => {
      setLoading(true);

      try {
        const response = await lessonContentService.getContents(
          courseId,
          chapterId,
          lessonId
        );

        const data = getResponseData(response);

        if (active) {
          setContents(
            [...data].sort((a, b) => a.orderNum - b.orderNum)
          );
        }
      } catch (error) {
        if (active) toast.error(getErrorMessage(error));
      } finally {
        if (active) setLoading(false);
      }
    };

    loadContents();

    return () => {
      active = false;
    };
  }, [courseId, chapterId, lessonId]);

  // Mở modal thêm nội dung
  const handleOpenAdd = () => {
    setEditingContent(null);
    setFormData({ ...EMPTY_FORM });
    setSelectedFile(null);
    setShowModal(true);
  };

  // Mở modal sửa
  const handleOpenEdit = (item) => {
    setEditingContent(item);
    setFormData({
      title: item.title || '',
      contentType: item.contentType || 'Text',
      contentData: item.contentData || '',
      status: item.status || 'Active'
    });
    setSelectedFile(null);
    setShowModal(true);
  };

  // Đóng modal thêm hoặc sửa
  const handleCloseModal = () => {
    if (saving) return;

    setShowModal(false);
    setEditingContent(null);
    setFormData({ ...EMPTY_FORM });
    setSelectedFile(null);
  };

  // Thay đổi loại nội dung
  const handleChangeType = (type) => {
    setFormData((prev) => ({
      ...prev,
      contentType: type,
      contentData: ''
    }));
    setSelectedFile(null);
  };

  // Kiểm tra định dạng file được chọn
  const handleSelectFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isVideo = formData.contentType === 'Video';

    const valid = isVideo
      ? /\.(mp4|webm)$/i.test(file.name)
      : /\.pdf$/i.test(file.name);

    if (!valid) {
      toast.error(
        isVideo
          ? 'Chỉ hỗ trợ video MP4 hoặc WebM.'
          : 'Vui lòng chọn file PDF.'
      );
      e.target.value = '';
      return;
    }

    setSelectedFile(file);
  };

  // Thêm hoặc cập nhật nội dung qua Backend
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (saving) return;

    const isFileType = ['Video', 'PDF'].includes(formData.contentType);

    const payload = new FormData();
    payload.append('title', formData.title);
    payload.append('contentType', formData.contentType);
    payload.append('status', formData.status);

    if (formData.contentType === 'Text') {
      payload.append('contentData', formData.contentData);
    }

    if (isFileType && selectedFile) {
      payload.append('file', selectedFile);
    }

    setSaving(true);

    try {
      let response;

      if (editingContent) {
        response = await lessonContentService.updateContent(
          courseId,
          chapterId,
          lessonId,
          editingContent.contentId,
          payload
        );
      } else {
        response = await lessonContentService.createContent(
          courseId,
          chapterId,
          lessonId,
          payload
        );
      }

      // Lấy thông báo thành công từ Backend
      const message = getSuccessMessage(response);

      // Tải lại danh sách
      const listResponse = await lessonContentService.getContents(
        courseId,
        chapterId,
        lessonId
      );

      const data = getResponseData(listResponse);

      setContents(
        [...data].sort((a, b) => a.orderNum - b.orderNum)
      );

      setShowModal(false);
      setEditingContent(null);
      setSelectedFile(null);
      setFormData({ ...EMPTY_FORM });

      toast.success(message);
    } catch (error) {
      // Lấy thông báo lỗi Validation hoặc nghiệp vụ từ Backend
      toast.error(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  // Di chuyển nội dung lên hoặc xuống
  const handleMove = async (index, direction) => {
    const item = contents[index];
    if (!item || movingId !== null) return;

    setMovingId(item.contentId);

    try {
      const response = await lessonContentService.moveContent(
        courseId,
        chapterId,
        lessonId,
        item.contentId,
        direction
      );

      const listResponse = await lessonContentService.getContents(
        courseId,
        chapterId,
        lessonId
      );

      const data = getResponseData(listResponse);

      setContents(
        [...data].sort((a, b) => a.orderNum - b.orderNum)
      );

      // Thông báo thành công từ Backend
      toast.success(getSuccessMessage(response));
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setMovingId(null);
    }
  };

  // Giữ nguyên xử lý chọn phương thức tạo trắc nghiệm
  const handleChooseQuizMethod = (method) => {
    setShowQuizMethodModal(false);
    setQuizState('draft');
    setQuizTitle(
      method === 'AI'
        ? 'Trắc nghiệm tạo bằng AI'
        : 'Trắc nghiệm tạo thủ công'
    );

    toast('Cần tích hợp API để tạo và lưu bộ trắc nghiệm.', {
      icon: 'ℹ️'
    });
  };

  // Giữ nguyên xử lý xuất bản trắc nghiệm
  const handlePublishQuiz = () => {
    setQuizState('published');
    setShowPublishModal(false);
    toast.success('Đã chuyển trạng thái trắc nghiệm trên giao diện.');
  };

  return (
    <div className="flex flex-col w-full px-2 pt-4 pb-12 gap-6">

      {/* Breadcrumb */}
      <div className="flex items-center justify-between gap-4">
        <nav className="flex items-center flex-wrap gap-2 text-xs text-gray-500">
          <Link
            to="/instructor/courses"
            className="hover:text-blue-600"
          >
            Khóa học được phân công
          </Link>

          <span className="material-symbols-outlined text-[14px]">
            chevron_right
          </span>

          <Link
            to={`/instructor/courses/${courseId}`}
            className="hover:text-blue-600"
          >
            Chi tiết khóa học
          </Link>

          <span className="material-symbols-outlined text-[14px]">
            chevron_right
          </span>

          <Link
            to={`/instructor/courses/${courseId}/chapters`}
            className="hover:text-blue-600"
          >
            Quản lý chương học
          </Link>

          <span className="material-symbols-outlined text-[14px]">
            chevron_right
          </span>

          <Link
            to={lessonPath}
            className="hover:text-blue-600"
          >
            Quản lý bài học
          </Link>

          <span className="material-symbols-outlined text-[14px]">
            chevron_right
          </span>

          <span className="text-blue-600 font-semibold">
            Quản lý nội dung bài học
          </span>
        </nav>

        <button
          onClick={() => navigate(lessonPath)}
          className="w-9 h-9 rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center text-gray-600 hover:text-blue-600"
        >
          <span className="material-symbols-outlined text-[20px]">
            arrow_back
          </span>
        </button>
      </div>

      {/* Tiêu đề trang */}
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-gray-900">
          Quản lý nội dung bài học
        </h1>

        <div className="inline-flex items-center flex-wrap gap-2 px-4 py-1.5 rounded-full bg-gray-50 w-fit border border-gray-200 text-xs text-gray-600">
          <span>
            <strong className="text-blue-600">Khóa học:</strong> {courseTitle}
          </span>
          <span>•</span>
          <span>
            <strong className="text-blue-600">Chương:</strong> {chapterTitle}
          </span>
          <span>•</span>
          <span>
            <strong className="text-blue-600">Bài học:</strong> {lessonTitle}
          </span>
        </div>
      </div>

      {/* Danh sách nội dung bài học */}
      <section className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
        <div className="p-6 flex items-center justify-between flex-wrap gap-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-blue-600">
              <span className="material-symbols-outlined text-[20px]">
                layers
              </span>
            </div>
            <h2 className="text-base font-bold text-gray-900">
              Nội dung bài học
            </h2>
          </div>

          <button
            onClick={handleOpenAdd}
            className="h-10 px-4 rounded-lg bg-blue-600 text-white font-semibold text-sm flex items-center gap-1.5 hover:bg-blue-700"
          >
            <span className="material-symbols-outlined text-[18px]">
              add
            </span>
            Thêm nội dung
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-600 text-xs uppercase border-b border-gray-200">
                <th className="py-3 px-6 w-16">ID</th>
                <th className="py-3 px-6 min-w-[240px]">
                  Tiêu đề nội dung
                </th>
                <th className="py-3 px-6 w-36">Loại nội dung</th>
                <th className="py-3 px-6 w-32">Thứ tự</th>
                <th className="py-3 px-6 w-40">Trạng thái</th>
                <th className="py-3 px-6 w-40 text-right">
                  Thao tác
                </th>
              </tr>
            </thead>

            <tbody className="text-sm text-gray-900 divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td
                    colSpan={6}
                    className="py-12 text-center text-gray-500"
                  >
                    Đang tải nội dung...
                  </td>
                </tr>
              ) : contents.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="py-12 text-center text-gray-500"
                  >
                    Bài học này chưa có nội dung
                  </td>
                </tr>
              ) : (
                contents.map((item, index) => (
                  <tr
                    key={item.contentId}
                    className="hover:bg-gray-50/60"
                  >
                    <td className="py-4 px-6 text-gray-400">
                      {index + 1}
                    </td>

                    <td className="py-4 px-6 font-semibold">
                      {item.title}
                    </td>

                    <td className="py-4 px-6">
                      <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-gray-100 text-blue-700">
                        {CONTENT_TYPES.find(
                          (type) => type.value === item.contentType
                        )?.label || item.contentType}
                      </span>
                    </td>

                    <td className="py-4 px-6">
                      <div className="inline-flex items-center gap-1.5 bg-gray-50 px-2 py-1 rounded-md border border-gray-200">
                        <span className="w-4 text-center font-semibold text-xs">
                          {item.orderNum}
                        </span>

                        <div className="flex flex-col">
                          <button
                            disabled={index === 0 || movingId !== null}
                            onClick={() => handleMove(index, 'up')}
                            className="text-gray-400 hover:text-blue-600 disabled:opacity-30 leading-none"
                          >
                            <span className="material-symbols-outlined text-[14px]">
                              expand_less
                            </span>
                          </button>

                          <button
                            disabled={
                              index === contents.length - 1 ||
                              movingId !== null
                            }
                            onClick={() => handleMove(index, 'down')}
                            className="text-gray-400 hover:text-blue-600 disabled:opacity-30 leading-none"
                          >
                            <span className="material-symbols-outlined text-[14px]">
                              expand_more
                            </span>
                          </button>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-6">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
                          item.status === 'Active'
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-rose-50 text-rose-700'
                        }`}
                      >
                        <span
                          className={`w-2 h-2 rounded-full ${
                            item.status === 'Active'
                              ? 'bg-emerald-600'
                              : 'bg-rose-500'
                          }`}
                        />
                        {item.status === 'Active'
                          ? 'Hoạt động'
                          : 'Không hoạt động'}
                      </span>
                    </td>

                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setPreviewContent(item)}
                          className="px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 text-xs font-medium"
                        >
                          Xem
                        </button>

                        <button
                          onClick={() => handleOpenEdit(item)}
                          className="px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-blue-600 text-xs font-medium inline-flex items-center gap-1"
                        >
                          <span className="material-symbols-outlined text-[16px]">
                            edit
                          </span>
                          Sửa
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Trắc nghiệm bài học - giữ nguyên */}
      <section className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
        <div className="p-6 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-blue-600">
              <span className="material-symbols-outlined text-[20px]">
                quiz
              </span>
            </div>

            <div>
              <h2 className="text-base font-bold text-gray-900">
                Trắc nghiệm bài học
              </h2>
              <p className="text-xs text-gray-500 mt-1">
                Mỗi bài học được phân công tối đa 01 bộ trắc nghiệm duy nhất.
              </p>
            </div>
          </div>

          {quizState === 'none' && (
            <button
              onClick={() => setShowQuizMethodModal(true)}
              className="h-10 px-4 rounded-lg bg-blue-600 text-white font-semibold text-sm flex items-center gap-1.5 hover:bg-blue-700"
            >
              <span className="material-symbols-outlined text-[18px]">
                add
              </span>
              Thêm trắc nghiệm
            </button>
          )}
        </div>

        {quizState !== 'none' && (
          <div className="px-6 pb-6">
            <div className="flex items-center justify-between flex-wrap gap-4 p-4 rounded-xl bg-gray-50 border border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[22px]">
                    assignment
                  </span>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-gray-900">
                    {quizTitle}
                  </h3>
                  <span
                    className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold mt-1 ${
                      quizState === 'draft'
                        ? 'bg-amber-50 text-amber-700'
                        : 'bg-emerald-50 text-emerald-700'
                    }`}
                  >
                    {quizState === 'draft'
                      ? 'Bản nháp'
                      : 'Đã xuất bản'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    toast('Chưa tích hợp chức năng xem trắc nghiệm.')
                  }
                  className="px-3 py-1.5 rounded-lg bg-white hover:bg-gray-100 text-gray-700 text-xs font-semibold border border-gray-200"
                >
                  Xem
                </button>

                {quizState === 'draft' && (
                  <button
                    onClick={() => setShowPublishModal(true)}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
                  >
                    Xuất bản
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Modal thêm / sửa nội dung */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div
            role="dialog"
            aria-modal="true"
            className="w-full max-w-2xl bg-white rounded-xl shadow-xl flex flex-col overflow-hidden border border-gray-200 max-h-[90vh]"
          >
            <div className="px-6 py-4 bg-gray-50 flex items-center justify-between border-b border-gray-200">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-blue-600">
                  {editingContent ? 'edit_note' : 'post_add'}
                </span>

                <h3 className="text-base font-bold text-gray-900">
                  {editingContent
                    ? 'Chỉnh sửa nội dung bài học'
                    : 'Thêm nội dung bài học'}
                </h3>
              </div>

              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-700"
              >
                <span className="material-symbols-outlined text-[20px]">
                  close
                </span>
              </button>
            </div>

            <form
              className="p-6 flex flex-col gap-4 overflow-y-auto"
              onSubmit={handleSubmit}
              noValidate
            >
              {/* Tiêu đề nội dung */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-700">
                  Tiêu đề nội dung
                  <span className="text-red-500"> *</span>
                </label>

                <input
                  type="text"
                  value={formData.title}
                  placeholder="Ví dụ: Giới thiệu về biến trong C"
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      title: e.target.value
                    })
                  }
                  className="h-10 px-3 rounded-lg bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              {/* Loại nội dung */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-700">
                  Loại nội dung
                  <span className="text-red-500"> *</span>
                </label>

                <select
                  value={formData.contentType}
                  onChange={(e) => handleChangeType(e.target.value)}
                  className="h-10 px-3 rounded-lg bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  {CONTENT_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Văn bản */}
              {formData.contentType === 'Text' && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-700">
                    Nội dung văn bản
                    <span className="text-red-500"> *</span>
                  </label>

                  <textarea
                    rows={8}
                    value={formData.contentData}
                    placeholder="Nhập nội dung bài giảng, giải thích khái niệm, ví dụ minh họa..."
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        contentData: e.target.value
                      })
                    }
                    className="w-full min-h-[200px] px-3 py-3 rounded-lg bg-gray-50 border border-gray-200 text-sm leading-6 focus:outline-none focus:ring-2 focus:ring-blue-600 resize-y"
                  />
                </div>
              )}

              {/* Video/PDF */}
              {['Video', 'PDF'].includes(formData.contentType) && (
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold text-gray-700">
                    {formData.contentType === 'Video'
                      ? 'Tải video bài giảng'
                      : 'Tải tài liệu PDF'}
                    <span className="text-red-500"> *</span>
                  </label>

                  <label className="flex flex-col items-center justify-center gap-2 p-7 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50 hover:border-blue-500 hover:bg-blue-50/40 cursor-pointer transition">
                    <span className="material-symbols-outlined text-[36px] text-blue-600">
                      {formData.contentType === 'Video'
                        ? 'video_file'
                        : 'picture_as_pdf'}
                    </span>

                    <span className="text-sm font-semibold text-gray-700 text-center">
                      {selectedFile?.name ||
                        (editingContent?.contentType ===
                          formData.contentType &&
                        editingContent?.contentData
                          ? 'Đã có file trên hệ thống (nhấn để thay thế)'
                          : formData.contentType === 'Video'
                            ? 'Nhấn để chọn video từ máy tính'
                            : 'Nhấn để chọn file PDF từ máy tính')}
                    </span>

                    <span className="text-xs text-gray-500">
                      {formData.contentType === 'Video'
                        ? 'Hỗ trợ MP4, WebM'
                        : 'Chỉ hỗ trợ định dạng PDF'}
                    </span>

                    <input
                      key={formData.contentType}
                      type="file"
                      accept={
                        formData.contentType === 'Video'
                          ? '.mp4,.webm'
                          : '.pdf,application/pdf'
                      }
                      onChange={handleSelectFile}
                      className="hidden"
                    />
                  </label>

                  {selectedFile && (
                    <div className="flex items-center justify-between gap-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
                      <span className="text-xs text-blue-700 truncate">
                        Đã chọn: {selectedFile.name}
                      </span>

                      <button
                        type="button"
                        onClick={() => setSelectedFile(null)}
                        className="text-xs font-semibold text-red-600"
                      >
                        Bỏ chọn
                      </button>
                    </div>
                  )}

                  <p className="text-xs text-gray-500">
                    {editingContent
                      ? 'Không chọn file mới nếu muốn giữ file hiện tại.'
                      : 'File sẽ được tải lên server khi nhấn Thêm nội dung.'}
                  </p>
                </div>
              )}

              {/* Trạng thái nội dung */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-gray-700">
                  Trạng thái nội dung
                  <span className="text-red-500"> *</span>
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
                  ].map((status) => (
                    <label
                      key={status.value}
                      className={`flex items-center gap-2.5 p-3 rounded-lg cursor-pointer border ${
                        formData.status === status.value
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 bg-gray-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="content-status"
                        checked={formData.status === status.value}
                        onChange={() =>
                          setFormData({
                            ...formData,
                            status: status.value
                          })
                        }
                        className="accent-blue-600"
                      />

                      <span
                        className={`w-2 h-2 rounded-full ${status.color}`}
                      />

                      <span className="text-sm font-medium text-gray-900">
                        {status.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Nút lưu và hủy */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold"
                >
                  Hủy
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold disabled:opacity-50"
                >
                  {saving
                    ? 'Đang lưu...'
                    : editingContent
                      ? 'Lưu thay đổi'
                      : 'Thêm nội dung'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal xem nội dung */}
      {previewContent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-3xl bg-white rounded-xl shadow-xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-base font-bold text-gray-900">
                {previewContent.title}
              </h3>

              <button
                onClick={() => setPreviewContent(null)}
                className="text-gray-400 hover:text-gray-700"
              >
                <span className="material-symbols-outlined">
                  close
                </span>
              </button>
            </div>

            <div className="p-6 overflow-y-auto">
              {previewContent.contentType === 'Text' && (
                <div className="whitespace-pre-wrap text-sm text-gray-800 leading-7">
                  {previewContent.contentData || 'Chưa có nội dung.'}
                </div>
              )}

              {previewContent.contentType === 'Video' && (
                previewContent.contentData ? (
                  <video
                    controls
                    className="w-full max-h-[65vh] rounded-lg bg-black"
                    src={getLessonContentFileUrl(
                      previewContent.contentData
                    )}
                  >
                    Trình duyệt không hỗ trợ phát video.
                  </video>
                ) : (
                  <p className="text-sm text-gray-500">
                    Chưa có file video để xem.
                  </p>
                )
              )}

              {previewContent.contentType === 'PDF' && (
                previewContent.contentData ? (
                  <iframe
                    title={previewContent.title}
                    src={getLessonContentFileUrl(
                      previewContent.contentData
                    )}
                    className="w-full h-[65vh] border border-gray-200 rounded-lg"
                  />
                ) : (
                  <p className="text-sm text-gray-500">
                    Chưa có file PDF để xem.
                  </p>
                )
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal chọn phương thức tạo trắc nghiệm */}
      {showQuizMethodModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-xl bg-white rounded-xl shadow-xl overflow-hidden border border-gray-200">
            <div className="px-6 py-4 bg-gray-50 flex items-center justify-between border-b border-gray-200">
              <h3 className="text-base font-bold text-gray-900">
                Chọn phương thức tạo trắc nghiệm
              </h3>

              <button
                onClick={() => setShowQuizMethodModal(false)}
                className="text-gray-400 hover:text-gray-700"
              >
                <span className="material-symbols-outlined">
                  close
                </span>
              </button>
            </div>

            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                onClick={() => handleChooseQuizMethod('MANUAL')}
                className="p-4 rounded-xl border border-gray-200 hover:border-blue-600 hover:bg-blue-50/40 text-left flex flex-col gap-2"
              >
                <span className="material-symbols-outlined text-[32px] text-blue-600">
                  edit_document
                </span>

                <h4 className="font-bold text-gray-900 text-sm">
                  Tạo thủ công
                </h4>

                <p className="text-xs text-gray-500">
                  Tự biên soạn câu hỏi và thiết lập đáp án.
                </p>

                <span className="text-xs font-semibold text-blue-600 mt-2">
                  Chọn tạo thủ công
                </span>
              </button>

              <button
                onClick={() => handleChooseQuizMethod('AI')}
                className="p-4 rounded-xl border border-blue-200 hover:border-blue-600 hover:bg-blue-50/40 text-left flex flex-col gap-2"
              >
                <span className="material-symbols-outlined text-[32px] text-blue-600">
                  smart_toy
                </span>

                <h4 className="font-bold text-gray-900 text-sm">
                  Tạo bằng AI
                </h4>

                <p className="text-xs text-gray-500">
                  Tải tài liệu để AI tự động trích xuất câu hỏi.
                </p>

                <span className="text-xs font-semibold text-blue-600 mt-2">
                  Chọn tạo bằng AI
                </span>
              </button>
            </div>

            <div className="px-6 py-3 bg-gray-50 flex justify-end border-t border-gray-200">
              <button
                onClick={() => setShowQuizMethodModal(false)}
                className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 text-sm font-semibold"
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal xác nhận xuất bản trắc nghiệm */}
      {showPublishModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white rounded-xl shadow-xl p-6 text-center border border-gray-200">
            <div className="w-14 h-14 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-[32px]">
                rocket_launch
              </span>
            </div>

            <h3 className="text-lg font-bold text-gray-900 mb-2">
              Xuất bản bộ trắc nghiệm?
            </h3>

            <p className="text-sm text-gray-600 mb-4">
              Bạn đang xuất bản bộ trắc nghiệm{' '}
              <strong>{quizTitle}</strong>. Sau khi xuất bản,
              bộ trắc nghiệm sẽ được sử dụng cho bài học này.
            </p>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
              <button
                onClick={() => setShowPublishModal(false)}
                className="flex-1 h-10 rounded-lg bg-gray-100 text-gray-700 text-sm font-semibold"
              >
                Hủy
              </button>

              <button
                onClick={handlePublishQuiz}
                className="flex-1 h-10 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold"
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
