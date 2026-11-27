import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import {
  ArrowLeft, ArrowRight, Pencil, Trash2, Eye, Rocket,
  PlusCircle, Plus, X, CheckCircle2, Lightbulb,
  SlidersHorizontal, ClipboardList, Lock, Clock,
  AlertTriangle, Info, Bookmark, Check
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  getInstructorId, getChapterQuiz, getLessonQuiz, getQuizDetail,
  createQuiz, generateQuizWithAI, updateQuizTitle, addQuestion, updateQuestion,
  deleteQuestion, publishQuiz
} from '../../services/instructorQuizService';

// Số lượng câu hỏi tối thiểu để xuất bản
const MIN_QUESTIONS = 3;

// Lấy thông báo lỗi từ Backend
const getErrorMessage = (error) => {
  return error.response?.data?.message || error.message || 'Đã xảy ra lỗi. Vui lòng thử lại.';
};

// Khởi tạo form câu hỏi trống
const createEmptyQuestion = () => ({
  id: null,
  content: '',
  options: ['', '', '', ''],
  correctAnswer: -1,
  explanation: ''
});

// Component modal dùng chung
const Modal = ({ title, children, onClose, footer, wide = false }) => {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4" onClick={onClose}>
      <div className={`bg-white rounded-xl shadow-2xl w-full ${wide === 'question' ? 'max-w-2xl' : wide ? 'max-w-3xl' : 'max-w-xl'} max-h-[90vh] flex flex-col overflow-hidden`}
        onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label={title}>

        {/* Tiêu đề modal */}
        <div className="px-6 py-4 bg-[#eff4ff] flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-800">{title}</h2>
          <button onClick={onClose} aria-label="Đóng" className="p-1.5 rounded-lg hover:bg-blue-100 text-slate-500">
            <X size={21} />
          </button>
        </div>

        {/* Nội dung modal */}
        <div className="p-6 overflow-y-auto">{children}</div>

        {/* Footer modal */}
        {footer && (
          <div className="px-6 py-4 bg-[#eff4ff] flex items-center justify-end gap-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

// ==================================================
// COMPONENT ĐIỀU HƯỚNG BIÊN SOẠN TRẮC NGHIỆM
// ==================================================
const QuizEditor = () => {
  // Lấy các ID từ đường dẫn URL
  const { courseId, chapterId, lessonId } = useParams();
  const location = useLocation();

  // Khởi tạo lại component khi chuyển sang bài kiểm tra khác
  return (
    <QuizEditorContent
      key={`${courseId}-${chapterId}-${lessonId ?? 'chapter'}-${location.key}`}
      courseId={courseId}
      chapterId={chapterId}
      lessonId={lessonId}
    />
  );
};

// ==================================================
// COMPONENT XỬ LÝ BIÊN SOẠN BÀI KIỂM TRA
// ==================================================
const QuizEditorContent = ({ courseId, chapterId, lessonId }) => {
  const navigate = useNavigate();
  const location = useLocation();

  // Lấy thông tin bài kiểm tra từ trang trước
  const quizData = location.state?.quiz;
  const aiData = location.state?.aiData;

  // Xác định trang truy cập trước đó
  const fromDraftManagement = location.state?.from === 'draft-management';

  // Có lessonId: Trắc nghiệm bài học
  // Không có lessonId: Bài kiểm tra cuối chương
  const isChapterExam = !lessonId;

  // Xác định tạo mới hay tiếp tục chỉnh sửa
  const isNewQuiz = location.state?.isNew === true;

  // Xác định chế độ chỉ xem
  const isReadOnly = location.state?.readOnly === true;

  // Xác định phương thức tạo trắc nghiệm
  const method = location.state?.method || 'MANUAL';

  // Xác định tên loại bài kiểm tra
  const quizType = isChapterExam ? 'Bài kiểm tra cuối chương' : 'Trắc nghiệm bài học';

  // ID giảng viên dùng để truyền vào đường dẫn API
  const [instructorId, setInstructorId] = useState(null);

  // ID bộ trắc nghiệm trong Database
  const [quizId, setQuizId] = useState(null);

  // Trạng thái tải và xử lý dữ liệu
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState('');

  // Ngăn gửi nhiều yêu cầu API cùng lúc
  const actionLock = useRef(false);

  // Thông tin bài kiểm tra
  const [quizTitle, setQuizTitle] = useState(
    quizData?.title || (isChapterExam ? 'Bài kiểm tra cuối chương' : 'Trắc nghiệm bài học')
  );

  // Trạng thái bài kiểm tra
  const [status, setStatus] = useState(quizData?.status || 'Draft');

  // Thời gian làm bài, chỉ sử dụng mặc định khi tạo mới
  const [timeLimit, setTimeLimit] = useState(
    isChapterExam ? quizData?.timeLimit ?? (isNewQuiz ? 15 : null) : null
  );

  // Điểm đạt yêu cầu, chỉ sử dụng mặc định khi tạo mới
  const [passingScore, setPassingScore] = useState(
    isChapterExam ? quizData?.passingScore ?? (isNewQuiz ? 5.0 : null) : null
  );

  // Chỉ mở modal cấu hình khi tạo mới bài kiểm tra cuối chương
  const [showConfigModal, setShowConfigModal] = useState(false);

  // Form cấu hình bài kiểm tra cuối chương
  const [configForm, setConfigForm] = useState({
    timeLimit: quizData?.timeLimit ?? 15,
    passingScore: quizData?.passingScore ?? 5.0
  });

  // Danh sách câu hỏi lấy từ Backend
  const [questions, setQuestions] = useState([]);

  // Quản lý trạng thái các modal
  const [activeModal, setActiveModal] = useState(null);

  // Form thêm và sửa câu hỏi
  const [questionForm, setQuestionForm] = useState(createEmptyQuestion);

  // Câu hỏi cần xóa
  const [deleteId, setDeleteId] = useState(null);

  // Tiêu đề tạm khi chỉnh sửa
  const [tempTitle, setTempTitle] = useState('');

// Đáp án được chọn trong chế độ xem trước
const [previewAnswers, setPreviewAnswers] = useState({});

// Vị trí câu hỏi đang hiển thị
const [previewIndex, setPreviewIndex] = useState(0);

// Danh sách câu hỏi được đánh dấu xem lại
const [previewMarked, setPreviewMarked] = useState({});

// Câu hỏi hiện tại trong chế độ xem trước
const previewQuestion = questions[previewIndex];

// Tính điểm mỗi câu hỏi theo thang điểm 10
const previewPoint = questions.length > 0
  ? (10 / questions.length).toFixed(2)
  : '0.00';

  // Kiểm tra trạng thái xuất bản
  const isPublished = status === 'Published';

  // Khóa chỉnh sửa khi đã xuất bản, chỉ xem, đang tải hoặc chưa cấu hình
  const isLocked = isPublished || isReadOnly || showConfigModal ||
    loading || !!loadError || quizId == null;

  // Class CSS dùng chung
  const primaryButton = 'inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#00288e] hover:bg-[#1e40af] text-white text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed';

  const secondaryButton = 'inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#eff4ff] hover:bg-[#dce9ff] text-[#00288e] text-sm font-semibold transition-all';

  const inputClass = 'w-full px-4 py-2.5 rounded-lg bg-[#eff4ff] text-slate-800 text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all';

  // ==================================================
  // 1. LẤY VÀ ĐỒNG BỘ DỮ LIỆU TỪ BACKEND
  // ==================================================

  // Cập nhật thông tin bài kiểm tra từ dữ liệu Backend trả về
  const applyQuizData = (data) => {
    if (!data || data.quizId == null) {
      throw new Error('Dữ liệu bài kiểm tra không hợp lệ');
    }

    if (!Array.isArray(data.questions)) {
      throw new Error('Không nhận được danh sách câu hỏi từ Backend');
    }

    setQuizId(data.quizId);
    setQuizTitle(data.title || quizType);
    setStatus(data.status || 'Draft');
    setTimeLimit(isChapterExam ? data.timeLimit ?? null : null);
    setPassingScore(isChapterExam ? data.passingScore ?? null : null);

    // Chuẩn hóa dữ liệu câu hỏi trả về từ Backend
    setQuestions(data.questions.map((question) => ({
      id: question.id ?? question.questionId,
      content: question.content ?? '',
      options: Array.isArray(question.options) ? question.options : [],
      correctAnswer: question.correctAnswer ?? -1,
      explanation: question.explanation ?? ''
    })));
  };

  // GET: Lấy chi tiết bài kiểm tra và danh sách câu hỏi
  const refreshQuiz = async (userId, currentQuizId) => {
    const response = await getQuizDetail(userId, currentQuizId);
    applyQuizData(response.result);
    return response.result;
  };

  // Lấy dữ liệu khi truy cập trang biên soạn
  useEffect(() => {
    let cancelled = false;

    const fetchQuiz = async () => {
      try {
        setLoading(true);
        setLoadError('');

        // Lấy ID tài khoản hiện tại để truyền vào API
        const userId = await getInstructorId();

        if (cancelled) return;

        setInstructorId(userId);

        // Lấy bộ trắc nghiệm theo chương hoặc bài học
        const response = isChapterExam
          ? await getChapterQuiz(userId, chapterId)
          : await getLessonQuiz(userId, lessonId);

        if (cancelled) return;

        const existingQuiz = response.result ?? null;

        // Trường hợp bộ trắc nghiệm đã tồn tại
        if (existingQuiz) {
          // Kiểm tra bộ trắc nghiệm có thuộc đúng đường dẫn hay không
          if (
            (existingQuiz.courseId != null && Number(existingQuiz.courseId) !== Number(courseId)) ||
            (existingQuiz.chapterId != null && Number(existingQuiz.chapterId) !== Number(chapterId)) ||
            (isChapterExam && existingQuiz.lessonId != null) ||
            (!isChapterExam && Number(existingQuiz.lessonId) !== Number(lessonId))
          ) {
            throw new Error('Bộ trắc nghiệm không thuộc chương hoặc bài học hiện tại');
          }

          // Kiểm tra ID nếu truy cập từ bản nháp đã tồn tại
          if (quizData?.quizId != null &&
            Number(quizData.quizId) !== Number(existingQuiz.quizId)) {
            throw new Error('Bộ trắc nghiệm không khớp với dữ liệu được chọn');
          }

          // Không ghi đè bài kiểm tra đã tồn tại khi đang tạo mới
          if (isNewQuiz && quizData?.quizId == null) {
            throw new Error('Chương hoặc bài học đã có bộ trắc nghiệm');
          }

          // Lấy chi tiết đầy đủ từ Backend
          const detailResponse = await getQuizDetail(userId, existingQuiz.quizId);

          if (cancelled) return;

          applyQuizData(detailResponse.result);
          setShowConfigModal(false);
          return;
        }

        // Không cho tạo mới khi truy cập chế độ xem hoặc chỉnh sửa
        if (!isNewQuiz || isReadOnly) {
          throw new Error('Không tìm thấy bộ trắc nghiệm');
        }

        // Kiểm tra tên bộ trắc nghiệm
        const title = quizData?.title?.trim();

        if (!title || title.length > 255) {
          throw new Error('Tên bộ trắc nghiệm không hợp lệ');
        }

        // Tạo mới bài kiểm tra cuối chương:
        // Chỉ mở modal cấu hình, chưa lưu vào Database
        if (isChapterExam) {
          setShowConfigModal(true);
          return;
        }

        // Trắc nghiệm bài học phải được tạo ở ManageLessonContent
        // trước khi chuyển sang trang QuizEditor
        throw new Error('Trắc nghiệm bài học chưa được tạo trong hệ thống');

      } catch (err) {
        if (cancelled) return;

        console.error('Lỗi lấy dữ liệu bài kiểm tra:', err);
        setLoadError(getErrorMessage(err));
        toast.error(getErrorMessage(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchQuiz();

    return () => {
      cancelled = true;
    };
  }, [courseId, chapterId, lessonId]);

  // Hàm dùng chung để xử lý các API thay đổi dữ liệu
  const executeQuizAction = async (action, successMessage) => {
    if (actionLock.current || loading || loadError) return false;

    actionLock.current = true;
    setSaving(true);

    try {
      // Thực hiện API thay đổi dữ liệu
      const response = await action();

      // Lấy ID bài kiểm tra sau khi tạo hoặc cập nhật
      const currentQuizId = response.result?.quizId ?? quizId;

      if (currentQuizId == null) {
        throw new Error('Không xác định được ID bộ trắc nghiệm');
      }

      // Đồng bộ lại toàn bộ dữ liệu từ Database
      // Không phụ thuộc API cập nhật trả về câu hỏi hay toàn bộ Quiz
      await refreshQuiz(instructorId, currentQuizId);

      toast.success(response.message || successMessage);
      return true;

    } catch (err) {
      console.error('Lỗi xử lý bài kiểm tra:', err);
      toast.error(getErrorMessage(err));
      return false;

    } finally {
      setSaving(false);
      actionLock.current = false;
    }
  };

  // ==================================================
  // 2. XỬ LÝ MODAL VÀ ĐIỀU HƯỚNG
  // ==================================================

  // Quay lại trang trước
  const handleBack = () => {
    if (actionLock.current) return;

    // Trường hợp truy cập từ trang quản lý bản nháp
    if (fromDraftManagement) {
      navigate('/instructor/drafts', { replace: true });
      return;
    }

    // Dữ liệu đã được lưu vào Database sau mỗi thao tác
    // Truyền thêm dữ liệu để tương thích với trang quản lý cũ
    const updatedQuiz = quizId != null ? {
      quizId,
      courseId: Number(courseId),
      chapterId: Number(chapterId),
      lessonId: lessonId ? Number(lessonId) : null,
      title: quizTitle,
      status,
      timeLimit: isChapterExam ? timeLimit : null,
      passingScore: isChapterExam ? passingScore : null,
      questionCount: questions.length,
      questions
    } : null;

    // Quay lại trang quản lý bài học nếu là kiểm tra cuối chương
    if (isChapterExam) {
      navigate(`/instructor/courses/${courseId}/chapters/${chapterId}`, {
        replace: true,
        state: {
          courseTitle: location.state?.courseTitle,
          chapterTitle: location.state?.chapterTitle,
          updatedQuiz
        }
      });
      return;
    }

    // Quay lại trang quản lý nội dung nếu là trắc nghiệm bài học
    navigate(`/instructor/courses/${courseId}/chapters/${chapterId}/lessons/${lessonId}`, {
      replace: true,
      state: {
        courseTitle: location.state?.courseTitle,
        chapterTitle: location.state?.chapterTitle,
        lessonTitle: location.state?.lessonTitle,
        updatedQuiz
      }
    });
  };

  // Đóng modal hiện tại
  const closeModal = () => {
    if (actionLock.current) return;
    setActiveModal(null);
  };

  // ==================================================
  // 3. CẤU HÌNH BÀI KIỂM TRA CUỐI CHƯƠNG
  // ==================================================

  // POST: Lưu cấu hình và tạo bản nháp bài kiểm tra
  const handleSaveConfig = async (event) => {
    event.preventDefault();

    if (!showConfigModal || !isChapterExam || isReadOnly ||
      isPublished || loading || saving || loadError ||
      !instructorId || quizId != null || actionLock.current) return;

    const duration = Number(configForm.timeLimit);
    const score = Number(configForm.passingScore);
    const title = quizTitle.trim();

    // Kiểm tra tên bài kiểm tra
    if (!title || title.length > 255) {
      toast.error('Tên bài kiểm tra không hợp lệ');
      return;
    }

    // Kiểm tra thời gian làm bài
    if (String(configForm.timeLimit).trim() === '' ||
      !Number.isInteger(duration) || duration < 1 || duration > 180) {
      toast.error('Thời gian làm bài phải từ 1 đến 180 phút');
      return;
    }

    // Kiểm tra điểm đạt yêu cầu
    if (String(configForm.passingScore).trim() === '' ||
      !Number.isFinite(score) || score < 0 || score > 10) {
      toast.error('Điểm đạt yêu cầu phải từ 0 đến 10');
      return;
    }

    // Điểm đạt yêu cầu chỉ có tối đa một chữ số thập phân
    if (Math.abs(score * 10 - Math.round(score * 10)) > 0.000001) {
      toast.error('Điểm đạt yêu cầu chỉ được có một chữ số thập phân');
      return;
    }

    if (method === 'AI') {
      const questionCount = Number(aiData?.questionCount);
      if (!Number.isInteger(questionCount) || questionCount < 3 || questionCount > 8) {
        toast.error('Số lượng câu hỏi phải từ 3 đến 8');
        return;
      }

      if (!['BASIC', 'INTERMEDIATE', 'ADVANCED'].includes(aiData?.difficulty)) {
        toast.error('Độ khó mục tiêu không hợp lệ');
        return;
      }

      if (!aiData?.file) {
        toast.error('Vui lòng chọn tài liệu PDF chương học');
        return;
      }

      const payload = new FormData();
      payload.append('title', title);
      payload.append('chapterId', Number(chapterId));
      payload.append('timeLimit', duration);
      payload.append('passingScore', score);
      payload.append('questionCount', questionCount);
      payload.append('difficulty', aiData.difficulty);
      payload.append('file', aiData.file);

      const success = await executeQuizAction(
        () => generateQuizWithAI(instructorId, payload),
        `AI đã tạo ${questionCount} câu hỏi. Hãy kiểm tra trước khi xuất bản.`
      );

      if (success) {
        setShowConfigModal(false);
      }
      return;
    }

    // Dữ liệu gửi đến Backend
    const payload = {
      title,
      chapterId: Number(chapterId),
      lessonId: null,
      timeLimit: duration,
      passingScore: score
    };

    // Gọi API tạo bản nháp bài kiểm tra cuối chương
    const success = await executeQuizAction(
      () => createQuiz(instructorId, payload),
      'Tạo bản nháp bài kiểm tra thành công'
    );

    // Chỉ đóng modal sau khi Backend lưu thành công
    if (success) {
      setShowConfigModal(false);
    }
  };

  // Hủy cấu hình và quay về trang trước
  // Không tạo bản nháp và không gọi API AI
  const handleCancelConfig = () => {
    if (actionLock.current) return;
    handleBack();
  };

  // ==================================================
  // 4. CHỈNH SỬA TIÊU ĐỀ BÀI KIỂM TRA
  // ==================================================

  // Mở modal chỉnh sửa tiêu đề
  const handleOpenRename = () => {
    if (isLocked || saving) return;

    setTempTitle(quizTitle);
    setActiveModal('rename');
  };

  // PATCH: Lưu tiêu đề bài kiểm tra
  const handleSaveTitle = async () => {
    if (isLocked || saving || actionLock.current) return;

    const title = tempTitle.trim();

    // Kiểm tra tên bài kiểm tra không được để trống
    if (!title) {
      toast.error('Vui lòng nhập tên bài kiểm tra');
      return;
    }

    // Kiểm tra độ dài tên bài kiểm tra
    if (title.length > 255) {
      toast.error('Tên bài kiểm tra không được vượt quá 255 ký tự');
      return;
    }

    // Không gọi API nếu tên không thay đổi
    if (title === quizTitle) {
      closeModal();
      return;
    }

    // Gọi API cập nhật tiêu đề
    const success = await executeQuizAction(
      () => updateQuizTitle(instructorId, quizId, { title }),
      'Cập nhật tiêu đề thành công'
    );

    if (success) closeModal();
  };

  // ==================================================
  // 5. THÊM VÀ CHỈNH SỬA CÂU HỎI
  // ==================================================

  // Mở modal thêm câu hỏi
  const handleAddQuestion = () => {
    if (isLocked || saving) return;

    setQuestionForm(createEmptyQuestion());
    setActiveModal('question');
  };

  // Mở modal sửa câu hỏi
  const handleEditQuestion = (question) => {
    if (isLocked || saving) return;

    // Sao chép dữ liệu để không thay đổi câu hỏi gốc khi chưa lưu
    setQuestionForm({
      ...question,
      options: [...question.options],
      explanation: question.explanation ?? ''
    });

    setActiveModal('question');
  };

  // Thay đổi nội dung phương án trả lời
  const handleChangeOption = (index, value) => {
    if (isLocked || saving) return;

    setQuestionForm((prev) => ({
      ...prev,
      options: prev.options.map((option, i) => i === index ? value : option)
    }));
  };

  // Thêm phương án trả lời, tối đa 6 phương án
  const handleAddOption = () => {
    if (isLocked || saving) return;

    if (questionForm.options.length >= 6) {
      toast.error('Tối đa 6 phương án trả lời');
      return;
    }

    setQuestionForm((prev) => ({
      ...prev,
      options: [...prev.options, '']
    }));
  };

  // Xóa phương án trả lời
  const handleRemoveOption = (index) => {
    if (isLocked || saving) return;

    if (questionForm.options.length <= 2) {
      toast.error('Câu hỏi phải có ít nhất 2 phương án');
      return;
    }

    setQuestionForm((prev) => {
      let correctAnswer = prev.correctAnswer;

      // Cập nhật vị trí đáp án đúng sau khi xóa
      if (index === correctAnswer) {
        correctAnswer = -1;
      } else if (index < correctAnswer) {
        correctAnswer--;
      }

      return {
        ...prev,
        options: prev.options.filter((_, i) => i !== index),
        correctAnswer
      };
    });
  };

  // POST/PUT: Kiểm tra và lưu câu hỏi vào Database
  const handleSaveQuestion = async () => {
    if (isLocked || saving || actionLock.current) return;

    // Kiểm tra nội dung câu hỏi
    if (!questionForm.content.trim()) {
      toast.error('Vui lòng nhập nội dung câu hỏi');
      return;
    }

    // Kiểm tra số lượng phương án trả lời
    if (questionForm.options.length < 2 || questionForm.options.length > 6) {
      toast.error('Câu hỏi phải có từ 2 đến 6 phương án');
      return;
    }

    // Kiểm tra các phương án trả lời
    if (questionForm.options.some((option) => !option.trim())) {
      toast.error('Vui lòng nhập đầy đủ các phương án');
      return;
    }

    // Kiểm tra đáp án đúng
    if (!Number.isInteger(questionForm.correctAnswer) ||
      questionForm.correctAnswer < 0 ||
      questionForm.correctAnswer >= questionForm.options.length) {
      toast.error('Vui lòng chọn đáp án đúng');
      return;
    }

    // Kiểm tra phương án trả lời bị trùng
    const normalizedOptions = questionForm.options.map(
      (option) => option.trim().toLowerCase()
    );

    if (new Set(normalizedOptions).size !== normalizedOptions.length) {
      toast.error('Các phương án trả lời không được trùng nhau');
      return;
    }

    // Chuẩn hóa dữ liệu câu hỏi trước khi gửi Backend
    const payload = {
      content: questionForm.content.trim(),
      options: questionForm.options.map((option) => option.trim()),
      correctAnswer: questionForm.correctAnswer,
      explanation: (questionForm.explanation ?? '').trim()
    };

    let success;

    // Cập nhật câu hỏi nếu đang chỉnh sửa
    if (questionForm.id != null) {
      success = await executeQuizAction(
        () => updateQuestion(instructorId, quizId, questionForm.id, payload),
        'Cập nhật câu hỏi thành công'
      );
    } else {
      // Thêm câu hỏi mới vào Database
      success = await executeQuizAction(
        () => addQuestion(instructorId, quizId, payload),
        'Thêm câu hỏi thành công'
      );
    }

    // Chỉ đóng modal khi lưu thành công
    if (success) {
      closeModal();
      setQuestionForm(createEmptyQuestion());
    }
  };

  // ==================================================
  // 6. XÓA CÂU HỎI
  // ==================================================

  // Mở modal xác nhận xóa
  const handleOpenDelete = (id) => {
    if (isLocked || saving) return;

    setDeleteId(id);
    setActiveModal('delete');
  };

  // DELETE: Xác nhận xóa câu hỏi
  const handleDeleteQuestion = async () => {
    if (isLocked || saving || deleteId == null || actionLock.current) return;

    // Gọi API xóa câu hỏi và các phương án liên quan
    const success = await executeQuizAction(
      () => deleteQuestion(instructorId, quizId, deleteId),
      'Xóa câu hỏi thành công'
    );

    if (success) {
      setDeleteId(null);
      closeModal();
    }
  };

  // ==================================================
  // 7. XUẤT BẢN BÀI KIỂM TRA
  // ==================================================

  // Kiểm tra điều kiện xuất bản
  const validatePublish = () => {
    // Kiểm tra số lượng câu hỏi tối thiểu
    if (questions.length < MIN_QUESTIONS) {
      toast.error(`Bài kiểm tra phải có ít nhất ${MIN_QUESTIONS} câu hỏi`);
      return false;
    }

    // Kiểm tra tên bài kiểm tra
    if (!quizTitle.trim() || quizTitle.trim().length > 255) {
      toast.error('Tên bài kiểm tra không hợp lệ');
      return false;
    }

    // Kiểm tra nội dung và đáp án của tất cả câu hỏi
    const invalidQuestion = questions.findIndex((question) =>
      !question.content?.trim() ||
      !Array.isArray(question.options) ||
      question.options.length < 2 ||
      question.options.length > 6 ||
      question.options.some((option) => !option?.trim()) ||
      !Number.isInteger(question.correctAnswer) ||
      question.correctAnswer < 0 ||
      question.correctAnswer >= question.options.length ||
      new Set(question.options.map((option) => option.trim().toLowerCase())).size !== question.options.length
    );

    if (invalidQuestion !== -1) {
      toast.error(`Câu hỏi ${invalidQuestion + 1} chưa hợp lệ`);
      return false;
    }

    // Chỉ kiểm tra cấu hình đối với bài kiểm tra cuối chương
    if (isChapterExam) {
      // Không cho xuất bản nếu chưa có đầy đủ cấu hình
      if (timeLimit == null || passingScore == null) {
        toast.error('Bài kiểm tra chưa có đầy đủ cấu hình');
        return false;
      }

      // Kiểm tra thời gian làm bài
      if (!Number.isInteger(Number(timeLimit)) ||
        Number(timeLimit) < 1 || Number(timeLimit) > 180) {
        toast.error('Thời gian làm bài không hợp lệ');
        return false;
      }

      // Kiểm tra điểm đạt yêu cầu
      if (!Number.isFinite(Number(passingScore)) ||
        Number(passingScore) < 0 || Number(passingScore) > 10) {
        toast.error('Điểm đạt yêu cầu không hợp lệ');
        return false;
      }
    }

    return true;
  };

  // Mở modal xác nhận xuất bản
  const handleOpenPublish = () => {
    if (isLocked || saving) return;

    if (!validatePublish()) return;

    setActiveModal('publish');
  };

  // PATCH: Xác nhận xuất bản bài kiểm tra
  const handlePublish = async () => {
    if (isLocked || saving || actionLock.current) return;

    if (!validatePublish()) return;

    // Gọi API xuất bản bộ trắc nghiệm
    const success = await executeQuizAction(
      () => publishQuiz(instructorId, quizId),
      'Xuất bản bài kiểm tra thành công'
    );

    // Trạng thái Published được cập nhật từ Backend
    if (success) closeModal();
  };

  // ==================================================
  // 8. XEM TRƯỚC BÀI KIỂM TRA
  // ==================================================

  // Mở chế độ xem trước
  const handlePreview = () => {
    if (showConfigModal || loading || saving || loadError) return;

    // Kiểm tra danh sách câu hỏi
    if (questions.length === 0) {
      toast.error('Bài kiểm tra chưa có câu hỏi');
      return;
    }

    // Khởi tạo lại dữ liệu xem trước
    setPreviewAnswers({});
    setPreviewIndex(0);
    setPreviewMarked({});
    setActiveModal('preview');
  };

  // Chọn phương án trả lời
  const handleSelectPreviewAnswer = (optionIndex) => {
    if (!previewQuestion) return;

    setPreviewAnswers((prev) => ({
      ...prev,
      [previewQuestion.id]: optionIndex
    }));
  };

  // Xóa phương án đã chọn
  const handleClearPreviewAnswer = () => {
    if (!previewQuestion) return;

    setPreviewAnswers((prev) => {
      const updatedAnswers = { ...prev };
      delete updatedAnswers[previewQuestion.id];
      return updatedAnswers;
    });
  };

  // Đánh dấu hoặc bỏ đánh dấu xem lại
  const handleMarkPreviewQuestion = () => {
    if (!previewQuestion) return;

    setPreviewMarked((prev) => ({
      ...prev,
      [previewQuestion.id]: !prev[previewQuestion.id]
    }));
  };

  // Quay lại câu hỏi trước
  const handlePreviousPreview = () => {
    setPreviewIndex((prev) => Math.max(0, prev - 1));
  };

  // Chuyển đến câu hỏi tiếp theo
  const handleNextPreview = () => {
    setPreviewIndex((prev) => Math.min(questions.length - 1, prev + 1));
  };

  // ==================================================
  // 9. GIAO DIỆN BIÊN SOẠN BÀI KIỂM TRA
  // ==================================================
  return (
    <div className="w-full min-h-screen bg-[#f8f9ff] pb-8 text-slate-800">

      {/* ==================== THANH TIÊU ĐỀ ==================== */}
      <div className="bg-white rounded-xl p-4 shadow-sm mb-6 flex flex-col xl:flex-row xl:items-center justify-between gap-4">

        <div className="flex items-center gap-4 min-w-0">

          {/* Nút quay lại */}
          <button onClick={handleBack} title="Quay lại" disabled={saving}
            className="w-10 h-10 shrink-0 rounded-lg bg-[#eff4ff] hover:bg-[#dce9ff] flex items-center justify-center text-[#00288e] transition-all">
            <ArrowLeft size={21} />
          </button>

          {/* Thông tin bài kiểm tra */}
          <div className="min-w-0 flex flex-col gap-2">

            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg font-bold text-slate-800 break-words">{quizTitle}</h1>

              {/* Chỉ cho phép đổi tên khi được chỉnh sửa */}
              {!isLocked && (
                <button onClick={handleOpenRename} title="Chỉnh sửa tiêu đề" disabled={saving}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-[#00288e] hover:bg-[#eff4ff]">
                  <Pencil size={17} />
                </button>
              )}
            </div>

            {/* Trạng thái và loại bài kiểm tra */}
            <div className="flex items-center gap-3 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#dbe1ff] text-[#00288e] text-xs font-semibold">
                <span className="w-2 h-2 rounded-full bg-[#00288e]" />
                {loading ? 'Đang tải...' : loadError ? 'Lỗi tải dữ liệu' : isPublished ? 'Đã xuất bản (Published)' : 'Bản nháp (Draft)'}
              </span>

              <span className="text-xs text-slate-500">{quizType}</span>
            </div>
          </div>
        </div>

        {/* Các nút thao tác */}
        <div className="flex items-center gap-2 shrink-0">
          <button onClick={handlePreview} disabled={showConfigModal || loading || saving || !!loadError}
            className={`${secondaryButton} disabled:opacity-50 disabled:cursor-not-allowed`}>
            <Eye size={19} />
            Xem trước
          </button>

          {!isReadOnly && (
            <button onClick={handleOpenPublish} disabled={isLocked || saving} className={primaryButton}>
              <Rocket size={19} />
              {isPublished ? 'Đã xuất bản' : 'Xuất bản'}
            </button>
          )}
        </div>
      </div>

      {/* Thông báo khi bài kiểm tra đã xuất bản */}
      {isPublished && (
        <div className="mb-6 p-4 rounded-xl bg-[#e5eeff] flex items-center gap-3 text-[#00288e]">
          <Lock size={21} className="shrink-0" />
          <div>
            <p className="text-sm font-bold">Bài kiểm tra đã được xuất bản</p>
            <p className="text-xs mt-1">Không thể chỉnh sửa nội dung bài kiểm tra sau khi xuất bản.</p>
          </div>
        </div>
      )}

      {/* Thông báo khi đang ở chế độ chỉ xem */}
      {isReadOnly && !isPublished && (
        <div className="mb-6 p-4 rounded-xl bg-[#e5eeff] flex items-center gap-3 text-[#00288e]">
          <Eye size={21} className="shrink-0" />
          <div>
            <p className="text-sm font-bold">Chế độ xem bài kiểm tra</p>
            <p className="text-xs mt-1">Chỉ được xem nội dung, không thể chỉnh sửa bài kiểm tra.</p>
          </div>
        </div>
      )}

      {/* ==================== KHU VỰC CHÍNH ==================== */}
      <div className="grid grid-cols-12 gap-6">

        {/* Kiểm tra cuối chương chiếm 8 cột, trắc nghiệm bài học chiếm 12 cột */}
        <div className={`col-span-12 ${isChapterExam ? 'lg:col-span-8' : ''} flex flex-col gap-4`}>

          {/* Tiêu đề danh sách câu hỏi */}
          <div className="bg-white rounded-xl p-4 shadow-sm flex flex-wrap items-center justify-between gap-3">

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#e5eeff] text-[#00288e] flex items-center justify-center">
                <ClipboardList size={22} />
              </div>

              <div>
                <h2 className="text-base font-bold">Danh sách câu hỏi</h2>
                <p className="text-xs text-slate-500 mt-1">
                  Tổng số: {questions.length} câu hỏi
                  <span className="mx-2">•</span>
                  Tổng điểm: {questions.length > 0 ? '10.0' : '0.0'}
                </p>
              </div>
            </div>

            {/* Nút thêm câu hỏi */}
            {!isLocked && (
              <button onClick={handleAddQuestion} disabled={saving}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#0051d5] hover:bg-[#00288e] text-white text-sm font-semibold transition-all">
                <PlusCircle size={18} />
                Thêm câu hỏi
              </button>
            )}
          </div>

          {/* Trạng thái danh sách rỗng hoặc đang tải dữ liệu */}
          {questions.length === 0 && (
            <div className="bg-white rounded-xl shadow-sm p-12 text-center">
              <ClipboardList size={48} className="mx-auto text-blue-200 mb-4" />
              <h3 className="font-semibold text-slate-700">
                {loading ? 'Đang tải danh sách câu hỏi' : loadError ? 'Không thể tải dữ liệu' : 'Chưa có câu hỏi nào'}
              </h3>

              <p className="text-sm text-slate-500 mt-2">
                {loading
                  ? 'Vui lòng chờ trong giây lát.'
                  : loadError
                    ? loadError
                    : showConfigModal
                      ? 'Vui lòng hoàn thành cấu hình bài kiểm tra.'
                      : isReadOnly
                        ? 'Bài kiểm tra chưa có câu hỏi.'
                        : 'Hãy thêm câu hỏi để xây dựng bài kiểm tra.'}
              </p>

              {!isLocked && (
                <button onClick={handleAddQuestion} disabled={saving} className={`${primaryButton} mt-5`}>
                  <Plus size={18} />
                  Thêm câu hỏi
                </button>
              )}
            </div>
          )}

          {/* Hiển thị danh sách câu hỏi */}
          {questions.map((question, questionIndex) => (
            <article key={question.id}
              className="relative bg-white rounded-xl p-5 pl-6 shadow-sm hover:shadow-md transition-all overflow-hidden">

              {/* Thanh màu bên trái */}
              <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#00288e]" />

              {/* Tiêu đề và nút thao tác */}
              <div className="flex items-center justify-between gap-3 mb-4">

                <span className="px-3 py-1.5 rounded-lg bg-[#eff4ff] text-[#00288e] text-sm font-bold">
                  Câu hỏi {questionIndex + 1}
                </span>

                {!isLocked && (
                  <div className="flex items-center gap-1">

                    {/* Nút sửa câu hỏi */}
                    <button onClick={() => handleEditQuestion(question)} title="Chỉnh sửa câu hỏi" disabled={saving}
                      className="p-2 rounded-lg text-slate-500 hover:bg-[#eff4ff] hover:text-[#00288e]">
                      <Pencil size={18} />
                    </button>

                    {/* Nút xóa câu hỏi */}
                    <button onClick={() => handleOpenDelete(question.id)} title="Xóa câu hỏi" disabled={saving}
                      className="p-2 rounded-lg text-slate-500 hover:bg-red-50 hover:text-red-600">
                      <Trash2 size={18} />
                    </button>
                  </div>
                )}
              </div>

              {/* Nội dung câu hỏi */}
              <p className="font-semibold text-sm leading-relaxed mb-4 whitespace-pre-wrap break-words">
                {question.content}
              </p>

              {/* Các phương án trả lời */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">

                {question.options.map((option, optionIndex) => {
                  const isCorrect = question.correctAnswer === optionIndex;

                  return (
                    <div key={optionIndex}
                      className={`p-3 rounded-xl flex items-start gap-3 ${isCorrect ? 'bg-[#dce9ff] text-[#00288e]' : 'bg-[#eff4ff] text-slate-600'}`}>

                      {/* Ký hiệu phương án A, B, C, D... */}
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${isCorrect ? 'bg-[#00288e] text-white' : 'bg-[#d3e4fe] text-slate-600'}`}>
                        {String.fromCharCode(65 + optionIndex)}
                      </div>

                      {/* Nội dung phương án */}
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm break-words ${isCorrect ? 'font-semibold' : ''}`}>
                          {option}
                        </p>

                        {/* Đánh dấu đáp án đúng */}
                        {isCorrect && (
                          <span className="inline-flex items-center gap-1 mt-1 text-[11px] font-semibold">
                            <CheckCircle2 size={13} />
                            Đáp án đúng
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Lời giải thích */}
              <div className="rounded-xl bg-[#eff4ff] p-3 flex items-start gap-2">
                <Lightbulb size={18} className="text-[#0051d5] shrink-0 mt-0.5" />

                <p className="text-xs text-slate-600 leading-relaxed break-words">
                  <strong className="text-slate-800">Lời giải thích:</strong>{' '}
                  {question.explanation || 'Chưa cập nhật lời giải thích.'}
                </p>
              </div>
            </article>
          ))}
        </div>

        {/* ==================== CÀI ĐẶT BÀI KIỂM TRA ==================== */}
        {/* Chỉ hiển thị khi không có lessonId */}
        {isChapterExam && (
          <div className="col-span-12 lg:col-span-4">

            <div className="bg-white rounded-xl p-5 shadow-sm sticky top-24">

              <h3 className="text-base font-bold flex items-center gap-2 mb-5">
                <SlidersHorizontal size={20} className="text-[#00288e]" />
                Cài đặt bài kiểm tra
              </h3>

              <div className="flex flex-col gap-3">

                {/* Thời gian làm bài */}
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-medium text-slate-700">Thời gian làm bài</span>

                  <div className="w-28 bg-[#eff4ff] rounded-lg py-2 text-center text-sm font-semibold shrink-0">
                    {timeLimit != null ? `${timeLimit} phút` : 'Chưa cấu hình'}
                  </div>
                </div>

                {/* Điểm đạt tối thiểu */}
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-medium text-slate-700">Điểm đạt tối thiểu:</span>

                  <div className="w-28 bg-[#eff4ff] rounded-lg py-2 text-center text-sm font-semibold shrink-0">
                    {passingScore != null ? `${Number(passingScore).toFixed(1)} / 10.0` : 'Chưa cấu hình'}
                  </div>
                </div>

              </div>
            </div>
          </div>
        )}
      </div>

      {/* ==================== MODAL CẤU HÌNH KIỂM TRA CUỐI CHƯƠNG ==================== */}
      {/* Chỉ xuất hiện khi tạo mới bài kiểm tra cuối chương */}
      {isChapterExam && showConfigModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">

          <div role="dialog" aria-modal="true" aria-labelledby="config-modal-title"
            className="w-full max-w-lg bg-white rounded-xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">

            {/* Tiêu đề modal cấu hình */}
            <div className="px-6 py-4 bg-[#eff4ff] flex items-start justify-between">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <ClipboardList size={20} className="text-[#00288e]" />

                  <h2 id="config-modal-title" className="text-lg font-bold text-slate-800">
                    Cấu hình kiểm tra cuối chương
                  </h2>
                </div>

                <p className="text-xs text-slate-500">
                  Thiết lập thông tin cho bài kiểm tra cuối chương.
                </p>
              </div>

              <button type="button" onClick={handleCancelConfig} aria-label="Đóng cấu hình" disabled={saving}
                className="p-1 rounded-lg text-slate-500 hover:bg-blue-100">
                <X size={20} />
              </button>
            </div>

            {/* Form cấu hình */}
            <form onSubmit={handleSaveConfig} noValidate className="flex flex-col min-h-0">

              <div className="p-6 flex flex-col gap-5 overflow-y-auto">

                {/* Thời gian làm bài */}
                <div className="flex flex-col gap-2">

                  <div className="flex items-center justify-between gap-2">
                    <label htmlFor="config-time-limit" className="text-sm font-semibold text-slate-800">
                      Thời gian làm bài
                      <span className="text-red-500"> *</span>
                    </label>

                    <span className="text-xs text-slate-400">Tối đa 180 phút</span>
                  </div>

                  <div className="relative">
                    <input id="config-time-limit" type="number" min={1} max={180} step={1}
                      value={configForm.timeLimit} disabled={saving}
                      onChange={(e) => setConfigForm((prev) => ({ ...prev, timeLimit: e.target.value }))}
                      className="w-full h-11 pl-4 pr-20 rounded-lg bg-gray-50/50 text-sm text-slate-800 border border-gray-100 outline-none focus:ring-2 focus:ring-blue-600"
                    />

                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-slate-600 pointer-events-none">
                      phút
                    </span>
                  </div>

                  <p className="text-xs text-slate-500">
                    Thời gian đếm ngược khi sinh viên bắt đầu làm bài trắc nghiệm.
                  </p>
                </div>

                {/* Điểm đạt yêu cầu */}
                <div className="flex flex-col gap-2">

                  <div className="flex items-center justify-between gap-2">
                    <label htmlFor="config-passing-score" className="text-sm font-semibold text-slate-800">
                      Điểm đạt yêu cầu
                      <span className="text-red-500"> *</span>
                    </label>

                    <span className="text-xs text-slate-400">Thang điểm 10.0</span>
                  </div>

                  <div className="relative">
                    <input id="config-passing-score" type="number" min={0} max={10} step={0.1}
                      value={configForm.passingScore} disabled={saving}
                      onChange={(e) => setConfigForm((prev) => ({ ...prev, passingScore: e.target.value }))}
                      className="w-full h-11 pl-4 pr-32 rounded-lg bg-gray-50/50 text-sm text-slate-800 border border-gray-100 outline-none focus:ring-2 focus:ring-blue-600"
                    />

                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-slate-600 pointer-events-none">
                      điểm / 10.0
                    </span>
                  </div>

                  <p className="text-xs text-slate-500">
                    Điểm số tối thiểu sinh viên cần đạt để hoàn thành chương học này.
                  </p>
                </div>

                {/* Ghi chú cấu hình */}
                <div className="flex items-start gap-3 p-3 rounded-lg bg-[#e5eeff] text-slate-600">
                  <Info size={18} className="text-[#00288e] shrink-0" />

                  <p className="text-xs leading-relaxed">
                    Sau khi lưu cấu hình, hệ thống sẽ mở giao diện soạn thảo
                    danh sách câu hỏi trắc nghiệm cho bài kiểm tra.
                  </p>
                </div>
              </div>

              {/* Footer modal cấu hình */}
              <div className="px-6 pb-5 pt-2 flex items-center justify-end gap-3">

                <button type="button" onClick={handleCancelConfig} disabled={saving} className={secondaryButton}>
                  Hủy
                </button>

                <button type="submit" disabled={saving || loading} className={primaryButton}>
                  <CheckCircle2 size={17} />
                  {saving ? 'Đang lưu...' : 'Lưu'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== MODAL THÊM / SỬA CÂU HỎI ==================== */}
      {activeModal === 'question' && !isLocked && (
        <Modal
          title={questionForm.id != null ? 'Chỉnh sửa câu hỏi' : 'Thêm câu hỏi mới'}
          onClose={closeModal}
          wide="question"
          footer={
            <>
              <button onClick={closeModal} disabled={saving} className={secondaryButton}>Hủy</button>
              <button onClick={handleSaveQuestion} disabled={saving} className={primaryButton}>
                {saving ? 'Đang lưu...' : 'Lưu câu hỏi'}
              </button>
            </>
          }
        >
          <div className="flex flex-col gap-5">

            {/* Nội dung câu hỏi */}
            <div>
              <label className="block text-sm font-semibold mb-2">
                Nội dung câu hỏi
                <span className="text-red-500"> *</span>
              </label>

              <textarea rows={3} value={questionForm.content} disabled={saving}
                onChange={(e) => setQuestionForm((prev) => ({ ...prev, content: e.target.value }))}
                placeholder="Nhập nội dung câu hỏi..."
                className={`${inputClass} resize-none`}
              />
            </div>

            {/* Các phương án trả lời */}
            <div>
              <label className="block text-sm font-semibold mb-1">
                Các phương án trả lời
                <span className="text-red-500"> *</span>
              </label>

              <p className="text-xs text-slate-500 mb-3">
                Chọn nút tròn để đánh dấu phương án đúng.
              </p>

              <div className="flex flex-col gap-2">

                {questionForm.options.map((option, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 rounded-lg bg-[#eff4ff]">

                    {/* Chọn đáp án đúng */}
                    <label className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold cursor-pointer shrink-0 ${questionForm.correctAnswer === index ? 'bg-[#00288e] text-white' : 'bg-[#d3e4fe] text-slate-600'}`}>

                      <input type="radio" name="correctAnswer" disabled={saving}
                        checked={questionForm.correctAnswer === index}
                        onChange={() => setQuestionForm((prev) => ({ ...prev, correctAnswer: index }))}
                        className="sr-only"
                      />

                      {String.fromCharCode(65 + index)}
                    </label>

                    {/* Nội dung phương án */}
                    <input type="text" value={option} disabled={saving}
                      onChange={(e) => handleChangeOption(index, e.target.value)}
                      placeholder={`Nội dung phương án ${String.fromCharCode(65 + index)}...`}
                      className="flex-1 min-w-0 px-3 py-2 rounded-lg bg-white text-sm outline-none focus:ring-1 focus:ring-blue-500"
                    />

                    {/* Xóa phương án - sử dụng icon thùng rác */}
                    <button onClick={() => handleRemoveOption(index)}
                      disabled={questionForm.options.length <= 2 || saving} title="Xóa phương án"
                      className="p-1 text-slate-400 hover:text-red-500 disabled:opacity-30 disabled:cursor-not-allowed">
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
              </div>

              {/* Thêm phương án */}
              {questionForm.options.length < 6 && (
                <button onClick={handleAddOption} disabled={saving}
                  className="mt-3 flex items-center gap-1 text-sm font-semibold text-[#0051d5] hover:text-[#00288e]">
                  <Plus size={18} />
                  Thêm phương án
                </button>
              )}
            </div>

            {/* Lời giải thích */}
            <div>
              <label className="block text-sm font-semibold mb-2">Lời giải thích</label>

              <textarea rows={3} value={questionForm.explanation} disabled={saving}
                onChange={(e) => setQuestionForm((prev) => ({ ...prev, explanation: e.target.value }))}
                placeholder="Giải thích vì sao phương án trên là chính xác..."
                className={`${inputClass} resize-none`}
              />

              <p className="text-xs text-slate-500 mt-1">
                Hiển thị sau khi sinh viên nộp bài.
              </p>
            </div>
          </div>
        </Modal>
      )}

      {/* ==================== MODAL ĐỔI TÊN ==================== */}
      {activeModal === 'rename' && !isLocked && (
        <Modal
          title="Chỉnh sửa tên bài kiểm tra"
          onClose={closeModal}
          footer={
            <>
              <button onClick={closeModal} disabled={saving} className={secondaryButton}>Hủy</button>
              <button onClick={handleSaveTitle} disabled={saving} className={primaryButton}>
                {saving ? 'Đang cập nhật...' : 'Cập nhật'}
              </button>
            </>
          }
        >
          <label className="block text-sm font-semibold mb-2">Tên bài kiểm tra</label>

          <input type="text" value={tempTitle} disabled={saving}
            onChange={(e) => setTempTitle(e.target.value)}
            placeholder="Nhập tên bài kiểm tra"
            className={inputClass}
          />
        </Modal>
      )}

      {/* ==================== MODAL XÁC NHẬN XÓA ==================== */}
      {activeModal === 'delete' && !isLocked && (
        <Modal
          title="Xác nhận xóa câu hỏi"
          onClose={closeModal}
          footer={
            <>
              <button onClick={closeModal} disabled={saving} className={secondaryButton}>Hủy</button>

              <button onClick={handleDeleteQuestion} disabled={saving}
                className="px-4 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-semibold">
                {saving ? 'Đang xóa...' : 'Xác nhận xóa'}
              </button>
            </>
          }
        >
          <div className="flex items-start gap-4">

            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0">
              <Trash2 size={24} />
            </div>

            <p className="text-sm text-slate-600 leading-relaxed">
              Bạn có chắc chắn muốn xóa câu hỏi này khỏi bài kiểm tra?
              Câu hỏi sẽ bị loại khỏi danh sách biên soạn hiện tại.
            </p>
          </div>
        </Modal>
      )}

      {/* ==================== MODAL XÁC NHẬN XUẤT BẢN ==================== */}
      {activeModal === 'publish' && !isLocked && (
        <Modal
          title="Xác nhận xuất bản bài kiểm tra"
          onClose={closeModal}
          footer={
            <>
              <button onClick={closeModal} disabled={saving} className={secondaryButton}>Hủy</button>

              <button onClick={handlePublish} disabled={saving} className={primaryButton}>
                <CheckCircle2 size={18} />
                {saving ? 'Đang xuất bản...' : 'Xác nhận xuất bản'}
              </button>
            </>
          }
        >
          <div className="flex flex-col gap-4">

            <div className="w-12 h-12 rounded-full bg-[#dbe1ff] text-[#00288e] flex items-center justify-center">
              <Rocket size={25} />
            </div>

            <p className="text-sm text-slate-600 leading-relaxed">
              Bạn có chắc chắn muốn xuất bản bài kiểm tra này không?
              Sau khi xuất bản, sinh viên có thể thực hiện bài kiểm tra
              và giảng viên không thể chỉnh sửa nội dung.
            </p>

            {/* Thông tin bài kiểm tra trước khi xuất bản */}
            <div className="rounded-lg bg-[#eff4ff] p-3 text-sm space-y-2">

              <p><strong>Loại bài:</strong> {quizType}</p>

              <p><strong>Số câu hỏi:</strong> {questions.length} câu</p>

              {/* Chỉ hiển thị cấu hình nếu là kiểm tra cuối chương */}
              {isChapterExam && (
                <>
                  <p>
                    <strong>Thời gian:</strong> {timeLimit} phút
                  </p>

                  <p>
                    <strong>Điểm đạt yêu cầu:</strong>{' '}
                    {Number(passingScore).toFixed(1)} / 10.0
                  </p>
                </>
              )}
            </div>

            <div className="flex items-start gap-2 text-xs text-amber-700 bg-amber-50 p-3 rounded-lg">
              <AlertTriangle size={17} className="shrink-0" />
              Vui lòng kiểm tra kỹ nội dung và đáp án trước khi xuất bản.
            </div>
          </div>
        </Modal>
      )}

  {/* ==================== MODAL XEM TRƯỚC ==================== */}
  {activeModal === 'preview' && previewQuestion && (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4"
      onClick={closeModal}>

      <div role="dialog" aria-modal="true" aria-label="Xem trước bài kiểm tra"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-4xl max-h-[95vh] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col">

        {/* Tiêu đề modal xem trước */}
        <div className="px-6 py-4 bg-[#eff4ff] flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Eye size={22} className="text-[#00288e]" />

            <div>
              <h2 className="text-lg font-bold text-slate-800">
                Xem trước bài kiểm tra
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                {quizTitle}
              </p>
            </div>
          </div>

          {/* Nút đóng xem trước */}
          <button onClick={closeModal} title="Đóng xem trước"
            className="p-1.5 rounded-lg text-slate-500 hover:bg-blue-100">
            <X size={22} />
          </button>
        </div>

        {/* Nội dung xem trước */}
        <div className="p-3 sm:p-5 bg-[#f8f8fc] overflow-y-auto">

          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">

            <div className="p-5 sm:p-8">

              {/* Thanh tiến trình làm bài */}
              <div className="w-full h-1.5 bg-[#e0e5f8] rounded-full overflow-hidden mb-6">
                <div
                  className="h-full bg-[#2563eb] rounded-full transition-all duration-300"
                  style={{
                    width: `${((previewIndex + 1) / questions.length) * 100}%`
                  }}
                />
              </div>

              {/* Số câu hỏi, điểm số và đánh dấu xem lại */}
              <div className="flex flex-wrap items-center justify-between gap-3 mb-6">

                <div className="flex items-center gap-3">

                  {/* Vị trí câu hỏi hiện tại */}
                  <div className="px-3 py-1.5 rounded-lg bg-[#dce2fa] text-[#00204f]">
                    <span className="text-lg font-bold">
                      Câu {previewIndex + 1}
                    </span>
                    <span className="text-sm font-medium text-slate-600">
                      {' '}/ {questions.length}
                    </span>
                  </div>

                  {/* Điểm của câu hỏi */}
                  <span className="px-2.5 py-1 rounded-full bg-[#d5edff] text-[#164b70] text-xs font-semibold">
                    {previewPoint} Điểm
                  </span>
                </div>

                {/* Nút đánh dấu xem lại */}
                <button type="button" onClick={handleMarkPreviewQuestion}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                    previewMarked[previewQuestion.id]
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-[#f0f2fb] text-slate-600 hover:bg-[#e5e9fa]'
                  }`}>

                  <Bookmark size={15}
                    fill={previewMarked[previewQuestion.id] ? 'currentColor' : 'none'}
                  />

                  {previewMarked[previewQuestion.id]
                    ? 'Đã đánh dấu'
                    : 'Đánh dấu xem lại'}
                </button>
              </div>

              {/* Nội dung câu hỏi */}
              <p className="text-base font-semibold text-slate-900 leading-relaxed whitespace-pre-wrap break-words mb-8">
                {previewQuestion.content}
              </p>

              {/* Danh sách phương án trả lời */}
              <div className="flex flex-col gap-3">

                {previewQuestion.options.map((option, optionIndex) => {

                  // Kiểm tra phương án hiện tại đã được chọn hay chưa
                  const isSelected =
                    previewAnswers[previewQuestion.id] === optionIndex;

                  return (
                    <button
                      key={`${previewQuestion.id}-${optionIndex}`}
                      type="button"
                      aria-pressed={isSelected}
                      onClick={() => handleSelectPreviewAnswer(optionIndex)}
                      className={`w-full min-h-[68px] p-4 rounded-xl border flex items-center gap-4 text-left transition-all ${
                        isSelected
                          ? 'bg-[#e8edff] border-[#b9c8ee] shadow-md text-[#0051b8]'
                          : 'bg-white border-slate-100 shadow-sm text-slate-900 hover:bg-[#f5f7ff] hover:border-blue-200'
                      }`}>

                      {/* Ký hiệu A, B, C, D hoặc dấu tích khi chọn */}
                      <div className={`w-9 h-9 rounded-lg shrink-0 flex items-center justify-center text-sm font-bold ${
                        isSelected
                          ? 'bg-[#2563eb] text-white'
                          : 'bg-[#e1e6fb] text-slate-800'
                      }`}>

                        {isSelected
                          ? <Check size={19} strokeWidth={2.5} />
                          : String.fromCharCode(65 + optionIndex)}
                      </div>

                      {/* Nội dung phương án trả lời */}
                      <span className={`flex-1 min-w-0 text-sm sm:text-base break-words ${
                        isSelected ? 'font-semibold' : 'font-medium'
                      }`}>
                        {option}
                      </span>

                      {/* Icon xác nhận phương án đang được chọn */}
                      {isSelected && (
                        <CheckCircle2 size={18}
                          className="text-[#0051b8] shrink-0"
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Thanh điều hướng câu hỏi */}
            <div className="px-5 sm:px-8 py-6 bg-[#f7f8fc] border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">

              {/* Nút quay lại câu trước */}
              <button
                type="button"
                onClick={handlePreviousPreview}
                disabled={previewIndex === 0}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-white text-sm font-medium text-slate-600 hover:bg-blue-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all">

                <ArrowLeft size={16} />

                Câu {Math.max(1, previewIndex)} (Trước)
              </button>

              <div className="flex flex-wrap items-center gap-3">

                {/* Xóa lựa chọn hiện tại */}
                <button
                  type="button"
                  onClick={handleClearPreviewAnswer}
                  disabled={previewAnswers[previewQuestion.id] === undefined}
                  className="px-3 py-2.5 text-xs font-medium text-slate-600 hover:text-[#0051d5] disabled:opacity-40 disabled:cursor-not-allowed">

                  Xóa lựa chọn
                </button>

                {/* Lưu lựa chọn và chuyển sang câu tiếp theo */}
                {previewIndex < questions.length - 1 ? (
                  <button
                    type="button"
                    onClick={handleNextPreview}
                    className="flex items-center justify-center gap-2 px-5 py-3 rounded-lg bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-sm font-semibold shadow-md transition-all">

                    Lưu & Tiếp theo (Câu {previewIndex + 2})
                    <ArrowRight size={17} />
                  </button>
                ) : (

                  /* Kết thúc khi đang ở câu hỏi cuối cùng */
                  <button
                    type="button"
                    onClick={closeModal}
                    className="flex items-center justify-center gap-2 px-5 py-3 rounded-lg bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-sm font-semibold shadow-md transition-all">

                    Hoàn thành xem trước
                    <CheckCircle2 size={17} />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )}
    </div>
  );
};

export default QuizEditor;
