
import React, { useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';

const EMPTY_FORM = { title: '', contentType: 'TEXT', contentData: '', status: 'Active' };
const CONTENT_TYPES = [
  { value: 'TEXT', label: 'Văn bản' },
  { value: 'VIDEO', label: 'Video' },
  { value: 'PDF', label: 'Tài liệu PDF' }
];

const ManageLessonContent = () => {
  const { courseId, chapterId, lessonId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const courseTitle = location.state?.courseTitle || `Khóa học #${courseId}`;
  const chapterTitle = location.state?.chapterTitle || `Chương #${chapterId}`;
  const lessonTitle = location.state?.lessonTitle || `Bài học #${lessonId}`;
  const lessonPath = `/instructor/courses/${courseId}/chapters/${chapterId}`;

  // Dữ liệu tạm thời, sẽ thay bằng API LessonContent
  const [contents, setContents] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingContent, setEditingContent] = useState(null);
  const [formData, setFormData] = useState({ ...EMPTY_FORM });
  const [selectedPdf, setSelectedPdf] = useState(null);
  const [saving, setSaving] = useState(false);
  const [previewContent, setPreviewContent] = useState(null);

  // Trắc nghiệm: tối đa một bộ, không có chức năng sửa hoặc xóa
  const [quizState, setQuizState] = useState('none');
  const [quizTitle, setQuizTitle] = useState('Trắc nghiệm kiểm tra kiến thức bài học');
  const [showQuizMethodModal, setShowQuizMethodModal] = useState(false);
  const [showPublishModal, setShowPublishModal] = useState(false);

  // ==================== MODAL THÊM / SỬA ====================
  const handleOpenAdd = () => {
    setEditingContent(null);
    setFormData({ ...EMPTY_FORM });
    setSelectedPdf(null);
    setShowModal(true);
  };

  const handleOpenEdit = (item) => {
    setEditingContent(item);
    setFormData({
      title: item.title || '',
      contentType: item.contentType || 'TEXT',
      contentData: item.contentData || '',
      status: item.status || 'Active'
    });
    setSelectedPdf(null);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    if (saving) return;
    setShowModal(false);
    setEditingContent(null);
    setFormData({ ...EMPTY_FORM });
    setSelectedPdf(null);
  };

  const handleChangeType = (type) => {
    setFormData((prev) => ({ ...prev, contentType: type, contentData: '' }));
    setSelectedPdf(null);
  };

  const handleSelectPdf = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      toast.error('Vui lòng chọn file PDF.');
      e.target.value = '';
      return;
    }

    setSelectedPdf(file);
    toast('Cần tích hợp API upload để lưu file PDF lên server.', { icon: 'ℹ️' });
  };

  // ==================== THÊM / SỬA NỘI DUNG ====================
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (saving) return;

    if (selectedPdf) {
      toast.error('Chưa có API upload PDF. Vui lòng nhập URL PDF.');
      return;
    }

    const payload = {
      title: formData.title.trim(),
      contentType: formData.contentType,
      contentData: formData.contentData.trim(),
      status: formData.status
    };

    try {
      setSaving(true);

      if (editingContent) {
        setContents((prev) => prev.map((item) =>
          item.contentId === editingContent.contentId ? { ...item, ...payload } : item
        ));
        toast.success('Đã cập nhật nội dung trên giao diện.');
      } else {
        const nextId = Math.max(0, ...contents.map((item) => item.contentId)) + 1;
        setContents((prev) => [...prev, {
          contentId: nextId, lessonId: Number(lessonId), orderNum: prev.length + 1, ...payload
        }]);
        toast.success('Đã thêm nội dung trên giao diện.');
      }

      setShowModal(false);
      setEditingContent(null);
      setFormData({ ...EMPTY_FORM });
      setSelectedPdf(null);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Không thể lưu nội dung.');
    } finally {
      setSaving(false);
    }
  };

  // ==================== THAY ĐỔI THỨ TỰ ====================
  const handleMove = (index, direction) => {
    const target = direction === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= contents.length) return;

    setContents((prev) => {
      const updated = [...prev];
      [updated[index], updated[target]] = [updated[target], updated[index]];
      return updated.map((item, i) => ({ ...item, orderNum: i + 1 }));
    });

    toast.success('Đã thay đổi thứ tự trên giao diện.');
  };

  // ==================== TRẮC NGHIỆM ====================
  const handleChooseQuizMethod = (method) => {
    setShowQuizMethodModal(false);
    setQuizState('draft');
    setQuizTitle(method === 'AI' ? 'Trắc nghiệm tạo bằng AI' : 'Trắc nghiệm tạo thủ công');
    toast('Cần tích hợp API để tạo và lưu bộ trắc nghiệm.', { icon: 'ℹ️' });
  };

  const handlePublishQuiz = () => {
    setQuizState('published');
    setShowPublishModal(false);
    toast.success('Đã chuyển trạng thái trắc nghiệm trên giao diện.');
  };

  return (
    <div className="flex flex-col w-full px-2 pt-4 pb-12 gap-6">

      {/* ==================== BREADCRUMB ==================== */}
      <div className="flex items-center justify-between gap-4">
        <nav className="flex items-center flex-wrap gap-2 text-xs text-gray-500">
          <Link to="/instructor/courses" className="hover:text-blue-600">Khóa học được phân công</Link>
          <span className="material-symbols-outlined text-[14px] text-gray-400">chevron_right</span>
          <Link to={`/instructor/courses/${courseId}`} className="hover:text-blue-600">Chi tiết khóa học</Link>
          <span className="material-symbols-outlined text-[14px] text-gray-400">chevron_right</span>
          <Link to={`/instructor/courses/${courseId}/chapters`} className="hover:text-blue-600">Quản lý chương học</Link>
          <span className="material-symbols-outlined text-[14px] text-gray-400">chevron_right</span>
          <Link to={lessonPath} className="hover:text-blue-600">Quản lý bài học</Link>
          <span className="material-symbols-outlined text-[14px] text-gray-400">chevron_right</span>
          <span className="text-blue-600 font-semibold">Quản lý nội dung bài học</span>
        </nav>

        <button type="button" onClick={() => navigate(lessonPath)}
          className="w-9 h-9 rounded-full bg-white shadow-sm border border-gray-200 flex items-center justify-center text-gray-600 hover:text-blue-600 shrink-0">
          <span className="material-symbols-outlined text-[20px]">arrow_back</span>
        </button>
      </div>

      {/* ==================== TIÊU ĐỀ ==================== */}
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-gray-900">Quản lý nội dung bài học</h1>
        <div className="inline-flex items-center flex-wrap gap-2 px-4 py-1.5 rounded-full bg-gray-50 w-fit border border-gray-200 text-xs text-gray-600">
          <span><strong className="text-blue-600">Khóa học:</strong> {courseTitle}</span>
          <span className="text-gray-400">•</span>
          <span><strong className="text-blue-600">Chương:</strong> {chapterTitle}</span>
          <span className="text-gray-400">•</span>
          <span><strong className="text-blue-600">Bài học:</strong> {lessonTitle}</span>
        </div>
      </div>

      {/* ==================== DANH SÁCH NỘI DUNG ==================== */}
      <section className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
        <div className="p-6 flex items-center justify-between flex-wrap gap-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-blue-600">
              <span className="material-symbols-outlined text-[20px]">layers</span>
            </div>
            <h2 className="text-base font-bold text-gray-900">Nội dung bài học</h2>
          </div>
          <button type="button" onClick={handleOpenAdd}
            className="h-10 px-4 rounded-lg bg-blue-600 text-white font-semibold text-sm flex items-center gap-1.5 hover:bg-blue-700">
            <span className="material-symbols-outlined text-[18px]">add</span> Thêm nội dung
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-600 font-medium text-xs uppercase tracking-wider border-b border-gray-200">
                <th className="py-3 px-6 w-16">ID</th>
                <th className="py-3 px-6 min-w-[240px]">Tiêu đề nội dung</th>
                <th className="py-3 px-6 w-36">Loại nội dung</th>
                <th className="py-3 px-6 w-32">Thứ tự</th>
                <th className="py-3 px-6 w-40">Trạng thái</th>
                <th className="py-3 px-6 w-40 text-right">Thao tác</th>
              </tr>
            </thead>

            <tbody className="text-sm text-gray-900 divide-y divide-gray-100">
              {contents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-500">
                    Bài học này chưa có nội dung
                  </td>
                </tr>
              ) : contents.map((item, index) => (
                <tr key={item.contentId} className="hover:bg-gray-50/60">
                  <td className="py-4 px-6 font-medium text-gray-400">{item.contentId}</td>
                  <td className="py-4 px-6 font-semibold text-gray-900">{item.title}</td>
                  <td className="py-4 px-6">
                    <span className="inline-flex px-2.5 py-1 rounded-md text-xs font-semibold bg-gray-100 text-blue-700">
                      {item.contentType}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <div className="inline-flex items-center gap-1.5 bg-gray-50 px-2 py-1 rounded-md border border-gray-200">
                      <span className="w-4 text-center font-semibold text-xs">{item.orderNum}</span>
                      <div className="flex flex-col">
                        <button type="button" disabled={index === 0} onClick={() => handleMove(index, 'up')}
                          className="text-gray-400 hover:text-blue-600 leading-none disabled:opacity-30">
                          <span className="material-symbols-outlined text-[14px]">expand_less</span>
                        </button>
                        <button type="button" disabled={index === contents.length - 1} onClick={() => handleMove(index, 'down')}
                          className="text-gray-400 hover:text-blue-600 leading-none disabled:opacity-30">
                          <span className="material-symbols-outlined text-[14px]">expand_more</span>
                        </button>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
                      item.status === 'Active' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                    }`}>
                      <span className={`w-2 h-2 rounded-full ${item.status === 'Active' ? 'bg-emerald-600' : 'bg-rose-500'}`} />
                      {item.status === 'Active' ? 'Hoạt động' : 'Không hoạt động'}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button type="button" onClick={() => setPreviewContent(item)}
                        className="px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 text-xs font-medium">
                        Xem
                      </button>
                      <button type="button" onClick={() => handleOpenEdit(item)}
                        className="px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-blue-600 text-xs font-medium inline-flex items-center gap-1">
                        <span className="material-symbols-outlined text-[16px]">edit</span> Sửa
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ==================== TRẮC NGHIỆM: KHÔNG SỬA / XÓA ==================== */}
      <section className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
        <div className="p-6 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-blue-600">
              <span className="material-symbols-outlined text-[20px]">quiz</span>
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">Trắc nghiệm bài học</h2>
              <p className="text-xs text-gray-500 mt-1">Mỗi bài học được phân công tối đa 01 bộ trắc nghiệm duy nhất.</p>
            </div>
          </div>
          {quizState === 'none' && (
            <button type="button" onClick={() => setShowQuizMethodModal(true)}
              className="h-10 px-4 rounded-lg bg-blue-600 text-white font-semibold text-sm flex items-center gap-1.5 hover:bg-blue-700">
              <span className="material-symbols-outlined text-[18px]">add</span> Thêm trắc nghiệm
            </button>
          )}
        </div>

        {quizState !== 'none' && (
          <div className="px-6 pb-6">
            <div className="flex items-center justify-between flex-wrap gap-4 p-4 rounded-xl bg-gray-50 border border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[22px]">assignment</span>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900">{quizTitle}</h3>
                  <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold mt-1 ${
                    quizState === 'draft' ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'
                  }`}>
                    {quizState === 'draft' ? 'Bản nháp' : 'Đã xuất bản'}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => toast('Chưa tích hợp chức năng xem trắc nghiệm.')}
                  className="px-3 py-1.5 rounded-lg bg-white hover:bg-gray-100 text-gray-700 text-xs font-semibold border border-gray-200">
                  Xem
                </button>
                {quizState === 'draft' && (
                  <button type="button" onClick={() => setShowPublishModal(true)}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold">
                    Xuất bản
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </section>

      {/* ==================== MODAL THÊM / SỬA NỘI DUNG ==================== */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div role="dialog" aria-modal="true"
            className="w-full max-w-2xl bg-white rounded-xl shadow-xl flex flex-col overflow-hidden border border-gray-200 max-h-[90vh]">
            <div className="px-6 py-4 bg-gray-50 flex items-center justify-between border-b border-gray-200">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-blue-600">{editingContent ? 'edit_note' : 'post_add'}</span>
                <h3 className="text-base font-bold text-gray-900">
                  {editingContent ? 'Chỉnh sửa nội dung bài học' : 'Thêm nội dung bài học'}
                </h3>
              </div>
              <button type="button" disabled={saving} onClick={handleCloseModal} className="text-gray-400 hover:text-gray-700">
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <form className="p-6 flex flex-col gap-4 overflow-y-auto" onSubmit={handleSubmit} noValidate>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-700">Tiêu đề nội dung <span className="text-red-500">*</span></label>
                <input type="text" value={formData.title} placeholder="Ví dụ: Giới thiệu về biến trong C"
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="h-10 px-3 rounded-lg bg-gray-50 text-gray-900 border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600" />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-700">Loại nội dung <span className="text-red-500">*</span></label>
                <select value={formData.contentType} onChange={(e) => handleChangeType(e.target.value)}
                  className="h-10 px-3 rounded-lg bg-gray-50 text-gray-900 border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600">
                  {CONTENT_TYPES.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}
                </select>
              </div>

              {/* TEXT: lưu nội dung văn bản trực tiếp vào contentData */}
              {formData.contentType === 'TEXT' && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-700">Nội dung văn bản <span className="text-red-500">*</span></label>
                  <textarea rows={8} value={formData.contentData} placeholder="Nhập nội dung bài giảng, giải thích khái niệm, ví dụ minh họa..."
                    onChange={(e) => setFormData({ ...formData, contentData: e.target.value })}
                    className="w-full min-h-[200px] px-3 py-3 rounded-lg bg-gray-50 text-gray-900 border border-gray-200 text-sm leading-6 focus:outline-none focus:ring-2 focus:ring-blue-600 resize-y" />
                  <p className="text-xs text-gray-500">Có thể nhập nhiều đoạn văn và xuống dòng.</p>
                </div>
              )}

              {/* VIDEO: lưu URL video vào contentData */}
              {formData.contentType === 'VIDEO' && (
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold text-gray-700">Đường dẫn video <span className="text-red-500">*</span></label>
                  <input type="text" value={formData.contentData} placeholder="https://www.youtube.com/watch?v=..."
                    onChange={(e) => setFormData({ ...formData, contentData: e.target.value })}
                    className="h-10 px-3 rounded-lg bg-gray-50 text-gray-900 border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600" />
                  <p className="text-xs text-gray-500">Nhập URL YouTube hoặc đường dẫn video trực tiếp.</p>
                  <div className="p-3 rounded-lg bg-blue-50 border border-blue-100 text-xs text-blue-800">
                    Nếu muốn tải video từ máy tính, cần API upload video. Trường contentData sẽ lưu URL sau khi upload.
                  </div>
                </div>
              )}

              {/* PDF: lưu URL, chọn file cần API upload riêng */}
              {formData.contentType === 'PDF' && (
                <div className="flex flex-col gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-gray-700">Đường dẫn tài liệu PDF</label>
                    <input type="text" value={formData.contentData} placeholder="https://example.com/tai-lieu.pdf"
                      onChange={(e) => setFormData({ ...formData, contentData: e.target.value })}
                      className="h-10 px-3 rounded-lg bg-gray-50 text-gray-900 border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600" />
                  </div>

                  <span className="text-xs text-gray-500">Hoặc chọn file từ máy tính:</span>
                  <label className="flex flex-col items-center justify-center gap-2 p-6 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50 hover:border-blue-400 cursor-pointer">
                    <span className="material-symbols-outlined text-[32px] text-blue-600">upload_file</span>
                    <span className="text-sm font-semibold text-gray-700">{selectedPdf ? selectedPdf.name : 'Chọn file PDF'}</span>
                    <span className="text-xs text-gray-500">Chỉ hỗ trợ định dạng .pdf</span>
                    <input type="file" accept=".pdf,application/pdf" onChange={handleSelectPdf} className="hidden" />
                  </label>

                  {selectedPdf && (
                    <div className="flex items-center justify-between gap-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
                      <span className="text-xs text-blue-700 truncate">Đã chọn: {selectedPdf.name}</span>
                      <button type="button" onClick={() => setSelectedPdf(null)} className="text-xs font-semibold text-red-600">Bỏ chọn</button>
                    </div>
                  )}
                  <p className="text-xs text-amber-700">Chưa có API upload nên file PDF chưa được lưu trên server.</p>
                </div>
              )}

              {/* Trạng thái nội dung */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-gray-700">Trạng thái nội dung <span className="text-red-500">*</span></label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { value: 'Active', label: 'Hoạt động', color: 'bg-emerald-500' },
                    { value: 'Inactive', label: 'Không hoạt động', color: 'bg-rose-500' }
                  ].map((status) => (
                    <label key={status.value}
                      className={`flex items-center gap-2.5 p-3 rounded-lg cursor-pointer border ${
                        formData.status === status.value ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-gray-50'
                      }`}>
                      <input type="radio" name="content-status" checked={formData.status === status.value}
                        onChange={() => setFormData({ ...formData, status: status.value })} className="accent-blue-600" />
                      <span className={`w-2 h-2 rounded-full ${status.color}`} />
                      <span className="text-sm font-medium text-gray-900">{status.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-200">
                <button type="button" disabled={saving} onClick={handleCloseModal}
                  className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold">Hủy</button>
                <button type="submit" disabled={saving}
                  className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold disabled:opacity-50">
                  {saving ? 'Đang lưu...' : editingContent ? 'Lưu thay đổi' : 'Thêm nội dung'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== MODAL XEM NỘI DUNG ==================== */}
      {previewContent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-3xl bg-white rounded-xl shadow-xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-base font-bold text-gray-900">{previewContent.title}</h3>
              <button type="button" onClick={() => setPreviewContent(null)} className="text-gray-400 hover:text-gray-700">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="p-6 overflow-y-auto">
              {previewContent.contentType === 'TEXT' && (
                <div className="whitespace-pre-wrap text-sm text-gray-800 leading-7">
                  {previewContent.contentData || 'Chưa có nội dung.'}
                </div>
              )}
              {['VIDEO', 'PDF'].includes(previewContent.contentType) && (
                <div className="flex flex-col gap-3">
                  <p className="text-sm text-gray-600">
                    {previewContent.contentType === 'VIDEO' ? 'Đường dẫn video:' : 'Tài liệu PDF:'}
                  </p>
                  <a href={previewContent.contentData} target="_blank" rel="noopener noreferrer"
                    className="text-sm text-blue-600 underline break-all">
                    {previewContent.contentData}
                  </a>
                  <p className="text-xs text-gray-500">Nhấn đường dẫn để mở nội dung.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ==================== MODAL CHỌN CÁCH TẠO TRẮC NGHIỆM ==================== */}
      {showQuizMethodModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-xl bg-white rounded-xl shadow-xl overflow-hidden border border-gray-200">
            <div className="px-6 py-4 bg-gray-50 flex items-center justify-between border-b border-gray-200">
              <h3 className="text-base font-bold text-gray-900">Chọn phương thức tạo trắc nghiệm</h3>
              <button type="button" onClick={() => setShowQuizMethodModal(false)} className="text-gray-400 hover:text-gray-700">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button type="button" onClick={() => handleChooseQuizMethod('MANUAL')}
                className="p-4 rounded-xl border border-gray-200 hover:border-blue-600 hover:bg-blue-50/40 text-left flex flex-col gap-2">
                <span className="material-symbols-outlined text-[32px] text-blue-600">edit_document</span>
                <h4 className="font-bold text-gray-900 text-sm">Tạo thủ công</h4>
                <p className="text-xs text-gray-500">Tự biên soạn câu hỏi và thiết lập đáp án.</p>
                <span className="text-xs font-semibold text-blue-600 mt-2">Chọn tạo thủ công</span>
              </button>
              <button type="button" onClick={() => handleChooseQuizMethod('AI')}
                className="p-4 rounded-xl border border-blue-200 hover:border-blue-600 hover:bg-blue-50/40 text-left flex flex-col gap-2">
                <span className="material-symbols-outlined text-[32px] text-blue-600">smart_toy</span>
                <h4 className="font-bold text-gray-900 text-sm">Tạo bằng AI</h4>
                <p className="text-xs text-gray-500">Tải tài liệu để AI tự động trích xuất câu hỏi.</p>
                <span className="text-xs font-semibold text-blue-600 mt-2">Chọn tạo bằng AI</span>
              </button>
            </div>
            <div className="px-6 py-3 bg-gray-50 flex justify-end border-t border-gray-200">
              <button type="button" onClick={() => setShowQuizMethodModal(false)}
                className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 text-sm font-semibold">Hủy</button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== MODAL XÁC NHẬN XUẤT BẢN ==================== */}
      {showPublishModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white rounded-xl shadow-xl p-6 text-center border border-gray-200">
            <div className="w-14 h-14 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-[32px]">rocket_launch</span>
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Xuất bản bộ trắc nghiệm?</h3>
            <p className="text-sm text-gray-600 mb-4">
              Bạn đang xuất bản bộ trắc nghiệm <strong>{quizTitle}</strong>.
              Sau khi xuất bản, bộ trắc nghiệm sẽ được sử dụng cho bài học này.
            </p>
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
              <button type="button" onClick={() => setShowPublishModal(false)}
                className="flex-1 h-10 rounded-lg bg-gray-100 text-gray-700 text-sm font-semibold">Hủy</button>
              <button type="button" onClick={handlePublishQuiz}
                className="flex-1 h-10 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold">
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
