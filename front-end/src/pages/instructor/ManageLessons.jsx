import React, { useCallback, useEffect, useState, useRef } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { getLessonsByChapterId, createLesson, updateLesson, moveLesson } from '../../services/lessonService';
import { getInstructorId, getChapterQuiz, publishQuiz } from '../../services/instructorQuizService';
import { deleteDraft } from '../../services/instructorDraftService';

// Dữ liệu mặc định của form bài học
const EMPTY_FORM = { title: '', status: 'Active' };

// Số lượng câu hỏi tối thiểu để xuất bản
const MIN_QUESTIONS = 3;

// Lấy thông báo lỗi từ Backend
const getErrorMessage = (error) => {
  return error.response?.data?.message || error.message || 'Đã xảy ra lỗi. Vui lòng thử lại.';
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

  // State quản lý bài kiểm tra cuối chương
  const [instructorId, setInstructorId] = useState(null);
  const [quiz, setQuiz] = useState(null);
  const [quizLoading, setQuizLoading] = useState(true);
  const [quizSaving, setQuizSaving] = useState(false);
  const [quizError, setQuizError] = useState('');

  // Ngăn gửi nhiều yêu cầu cùng lúc
  const quizActionLock = useRef(false);
  const quizRequestVersion = useRef(0);

  // Xác định chương học đã có bài kiểm tra hay chưa
  const quizCreated = quiz !== null;
  const questionCount = Number(quiz?.questionCount ?? quiz?.questions?.length ?? 0);
  const isQuizBusy = quizLoading || quizSaving;

  // Modal quản lý trắc nghiệm
  const [showQuizMethodModal, setShowQuizMethodModal] = useState(false);
  const [showManualQuizModal, setShowManualQuizModal] = useState(false);
  const [showAIQuizModal, setShowAIQuizModal] = useState(false);
  const [showPublishQuizModal, setShowPublishQuizModal] = useState(false);
  const [showDeleteQuizModal, setShowDeleteQuizModal] = useState(false);

  // Dữ liệu tạo bài kiểm tra cuối chương
  const [quizForm, setQuizForm] = useState({
    title: '',
    questionCount: 4,
    difficulty: 'BASIC'
  });

  // Tài liệu PDF dùng để tạo câu hỏi bằng AI
  const [quizPdfFile, setQuizPdfFile] = useState(null);

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

  // GET: Lấy bài kiểm tra cuối chương từ Backend
  const fetchChapterQuiz = useCallback(async () => {
    const requestVersion = ++quizRequestVersion.current;

    try {
      setQuizLoading(true);
      setQuizError('');

      // Lấy ID tài khoản đang đăng nhập để truyền vào URL
      const userId = await getInstructorId();

      // Lấy bài kiểm tra cuối chương
      const response = await getChapterQuiz(userId, chapterId);

      // Bỏ qua dữ liệu nếu đã chuyển sang chương khác
      if (requestVersion !== quizRequestVersion.current) return;

      setInstructorId(userId);
      setQuiz(response.result ?? null);
    } catch (err) {
      if (requestVersion !== quizRequestVersion.current) return;

      console.error('Lỗi lấy bài kiểm tra cuối chương:', err);
      const message = getErrorMessage(err);

      setQuiz(null);
      setQuizError(message);
      toast.error(message);
    } finally {
      if (requestVersion === quizRequestVersion.current) {
        setQuizLoading(false);
      }
    }
  }, [chapterId]);

  // Tải danh sách khi vào trang hoặc thay đổi chương
  useEffect(() => {
    fetchLessons();
  }, [fetchLessons]);

  // Tải bài kiểm tra khi vào trang hoặc quay về từ QuizEditor
  useEffect(() => {
    setQuiz(null);
    fetchChapterQuiz();

    return () => {
      quizRequestVersion.current++;
    };
  }, [fetchChapterQuiz, location.key]);

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
          courseId, chapterId, editingLesson.lessonId, payload
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
        courseId, chapterId, lessonId, direction
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

  // Mở Modal chọn phương thức tạo bài kiểm tra
  const handleOpenQuizMethod = () => {
    if (isQuizBusy || quizError || !instructorId || quizCreated) return;
    setShowQuizMethodModal(true);
  };

  // Chọn phương thức tạo bài kiểm tra cuối chương
  const handleChooseQuizMethod = (method) => {
    if (quizCreated || isQuizBusy || quizError) return;

    setShowQuizMethodModal(false);
    setQuizForm({
      title: `Kiểm tra cuối chương: ${chapterTitle || lessons[0]?.chapterTitle || `Chương ${chapterId}`}`,
      questionCount: 4,
      difficulty: 'BASIC'
    });

    setQuizPdfFile(null);

    if (method === 'MANUAL') {
      setShowManualQuizModal(true);
    } else if (method === 'AI') {
      setShowAIQuizModal(true);
    }
  };

  // Điều hướng đến trang biên soạn trắc nghiệm
  const navigateToQuizEditor = (
    quizData,
    isNew = false,
    readOnly = false,
    method = 'MANUAL',
    aiData = null
  ) => {
    navigate(
      `/instructor/courses/${courseId}/chapters/${chapterId}/quiz`,
      {
        state: {
          instructorId,
          courseTitle,
          chapterTitle: chapterTitle || lessons[0]?.chapterTitle,
          type: 'CHAPTER_EXAM',
          isNew,
          readOnly,
          method,
          aiData,
          showConfigModal: isNew,
          quiz: {
            ...quizData,
            courseId: Number(courseId),
            chapterId: Number(chapterId),
            lessonId: null
          }
        }
      }
    );
  };

  // Tạo bài kiểm tra cuối chương thủ công
  const handleCreateManualQuiz = (event) => {
    event.preventDefault();

    if (isQuizBusy || quizError || !instructorId) return;

    const title = quizForm.title.trim();

    if (!title) {
      toast.error('Vui lòng nhập tên bài kiểm tra.');
      return;
    }

    if (title.length > 255) {
      toast.error('Tên bài kiểm tra không được vượt quá 255 ký tự.');
      return;
    }

    if (quizCreated) {
      toast.error('Chương học đã có bài kiểm tra.');
      return;
    }

    setShowManualQuizModal(false);

    // Chuyển sang QuizEditor và mở Modal cấu hình
    // Chỉ tạo bản nháp trong database sau khi lưu cấu hình
    navigateToQuizEditor({
      title,
      status: 'Draft',
      timeLimit: 15,
      passingScore: 5.0,
      questions: []
    }, true, false, 'MANUAL');
  };

  // Chọn tài liệu PDF dùng để tạo trắc nghiệm bằng AI
  const handleSelectQuizPdf = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!/\.pdf$/i.test(file.name)) {
      toast.error('Vui lòng chọn tài liệu định dạng PDF.');
      event.target.value = '';
      setQuizPdfFile(null);
      return;
    }

    if (file.size === 0) {
      toast.error('Tài liệu PDF không được để trống.');
      event.target.value = '';
      setQuizPdfFile(null);
      return;
    }

    setQuizPdfFile(file);
  };

  // Định dạng dung lượng tài liệu PDF
  const formatFileSize = (size) => {
    if (size < 1024) {
      return `${size} B`;
    }

    if (size < 1024 * 1024) {
      return `${(size / 1024).toFixed(1)} KB`;
    }

    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Đóng Modal tạo trắc nghiệm bằng AI
  const handleCloseAIQuizModal = () => {
    setShowAIQuizModal(false);
    setQuizPdfFile(null);
  };

  // Tạo bài kiểm tra cuối chương bằng AI
  const handleCreateAIQuiz = (event) => {
    event.preventDefault();

    if (isQuizBusy || quizError || !instructorId) return;

    const title = quizForm.title.trim();

    if (!title) {
      toast.error('Vui lòng nhập tên bài kiểm tra.');
      return;
    }

    if (title.length > 255) {
      toast.error('Tên bài kiểm tra không được vượt quá 255 ký tự.');
      return;
    }

    if (!quizPdfFile) {
      toast.error('Vui lòng tải lên tài liệu PDF chương học.');
      return;
    }

    if (quizCreated) {
      toast.error('Chương học đã có bài kiểm tra.');
      return;
    }

    if (![4, 5, 10, 15, 20].includes(Number(quizForm.questionCount))) {
      toast.error('Số lượng câu hỏi không hợp lệ.');
      return;
    }

    if (!['BASIC', 'INTERMEDIATE', 'ADVANCED'].includes(quizForm.difficulty)) {
      toast.error('Độ khó mục tiêu không hợp lệ.');
      return;
    }

    setShowAIQuizModal(false);

    // Chuyển sang QuizEditor và mở Modal cấu hình
    // API AI sẽ được tích hợp tại QuizEditor sau khi lưu cấu hình
    navigateToQuizEditor({
      title,
      status: 'Draft',
      timeLimit: 15,
      passingScore: 5.0,
      questions: []
    }, true, false, 'AI', {
      file: quizPdfFile,
      questionCount: quizForm.questionCount,
      difficulty: quizForm.difficulty
    });
  };

  // Xem bài kiểm tra cuối chương
  const handleViewQuiz = () => {
    if (!quiz || isQuizBusy || quizError) return;

    navigateToQuizEditor(quiz, false, true);
  };

  // Tiếp tục chỉnh sửa bài kiểm tra bản nháp
  const handleEditQuiz = () => {
    if (!quiz || quiz.status !== 'Draft' || isQuizBusy || quizError) return;

    navigateToQuizEditor(quiz, false, false);
  };

  // PATCH: Xuất bản bài kiểm tra cuối chương
  const handlePublishQuiz = async () => {
    if (!quiz || quiz.status !== 'Draft' || !instructorId ||
      isQuizBusy || quizError || quizActionLock.current) return;

    // Kiểm tra số lượng câu hỏi tối thiểu
    if (questionCount < MIN_QUESTIONS) {
      toast.error(`Bài kiểm tra phải có ít nhất ${MIN_QUESTIONS} câu hỏi để xuất bản.`);
      return;
    }

    quizActionLock.current = true;

    try {
      setQuizSaving(true);

      // Gọi API xuất bản bài kiểm tra
      const response = await publishQuiz(instructorId, quiz.quizId);

      // Đóng Modal sau khi xuất bản thành công
      setShowPublishQuizModal(false);

      toast.success(response.message || 'Xuất bản bài kiểm tra thành công.');

      // Tải lại trạng thái bài kiểm tra từ database
      await fetchChapterQuiz();
    } catch (err) {
      console.error('Lỗi xuất bản bài kiểm tra:', err);
      toast.error(getErrorMessage(err));
    } finally {
      setQuizSaving(false);
      quizActionLock.current = false;
    }
  };

  // DELETE: Xóa bài kiểm tra bản nháp
  const handleDeleteQuiz = async () => {
    if (!quiz || quiz.status !== 'Draft' || !instructorId ||
      isQuizBusy || quizError || quizActionLock.current) return;

    quizActionLock.current = true;

    try {
      setQuizSaving(true);

      // Gọi API xóa bản nháp và dữ liệu liên quan
      const response = await deleteDraft(instructorId, quiz.quizId);

      // Đóng Modal và cập nhật giao diện
      setQuiz(null);
      setShowDeleteQuizModal(false);
      setQuizPdfFile(null);

      toast.success(response.message || 'Xóa bản nháp bài kiểm tra thành công.');

      // Tải lại dữ liệu từ Backend
      await fetchChapterQuiz();
    } catch (err) {
      console.error('Lỗi xóa bản nháp bài kiểm tra:', err);
      toast.error(getErrorMessage(err));
    } finally {
      setQuizSaving(false);
      quizActionLock.current = false;
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
            <Link to="/instructor/courses" className="hover:text-blue-600 transition-colors">
              Khóa học
            </Link>

            <span className="material-symbols-outlined text-[14px] text-gray-400">
              chevron_right
            </span>

            <Link to={`/instructor/courses/${courseId}`} className="hover:text-blue-600 transition-colors">
              Chi tiết khóa học
            </Link>

            <span className="material-symbols-outlined text-[14px] text-gray-400">
              chevron_right
            </span>

            <Link to={`/instructor/courses/${courseId}/chapters`} className="hover:text-blue-600 transition-colors">
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
              {lessons.length} bài học • {quizLoading || quizError ? '—' : quizCreated ? 1 : 0} bài kiểm tra
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
                    <td colSpan={5} className="py-12 text-center text-gray-500">
                      Đang tải danh sách bài học...
                    </td>
                  </tr>
                ) : (
                  <>
                    {/* Danh sách trống */}
                    {lessons.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-12 text-center text-gray-500">
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
                          {index + 1}
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
                              state={{
                                courseTitle,
                                chapterTitle,
                                lessonTitle: lesson.title
                              }}
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

                      {/* Hiển thị trạng thái bài kiểm tra từ Backend */}
                      <td className="py-4 px-6 whitespace-nowrap">
                        {quizLoading ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-100 text-gray-600 text-xs font-medium">
                            <span className="w-2 h-2 rounded-full bg-gray-400" />
                            Đang tải...
                          </span>
                        ) : quizError ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 text-xs font-medium" title={quizError}>
                            <span className="w-2 h-2 rounded-full bg-rose-500" />
                            Lỗi tải dữ liệu
                          </span>
                        ) : !quizCreated ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-100 text-gray-600 text-xs font-medium">
                            <span className="w-2 h-2 rounded-full bg-gray-400" />
                            Chưa tạo
                          </span>
                        ) : quiz.status === 'Draft' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-medium">
                            <span className="w-2 h-2 rounded-full bg-amber-500" />
                            Bản nháp
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium">
                            <span className="w-2 h-2 rounded-full bg-emerald-500" />
                            Đã xuất bản
                          </span>
                        )}
                      </td>

                      <td className="py-4 px-6 text-right whitespace-nowrap">
                        {quizLoading ? (
                          <span className="text-xs text-gray-500">
                            Đang tải dữ liệu...
                          </span>
                        ) : quizError ? (
                          <button
                            type="button"
                            onClick={fetchChapterQuiz}
                            disabled={isQuizBusy}
                            className="px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 text-xs font-medium"
                          >
                            Thử lại
                          </button>
                        ) : !quizCreated ? (
                          <button
                            type="button"
                            onClick={handleOpenQuizMethod}
                            disabled={isQuizBusy || !instructorId}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium"
                          >
                            <span className="material-symbols-outlined text-[16px]">
                              add_circle
                            </span>
                            Tạo trắc nghiệm
                          </button>
                        ) : (
                          <div className="inline-flex items-center gap-2">
                            {/* Xem bài kiểm tra ở cả Draft và Published */}
                            <button
                              type="button"
                              onClick={handleViewQuiz}
                              disabled={isQuizBusy}
                              className="px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium"
                            >
                              Xem
                            </button>

                            {/* Các thao tác chỉ dành cho bản nháp */}
                            {quiz.status === 'Draft' && (
                              <>
                                <button
                                  type="button"
                                  onClick={handleEditQuiz}
                                  disabled={isQuizBusy}
                                  className="px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 text-xs font-medium"
                                >
                                  Tiếp tục chỉnh sửa
                                </button>

                                <button
                                  type="button"
                                  disabled={isQuizBusy}
                                  onClick={() => setShowPublishQuizModal(true)}
                                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium"
                                >
                                  Xuất bản
                                </button>

                                <button
                                  type="button"
                                  disabled={isQuizBusy}
                                  onClick={() => setShowDeleteQuizModal(true)}
                                  className="px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 text-xs font-medium"
                                >
                                  Xóa bản nháp
                                </button>
                              </>
                            )}
                          </div>
                        )}
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

                <h3 id="lesson-modal-title" className="text-base font-semibold text-gray-900">
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

            {/* Backend sẽ kiểm tra và trả message cho Toast */}
            <form className="p-6 flex flex-col gap-4" onSubmit={handleSubmit} noValidate>

              {/* Tên bài học */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="lesson-title" className="text-xs font-semibold text-gray-700">
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
                  formData.title.length > 255 ? 'text-red-500' : 'text-gray-400'
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
              {editingLesson?.status === 'Active' && formData.status === 'Inactive' && (
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

      {/* ================= MODAL CHỌN PHƯƠNG THỨC TẠO TRẮC NGHIỆM ================= */}
      {showQuizMethodModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-xl bg-white rounded-xl shadow-xl overflow-hidden border border-gray-200">
            <div className="px-6 py-4 bg-gray-50 flex items-center justify-between border-b border-gray-200">
              <h3 className="text-base font-bold text-gray-900">
                Chọn phương thức tạo trắc nghiệm
              </h3>

              <button
                type="button"
                onClick={() => setShowQuizMethodModal(false)}
                className="text-gray-400 hover:text-gray-700"
              >
                <span className="material-symbols-outlined">
                  close
                </span>
              </button>
            </div>

            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">

              {/* Tạo trắc nghiệm thủ công */}
              <button
                type="button"
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

              {/* Tạo trắc nghiệm bằng AI */}
              <button
                type="button"
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
                type="button"
                onClick={() => setShowQuizMethodModal(false)}
                className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold"
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL TẠO TRẮC NGHIỆM THỦ CÔNG ================= */}
      {showManualQuizModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Tạo bộ trắc nghiệm thủ công"
            className="w-full max-w-lg bg-white rounded-xl shadow-xl overflow-hidden border border-gray-200"
          >
            <div className="px-6 py-4 bg-[#eff4ff] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#00288e] text-[22px]">
                  edit_document
                </span>

                <h3 className="text-base font-bold text-gray-900">
                  Tạo bộ trắc nghiệm thủ công
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setShowManualQuizModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <span className="material-symbols-outlined text-[20px]">
                  close
                </span>
              </button>
            </div>

            <form onSubmit={handleCreateManualQuiz} noValidate>
              <div className="p-6">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-700">
                    Tên bài trắc nghiệm
                    <span className="text-red-500"> *</span>
                  </label>

                  <input
                    type="text"
                    value={quizForm.title}
                    placeholder="Nhập tên bài kiểm tra cuối chương"
                    onChange={(event) =>
                      setQuizForm({
                        ...quizForm,
                        title: event.target.value
                      })
                    }
                    className="w-full h-10 px-3 rounded-lg bg-[#eff4ff] border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>

              <div className="px-6 py-4 bg-[#eff4ff] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowManualQuizModal(false)}
                  className="px-4 py-2 rounded-lg bg-[#e5eeff] hover:bg-blue-100 text-gray-700 text-sm font-semibold"
                >
                  Hủy
                </button>

                <button
                  type="submit"
                  disabled={isQuizBusy}
                  className="px-5 py-2 rounded-lg bg-[#1e40af] hover:bg-[#00288e] text-white text-sm font-semibold inline-flex items-center gap-2"
                >
                  Tiếp tục
                  <span className="material-symbols-outlined text-[18px]">
                    arrow_forward
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL TẠO TRẮC NGHIỆM BẰNG AI ================= */}
      {showAIQuizModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Tạo trắc nghiệm bằng AI"
            className="w-full max-w-xl bg-white rounded-xl shadow-xl overflow-hidden border border-gray-200 max-h-[90vh] flex flex-col"
          >
            <div className="px-6 py-4 bg-[#eff4ff] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-blue-600 text-[22px]">
                  auto_awesome
                </span>

                <h3 className="text-base font-bold text-gray-900">
                  Tạo trắc nghiệm bằng AI
                </h3>
              </div>

              <button
                type="button"
                onClick={handleCloseAIQuizModal}
                className="text-gray-500 hover:text-gray-700"
              >
                <span className="material-symbols-outlined text-[20px]">
                  close
                </span>
              </button>
            </div>

            <form onSubmit={handleCreateAIQuiz} className="flex flex-col min-h-0" noValidate>
              <div className="p-6 flex flex-col gap-4 overflow-y-auto">

                {/* Tên bài trắc nghiệm */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-700">
                    Tên bài trắc nghiệm
                    <span className="text-red-500"> *</span>
                  </label>

                  <input
                    type="text"
                    value={quizForm.title}
                    placeholder="Nhập tên bài kiểm tra cuối chương"
                    onChange={(event) =>
                      setQuizForm({
                        ...quizForm,
                        title: event.target.value
                      })
                    }
                    className="w-full h-10 px-3 rounded-lg bg-[#eff4ff] border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                {/* Tải lên tài liệu PDF */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-700">
                    Tải lên tài liệu PDF chương học
                    <span className="text-red-500"> *</span>
                  </label>

                  <label className="flex flex-col items-center justify-center gap-2 min-h-[140px] p-5 rounded-xl bg-[#eff4ff] border border-dashed border-gray-300 hover:border-blue-500 cursor-pointer transition-colors">
                    <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                      <span className="material-symbols-outlined text-blue-600 text-[24px]">
                        upload_file
                      </span>
                    </div>

                    <div className="text-center">
                      <p className="text-sm font-semibold text-gray-800 break-all">
                        {quizPdfFile
                          ? quizPdfFile.name
                          : 'Nhấn để tải lên tài liệu PDF'}
                      </p>

                      <p className="text-xs text-gray-500 mt-1">
                        {quizPdfFile
                          ? `Dung lượng: ${formatFileSize(quizPdfFile.size)} • Sẵn sàng phân tích AI`
                          : 'Chỉ hỗ trợ tài liệu định dạng PDF'}
                      </p>
                    </div>

                    <input
                      type="file"
                      accept=".pdf,application/pdf"
                      onChange={handleSelectQuizPdf}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* Số lượng câu hỏi và độ khó mục tiêu */}
                <div className="grid grid-cols-2 gap-4">

                  {/* Số lượng câu hỏi */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-gray-700">
                      Số lượng câu hỏi
                    </label>

                    <select
                      value={quizForm.questionCount}
                      onChange={(event) =>
                        setQuizForm({
                          ...quizForm,
                          questionCount: Number(event.target.value)
                        })
                      }
                      className="w-full h-10 px-3 rounded-lg bg-[#eff4ff] border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                    >
                      <option value={4}>4 câu hỏi</option>
                      <option value={5}>5 câu hỏi</option>
                      <option value={10}>10 câu hỏi</option>
                      <option value={15}>15 câu hỏi</option>
                      <option value={20}>20 câu hỏi</option>
                    </select>
                  </div>

                  {/* Độ khó mục tiêu */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-gray-700">
                      Độ khó mục tiêu
                    </label>

                    <select
                      value={quizForm.difficulty}
                      onChange={(event) =>
                        setQuizForm({
                          ...quizForm,
                          difficulty: event.target.value
                        })
                      }
                      className="w-full h-10 px-3 rounded-lg bg-[#eff4ff] border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                    >
                      <option value="BASIC">
                        Cơ bản - Thông hiểu
                      </option>
                      <option value="INTERMEDIATE">
                        Trung bình - Vận dụng
                      </option>
                      <option value="ADVANCED">
                        Nâng cao - Vận dụng cao
                      </option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Nút hủy và tạo câu hỏi bằng AI */}
              <div className="px-6 py-4 bg-[#eff4ff] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={handleCloseAIQuizModal}
                  className="px-4 py-2 rounded-lg bg-[#e5eeff] hover:bg-blue-100 text-gray-700 text-sm font-semibold"
                >
                  Hủy
                </button>

                <button
                  type="submit"
                  disabled={isQuizBusy}
                  className="px-5 py-2 rounded-lg bg-[#1e40af] hover:bg-[#00288e] text-white text-sm font-semibold inline-flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    auto_awesome
                  </span>
                  Tạo câu hỏi bằng AI
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL XÁC NHẬN XUẤT BẢN ================= */}
      {showPublishQuizModal && quiz?.status === 'Draft' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white rounded-xl shadow-xl p-6 text-center border border-gray-200">
            <div className="w-14 h-14 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-[32px]">
                rocket_launch
              </span>
            </div>

            <h3 className="text-lg font-bold text-gray-900 mb-2">
              Xuất bản bài kiểm tra cuối chương?
            </h3>

            <p className="text-sm text-gray-600 mb-4">
              Bạn có chắc chắn muốn xuất bản bài kiểm tra{' '}
              <strong>{quiz.title}</strong> không?
              Sau khi xuất bản, bài kiểm tra sẽ không thể chỉnh sửa.
            </p>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
              <button
                type="button"
                disabled={quizSaving}
                onClick={() => setShowPublishQuizModal(false)}
                className="flex-1 h-10 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold"
              >
                Hủy
              </button>

              <button
                type="button"
                disabled={quizSaving}
                onClick={handlePublishQuiz}
                className="flex-1 h-10 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold"
              >
                {quizSaving ? 'Đang xuất bản...' : 'Xác nhận xuất bản'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL XÁC NHẬN XÓA BẢN NHÁP ================= */}
      {showDeleteQuizModal && quiz?.status === 'Draft' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white rounded-xl shadow-xl p-6 text-center border border-gray-200">
            <div className="w-14 h-14 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-[32px]">
                delete
              </span>
            </div>

            <h3 className="text-lg font-bold text-gray-900 mb-2">
              Xóa bản nháp bài kiểm tra?
            </h3>

            <p className="text-sm text-gray-600 mb-4">
              Bạn có chắc chắn muốn xóa bài kiểm tra{' '}
              <strong>{quiz.title}</strong> không?
              Hành động này không thể hoàn tác.
            </p>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
              <button
                type="button"
                disabled={quizSaving}
                onClick={() => setShowDeleteQuizModal(false)}
                className="flex-1 h-10 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold"
              >
                Hủy
              </button>

              <button
                type="button"
                disabled={quizSaving}
                onClick={handleDeleteQuiz}
                className="flex-1 h-10 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-semibold"
              >
                {quizSaving ? 'Đang xóa...' : 'Xác nhận xóa'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default ManageLessons;