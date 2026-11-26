import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, X, Eye, Pencil, Trash2,
  Bookmark, FileText, RotateCcw, Info, Loader2
} from 'lucide-react';
import toast from 'react-hot-toast';
import { getCurrentUser } from '../../services/authService';
import { getDrafts, getDraftDetail, deleteDraft } from '../../services/instructorDraftService';

// Lấy thông báo lỗi từ Backend
const getErrorMessage = (error) => error.response?.data?.message || error.message || 'Đã xảy ra lỗi. Vui lòng thử lại.';

// ==================================================
// COMPONENT MODAL DÙNG CHUNG
// ==================================================
const Modal = ({ title, subtitle, icon, children, footer, onClose, wide = false }) => {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4" onClick={onClose}>
      <div className={`bg-white rounded-xl shadow-2xl w-full ${wide ? 'max-w-2xl' : 'max-w-lg'} max-h-[85vh] flex flex-col overflow-hidden`}
        onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label={title}>

        {/* Tiêu đề modal */}
        <div className="p-5 bg-[#eff4ff] flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {icon}
            <div>
              <h3 className="text-lg font-bold text-slate-800">{title}</h3>
              {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
            </div>
          </div>
          <button onClick={onClose} title="Đóng" className="p-1.5 rounded-lg text-slate-500 hover:bg-blue-100 transition-colors">
            <X size={21} />
          </button>
        </div>

        {/* Nội dung modal */}
        <div className="p-6 overflow-y-auto">{children}</div>

        {/* Các nút thao tác */}
        {footer && (
          <div className="p-4 bg-[#eff4ff] flex items-center justify-end gap-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

// ==================================================
// COMPONENT QUẢN LÝ BẢN NHÁP
// ==================================================
const DraftManagement = () => {
  const navigate = useNavigate();

  // Quản lý dữ liệu và trạng thái gọi API
  const [instructorId, setInstructorId] = useState(null); // ID giảng viên đang đăng nhập
  const [drafts, setDrafts] = useState([]); // Danh sách bản nháp từ Backend
  const [loading, setLoading] = useState(true); // Trạng thái tải danh sách
  const [error, setError] = useState(''); // Thông báo lỗi tải danh sách
  const [processingId, setProcessingId] = useState(null); // ID bản nháp đang xử lý
  const [deleting, setDeleting] = useState(false); // Trạng thái đang xóa
  const actionLock = useRef(false); // Ngăn gọi API nhiều lần liên tiếp
  const requestVersion = useRef(0); // Bỏ qua kết quả của yêu cầu tải danh sách cũ

  // Quản lý tìm kiếm, bộ lọc và modal
  const [keyword, setKeyword] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [selectedDraft, setSelectedDraft] = useState(null);
  const [activeModal, setActiveModal] = useState(null);

  // Khóa các nút thao tác khi đang gọi API
  const isBusy = loading || processingId !== null || deleting;

  // ==================================================
  // 1. LẤY DANH SÁCH BẢN NHÁP TỪ BACKEND
  // ==================================================

  // Lấy danh sách bản nháp của giảng viên
  const fetchDrafts = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      // Lấy ID người dùng hiện tại để truyền vào đường dẫn API
      const userId = await getCurrentUser();
      setInstructorId(userId);

      // Lấy danh sách bản nháp
      const response = await getDrafts(userId);
      setDrafts(response.result || []);
    } catch (error) {
      console.error('Lỗi lấy danh sách bản nháp:', error);
      setError(getErrorMessage(error));
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, []);

  // Tự động lấy danh sách khi truy cập trang quản lý bản nháp
  useEffect(() => {
    fetchDrafts();

    // Bỏ qua kết quả API nếu component đã bị hủy
    return () => {
      requestVersion.current++;
    };
  }, [fetchDrafts]);

  // ==================================================
  // 2. THỐNG KÊ VÀ LỌC DỮ LIỆU
  // ==================================================

  // Chỉ lấy bài trắc nghiệm có trạng thái Draft
  const draftList = drafts.filter((draft) => draft.status === 'Draft');

  // Tổng số bản nháp theo từng loại
  const totalDrafts = draftList.length;
  const totalLessonQuizzes = draftList.filter((draft) => draft.lessonId != null).length;
  const totalChapterExams = draftList.filter((draft) => draft.lessonId == null).length;

  // Danh sách các tab lọc
  const filterTabs = [
    { value: 'all', label: 'Tất cả', count: totalDrafts },
    { value: 'lesson', label: 'Trắc nghiệm bài học', count: totalLessonQuizzes },
    { value: 'chapter', label: 'Kiểm tra cuối chương', count: totalChapterExams }
  ];

  // Lọc danh sách theo tên và loại bài trắc nghiệm
  const filteredDrafts = draftList.filter((draft) => {
    const matchesKeyword = (draft.title || '').toLowerCase().includes(keyword.trim().toLowerCase());
    const matchesType = activeFilter === 'all' ||
      (activeFilter === 'lesson' && draft.lessonId != null) ||
      (activeFilter === 'chapter' && draft.lessonId == null);
    return matchesKeyword && matchesType;
  });

  // ==================================================
  // 3. CÁC HÀM HỖ TRỢ HIỂN THỊ
  // ==================================================

  // Xác định tên loại bài trắc nghiệm
  const getQuizType = (draft) => {
    return draft.lessonId != null ? 'Trắc nghiệm bài học' : 'Kiểm tra cuối chương';
  };

  // Xác định vị trí chương và bài học
  const getQuizLocation = (draft) => {
    if (draft.lessonId != null) {
      return `Chương ${draft.chapterOrder} / Bài ${draft.lessonOrder}`;
    }
    return `Chương ${draft.chapterOrder}`;
  };

  // Định dạng ID thành 01, 02, 03...
  const formatId = (id) => String(id).padStart(2, '0');

  // Class CSS dùng chung cho các nút thao tác
  const primaryButton = 'inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#00288e] hover:bg-[#1e40af] text-white text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed';
  const secondaryButton = 'inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#e5eeff] hover:bg-[#dce9ff] text-slate-600 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed';

  // ==================================================
  // 4. XỬ LÝ TÌM KIẾM VÀ BỘ LỌC
  // ==================================================

  // Xóa từ khóa tìm kiếm
  const handleClearSearch = () => setKeyword('');

  // Đặt lại toàn bộ bộ lọc
  const handleResetFilters = () => {
    setKeyword('');
    setActiveFilter('all');
  };

  // ==================================================
  // 5. XỬ LÝ MODAL VÀ XEM CHI TIẾT
  // ==================================================

  // Mở modal xem thông tin bản nháp từ Backend
  const handleViewDetail = async (draft) => {
    if (!instructorId || isBusy || actionLock.current) return;

    actionLock.current = true;
    setProcessingId(draft.quizId);

    try {
      // Gọi API lấy thông tin chi tiết bản nháp
      const response = await getDraftDetail(instructorId, draft.quizId);

      // Kiểm tra dữ liệu trả về
      if (!response.result || response.result.status !== 'Draft') {
        throw new Error('Bản nháp không còn tồn tại hoặc đã được xuất bản');
      }

      // Lưu thông tin và mở modal chi tiết
      setSelectedDraft(response.result);
      setActiveModal('detail');
    } catch (error) {
      console.error('Lỗi xem chi tiết bản nháp:', error);
      toast.error(getErrorMessage(error));
    } finally {
      setProcessingId(null);
      actionLock.current = false;
    }
  };

  // Mở modal xác nhận xóa
  const handleOpenDelete = (draft) => {
    if (isBusy || actionLock.current) return;
    setSelectedDraft(draft);
    setActiveModal('delete');
  };

  // Đóng modal, không cho đóng khi đang xử lý API
  const handleCloseModal = () => {
    if (deleting || processingId !== null || actionLock.current) return;
    setActiveModal(null);
    setSelectedDraft(null);
  };

  // ==================================================
  // 6. TIẾP TỤC CHỈNH SỬA BẢN NHÁP
  // ==================================================

  const handleEditDraft = async (draft) => {
    if (!instructorId || isBusy || actionLock.current) return;

    actionLock.current = true;
    setProcessingId(draft.quizId);

    try {
      // Bước 1: Lấy thông tin mới nhất và danh sách câu hỏi
      const response = await getDraftDetail(instructorId, draft.quizId);
      const draftDetail = response.result;

      // Bước 2: Kiểm tra bài trắc nghiệm vẫn đang ở trạng thái Draft
      if (!draftDetail || draftDetail.status !== 'Draft') {
        throw new Error('Bản nháp không còn tồn tại hoặc đã được xuất bản');
      }

      // Bước 3: Kiểm tra danh sách câu hỏi
      if (!Array.isArray(draftDetail.questions)) {
        throw new Error('Không lấy được danh sách câu hỏi của bản nháp');
      }

      // Bước 4: Xác định loại bài trắc nghiệm
      const isLessonQuiz = draftDetail.lessonId != null;

      // Bước 5: Xác định đường dẫn đến QuizEditor
      const path = isLessonQuiz
        ? `/instructor/courses/${draftDetail.courseId}/chapters/${draftDetail.chapterId}/lessons/${draftDetail.lessonId}/quiz`
        : `/instructor/courses/${draftDetail.courseId}/chapters/${draftDetail.chapterId}/quiz`;

      // Bước 6: Đóng modal trước khi chuyển trang
      setActiveModal(null);
      setSelectedDraft(null);

      // Bước 7: Truyền toàn bộ dữ liệu bản nháp sang trang biên soạn
      navigate(path, {
        state: {
          quiz: draftDetail,
          instructorId,
          courseTitle: draftDetail.courseName,
          chapterTitle: draftDetail.chapterTitle,
          lessonTitle: draftDetail.lessonTitle,
          type: isLessonQuiz ? 'LESSON_QUIZ' : 'CHAPTER_EXAM',
          isNew: false, // Bản nháp đã tồn tại, không mở modal cấu hình
          readOnly: false, // Cho phép tiếp tục chỉnh sửa
          from: 'draft-management' // Xác định trang cần quay lại
        }
      });
    } catch (error) {
      console.error('Lỗi mở bản nháp:', error);
      toast.error(getErrorMessage(error));
    } finally {
      setProcessingId(null);
      actionLock.current = false;
    }
  };

  // ==================================================
  // 7. XÓA BẢN NHÁP
  // ==================================================

  const handleDeleteDraft = async () => {
    if (!selectedDraft || !instructorId || isBusy || actionLock.current) return;

    actionLock.current = true;
    setDeleting(true);

    try {
      // Bước 1: Lấy ID bản nháp cần xóa
      const quizId = selectedDraft.quizId;

      // Bước 2: Gọi API xóa bản nháp trong Database
      const response = await deleteDraft(instructorId, quizId);

      // Bước 3: Chỉ cập nhật giao diện sau khi Backend xóa thành công
      setDrafts((prev) => prev.filter((draft) => draft.quizId !== quizId));

      // Bước 4: Đóng modal xác nhận
      setActiveModal(null);
      setSelectedDraft(null);

      // Bước 5: Hiển thị thông báo thành công
      toast.success(response.message || 'Xóa bản nháp thành công');

      // Bước 6: Tải lại danh sách mới nhất từ Backend
      await fetchDrafts();
    } catch (error) {
      console.error('Lỗi xóa bản nháp:', error);
      toast.error(getErrorMessage(error));
    } finally {
      setDeleting(false);
      actionLock.current = false;
    }
  };

  // ==================================================
  // 8. GIAO DIỆN QUẢN LÝ BẢN NHÁP
  // ==================================================
  return (
    <div className="w-full min-h-screen bg-[#f8f9ff] pb-8 text-slate-800">
      <div className="flex flex-col gap-6">

        {/* ==================== TIÊU ĐỀ TRANG ==================== */}
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-4">
            <h1 className="text-[28px] font-bold tracking-tight text-slate-800">Quản lý bản nháp</h1>

            {/* Tổng số bản nháp */}
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#e5eeff] text-[#00288e] text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-[#0051d5]" />
              Tổng số: {loading || error ? '...' : totalDrafts} bài trắc nghiệm bản nháp
            </span>
          </div>
          <p className="text-sm text-slate-500">Quản lý tập trung các bài trắc nghiệm chưa xuất bản.</p>
        </div>

        {/* ==================== TÌM KIẾM VÀ BỘ LỌC ==================== */}
        <div className="bg-white p-4 rounded-xl shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">

          {/* Ô tìm kiếm */}
          <div className="relative flex-1 max-w-md">
            <Search size={20} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Tìm kiếm bản nháp theo tên bài trắc nghiệm..."
              className="w-full pl-10 pr-10 py-2.5 rounded-lg bg-[#eff4ff] text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-blue-200 transition-all"
            />

            {/* Nút xóa từ khóa */}
            {keyword && (
              <button onClick={handleClearSearch} title="Xóa tìm kiếm"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700">
                <X size={18} />
              </button>
            )}
          </div>

          {/* Các tab lọc loại trắc nghiệm */}
          <div className="flex items-center gap-1.5 p-1 bg-[#eff4ff] rounded-lg self-start lg:self-auto overflow-x-auto max-w-full">
            {filterTabs.map((tab) => (
              <button key={tab.value} onClick={() => setActiveFilter(tab.value)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-md text-xs whitespace-nowrap transition-all ${
                  activeFilter === tab.value ? 'bg-white text-[#00288e] shadow-sm font-semibold' : 'text-slate-600 font-medium hover:text-[#00288e]'
                }`}>
                {tab.label}

                {/* Số lượng tương ứng với từng tab */}
                <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                  activeFilter === tab.value ? 'bg-[#dce9ff] text-[#00288e]' : 'bg-[#e5eeff] text-slate-600'
                }`}>
                  {loading || error ? '...' : tab.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* ==================== DANH SÁCH BẢN NHÁP ==================== */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">

          {/* Trạng thái đang tải dữ liệu */}
          {loading ? (
            <div className="flex flex-col items-center justify-center p-12 text-center">
              <Loader2 size={35} className="animate-spin text-[#00288e] mb-4" />
              <p className="text-sm text-slate-500">Đang tải danh sách bản nháp...</p>
            </div>

          /* Trạng thái lỗi khi tải dữ liệu */
          ) : error ? (
            <div className="flex flex-col items-center justify-center p-12 text-center">
              <Info size={35} className="text-red-500 mb-4" />
              <h3 className="text-lg font-semibold text-slate-800">Không thể tải danh sách bản nháp</h3>
              <p className="text-sm text-red-500 mt-2 mb-5">{error}</p>
              <button onClick={fetchDrafts} disabled={isBusy} className={primaryButton}>
                <RotateCcw size={17} /> Thử lại
              </button>
            </div>

          /* Hiển thị danh sách bản nháp */
          ) : filteredDrafts.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1000px] text-left border-collapse">

                  {/* Tiêu đề bảng */}
                  <thead>
                    <tr className="bg-[#eff4ff] text-xs uppercase tracking-wide text-slate-600">
                      <th className="py-4 px-4 w-14 text-center font-semibold">ID</th>
                      <th className="py-4 px-4 min-w-[200px] font-semibold">Tên bài trắc nghiệm</th>
                      <th className="py-4 px-4 min-w-[160px] font-semibold">Loại trắc nghiệm</th>
                      <th className="py-4 px-4 min-w-[160px] font-semibold">Khóa học</th>
                      <th className="py-4 px-4 min-w-[140px] font-semibold">Chương / Bài học</th>
                      <th className="py-4 px-4 min-w-[100px] text-center font-semibold">Số câu hỏi</th>
                      <th className="py-4 px-4 min-w-[120px] text-right font-semibold">Thao tác</th>
                    </tr>
                  </thead>

                  {/* Nội dung bảng */}
                  <tbody className="divide-y divide-blue-50">
                    {filteredDrafts.map((draft) => (
                      <tr key={draft.quizId} className="group hover:bg-[#eff4ff]/60 transition-colors">

                        {/* ID bài trắc nghiệm */}
                        <td className="py-4 px-4 text-center text-xs text-slate-500 font-semibold">
                          {formatId(draft.quizId)}
                        </td>

                        {/* Tên bài trắc nghiệm */}
                        <td className="py-4 px-4">
                          <span className="text-sm font-semibold leading-relaxed group-hover:text-[#00288e] transition-colors">
                            {draft.title}
                          </span>
                        </td>

                        {/* Loại trắc nghiệm */}
                        <td className="py-4 px-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap ${
                            draft.lessonId != null ? 'bg-[#dce9ff] text-[#00288e]' : 'bg-[#d8e2ff] text-[#001a42]'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${
                              draft.lessonId != null ? 'bg-[#00288e]' : 'bg-[#003272]'
                            }`} />
                            {getQuizType(draft)}
                          </span>
                        </td>

                        {/* Tên khóa học */}
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-[#0051d5] shrink-0" />
                            <span className="text-sm font-medium">{draft.courseName}</span>
                          </div>
                        </td>

                        {/* Vị trí chương và bài học */}
                        <td className="py-4 px-4">
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-[#eff4ff] text-slate-600 text-xs whitespace-nowrap">
                            <Bookmark size={14} />
                            {getQuizLocation(draft)}
                          </span>
                        </td>

                        {/* Số lượng câu hỏi */}
                        <td className="py-4 px-4 text-center">
                          <span className="inline-block px-2.5 py-1 rounded-md bg-[#e5eeff] text-xs font-semibold whitespace-nowrap">
                            {draft.questionCount} câu
                          </span>
                        </td>

                        {/* Các nút thao tác */}
                        <td className="py-4 px-4 text-right">
                          <div className="inline-flex items-center justify-end gap-1.5">

                            {/* Xem chi tiết */}
                            <button onClick={() => handleViewDetail(draft)} disabled={isBusy}
                              title="Xem chi tiết" aria-label="Xem chi tiết"
                              className="p-1.5 rounded-lg text-slate-500 hover:text-[#00288e] hover:bg-[#e5eeff] transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                              <Eye size={18} />
                            </button>

                            {/* Tiếp tục chỉnh sửa */}
                            <button onClick={() => handleEditDraft(draft)} disabled={isBusy}
                              title="Tiếp tục chỉnh sửa" aria-label="Tiếp tục chỉnh sửa"
                              className="p-1.5 rounded-lg text-[#00288e] hover:bg-[#dce9ff] transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                              <Pencil size={18} />
                            </button>

                            {/* Xóa bản nháp */}
                            <button onClick={() => handleOpenDelete(draft)} disabled={isBusy}
                              title="Xóa bản nháp" aria-label="Xóa bản nháp"
                              className="p-1.5 rounded-lg text-[#ba1a1a] hover:bg-[#ffdad6] transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                              <Trash2 size={18} />
                            </button>

                            {/* Hiển thị biểu tượng loading khi đang xử lý bản nháp */}
                            {processingId === draft.quizId && (
                              <Loader2 size={17} className="animate-spin text-[#00288e]" />
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Thông tin số lượng bản ghi */}
              <div className="p-4 bg-white border-t border-blue-50 flex items-center justify-between">
                <p className="text-xs text-slate-500">
                  Hiển thị{' '}
                  <span className="font-semibold text-slate-800">1 - {filteredDrafts.length}</span>
                  {' '}trong số{' '}
                  <span className="font-semibold text-slate-800">{totalDrafts}</span>
                  {' '}bài trắc nghiệm bản nháp
                </p>
              </div>
            </>
          ) : (

            /* ==================== DANH SÁCH RỖNG ==================== */
            <div className="flex flex-col items-center justify-center p-12 text-center">
              <div className="w-20 h-20 rounded-full bg-[#eff4ff] text-[#00288e] flex items-center justify-center mb-4">
                <FileText size={38} />
              </div>
              <h3 className="text-lg font-semibold text-slate-800">Không tìm thấy bài trắc nghiệm bản nháp</h3>
              <p className="text-sm text-slate-500 max-w-md mt-2 mb-5 leading-relaxed">
                Bạn hiện chưa có bài trắc nghiệm nào trong danh sách này hoặc kết quả tìm kiếm không phù hợp với tiêu chí lọc.
              </p>
              <button onClick={handleResetFilters}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#dce9ff] text-[#00288e] text-sm font-semibold hover:bg-[#00288e] hover:text-white transition-colors">
                <RotateCcw size={17} /> Đặt lại bộ lọc
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ==================== MODAL XEM CHI TIẾT ==================== */}
      {activeModal === 'detail' && selectedDraft && (
        <Modal
          title="Xem thông tin bản nháp"
          subtitle="Chi tiết dữ liệu cấu hình trước khi phát hành"
          icon={<Eye size={25} className="text-[#00288e] shrink-0" />}
          onClose={handleCloseModal}
          wide
          footer={
            <>
              <button onClick={handleCloseModal} disabled={isBusy} className={secondaryButton}>Đóng</button>
              <button onClick={() => handleEditDraft(selectedDraft)} disabled={isBusy} className={primaryButton}>
                {processingId !== null ? <Loader2 size={17} className="animate-spin" /> : <Pencil size={17} />}
                {processingId !== null ? 'Đang tải...' : 'Tiếp tục chỉnh sửa'}
              </button>
            </>
          }
        >
          <div className="flex flex-col gap-5">

            {/* Thông tin chung của bài trắc nghiệm */}
            <div className="p-4 bg-[#eff4ff] rounded-xl flex flex-col gap-3">
              <div>
                <span className="inline-block px-2.5 py-1 rounded-full bg-[#dce9ff] text-[#00288e] text-[11px] font-bold">
                  {getQuizType(selectedDraft)}
                </span>
              </div>

              {/* Tên bài trắc nghiệm */}
              <h4 className="text-lg font-bold text-slate-800">{selectedDraft.title}</h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                {/* Khóa học áp dụng */}
                <div>
                  <p className="text-xs text-slate-500 mb-1">Khóa học áp dụng:</p>
                  <p className="text-sm font-medium">{selectedDraft.courseName}</p>
                </div>

                {/* Vị trí chương và bài học */}
                <div>
                  <p className="text-xs text-slate-500 mb-1">Vị trí bài học:</p>
                  <p className="text-sm font-medium">{getQuizLocation(selectedDraft)}</p>
                </div>
              </div>
            </div>

            {/* Cấu hình làm bài */}
            <div className="flex flex-col gap-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h4 className="text-sm font-semibold">Cấu hình làm bài</h4>
                <span className="text-[11px] font-medium text-[#0051d5]">Bản nháp chưa cấp quyền làm</span>
              </div>

              <div className={`grid gap-3 ${selectedDraft.lessonId == null ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-2'}`}>

                {/* Tổng số câu hỏi */}
                <div className="p-3 rounded-lg bg-[#eff4ff] text-center">
                  <p className="text-[11px] text-slate-500 mb-1">Tổng số câu</p>
                  <p className="text-lg font-bold text-[#00288e]">{selectedDraft.questionCount}</p>
                </div>

                {/* Chỉ hiện cấu hình đối với bài kiểm tra cuối chương */}
                {selectedDraft.lessonId == null && (
                  <>
                    {/* Thời gian làm bài */}
                    <div className="p-3 rounded-lg bg-[#eff4ff] text-center">
                      <p className="text-[11px] text-slate-500 mb-1">Thời gian làm</p>
                      <p className="text-lg font-bold">
                        {selectedDraft.timeLimit != null ? `${selectedDraft.timeLimit} phút` : 'Chưa cấu hình'}
                      </p>
                    </div>

                    {/* Điểm đạt yêu cầu */}
                    <div className="p-3 rounded-lg bg-[#eff4ff] text-center">
                      <p className="text-[11px] text-slate-500 mb-1">Điểm đạt yêu cầu</p>
                      <p className="text-lg font-bold">
                        {selectedDraft.passingScore != null ? Number(selectedDraft.passingScore).toFixed(1) : 'Chưa cấu hình'}
                      </p>
                    </div>
                  </>
                )}

                {/* Điểm tối đa */}
                <div className="p-3 rounded-lg bg-[#eff4ff] text-center">
                  <p className="text-[11px] text-slate-500 mb-1">Điểm tối đa</p>
                  <p className="text-lg font-bold">10.0</p>
                </div>
              </div>
            </div>

            {/* Ghi chú trạng thái bản nháp */}
            <div className="p-3 rounded-lg bg-[#eff4ff] flex items-start gap-2.5">
              <Info size={20} className="text-[#0051d5] shrink-0 mt-0.5" />
              <p className="text-xs text-slate-600 leading-relaxed">
                Bản nháp này đang ở chế độ riêng tư của giảng viên. Bạn có thể nhấn "Tiếp tục chỉnh sửa" để hoàn thiện ngân hàng câu hỏi trước khi xuất bản.
              </p>
            </div>
          </div>
        </Modal>
      )}

      {/* ==================== MODAL XÁC NHẬN XÓA ==================== */}
      {activeModal === 'delete' && selectedDraft && (
        <Modal
          title="Xác nhận xóa bản nháp"
          subtitle="Hành động này không thể hoàn tác"
          icon={
            <div className="w-12 h-12 rounded-xl bg-[#ffdad6] flex items-center justify-center text-[#ba1a1a] shrink-0">
              <Trash2 size={25} />
            </div>
          }
          onClose={handleCloseModal}
          footer={
            <>
              <button onClick={handleCloseModal} disabled={deleting} className={secondaryButton}>Hủy</button>
              <button onClick={handleDeleteDraft} disabled={isBusy}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#ba1a1a] hover:bg-red-800 text-white text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                {deleting ? <Loader2 size={17} className="animate-spin" /> : <Trash2 size={17} />}
                {deleting ? 'Đang xóa...' : 'Xác nhận xóa'}
              </button>
            </>
          }
        >
          <div className="flex flex-col gap-4">

            {/* Thông tin bản nháp cần xóa */}
            <div className="p-3 rounded-lg bg-[#eff4ff]">
              <p className="text-sm font-semibold text-slate-800">{selectedDraft.title}</p>
              <p className="text-xs text-[#ba1a1a] mt-1">Trạng thái: Chưa xuất bản (Bản nháp)</p>
            </div>

            {/* Nội dung xác nhận */}
            <p className="text-sm text-slate-600 leading-relaxed">
              Bạn có chắc chắn muốn xóa toàn bộ bài trắc nghiệm bản nháp này không? Tất cả câu hỏi và phương án trả lời liên quan cũng sẽ bị xóa vĩnh viễn.
            </p>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default DraftManagement;