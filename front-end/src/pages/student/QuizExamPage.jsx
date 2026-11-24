import React, { useState, useEffect, useMemo, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  getStudentQuizDetail,
  submitStudentQuiz,
} from "../../services/student/quizService";

export default function QuizExamPage() {
  const { courseId, lessonId, quizId } = useParams();
  const navigate = useNavigate();

  // State nạp dữ liệu
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [quizData, setQuizData] = useState(null);

  // State làm bài
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({}); // questionId -> answerId
  const [flaggedQuestions, setFlaggedQuestions] = useState({}); // questionId -> boolean
  const [remainingSeconds, setRemainingSeconds] = useState(45 * 60);

  // State Modal
  const [showGuide, setShowGuide] = useState(false);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [resultData, setResultData] = useState(null);

  // State màn hình kết quả sau khi nộp bài
  const [resultFilter, setResultFilter] = useState("ALL"); // ALL | INCORRECT | CORRECT | EXPLANATION
  const [openExplanations, setOpenExplanations] = useState({}); // questionId -> boolean

  const initialTimeRef = useRef(45 * 60);
  const startTimeRef = useRef(Date.now());

  const isTimed = Boolean(quizData?.isTimed);

  // 1. Tải đề thi từ Backend
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");

    getStudentQuizDetail(quizId || 1, controller.signal)
      .then((data) => {
        setQuizData(data);
        startTimeRef.current = Date.now();
        if (data?.isTimed) {
          const timeLimitSecs = (data.timeLimit || 45) * 60;
          setRemainingSeconds(timeLimitSecs);
          initialTimeRef.current = timeLimitSecs;
        } else {
          setRemainingSeconds(0);
          initialTimeRef.current = 0;
        }
      })
      .catch((err) => {
        if (controller.signal.aborted) return;
        console.error("Lỗi tải bài trắc nghiệm:", err);
        setError(err?.message || "Không thể tải đề kiểm tra. Vui lòng thử lại.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [quizId]);

  // 2. Đồng hồ đếm ngược thời gian làm bài (CHỈ DÀNH CHO BÀI KIỂM TRA TÍNH GIỜ)
  useEffect(() => {
    if (loading || resultData || !isTimed || remainingSeconds <= 0) return;

    const timer = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          // Hết giờ tự động nộp bài
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [loading, resultData, isTimed, remainingSeconds]);

  const questions = useMemo(() => quizData?.questions || [], [quizData]);
  const totalQuestions = questions.length;
  const currentQuestion = questions[currentIndex] || null;

  // Thống kê tiến độ
  const answeredCount = Object.keys(selectedAnswers).length;
  const unansweredCount = Math.max(0, totalQuestions - answeredCount);
  const flaggedCount = Object.values(flaggedQuestions).filter(Boolean).length;
  const progressPercent = totalQuestions > 0 ? Math.round((answeredCount / totalQuestions) * 100) : 0;

  const isCurrentFlagged = currentQuestion ? !!flaggedQuestions[currentQuestion.questionId] : false;

  // Điều hướng câu hỏi
  const goToQuestion = (index) => {
    if (index >= 0 && index < totalQuestions) {
      setCurrentIndex(index);
    }
  };

  const goToPrevious = () => {
    if (currentIndex > 0) setCurrentIndex((prev) => prev - 1);
  };

  const goToNext = () => {
    if (currentIndex < totalQuestions - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setShowSubmitConfirm(true);
    }
  };

  // Chọn phương án
  const selectOption = (questionId, answerId) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: answerId,
    }));
  };

  // Xóa lựa chọn của câu hiện tại
  const clearCurrentSelection = () => {
    if (!currentQuestion) return;
    setSelectedAnswers((prev) => {
      const next = { ...prev };
      delete next[currentQuestion.questionId];
      return next;
    });
  };

  // Gắn / gỡ cờ đánh dấu
  const toggleCurrentFlag = () => {
    if (!currentQuestion) return;
    setFlaggedQuestions((prev) => ({
      ...prev,
      [currentQuestion.questionId]: !prev[currentQuestion.questionId],
    }));
  };

  // Nộp bài
  const executeSubmit = async () => {
    setShowSubmitConfirm(false);
    if (submitting) return;

    setSubmitting(true);
    const timeSpent = isTimed
      ? Math.max(0, initialTimeRef.current - remainingSeconds)
      : Math.max(1, Math.round((Date.now() - startTimeRef.current) / 1000));

    try {
      const response = await submitStudentQuiz(quizId || 1, {
        timeSpentSeconds: timeSpent,
        answers: selectedAnswers,
      });
      setResultData(response);
      toast.success("Nộp bài kiểm tra thành công!");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      console.error("Lỗi nộp bài:", err);
      toast.error(err?.message || "Không thể gửi kết quả nộp bài. Vui lòng thử lại!");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAutoSubmit = () => {
    toast.warn("Đã hết thời gian làm bài! Hệ thống tự động nộp bài.");
    executeSubmit();
  };

  // Format thời gian hiển thị
  const mins = String(Math.floor(remainingSeconds / 60)).padStart(2, "0");
  const secs = String(remainingSeconds % 60).padStart(2, "0");

  const backUrl = courseId && lessonId
    ? `/student/courses/${courseId}/lessons/${lessonId}`
    : courseId
    ? `/student/courses/${courseId}`
    : "/student/courses";

  // Khi đang tải
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-on-surface">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="font-headline-sm text-headline-sm text-primary font-bold">Đang tải đề thi...</p>
        <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">Hệ thống đang chuẩn bị bộ câu hỏi trắc nghiệm</p>
      </div>
    );
  }

  // Khi có lỗi
  if (error && !quizData) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-error-container text-error flex items-center justify-center mb-4">
          <span className="material-symbols-outlined text-[32px]">error</span>
        </div>
        <h2 className="font-headline-sm text-headline-sm text-on-surface mb-2">Không thể tải bài kiểm tra</h2>
        <p className="font-body-md text-body-md text-on-surface-variant max-w-md mb-6">{error}</p>
        <button
          onClick={() => navigate(backUrl)}
          className="px-6 py-2.5 rounded-xl bg-primary text-on-primary font-label-lg text-label-lg shadow-sm hover:bg-primary-container transition-all cursor-pointer"
        >
          Quay lại khóa học
        </button>
      </div>
    );
  }

  // MÀN HÌNH HIỂN THỊ KẾT QUẢ SAU KHI NỘP BÀI (CHUẨN THEO GIAO DIỆN MẪU)
  if (resultData) {
    const courseTitle = resultData.courseTitle || quizData?.courseTitle || "Lập trình Spring Boot 3 & Microservices";
    const chapterTitle = resultData.chapterTitle || quizData?.chapterTitle || "Chương 2";
    const quizTitle = resultData.quizTitle || quizData?.title || "Hoàn thành bài kiểm tra: Lập trình Spring Boot 3 & JPA";
    const scoreNum = resultData.score != null ? Number(resultData.score) : 0;
    const percentageNum = resultData.percentage != null ? Number(resultData.percentage) : 0;
    const correctCount = resultData.correctCount != null ? resultData.correctCount : 0;
    const incorrectCount = resultData.incorrectCount != null ? resultData.incorrectCount : 0;
    const unansweredCount = resultData.unansweredCount != null ? resultData.unansweredCount : 0;
    const totalQ = resultData.totalQuestions || totalQuestions || (correctCount + incorrectCount + unansweredCount) || 1;
    const isPassed = Boolean(resultData.passed);
    const isTimedExam = Boolean(resultData.isTimed ?? quizData?.isTimed);
    const timeLimitMins = resultData.timeLimit || quizData?.timeLimit || 45;
    const timeSpentSecs = resultData.timeSpentSeconds != null ? resultData.timeSpentSeconds : Math.round((Date.now() - startTimeRef.current) / 1000);
    const timeSpentMins = Math.max(1, Math.round(timeSpentSecs / 60));

    // Stroke dashoffset: chu vi đường tròn r=50 là 314.159
    const strokeDashoffset = 314.159 * (1 - Math.min(10, Math.max(0, scoreNum)) / 10);

    // Thời gian nộp bài định dạng đẹp
    const submitDate = resultData.submittedAt ? new Date(resultData.submittedAt) : new Date();
    const hours = String(submitDate.getHours()).padStart(2, "0");
    const minutes = String(submitDate.getMinutes()).padStart(2, "0");
    const day = String(submitDate.getDate()).padStart(2, "0");
    const month = String(submitDate.getMonth() + 1).padStart(2, "0");
    const year = submitDate.getFullYear();
    const formattedSubmitTime = `${hours}:${minutes}, ${day}/${month}/${year}`;

    // Xếp loại học lực
    let rankText = "Khá giỏi";
    if (scoreNum >= 9.0) rankText = "Xuất sắc";
    else if (scoreNum >= 8.0) rankText = "Giỏi";
    else if (scoreNum >= 6.5) rankText = "Khá giỏi";
    else if (scoreNum >= 5.0) rankText = "Trung bình";
    else rankText = "Chưa đạt";

    // Map phản hồi đáp án từng câu hỏi
    const feedbackMap = {};
    if (resultData.feedback && Array.isArray(resultData.feedback)) {
      resultData.feedback.forEach((item) => {
        if (item.questionId != null) {
          feedbackMap[item.questionId] = item;
        }
      });
    }

    const toggleExplanation = (questionId) => {
      setOpenExplanations((prev) => ({
        ...prev,
        [questionId]: !prev[questionId],
      }));
    };

    const explanationCount = questions.filter((q) => {
      const fb = feedbackMap[q.questionId] || {};
      return Boolean(q.explanation || fb.explanation);
    }).length;

    const filteredQuestions = questions.filter((q) => {
      const fb = feedbackMap[q.questionId] || {};
      const isCorrect = Boolean(fb.isCorrect);
      if (resultFilter === "CORRECT") return isCorrect;
      if (resultFilter === "INCORRECT") return !isCorrect;
      if (resultFilter === "EXPLANATION") return Boolean(q.explanation || fb.explanation);
      return true;
    });

    return (
      <div className="min-h-screen bg-background text-on-surface flex flex-col font-sans">
        <main className="w-full max-w-[1280px] mx-auto px-4 md:px-margin py-8 flex-1">
          <div className="flex flex-col gap-6">

            {/* 1. TOP HEADER & BREADCRUMB & BANNER */}
            <section className="flex flex-col gap-space-xs">
              <nav className="flex items-center gap-space-xs font-label-md text-label-md text-on-surface-variant overflow-x-auto whitespace-nowrap">
                <span
                  onClick={() => navigate("/student/my-courses")}
                  className="hover:text-primary cursor-pointer transition-colors"
                >
                  Khóa học của tôi
                </span>
                <span className="material-symbols-outlined text-[14px] text-outline">chevron_right</span>
                <span
                  onClick={() => navigate(courseId ? `/student/courses/${courseId}` : "/student/my-courses")}
                  className="hover:text-primary cursor-pointer transition-colors"
                >
                  {courseTitle}
                </span>
                <span className="material-symbols-outlined text-[14px] text-outline">chevron_right</span>
                <span className="text-on-surface font-title-sm text-title-sm font-semibold">
                  Kết quả bài kiểm tra {chapterTitle}
                </span>
              </nav>

              {/* Banner chúc mừng */}
              <div className="bg-surface-container-high/70 backdrop-blur-md rounded-xl p-space-md flex items-center justify-between shadow-sm border border-surface-variant/30">
                <div className="flex items-center gap-space-sm">
                  <div className="w-10 h-10 rounded-full bg-primary-container text-on-primary flex items-center justify-center shadow-sm shrink-0">
                    <span className="material-symbols-outlined text-[24px]">workspace_premium</span>
                  </div>
                  <div>
                    <div className="font-label-sm text-label-sm uppercase text-primary font-bold tracking-wider">
                      {isPassed ? `Chứng nhận tiến độ ${chapterTitle}` : `Kết quả thi ${chapterTitle}`}
                    </div>
                    <h1 className="font-headline-sm text-headline-sm text-on-surface font-bold">
                      {quizTitle}
                    </h1>
                  </div>
                </div>
                <div className="hidden sm:flex items-center gap-space-xs bg-surface-container-lowest px-space-sm py-1 rounded-full text-on-surface-variant font-label-md text-label-md shadow-sm">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <span>Đã lưu kết quả thi</span>
                </div>
              </div>
            </section>

            {/* 2. KHỐI TỔNG QUAN KẾT QUẢ (Result Summary Card) */}
            <section className="bg-surface-container-lowest rounded-xl p-space-md sm:p-space-xl shadow-md flex flex-col md:flex-row gap-space-lg items-center relative overflow-hidden border border-surface-variant/30">
              {/* Ambient decorative aura */}
              <div className="absolute -right-20 -top-20 w-64 h-64 bg-primary-container/10 rounded-full blur-3xl pointer-events-none"></div>

              {/* Nửa bên trái: Điểm số, Progress Ring & Badge */}
              <div className="w-full md:w-5/12 flex flex-col items-center text-center p-space-md bg-surface-container-low rounded-lg relative">
                <div className="relative w-40 h-40 flex items-center justify-center">
                  {/* Circular SVG Progress Ring */}
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
                    <circle
                      className="text-surface-container-highest"
                      cx="60"
                      cy="60"
                      fill="transparent"
                      r="50"
                      stroke="currentColor"
                      strokeWidth="10"
                    ></circle>
                    <circle
                      className={isPassed ? "text-primary-container" : "text-amber-500"}
                      cx="60"
                      cy="60"
                      fill="transparent"
                      r="50"
                      stroke="currentColor"
                      strokeDasharray="314.159"
                      strokeDashoffset={strokeDashoffset}
                      strokeLinecap="round"
                      strokeWidth="10"
                    ></circle>
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="font-display-lg text-display-lg-mobile sm:text-[44px] font-bold text-on-surface leading-none">
                      {scoreNum.toFixed(1)}
                    </span>
                    <span className="font-label-md text-label-md text-on-surface-variant font-semibold mt-0.5">
                      Thang điểm 10
                    </span>
                  </div>
                </div>

                <div className="mt-space-sm flex flex-col items-center gap-1.5">
                  {isPassed ? (
                    <div className="inline-flex items-center gap-1.5 px-space-md py-1 bg-emerald-50 text-emerald-700 font-label-lg text-label-lg rounded-full shadow-sm">
                      <span className="material-symbols-outlined text-[18px]">verified</span>
                      <span>ĐẠT YÊU CẦU</span>
                    </div>
                  ) : (
                    <div className="inline-flex items-center gap-1.5 px-space-md py-1 bg-rose-50 text-rose-700 font-label-lg text-label-lg rounded-full shadow-sm">
                      <span className="material-symbols-outlined text-[18px]">cancel</span>
                      <span>CHƯA ĐẠT</span>
                    </div>
                  )}

                  <p className="font-title-sm text-title-sm text-on-surface mt-1 font-semibold">
                    {rankText} • Đạt {percentageNum}% mục tiêu
                  </p>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    {isPassed
                      ? `Đủ điều kiện nhận tín chỉ ${chapterTitle}`
                      : "Cần đạt tối thiểu 70% để hoàn thành mục tiêu"}
                  </p>
                </div>
              </div>

              {/* Nửa bên phải: Thống kê chi tiết & Action Buttons */}
              <div className="w-full md:w-7/12 flex flex-col justify-between gap-space-md">
                {/* Metadata */}
                <div className="grid grid-cols-2 gap-space-sm">
                  <div className="p-space-sm bg-surface-container-low rounded-lg flex items-center gap-space-sm">
                    <div className="w-9 h-9 rounded-lg bg-surface-container-high flex items-center justify-center text-primary shrink-0">
                      <span className="material-symbols-outlined text-[20px]">timer</span>
                    </div>
                    <div>
                      <div className="font-label-sm text-label-sm text-on-surface-variant">Thời gian làm bài</div>
                      <div className="font-title-sm text-title-sm text-on-surface font-semibold">
                        {isTimedExam
                          ? `${timeSpentMins} phút / ${timeLimitMins} phút`
                          : `${timeSpentMins} phút (Tự do)`}
                      </div>
                    </div>
                  </div>

                  <div className="p-space-sm bg-surface-container-low rounded-lg flex items-center gap-space-sm">
                    <div className="w-9 h-9 rounded-lg bg-surface-container-high flex items-center justify-center text-primary shrink-0">
                      <span className="material-symbols-outlined text-[20px]">event_available</span>
                    </div>
                    <div>
                      <div className="font-label-sm text-label-sm text-on-surface-variant">Thời gian nộp bài</div>
                      <div className="font-title-sm text-title-sm text-on-surface font-semibold">
                        {formattedSubmitTime}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Thống kê nhanh thanh số lượng */}
                <div className="flex flex-col gap-space-xs">
                  <div className="flex justify-between font-label-md text-label-md text-on-surface-variant">
                    <span>Tỷ lệ trả lời ({correctCount + incorrectCount}/{totalQ} câu)</span>
                    <span className="text-on-surface font-semibold">Tổng: {totalQ} câu hỏi</span>
                  </div>

                  {/* Segmented Progress Bar */}
                  <div className="w-full h-3 bg-surface-container-highest rounded-full overflow-hidden flex">
                    <div
                      className="h-full bg-emerald-500 transition-all duration-500"
                      style={{ width: `${(correctCount / totalQ) * 100}%` }}
                      title={`${correctCount} câu đúng`}
                    ></div>
                    <div
                      className="h-full bg-rose-500 transition-all duration-500"
                      style={{ width: `${(incorrectCount / totalQ) * 100}%` }}
                      title={`${incorrectCount} câu sai`}
                    ></div>
                    <div
                      className="h-full bg-amber-400 transition-all duration-500"
                      style={{ width: `${(unansweredCount / totalQ) * 100}%` }}
                      title={`${unansweredCount} câu chưa làm`}
                    ></div>
                  </div>

                  {/* Legend indicators */}
                  <div className="flex flex-wrap items-center gap-space-md pt-1 font-label-md text-label-md">
                    <div className="flex items-center gap-1.5 text-emerald-700 font-semibold">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                      <span>{correctCount} Đúng ({scoreNum.toFixed(1)}đ)</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-rose-700 font-semibold">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                      <span>{incorrectCount} Sai (0đ)</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-on-surface-variant font-medium">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
                      <span>{unansweredCount} Bỏ qua</span>
                    </div>
                  </div>
                </div>

                {/* Notice: Single Attempt Policy */}
                <div className="bg-surface-container-low px-space-sm py-2 rounded-lg flex items-center gap-space-xs font-label-sm text-label-sm text-on-surface-variant">
                  <span className="material-symbols-outlined text-[16px] text-outline">lock</span>
                  <span>Bài kiểm tra tính điểm trực tiếp và được lưu vào học bạ theo quy chế đào tạo.</span>
                </div>

                {/* Primary Actions: TUYỆT ĐỐI KHÔNG CÓ NÚT RETAKE */}
                <div className="flex flex-col sm:flex-row items-center gap-space-sm pt-space-xs">
                  <button
                    onClick={() => navigate(backUrl)}
                    className="w-full sm:flex-1 py-3 px-space-md bg-primary-container hover:bg-primary text-on-primary font-title-sm text-title-sm rounded-lg flex items-center justify-center gap-space-xs shadow-md transition-all cursor-pointer"
                  >
                    <span>Tiếp tục bài học tiếp theo</span>
                    <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
                  </button>
                  <button
                    onClick={() => navigate(courseId ? `/student/courses/${courseId}` : "/student/my-courses")}
                    className="w-full sm:w-auto py-3 px-space-md bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-title-sm text-title-sm rounded-lg flex items-center justify-center gap-space-xs transition-colors cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[20px]">dashboard</span>
                    <span>Quay lại khóa học</span>
                  </button>
                </div>
              </div>
            </section>

            {/* 3. THANH BỘ LỌC ĐÁP ÁN (Review Filter & Tabs) */}
            <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm bg-surface-container-lowest p-space-sm rounded-xl shadow-sm border border-surface-variant/30">
              <div className="flex items-center gap-space-xs overflow-x-auto pb-1 sm:pb-0">
                <button
                  type="button"
                  onClick={() => setResultFilter("ALL")}
                  className={`filter-btn px-space-sm py-1.5 rounded-lg font-label-lg text-label-lg flex items-center gap-1.5 transition-colors cursor-pointer ${
                    resultFilter === "ALL"
                      ? "bg-primary-container text-on-primary font-bold shadow-xs"
                      : "bg-surface-container text-on-surface hover:bg-surface-container-high"
                  }`}
                >
                  <span>Tất cả câu hỏi</span>
                  <span className={`px-1.5 py-0.5 rounded-full text-xs ${resultFilter === "ALL" ? "bg-on-primary/20" : "bg-surface-container-highest"}`}>
                    {totalQ}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setResultFilter("INCORRECT")}
                  className={`filter-btn px-space-sm py-1.5 rounded-lg font-label-lg text-label-lg flex items-center gap-1.5 transition-colors cursor-pointer ${
                    resultFilter === "INCORRECT"
                      ? "bg-rose-600 text-white font-bold shadow-xs"
                      : "bg-surface-container text-rose-700 hover:bg-rose-50"
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">cancel</span>
                  <span>Câu sai</span>
                  <span className="bg-rose-100 text-rose-800 px-1.5 py-0.5 rounded-full text-xs font-semibold">
                    {incorrectCount + unansweredCount}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setResultFilter("CORRECT")}
                  className={`filter-btn px-space-sm py-1.5 rounded-lg font-label-lg text-label-lg flex items-center gap-1.5 transition-colors cursor-pointer ${
                    resultFilter === "CORRECT"
                      ? "bg-emerald-600 text-white font-bold shadow-xs"
                      : "bg-surface-container text-emerald-800 hover:bg-emerald-50"
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">check_circle</span>
                  <span>Câu đúng</span>
                  <span className="bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded-full text-xs font-semibold">
                    {correctCount}
                  </span>
                </button>

                {explanationCount > 0 && (
                  <button
                    type="button"
                    onClick={() => setResultFilter("EXPLANATION")}
                    className={`filter-btn px-space-sm py-1.5 rounded-lg font-label-lg text-label-lg flex items-center gap-1.5 transition-colors cursor-pointer ${
                      resultFilter === "EXPLANATION"
                        ? "bg-primary-container text-on-primary font-bold shadow-xs"
                        : "bg-surface-container text-primary hover:bg-primary-fixed"
                    }`}
                  >
                    <span className="material-symbols-outlined text-[16px]">smart_toy</span>
                    <span>Có AI giải thích</span>
                    <span className="bg-primary-fixed text-primary px-1.5 py-0.5 rounded-full text-xs font-semibold">
                      {explanationCount}
                    </span>
                  </button>
                )}
              </div>
            </section>

            {/* 4. KHỐI CHI TIẾT BÀI LÀM (Review Section) & PHÂN TÍCH ĐÁP ÁN */}
            <section className="flex flex-col gap-space-md">
              <div className="flex flex-col">
                <h2 className="font-headline-sm text-headline-sm text-on-surface font-bold">
                  Chi tiết bài làm &amp; Phân tích đáp án
                </h2>
                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  Xem lại chi tiết từng phương án đã chọn và gợi ý khắc phục lỗ hổng kiến thức từ Trợ lý AI EduSmart.
                </p>
              </div>

              {filteredQuestions.length === 0 ? (
                <div className="bg-surface-container-lowest rounded-xl p-8 text-center text-on-surface-variant border border-surface-variant/30">
                  Không có câu hỏi nào phù hợp với bộ lọc hiện tại.
                </div>
              ) : (
                filteredQuestions.map((q, idx) => {
                  const fb = feedbackMap[q.questionId] || {};
                  const isCorrect = Boolean(fb.isCorrect);
                  const selectedAnswerId = fb.selectedAnswerId !== undefined ? fb.selectedAnswerId : selectedAnswers[q.questionId];
                  const correctAnswerId = fb.correctAnswerId;
                  const isUnanswered = (selectedAnswerId == null);
                  const isExplanationOpen = Boolean(openExplanations[q.questionId]);
                  const explanationText = q.explanation || fb.explanation;

                  return (
                    <div
                      key={q.questionId}
                      className="bg-surface-container-lowest rounded-xl p-space-md sm:p-space-lg shadow-sm flex flex-col gap-space-md border border-surface-variant/30"
                    >
                      {/* Question Top Meta */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-space-sm">
                          <span className="font-title-sm text-title-sm text-on-surface font-bold">
                            Câu {q.questionNumber || (idx + 1)} / {totalQ}
                          </span>
                          {isCorrect ? (
                            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-label-sm text-label-sm inline-flex items-center gap-1 font-semibold">
                              <span className="material-symbols-outlined text-[14px]">check</span> Đúng (+{Number(q.points || 1).toFixed(1)}đ)
                            </span>
                          ) : isUnanswered ? (
                            <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 font-label-sm text-label-sm inline-flex items-center gap-1 font-semibold">
                              <span className="material-symbols-outlined text-[14px]">remove</span> Chưa làm (0đ)
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 font-label-sm text-label-sm inline-flex items-center gap-1 font-semibold">
                              <span className="material-symbols-outlined text-[14px]">close</span> Sai (0đ)
                            </span>
                          )}
                        </div>
                        <span className="font-label-sm text-label-sm text-on-surface-variant">
                          Chủ đề: {chapterTitle}
                        </span>
                      </div>

                      {/* Question Content */}
                      <p className="font-title-md text-title-md text-on-surface font-medium leading-relaxed">
                        {q.content}
                      </p>

                      {/* Code Snippet if present */}
                      {q.codeSnippet && (
                        <div className="bg-surface-container p-space-md rounded-lg flex flex-col gap-1 font-mono text-body-sm text-on-surface border border-surface-variant/40 overflow-x-auto">
                          <div className="text-on-surface-variant font-label-sm text-label-sm mb-1">
                            // {q.codeLanguage || "Code Snippet"}:
                          </div>
                          <pre className="text-sm leading-relaxed whitespace-pre font-mono">
                            {q.codeSnippet}
                          </pre>
                        </div>
                      )}

                      {/* Options Container */}
                      <div className="grid grid-cols-1 gap-space-xs">
                        {q.options?.map((opt, optIdx) => {
                          const isChosen = (selectedAnswerId === opt.answerId);
                          const isRight = (correctAnswerId === opt.answerId);

                          if (isChosen && isRight) {
                            return (
                              <div
                                key={opt.answerId}
                                className="bg-emerald-50 text-emerald-950 p-space-md rounded-lg flex items-start gap-space-sm shadow-xs border border-emerald-300"
                              >
                                <div className="w-6 h-6 rounded-full bg-emerald-600 text-on-primary flex items-center justify-center shrink-0 mt-0.5">
                                  <span className="material-symbols-outlined text-[16px]">check</span>
                                </div>
                                <div className="flex-1 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                                  <span className="font-body-md text-body-md font-semibold">{opt.title}</span>
                                  <span className="font-label-sm text-label-sm text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full shrink-0">
                                    Bạn đã chọn (Chính xác)
                                  </span>
                                </div>
                              </div>
                            );
                          }

                          if (isChosen && !isRight) {
                            return (
                              <div
                                key={opt.answerId}
                                className="bg-rose-50 text-rose-950 p-space-md rounded-lg flex items-start gap-space-sm shadow-xs border border-rose-300"
                              >
                                <div className="w-6 h-6 rounded-full bg-rose-600 text-on-primary flex items-center justify-center shrink-0 mt-0.5">
                                  <span className="material-symbols-outlined text-[16px]">close</span>
                                </div>
                                <div className="flex-1 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                                  <span className="font-body-md text-body-md font-semibold">{opt.title}</span>
                                  <span className="font-label-sm text-label-sm text-rose-800 bg-rose-200/80 px-2 py-0.5 rounded-full shrink-0 font-medium">
                                    Bạn đã chọn - Chưa chính xác
                                  </span>
                                </div>
                              </div>
                            );
                          }

                          if (!isChosen && isRight) {
                            return (
                              <div
                                key={opt.answerId}
                                className="bg-emerald-50 text-emerald-950 p-space-md rounded-lg flex items-start gap-space-sm shadow-xs border border-emerald-300"
                              >
                                <div className="w-6 h-6 rounded-full bg-emerald-600 text-on-primary flex items-center justify-center shrink-0 mt-0.5">
                                  <span className="material-symbols-outlined text-[16px]">check</span>
                                </div>
                                <div className="flex-1 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                                  <span className="font-body-md text-body-md font-semibold">{opt.title}</span>
                                  <span className="font-label-sm text-label-sm text-emerald-800 bg-emerald-200/80 px-2 py-0.5 rounded-full shrink-0 font-medium">
                                    Đáp án chính xác
                                  </span>
                                </div>
                              </div>
                            );
                          }

                          return (
                            <div
                              key={opt.answerId}
                              className="opacity-60 bg-surface-container-low p-space-md rounded-lg flex items-center gap-space-sm"
                            >
                              <div className="w-6 h-6 rounded-full bg-surface-container-highest text-on-surface-variant flex items-center justify-center shrink-0 text-sm font-bold">
                                {opt.label || String.fromCharCode(65 + optIdx)}
                              </div>
                              <span className="font-body-md text-body-md text-on-surface">{opt.title}</span>
                            </div>
                          );
                        })}
                      </div>

                      {/* Box Trợ lý AI Giải thích */}
                      <div className="flex items-center pt-1">
                        <button
                          type="button"
                          onClick={() => toggleExplanation(q.questionId)}
                          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary font-label-md text-label-md transition-all shadow-xs cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[18px]">smart_toy</span>
                          <span>{isExplanationOpen ? "Ẩn giải thích đáp án" : "Xem Trợ lý AI giải thích"}</span>
                        </button>
                      </div>

                      {isExplanationOpen && (
                        <div className="bg-gradient-to-r from-blue-50/90 to-indigo-50/80 rounded-xl p-space-md sm:p-space-lg shadow-sm flex flex-col gap-space-sm border border-blue-100">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-primary font-title-sm text-title-sm font-bold">
                              <span className="material-symbols-outlined text-[24px]">smart_toy</span>
                              <span>Trợ lý AI Giải thích</span>
                            </div>
                            <span className="font-label-sm text-label-sm bg-surface-container-lowest text-primary px-2.5 py-1 rounded-full shadow-xs">
                              Phân tích tự động bởi EduSmart AI Engine
                            </span>
                          </div>

                          <p className="font-body-md text-body-md text-on-surface leading-relaxed">
                            {explanationText || "Đáp án đã được hệ thống kiểm duyệt và đánh giá chính xác theo tài liệu chuẩn của chương học."}
                          </p>

                          <div className="flex items-center pt-1">
                            <button
                              type="button"
                              className="bg-surface-container-lowest text-primary hover:bg-surface-container-high px-space-md py-2 rounded-lg inline-flex items-center gap-2 font-label-lg text-label-lg shadow-xs transition-colors cursor-pointer"
                              onClick={() => toast("Đang kết nối tới EduSmart AI Assistant...", { icon: "🤖" })}
                            >
                              <span className="material-symbols-outlined text-[18px]">chat_bubble_outline</span>
                              <span>Hỏi thêm AI về câu này</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </section>

            {/* 5. FOOTER ĐIỀU HƯỚNG DƯỚI CÙNG (Action Bar & Support box) */}
            <section className="flex flex-col gap-space-md mt-space-sm">
              <div className="bg-surface-container-lowest p-space-md sm:p-space-lg rounded-xl shadow-md flex flex-col sm:flex-row items-center justify-between gap-space-md border border-surface-variant/30">
                <div className="flex items-center gap-space-sm">
                  <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[24px]">task_alt</span>
                  </div>
                  <div>
                    <div className="font-body-sm text-body-sm text-on-surface-variant">
                      Kết quả và điểm số đã được ghi nhận vào học bạ điện tử của bạn.
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-space-sm w-full sm:w-auto">
                  <button
                    onClick={() => navigate(courseId ? `/student/courses/${courseId}` : "/student/my-courses")}
                    className="flex-1 sm:flex-initial px-space-md py-2.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-label-lg text-label-lg text-center transition-colors cursor-pointer"
                  >
                    Quay lại khóa học
                  </button>
                  <button
                    onClick={() => navigate(backUrl)}
                    className="flex-1 sm:flex-initial px-space-lg py-2.5 rounded-lg bg-primary-container hover:bg-primary text-on-primary font-label-lg text-label-lg text-center shadow-md flex items-center justify-center gap-1 transition-all cursor-pointer"
                  >
                    <span>Tiếp tục bài học tiếp theo</span>
                    <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                  </button>
                </div>
              </div>

              {/* Support & Help Card */}
              <div className="bg-surface-container-low p-space-md rounded-xl flex flex-col sm:flex-row items-center justify-between gap-space-sm">
                <div className="flex items-center gap-space-sm text-on-surface-variant font-body-sm text-body-sm">
                  <span className="material-symbols-outlined text-[20px] text-primary">support_agent</span>
                  <span>Cần phúc khảo câu hỏi hoặc cần giải đáp kiến thức nâng cao?</span>
                </div>
                <div className="flex items-center gap-space-sm">
                  <button
                    className="font-label-md text-label-md text-primary hover:underline font-semibold cursor-pointer"
                    onClick={() => toast.success("Đã gửi yêu cầu kết nối với giảng viên phụ trách môn.")}
                  >
                    Liên hệ Giảng viên
                  </button>
                  <span className="text-outline-variant">•</span>
                  <button
                    className="font-label-md text-label-md text-primary hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                    onClick={() => toast("Đang mở EduSmart AI Tư vấn 24/7...", { icon: "🤖" })}
                  >
                    <span className="material-symbols-outlined text-[14px]">smart_toy</span>
                    <span>Hỏi Trợ lý AI 24/7</span>
                  </button>
                </div>
              </div>
            </section>

          </div>
        </main>

        <footer className="w-full bg-surface-container-low py-space-lg mt-space-xl shadow-[0_1px_8px_rgba(0,0,0,0.02)] border-t border-surface-variant/30">
          <div className="max-w-7xl mx-auto px-margin-mobile md:px-margin-tablet lg:px-margin flex flex-col sm:flex-row items-center justify-between gap-space-sm font-body-sm text-body-sm text-on-surface-variant">
            <div>© 2026 EduSmart Learning Systems. Focus Review Console.</div>
            <div className="flex items-center gap-space-lg">
              <span className="font-label-sm text-label-sm">Quy chế đào tạo</span>
              <span className="font-label-sm text-label-sm">Hỗ trợ học viên</span>
            </div>
          </div>
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-on-surface flex flex-col font-sans selection:bg-primary-container selection:text-on-primary">
      {/* =========================================================================
          TOP ASIDE: THANH TRẠNG THÁI BÀI THI
          ========================================================================= */}
      <aside aria-label="Thanh trạng thái bài thi" className="w-full bg-surface-container-lowest shadow-sm z-30 border-b border-surface-variant/40">
        <div className="max-w-[1280px] mx-auto px-4 md:px-margin py-3 flex flex-wrap items-center justify-between gap-4">
          {/* Left: Exit / Back action */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(backUrl)}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-container-low hover:bg-surface-container text-on-surface-variant hover:text-on-surface font-label-lg text-label-lg transition-colors group cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px] transition-transform group-hover:-translate-x-0.5">
                arrow_back
              </span>
              <span className="hidden sm:inline">Quay lại khóa học</span>
              <span className="sm:hidden">Thoát</span>
            </button>
            <div className="hidden sm:block w-px h-6 bg-surface-variant"></div>
            <span className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary-fixed text-on-primary-fixed font-label-sm text-label-sm">
              <span className="material-symbols-outlined text-[15px]">code_blocks</span>
              <span>Khóa học: {quizData?.courseTitle || "Microservices Spring Boot"}</span>
            </span>
          </div>

          {/* Center: Quiz Title & Metadata */}
          <div className="flex flex-col items-center text-center">
            <h1 className="font-headline-sm text-headline-sm text-on-surface flex items-center gap-2 font-bold">
              <span>{quizData?.title || "Bài kiểm tra cuối khóa: Lập trình Spring Boot"}</span>
            </h1>
            <div className="flex items-center gap-2 text-on-surface-variant font-label-sm text-label-sm mt-0.5">
              <span>{quizData?.chapterTitle || "Chương 2"}</span>
              <span>•</span>
              <span>{totalQuestions} câu hỏi</span>
              {isTimed ? (
                <>
                  <span>•</span>
                  <span>Thời lượng: {quizData?.timeLimit || 45} phút</span>
                </>
              ) : (
                <>
                  <span>•</span>
                  <span>Luyện tập tự do</span>
                </>
              )}
            </div>
          </div>

          {/* Right: Auto-save status & Guide Button */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container-low text-secondary font-label-sm text-label-sm">
              <span className="w-2 h-2 rounded-full bg-secondary-container animate-pulse"></span>
              <span className="material-symbols-outlined text-[16px]">cloud_done</span>
              <span className="hidden lg:inline">Đã lưu tự động</span>
            </div>
            <button
              className="p-2 md:px-3 md:py-1.5 rounded-lg bg-surface-container-high hover:bg-surface-variant text-primary font-label-md text-label-md transition-colors flex items-center gap-1.5 cursor-pointer"
              onClick={() => setShowGuide(true)}
              type="button"
            >
              <span className="material-symbols-outlined text-[18px]">help_outline</span>
              <span className="hidden md:inline">Hướng dẫn</span>
            </button>
          </div>
        </div>
      </aside>

      {/* =========================================================================
          MAIN CONTENT LAYOUT (75% / 25% Split Screen)
          ========================================================================= */}
      <main className="w-full max-w-[1280px] mx-auto px-4 md:px-margin py-6 flex-1">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* =====================================================================
              LEFT COLUMN: 75% Question Workspace (Col span 8-9 on lg)
              ===================================================================== */}
          <div className="lg:col-span-8 xl:col-span-9 flex flex-col gap-5">
            {currentQuestion ? (
              <article className="bg-surface-container-lowest rounded-xl shadow-sm p-5 md:p-8 flex flex-col gap-6 relative overflow-hidden border border-surface-variant/30">
                {/* Top progress rail inside question card */}
                <div className="w-full bg-surface-container-high h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-primary-container h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${totalQuestions > 0 ? ((currentIndex + 1) / totalQuestions) * 100 : 0}%`,
                    }}
                  ></div>
                </div>

                {/* Question Header Row */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1 rounded-lg bg-primary-fixed text-on-primary-fixed font-headline-sm text-headline-sm font-bold">
                      Câu {currentIndex + 1}{" "}
                      <span className="font-body-md text-body-md text-on-surface-variant font-normal">
                        / {totalQuestions}
                      </span>
                    </span>

                    <span className="px-2.5 py-1 rounded-full bg-secondary-fixed text-on-secondary-fixed font-label-sm text-label-sm font-semibold">
                      1.0 Điểm
                    </span>
                  </div>

                  {/* Flag button */}
                  <button
                    onClick={toggleCurrentFlag}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-label-md text-label-md transition-colors cursor-pointer ${
                      isCurrentFlagged
                        ? "bg-tertiary-fixed text-on-tertiary-fixed"
                        : "bg-surface-container-low hover:bg-surface-container text-on-surface-variant hover:text-tertiary-container"
                    }`}
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      {isCurrentFlagged ? "bookmark" : "bookmark_border"}
                    </span>
                    <span>{isCurrentFlagged ? "Đã gắn cờ" : "Đánh dấu xem lại"}</span>
                  </button>
                </div>

                {/* Question Body Content */}
                <div className="flex flex-col gap-4">
                  <p className="font-title-md text-title-md text-on-surface leading-relaxed whitespace-pre-wrap">
                    {currentQuestion.content}
                  </p>

                  {/* Embedded Code Snippet / Architectural Blueprint */}
                  {currentQuestion.codeSnippet && (
                    <div className="rounded-lg bg-inverse-surface text-inverse-on-surface p-4 flex flex-col gap-2 font-mono text-[13px] leading-5 shadow-inner">
                      <div className="flex items-center justify-between pb-2 mb-1 bg-surface-variant/10 px-2 rounded">
                        <span className="font-label-sm text-label-sm text-outline-variant flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-[16px] text-secondary-container">
                            terminal
                          </span>
                          application.yml (Spring Cloud Gateway Configuration)
                        </span>
                        <span className="font-label-sm text-label-sm text-outline-variant">
                          {currentQuestion.codeLanguage || "YAML"}
                        </span>
                      </div>
                      <pre className="overflow-x-auto text-inverse-on-surface font-mono">
                        <code>{currentQuestion.codeSnippet}</code>
                      </pre>
                    </div>
                  )}
                </div>

                {/* Options List (Interactive Radio Cards) */}
                <div className="flex flex-col gap-3 pt-2">
                  {currentQuestion.options?.map((option) => {
                    const isSelected = selectedAnswers[currentQuestion.questionId] === option.answerId;

                    return (
                      <label
                        key={option.answerId}
                        onClick={() => selectOption(currentQuestion.questionId, option.answerId)}
                        className={`group flex items-start gap-4 p-4 rounded-xl cursor-pointer transition-all ${
                          isSelected
                            ? "bg-surface-container shadow-md border border-primary/20"
                            : "bg-surface-container-lowest hover:bg-surface-container-low shadow-sm border border-surface-variant/20"
                        }`}
                      >
                        <input
                          type="radio"
                          className="sr-only"
                          name={`quiz_choice_${currentQuestion.questionId}`}
                          value={option.answerId}
                          checked={isSelected}
                          onChange={() => selectOption(currentQuestion.questionId, option.answerId)}
                        />

                        {/* Option badge */}
                        <div
                          className={`w-9 h-9 rounded-lg flex items-center justify-center font-title-sm text-title-sm shrink-0 transition-colors ${
                            isSelected
                              ? "bg-primary-container text-on-primary shadow-sm"
                              : "bg-surface-container-high text-on-surface"
                          }`}
                        >
                          {isSelected ? (
                            <span className="material-symbols-outlined text-[20px]">check</span>
                          ) : (
                            option.label
                          )}
                        </div>

                        {/* Option Text */}
                        <div className="flex flex-col gap-0.5 pt-1 flex-1">
                          <span
                            className={`font-title-sm text-title-sm ${
                              isSelected ? "text-primary font-bold" : "text-on-surface"
                            }`}
                          >
                            {option.title}
                          </span>
                          {option.description && (
                            <span className="font-body-sm text-body-sm text-on-surface-variant">
                              {option.description}
                            </span>
                          )}
                        </div>

                        {isSelected && (
                          <span className="material-symbols-outlined text-primary text-[20px] shrink-0 mt-1">
                            check_circle
                          </span>
                        )}
                      </label>
                    );
                  })}
                </div>

                {/* Bottom Navigation Bar inside Question Card */}
                <div className="flex flex-wrap items-center justify-between gap-4 pt-6 mt-4 bg-surface-container-low/50 -mx-5 -mb-5 md:-mx-8 md:-mb-8 p-5 md:px-8 border-t border-surface-variant/30">
                  <button
                    disabled={currentIndex === 0}
                    onClick={goToPrevious}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-surface-container-lowest hover:bg-surface-container text-on-surface font-label-lg text-label-lg shadow-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                    <span>Câu {currentIndex > 0 ? currentIndex : 1} (Trước)</span>
                  </button>

                  <div className="flex items-center gap-3">
                    <button
                      className="px-3 py-2 text-on-surface-variant hover:text-error font-label-md text-label-md transition-colors cursor-pointer"
                      onClick={clearCurrentSelection}
                      type="button"
                    >
                      Xóa lựa chọn
                    </button>

                    {currentIndex < totalQuestions - 1 ? (
                      <button
                        onClick={goToNext}
                        className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-primary-container hover:bg-primary text-on-primary font-label-lg text-label-lg shadow-md hover:shadow-lg transition-all cursor-pointer"
                        type="button"
                      >
                        <span>Lưu & Tiếp theo (Câu {currentIndex + 2})</span>
                        <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => setShowSubmitConfirm(true)}
                        className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-primary-container hover:bg-primary text-on-primary font-label-lg text-label-lg shadow-md hover:shadow-lg transition-all cursor-pointer"
                        type="button"
                      >
                        <span>Xem lại & Nộp bài</span>
                        <span className="material-symbols-outlined text-[18px]">assignment_turned_in</span>
                      </button>
                    )}
                  </div>
                </div>
              </article>
            ) : (
              <div className="bg-surface-container-lowest rounded-xl p-8 text-center text-on-surface-variant">
                Không tìm thấy dữ liệu câu hỏi.
              </div>
            )}
          </div>

          {/* =====================================================================
              RIGHT COLUMN: 25% Sticky Control Panel (Col span 3-4 on lg)
              ===================================================================== */}
          <aside aria-label="Bảng điều khiển bài thi" className="lg:col-span-4 xl:col-span-3 flex flex-col gap-5 sticky top-20">
            {/* Timer Card (Chỉ hiển thị cho bài kiểm tra tính giờ, ẩn hoàn toàn đối với bài thường) */}
            {isTimed && (
              <div className="bg-surface-container-lowest rounded-xl shadow-sm p-5 flex flex-col items-center justify-center gap-2 relative overflow-hidden border border-surface-variant/30">
                <div className="absolute -right-6 -top-6 w-20 h-20 rounded-full bg-secondary-fixed/30 pointer-events-none"></div>
                <span className="font-label-md text-label-md text-on-surface-variant flex items-center gap-1 font-semibold">
                  <span className="material-symbols-outlined text-[16px] text-secondary">timer</span>
                  Thời gian còn lại
                </span>
                <div
                  className={`font-display-lg-mobile text-display-lg-mobile tracking-tight font-extrabold flex items-center gap-1 font-mono ${
                    remainingSeconds < 60 ? "text-error animate-pulse" : "text-primary"
                  }`}
                >
                  <span>{mins}:{secs}</span>
                </div>
                <p className="font-label-sm text-label-sm text-on-surface-variant/80">
                  Hệ thống tự nộp khi hết 00:00
                </p>
              </div>
            )}

            {/* Navigator Grid Card */}
            <div className="bg-surface-container-lowest rounded-xl shadow-sm p-5 flex flex-col gap-4 border border-surface-variant/30">
              {/* Quick Status Statistics */}
              <div className="flex items-center justify-between pb-3 bg-surface-container-low px-3 py-2 rounded-lg">
                <div className="flex flex-col">
                  <span className="font-label-sm text-label-sm text-on-surface-variant">Tiến độ</span>
                  <span className="font-headline-sm text-headline-sm text-primary font-bold">
                    {answeredCount} / {totalQuestions}
                  </span>
                </div>
                <div className="flex flex-col items-end text-right">
                  <span className="font-label-sm text-label-sm text-on-surface-variant">Chưa làm</span>
                  <span className="font-label-lg text-label-lg text-outline font-semibold">
                    {unansweredCount} câu
                  </span>
                </div>
              </div>

              {/* Question Grid */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="font-label-md text-label-md text-on-surface font-semibold">
                    Danh sách câu hỏi
                  </span>
                  <span className="font-label-sm text-label-sm text-tertiary-container flex items-center gap-0.5 font-bold">
                    <span className="material-symbols-outlined text-[14px]">flag</span>{" "}
                    {flaggedCount} Đã gắn cờ
                  </span>
                </div>

                {/* 20 Question Tiles (5 columns) */}
                <div className="grid grid-cols-5 gap-2 pt-1">
                  {questions.map((q, idx) => {
                    const isCurrent = idx === currentIndex;
                    const isAnswered = selectedAnswers[q.questionId] !== undefined;
                    const isFlagged = !!flaggedQuestions[q.questionId];

                    if (isCurrent) {
                      return (
                        <button
                          key={q.questionId}
                          onClick={() => goToQuestion(idx)}
                          className="h-10 rounded-lg bg-primary-container text-on-primary font-label-lg text-label-lg font-bold flex flex-col items-center justify-center shadow-md scale-105 cursor-pointer"
                          type="button"
                        >
                          <span>{idx + 1}</span>
                        </button>
                      );
                    }

                    if (isFlagged) {
                      return (
                        <button
                          key={q.questionId}
                          onClick={() => goToQuestion(idx)}
                          className="h-10 rounded-lg bg-tertiary-fixed text-on-tertiary-fixed font-label-md text-label-md flex items-center justify-center relative hover:bg-tertiary-fixed-dim transition-colors cursor-pointer"
                          type="button"
                        >
                          <span>{idx + 1}</span>
                          <span className="material-symbols-outlined text-[12px] absolute top-0.5 right-0.5 text-tertiary-container">
                            flag
                          </span>
                        </button>
                      );
                    }

                    if (isAnswered) {
                      return (
                        <button
                          key={q.questionId}
                          onClick={() => goToQuestion(idx)}
                          className="h-10 rounded-lg bg-surface-container text-primary font-label-md text-label-md flex flex-col items-center justify-center relative hover:bg-surface-variant transition-colors cursor-pointer"
                          type="button"
                        >
                          <span>{idx + 1}</span>
                          <span className="w-1.5 h-1.5 rounded-full bg-primary absolute bottom-1"></span>
                        </button>
                      );
                    }

                    return (
                      <button
                        key={q.questionId}
                        onClick={() => goToQuestion(idx)}
                        className="h-10 rounded-lg bg-surface-container-low text-on-surface-variant font-label-md text-label-md hover:bg-surface-container transition-colors cursor-pointer"
                        type="button"
                      >
                        {idx + 1}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Color Legend */}
              <div className="grid grid-cols-2 gap-2 pt-2 text-on-surface-variant font-label-sm text-label-sm border-t border-surface-variant/30">
                <div className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 rounded bg-surface-container shrink-0 border border-surface-variant/50"></span>
                  <span>Đã trả lời ({answeredCount})</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 rounded bg-primary-container shrink-0"></span>
                  <span>Đang xem (1)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 rounded bg-tertiary-fixed shrink-0"></span>
                  <span>Đã gắn cờ ({flaggedCount})</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 rounded bg-surface-container-low shrink-0 border border-surface-variant/30"></span>
                  <span>Chưa làm ({unansweredCount})</span>
                </div>
              </div>

              {/* Submit CTA Button */}
              <div className="pt-3">
                <button
                  onClick={() => setShowSubmitConfirm(true)}
                  className="w-full py-3.5 px-4 rounded-xl bg-primary-container hover:bg-primary text-on-primary font-title-sm text-title-sm flex items-center justify-center gap-2 shadow-lg transition-all hover:scale-[1.01] cursor-pointer"
                  type="button"
                >
                  <span className="material-symbols-outlined text-[20px]">assignment_turned_in</span>
                  <span>Nộp bài kiểm tra</span>
                </button>
              </div>
            </div>
          </aside>
        </div>
      </main>

      {/* =========================================================================
          SUBMISSION CONFIRMATION MODAL
          ========================================================================= */}
      {showSubmitConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-inverse-surface/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-surface-container-lowest rounded-2xl max-w-md w-full p-6 shadow-2xl flex flex-col gap-5 border border-surface-variant/40">
            {/* Modal Header */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-error-container text-error flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[28px]">notification_important</span>
              </div>
              <div>
                <h2 className="font-headline-sm text-headline-sm text-on-surface font-bold">Xác nhận nộp bài?</h2>
                <span className="font-label-md text-label-md text-on-surface-variant">
                  {unansweredCount > 0
                    ? `Bạn vẫn còn ${unansweredCount} câu hỏi chưa hoàn thành!`
                    : "Bạn đã hoàn thành tất cả các câu hỏi!"}
                </span>
              </div>
            </div>

            {/* Warning card summary */}
            <div className="p-4 rounded-xl bg-surface-container-low flex flex-col gap-2.5">
              <div className="flex items-center justify-between font-label-md text-label-md">
                <span className="text-on-surface-variant">Số câu đã trả lời:</span>
                <span className="font-bold text-primary">{answeredCount} / {totalQuestions} câu</span>
              </div>
              <div className="flex items-center justify-between font-label-md text-label-md">
                <span className="text-on-surface-variant">Số câu chưa hoàn thành:</span>
                <span className={`font-bold ${unansweredCount > 0 ? "text-error" : "text-emerald-600"}`}>
                  {unansweredCount} câu hỏi
                </span>
              </div>
              <div className="flex items-center justify-between font-label-md text-label-md">
                <span className="text-on-surface-variant">Thời gian còn lại:</span>
                <span className="font-bold text-on-surface font-mono">{mins} phút {secs} giây</span>
              </div>
            </div>

            <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
              Sau khi bấm xác nhận nộp, hệ thống sẽ chốt điểm số và bạn sẽ không thể thay đổi các câu trả lời đã lưu.
            </p>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                className="px-5 py-2.5 rounded-lg bg-surface-container-high hover:bg-surface-variant text-on-surface font-label-lg text-label-lg transition-colors cursor-pointer"
                onClick={() => setShowSubmitConfirm(false)}
                type="button"
                disabled={submitting}
              >
                Tiếp tục làm bài
              </button>
              <button
                className="px-5 py-2.5 rounded-lg bg-primary-container hover:bg-primary text-on-primary font-label-lg text-label-lg shadow-md transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                onClick={executeSubmit}
                type="button"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    <span>Đang nộp...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[18px]">done_all</span>
                    <span>Xác nhận nộp ngay</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          INSTRUCTIONS MODAL
          ========================================================================= */}
      {showGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-inverse-surface/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-surface-container-lowest rounded-2xl max-w-lg w-full p-6 shadow-2xl flex flex-col gap-5 border border-surface-variant/40">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[24px]">school</span>
                <h2 className="font-headline-sm text-headline-sm text-on-surface font-bold">
                  Hướng dẫn làm bài thi
                </h2>
              </div>
              <button
                className="p-1 rounded-lg text-on-surface-variant hover:bg-surface-container cursor-pointer"
                onClick={() => setShowGuide(false)}
                type="button"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="space-y-3 font-body-sm text-body-sm text-on-surface-variant">
              <p>1. <strong>Tự động lưu:</strong> Mỗi lựa chọn của bạn đều được lưu lại ngay lập tức vào máy chủ dữ liệu.</p>
              <p>2. <strong>Đánh dấu cờ:</strong> Sử dụng nút "Đánh dấu xem lại" để ghi nhớ các câu hỏi phân vân cần kiểm tra lại trước khi nộp.</p>
              <p>3. <strong>Hết giờ làm bài:</strong> Khi đồng hồ đếm ngược về 00:00, bài thi sẽ tự động khóa và gửi kết quả.</p>
              <p>4. <strong>Tiêu chí đạt:</strong> Cần đạt tối thiểu 70% (14/20 câu) để nhận chứng chỉ hoàn thành học phần.</p>
            </div>
            <div className="flex justify-end pt-2">
              <button
                className="px-5 py-2 rounded-lg bg-primary-container text-on-primary font-label-md text-label-md cursor-pointer hover:bg-primary transition-colors"
                onClick={() => setShowGuide(false)}
                type="button"
              >
                Đã hiểu, quay lại thi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
