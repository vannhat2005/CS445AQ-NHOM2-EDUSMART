import React, { useEffect, useState, useRef } from 'react';
import lessonContentService, { getLessonContentFileUrl } from '../../services/lessonContentService';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { getInstructorId, getLessonQuiz, getQuizDetail, createQuiz, generateQuizWithAI, publishQuiz } from '../../services/instructorQuizService';
import { deleteDraft } from '../../services/instructorDraftService';

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
  response?.data?.message || response?.message || 'Thực hiện thành công.';

// Lấy thông báo lỗi từ Backend
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

  // State quản lý trắc nghiệm bài học từ Backend
  const [quiz, setQuiz] = useState(null);
  const [instructorId, setInstructorId] = useState(null);
  const [quizLoading, setQuizLoading] = useState(true);
  const [quizSaving, setQuizSaving] = useState(false);
  const [quizError, setQuizError] = useState('');

  // Ngăn gửi nhiều yêu cầu xử lý trắc nghiệm cùng lúc
  const quizActionLock = useRef(false);

  // Xác định trạng thái trắc nghiệm từ dữ liệu Backend
  const quizState = !quiz ? 'none' :
    quiz.status === 'Published' ? 'published' : 'draft';

  // Lấy tên bài trắc nghiệm
  const quizTitle = quiz?.title || 'Trắc nghiệm kiểm tra kiến thức bài học';

  // Kiểm tra trạng thái đang xử lý trắc nghiệm
  const isQuizBusy = quizLoading || quizSaving;

  // State quản lý các modal trắc nghiệm
  const [showQuizMethodModal, setShowQuizMethodModal] = useState(false);
  const [showManualQuizModal, setShowManualQuizModal] = useState(false);
  const [showAIQuizModal, setShowAIQuizModal] = useState(false);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [showDeleteQuizModal, setShowDeleteQuizModal] = useState(false);

  // State dữ liệu tạo trắc nghiệm
  const [quizForm, setQuizForm] = useState({
    title: '',
    questionCount: 4,
    difficulty: 'BASIC'
  });

  // File PDF sử dụng để tạo trắc nghiệm bằng AI
  const [quizPdfFile, setQuizPdfFile] = useState(null);

  // ==================================================
  // 1. QUẢN LÝ NỘI DUNG BÀI HỌC
  // ==================================================

  // Lấy danh sách nội dung bài học từ Backend
  useEffect(() => {
    let active = true;

    const loadContents = async () => {
      setLoading(true);

      try {
        const response = await lessonContentService.getContents(
          courseId, chapterId, lessonId
        );

        const data = getResponseData(response);

        if (active) {
          setContents([...data].sort((a, b) => a.orderNum - b.orderNum));
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

  // Mở modal sửa nội dung
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

    // Chuẩn bị dữ liệu gửi Backend
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

      // Gọi API cập nhật hoặc thêm nội dung
      if (editingContent) {
        response = await lessonContentService.updateContent(
          courseId, chapterId, lessonId,
          editingContent.contentId, payload
        );
      } else {
        response = await lessonContentService.createContent(
          courseId, chapterId, lessonId, payload
        );
      }

      // Lấy thông báo thành công từ Backend
      const message = getSuccessMessage(response);

      // Tải lại danh sách nội dung
      const listResponse = await lessonContentService.getContents(
        courseId, chapterId, lessonId
      );

      const data = getResponseData(listResponse);

      setContents([...data].sort((a, b) => a.orderNum - b.orderNum));

      // Đóng modal và đặt lại dữ liệu
      setShowModal(false);
      setEditingContent(null);
      setSelectedFile(null);
      setFormData({ ...EMPTY_FORM });

      toast.success(message);

    } catch (error) {
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
        courseId, chapterId, lessonId,
        item.contentId, direction
      );

      // Tải lại danh sách sau khi thay đổi thứ tự
      const listResponse = await lessonContentService.getContents(
        courseId, chapterId, lessonId
      );

      const data = getResponseData(listResponse);

      setContents([...data].sort((a, b) => a.orderNum - b.orderNum));

      toast.success(getSuccessMessage(response));

    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setMovingId(null);
    }
  };

  // ==================================================
  // 2. LẤY TRẮC NGHIỆM BÀI HỌC TỪ BACKEND
  // ==================================================

  // Lấy thông tin bộ trắc nghiệm theo ID bài học
  const fetchLessonQuiz = async () => {
    setQuizLoading(true);
    setQuizError('');

    try {
      // Lấy ID giảng viên để truyền vào đường dẫn API
      const userId = await getInstructorId();
      setInstructorId(userId);

      // Gọi API lấy trắc nghiệm bài học
      const response = await getLessonQuiz(userId, lessonId);
      const data = response.result ?? null;

      // Cập nhật dữ liệu trắc nghiệm
      setQuiz(data);

    } catch (error) {
      console.error('Lỗi lấy trắc nghiệm bài học:', error);
      setQuizError(getErrorMessage(error));
      toast.error(getErrorMessage(error));
    } finally {
      setQuizLoading(false);
    }
  };

  // Tải lại trắc nghiệm khi truy cập hoặc quay lại từ QuizEditor
  useEffect(() => {
    let active = true;

    const loadQuiz = async () => {
      setQuizLoading(true);
      setQuizError('');
      setQuiz(null);

      try {
        const userId = await getInstructorId();
        const response = await getLessonQuiz(userId, lessonId);

        if (active) {
          setInstructorId(userId);
          setQuiz(response.result ?? null);
        }
      } catch (error) {
        if (active) {
          setQuizError(getErrorMessage(error));
          toast.error(getErrorMessage(error));
        }
      } finally {
        if (active) setQuizLoading(false);
      }
    };

    loadQuiz();

    return () => {
      active = false;
    };
  }, [courseId, chapterId, lessonId, location.key]);

  // ==================================================
  // 3. CHỌN PHƯƠNG THỨC TẠO TRẮC NGHIỆM
  // ==================================================

  // Mở modal chọn phương thức
  const handleOpenQuizMethod = () => {
    if (isQuizBusy || quizError || quizState !== 'none') return;

    setShowQuizMethodModal(true);
  };

  // Chọn phương thức tạo trắc nghiệm
  const handleChooseQuizMethod = (method) => {
    if (isQuizBusy || quizError || quizState !== 'none') return;

    setShowQuizMethodModal(false);

    // Khởi tạo dữ liệu mặc định
    setQuizForm({
      title: `Trắc nghiệm kiểm tra kiến thức: ${lessonTitle}`.slice(0, 255),
      questionCount: 4,
      difficulty: 'BASIC'
    });

    setQuizPdfFile(null);

    // Mở modal tương ứng với phương thức được chọn
    if (method === 'MANUAL') {
      setShowManualQuizModal(true);
    } else if (method === 'AI') {
      setShowAIQuizModal(true);
    }
  };

  // Đóng modal tạo trắc nghiệm thủ công
  const handleCloseManualQuizModal = () => {
    if (quizActionLock.current) return;
    setShowManualQuizModal(false);
  };

  // Đóng modal tạo trắc nghiệm bằng AI
  const handleCloseAIQuizModal = () => {
    if (quizActionLock.current) return;
    setShowAIQuizModal(false);
    setQuizPdfFile(null);
  };

  // ==================================================
  // 4. ĐIỀU HƯỚNG ĐẾN QUIZEDITOR
  // ==================================================

  // Điều hướng đến trang biên soạn trắc nghiệm
  const navigateToQuizEditor = (quizData, readOnly = false) => {
    navigate(
      `/instructor/courses/${courseId}/chapters/${chapterId}/lessons/${lessonId}/quiz`,
      {
        state: {
          instructorId,
          courseTitle,
          chapterTitle,
          lessonTitle,
          type: 'LESSON_QUIZ',
          method: 'MANUAL',
          readOnly,

          // Trắc nghiệm đã được tạo trong Database
          isNew: false,

          // Trắc nghiệm bài học không cần modal cấu hình
          showConfigModal: false,

          // Truyền dữ liệu trắc nghiệm sang QuizEditor
          quiz: {
            ...quizData,
            courseId: Number(courseId),
            chapterId: Number(chapterId),
            lessonId: Number(lessonId),
            timeLimit: null,
            passingScore: null
          }
        }
      }
    );
  };

  // ==================================================
  // 5. TẠO TRẮC NGHIỆM THỦ CÔNG
  // ==================================================

  const handleCreateManualQuiz = async (e) => {
    e.preventDefault();

    if (isQuizBusy || quizError || !instructorId ||
        quizActionLock.current) return;

    const title = quizForm.title.trim();

    // Kiểm tra tên bài trắc nghiệm
    if (!title) {
      toast.error('Vui lòng nhập tên bài trắc nghiệm.');
      return;
    }

    // Kiểm tra độ dài tên bài trắc nghiệm
    if (title.length > 255) {
      toast.error('Tên bài trắc nghiệm không được vượt quá 255 ký tự.');
      return;
    }

    // Mỗi bài học chỉ có một bộ trắc nghiệm
    if (quizState !== 'none') {
      toast.error('Bài học đã có bộ trắc nghiệm.');
      return;
    }

    quizActionLock.current = true;
    setQuizSaving(true);

    try {
      // Dữ liệu tạo trắc nghiệm bài học
      const payload = {
        title,
        lessonId: Number(lessonId),
        chapterId: null,
        timeLimit: null,
        passingScore: null
      };

      // Gọi API tạo bộ trắc nghiệm bản nháp
      const response = await createQuiz(instructorId, payload);
      const createdQuiz = response.result;

      // Kiểm tra dữ liệu trả về
      if (!createdQuiz?.quizId) {
        throw new Error('Không xác định được ID bộ trắc nghiệm.');
      }

      // Cập nhật dữ liệu từ Backend
      setQuiz(createdQuiz);

      // Đóng modal tạo trắc nghiệm
      setShowManualQuizModal(false);

      // Thông báo thành công
      toast.success(
        response.message || 'Tạo bản nháp trắc nghiệm thành công.'
      );

      // Chuyển sang trang biên soạn câu hỏi
      navigateToQuizEditor(createdQuiz);

    } catch (error) {
      toast.error(getErrorMessage(error));

      // Đồng bộ lại dữ liệu nếu có lỗi khi tạo
      await fetchLessonQuiz();
    } finally {
      setQuizSaving(false);
      quizActionLock.current = false;
    }
  };

  // ==================================================
  // 6. TẠO TRẮC NGHIỆM BẰNG AI
  // ==================================================

  // Kiểm tra và chọn tài liệu PDF để tạo trắc nghiệm bằng AI
  const handleSelectQuizPdf = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Kiểm tra định dạng tài liệu
    if (!/\.pdf$/i.test(file.name)) {
      toast.error('Vui lòng chọn tài liệu có định dạng PDF.');
      e.target.value = '';
      return;
    }

    // Kiểm tra dung lượng tài liệu
    if (file.size === 0) {
      toast.error('Tài liệu PDF không được để trống.');
      e.target.value = '';
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Tài liệu PDF không được vượt quá 10 MB.');
      e.target.value = '';
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

  // Tạo câu hỏi trắc nghiệm bằng AI
  const handleCreateAIQuiz = async (e) => {
    e.preventDefault();

    if (isQuizBusy || quizError || !instructorId || quizActionLock.current) return;

    const title = quizForm.title.trim();

    // Kiểm tra tên bài trắc nghiệm
    if (!title) {
      toast.error('Vui lòng nhập tên bài trắc nghiệm.');
      return;
    }

    if (title.length > 255) {
      toast.error('Tên bài trắc nghiệm không được vượt quá 255 ký tự.');
      return;
    }

    // Kiểm tra tài liệu PDF
    if (!quizPdfFile) {
      toast.error('Vui lòng tải lên tài liệu PDF bài học.');
      return;
    }

    // Kiểm tra bài học đã có trắc nghiệm hay chưa
    if (quizState !== 'none') {
      toast.error('Bài học đã có bộ trắc nghiệm.');
      return;
    }

    // Kiểm tra số lượng câu hỏi
    const questionCount = Number(quizForm.questionCount);
    if (!Number.isInteger(questionCount) || questionCount < 3 || questionCount > 8) {
      toast.error('Số lượng câu hỏi phải từ 3 đến 8.');
      return;
    }

    // Kiểm tra độ khó mục tiêu
    if (!['BASIC', 'INTERMEDIATE', 'ADVANCED'].includes(quizForm.difficulty)) {
      toast.error('Độ khó mục tiêu không hợp lệ.');
      return;
    }

    // Chuẩn bị dữ liệu gửi đến Backend khi tích hợp API AI
    const payload = new FormData();
    payload.append('title', title);
    payload.append('file', quizPdfFile);
    payload.append('questionCount', questionCount);
    payload.append('difficulty', quizForm.difficulty);
    payload.append('lessonId', lessonId);

    quizActionLock.current = true;
    setQuizSaving(true);

    try {
      const response = await generateQuizWithAI(instructorId, payload);
      const createdQuiz = response.result;

      if (!createdQuiz?.quizId || !Array.isArray(createdQuiz.questions)) {
        throw new Error('Backend không trả về bộ trắc nghiệm hợp lệ.');
      }

      setQuiz(createdQuiz);
      setShowAIQuizModal(false);
      setQuizPdfFile(null);
      toast.success(response.message || `AI đã tạo ${createdQuiz.questions.length} câu hỏi.`);
      navigateToQuizEditor(createdQuiz);
    } catch (error) {
      toast.error(getErrorMessage(error));
      await fetchLessonQuiz();
    } finally {
      setQuizSaving(false);
      quizActionLock.current = false;
    }
  };

  // ==================================================
  // 7. XEM VÀ CHỈNH SỬA TRẮC NGHIỆM
  // ==================================================

  // Xem bài trắc nghiệm ở chế độ chỉ đọc
  const handleViewQuiz = () => {
    if (!quiz || isQuizBusy || quizError) return;

    navigateToQuizEditor(quiz, true);
  };

  // Tiếp tục chỉnh sửa bài trắc nghiệm bản nháp
  const handleEditQuiz = () => {
    if (!quiz || quizState !== 'draft' ||
        isQuizBusy || quizError) return;

    navigateToQuizEditor(quiz, false);
  };

  // ==================================================
  // 8. XUẤT BẢN TRẮC NGHIỆM
  // ==================================================

  // Xuất bản trắc nghiệm thông qua Backend
  const handlePublishQuiz = async () => {
    if (!quiz || quizState !== 'draft' ||
        isQuizBusy || quizError || quizActionLock.current) return;

    quizActionLock.current = true;
    setQuizSaving(true);

    try {
      // Lấy chi tiết bộ trắc nghiệm mới nhất
      const detailResponse = await getQuizDetail(
        instructorId, quiz.quizId
      );

      const quizDetail = detailResponse.result;

      // Kiểm tra trạng thái bộ trắc nghiệm
      if (!quizDetail || quizDetail.status !== 'Draft') {
        toast.error('Bài trắc nghiệm không còn ở trạng thái bản nháp.');
        setShowPublishModal(false);
        await fetchLessonQuiz();
        return;
      }

      const questions = quizDetail.questions;

      // Kiểm tra số lượng câu hỏi tối thiểu
      if (!Array.isArray(questions) || questions.length < 3) {
        toast.error('Bài trắc nghiệm phải có ít nhất 3 câu hỏi.');
        return;
      }

      // Kiểm tra nội dung và đáp án của từng câu hỏi
      const invalidQuestion = questions.findIndex((question) =>
        !question.content?.trim() ||
        !Array.isArray(question.options) ||
        question.options.length < 2 ||
        question.options.length > 6 ||
        question.options.some((option) => !option?.trim()) ||
        !Number.isInteger(question.correctAnswer) ||
        question.correctAnswer < 0 ||
        question.correctAnswer >= question.options.length ||
        new Set(
          question.options.map((option) => option.trim().toLowerCase())
        ).size !== question.options.length
      );

      // Thông báo câu hỏi không hợp lệ
      if (invalidQuestion !== -1) {
        toast.error(`Câu hỏi ${invalidQuestion + 1} chưa hợp lệ.`);
        return;
      }

      // Gọi API xuất bản trắc nghiệm
      const response = await publishQuiz(instructorId, quiz.quizId);

      // Đóng modal xác nhận
      setShowPublishModal(false);

      // Thông báo thành công
      toast.success(
        response.message || 'Xuất bản trắc nghiệm thành công.'
      );

      // Tải lại dữ liệu trắc nghiệm từ Database
      await fetchLessonQuiz();

    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setQuizSaving(false);
      quizActionLock.current = false;
    }
  };

  // ==================================================
  // 9. XÓA BẢN NHÁP TRẮC NGHIỆM
  // ==================================================

  // Xóa bản nháp trắc nghiệm thông qua Backend
  const handleDeleteQuiz = async () => {
    if (!quiz || quizState !== 'draft' ||
        isQuizBusy || quizError || quizActionLock.current) return;

    quizActionLock.current = true;
    setQuizSaving(true);

    try {
      // Gọi API xóa bản nháp và dữ liệu liên quan
      const response = await deleteDraft(instructorId, quiz.quizId);

      // Cập nhật giao diện sau khi xóa thành công
      setQuiz(null);
      setShowDeleteQuizModal(false);
      setQuizPdfFile(null);

      // Thông báo kết quả từ Backend
      toast.success(
        response?.message || 'Xóa bản nháp trắc nghiệm thành công.'
      );

      // Đồng bộ lại dữ liệu từ Database
      await fetchLessonQuiz();

    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setQuizSaving(false);
      quizActionLock.current = false;
    }
  };

  // ==================================================
  // 10. GIAO DIỆN QUẢN LÝ NỘI DUNG BÀI HỌC
  // ==================================================

  return (
    <div className="flex flex-col w-full px-2 pt-4 pb-12 gap-6">

      {/* Breadcrumb */}
      <div className="flex items-center justify-between gap-4">
        <nav className="flex items-center flex-wrap gap-2 text-xs text-gray-500">
          <Link to="/instructor/courses" className="hover:text-blue-600">
            Khóa học được phân công
          </Link>

          <span className="material-symbols-outlined text-[14px]">
            chevron_right
          </span>

          <Link to={`/instructor/courses/${courseId}`} className="hover:text-blue-600">
            Chi tiết khóa học
          </Link>

          <span className="material-symbols-outlined text-[14px]">
            chevron_right
          </span>

          <Link to={`/instructor/courses/${courseId}/chapters`} className="hover:text-blue-600">
            Quản lý chương học
          </Link>

          <span className="material-symbols-outlined text-[14px]">
            chevron_right
          </span>

          <Link to={lessonPath} className="hover:text-blue-600">
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
                  <td colSpan={6} className="py-12 text-center text-gray-500">
                    Đang tải nội dung...
                  </td>
                </tr>
              ) : contents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-500">
                    Bài học này chưa có nội dung
                  </td>
                </tr>
              ) : (
                contents.map((item, index) => (
                  <tr key={item.contentId} className="hover:bg-gray-50/60">
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

      {/* Trắc nghiệm bài học */}
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
              onClick={handleOpenQuizMethod}
              disabled={isQuizBusy || !!quizError}
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

                {/* Xem trắc nghiệm ở cả trạng thái Draft và Published */}
                <button
                  onClick={handleViewQuiz}
                  disabled={isQuizBusy || !!quizError}
                  className="px-3 py-1.5 rounded-lg bg-white hover:bg-gray-100 text-gray-700 text-xs font-semibold border border-gray-200"
                >
                  Xem
                </button>

                {/* Các thao tác chỉ dành cho trắc nghiệm bản nháp */}
                {quizState === 'draft' && (
                  <>
                    <button
                      onClick={handleEditQuiz}
                      disabled={isQuizBusy || !!quizError}
                      className="px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 text-xs font-semibold border border-blue-200"
                    >
                      Tiếp tục chỉnh sửa
                    </button>

                    <button
                      onClick={() => setShowPublishModal(true)}
                      disabled={isQuizBusy || !!quizError}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
                    >
                      Xuất bản
                    </button>

                    <button
                      onClick={() => setShowDeleteQuizModal(true)}
                      disabled={isQuizBusy || !!quizError}
                      className="px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 text-xs font-semibold border border-red-200"
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

                      <span className={`w-2 h-2 rounded-full ${status.color}`} />

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
                    src={getLessonContentFileUrl(previewContent.contentData)}
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
                    src={getLessonContentFileUrl(previewContent.contentData)}
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

      {/* Modal tạo bộ trắc nghiệm thủ công */}
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
                onClick={handleCloseManualQuizModal}
                disabled={quizSaving}
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
                    placeholder="Nhập tên bài trắc nghiệm"
                    disabled={quizSaving}
                    onChange={(e) =>
                      setQuizForm({
                        ...quizForm,
                        title: e.target.value
                      })
                    }
                    className="w-full h-10 px-3 rounded-lg bg-[#eff4ff] border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>

              <div className="px-6 py-4 bg-[#eff4ff] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={handleCloseManualQuizModal}
                  disabled={quizSaving}
                  className="px-4 py-2 rounded-lg bg-[#e5eeff] hover:bg-blue-100 text-gray-700 text-sm font-semibold"
                >
                  Hủy
                </button>

                <button
                  type="submit"
                  disabled={isQuizBusy || !!quizError}
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

      {/* Modal tạo trắc nghiệm bằng AI */}
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
                onClick={handleCloseAIQuizModal}
                className="text-gray-500 hover:text-gray-700"
              >
                <span className="material-symbols-outlined text-[20px]">
                  close
                </span>
              </button>
            </div>

            <form
              onSubmit={handleCreateAIQuiz}
              className="flex flex-col min-h-0"
              noValidate
            >
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
                    placeholder="Nhập tên bài trắc nghiệm"
                    onChange={(e) =>
                      setQuizForm({
                        ...quizForm,
                        title: e.target.value
                      })
                    }
                    className="w-full h-10 px-3 rounded-lg bg-[#eff4ff] border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                {/* Tải lên tài liệu PDF */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-700">
                    Tải lên tài liệu PDF bài học
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
                      onChange={(e) =>
                        setQuizForm({
                          ...quizForm,
                          questionCount: Number(e.target.value)
                        })
                      }
                      className="w-full h-10 px-3 rounded-lg bg-[#eff4ff] border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                    >
                      {[3, 4, 5, 6, 7, 8].map((count) => (
                        <option key={count} value={count}>{count} câu hỏi</option>
                      ))}
                    </select>
                  </div>

                  {/* Độ khó mục tiêu */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-gray-700">
                      Độ khó mục tiêu
                    </label>

                    <select
                      value={quizForm.difficulty}
                      onChange={(e) =>
                        setQuizForm({
                          ...quizForm,
                          difficulty: e.target.value
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
                  disabled={isQuizBusy || !!quizError}
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
                disabled={quizSaving}
                className="flex-1 h-10 rounded-lg bg-gray-100 text-gray-700 text-sm font-semibold"
              >
                Hủy
              </button>

              <button
                onClick={handlePublishQuiz}
                disabled={isQuizBusy || !!quizError}
                className="flex-1 h-10 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold"
              >
                Xác nhận xuất bản
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal xác nhận xóa bản nháp trắc nghiệm */}
      {showDeleteQuizModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white rounded-xl shadow-xl p-6 text-center border border-gray-200">
            <div className="w-14 h-14 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-[32px]">
                delete
              </span>
            </div>

            <h3 className="text-lg font-bold text-gray-900 mb-2">
              Xóa bản nháp trắc nghiệm?
            </h3>

            <p className="text-sm text-gray-600 mb-4">
              Bạn có chắc chắn muốn xóa bộ trắc nghiệm{' '}
              <strong>{quizTitle}</strong> không?
              Hành động này không thể hoàn tác.
            </p>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
              <button
                onClick={() => setShowDeleteQuizModal(false)}
                disabled={quizSaving}
                className="flex-1 h-10 rounded-lg bg-gray-100 text-gray-700 text-sm font-semibold"
              >
                Hủy
              </button>

              <button
                onClick={handleDeleteQuiz}
                disabled={isQuizBusy || !!quizError}
                className="flex-1 h-10 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-semibold"
              >
                Xác nhận xóa
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default ManageLessonContent;
