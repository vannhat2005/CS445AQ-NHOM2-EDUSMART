import React, { useEffect, useState, useRef } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { ArrowLeft, ChevronRight, ChevronLeft, Search, Download, Eye, X, GraduationCap, BookOpen, Mail, CheckCircle2, ListChecks, ClipboardCheck, Loader2, Clock, FileQuestion } from "lucide-react";
import { toast } from "react-hot-toast";
import { getCurrentUser } from "../../services/authService";
import studentListService from "../../services/studentListService";

const StudentList = () => {
  const navigate = useNavigate();
  const { courseId } = useParams();
  const { state } = useLocation();

  // ================= STATE DỮ LIỆU =================
  const [instructorId, setInstructorId] = useState(null);
  const [students, setStudents] = useState([]);
  const [courseName, setCourseName] = useState(state?.courseTitle || "");
  const [totalStudents, setTotalStudents] = useState(0);
  const [selectedStudent, setSelectedStudent] = useState(null);

  // ================= STATE TÌM KIẾM VÀ PHÂN TRANG =================
  const [keyword, setKeyword] = useState("");
  const [debouncedKeyword, setDebouncedKeyword] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const pageSize = 7;

  // ================= STATE TRẠNG THÁI =================
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const detailRequestId = useRef(0);

  // ================= 1. LẤY ID GIẢNG VIÊN =================
  useEffect(() => {
    let active = true;
    const fetchInstructor = async () => {
      try {
        const id = await getCurrentUser();
        if (!id) throw new Error("Không xác định được giảng viên.");
        if (active) setInstructorId(id);
      } catch (err) {
        if (!active) return;
        setError("Không thể lấy thông tin giảng viên.");
        setLoading(false);
        toast.error("Không thể lấy thông tin giảng viên.");
      }
    };
    fetchInstructor();
    return () => { active = false; };
  }, []);

  // ================= 2. DEBOUNCE TÌM KIẾM =================
  // Chờ người dùng ngừng nhập 400ms mới gọi API
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedKeyword(keyword.trim());
      setCurrentPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [keyword]);

  // ================= 3. LẤY DANH SÁCH SINH VIÊN =================
  useEffect(() => {
    if (!instructorId || !courseId) return;
    let active = true;
    const fetchStudents = async () => {
      try {
        setLoading(true);
        setError("");

        const data = await studentListService.getStudents(instructorId, courseId, debouncedKeyword, currentPage, pageSize);
        if (!active) return;

        // Lấy thông tin khóa học
        setCourseName(data.courseName);
        setTotalStudents(data.totalStudents);

        // Lấy danh sách sinh viên và thông tin phân trang
        setStudents(data.students.content || []);
        setTotalPages(Math.max(1, data.students.totalPages));
        setTotalElements(data.students.totalElements);

        // Quay về trang cuối nếu trang hiện tại không còn hợp lệ
        if (currentPage > Math.max(1, data.students.totalPages)) {
          setCurrentPage(Math.max(1, data.students.totalPages));
        }
      } catch (err) {
        if (!active) return;
        const message = err.response?.data?.message || "Không thể tải danh sách sinh viên.";
        setError(message);
        setStudents([]);
        setTotalElements(0);
        setTotalPages(1);
        toast.error(message);
        console.error("Lỗi lấy danh sách sinh viên:", err);
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchStudents();
    return () => { active = false; };
  }, [instructorId, courseId, debouncedKeyword, currentPage, reloadKey]);

  // ================= 4. TÌM KIẾM SINH VIÊN =================
  const handleSearch = (e) => setKeyword(e.target.value);

  // ================= 5. XEM CHI TIẾT SINH VIÊN =================
  const handleViewDetail = async (student) => {
    const requestId = ++detailRequestId.current;
    try {
      setDetailLoading(true);

      // Hiển thị thông tin cơ bản trước khi API trả về
      setSelectedStudent(student);

      // Lấy chi tiết, tiến độ học tập và lịch sử kiểm tra
      const data = await studentListService.getStudentDetail(instructorId, courseId, student.studentId);

      // Ngăn request cũ ghi đè dữ liệu sinh viên mới
      if (requestId === detailRequestId.current) {
        setSelectedStudent(data);
      }
    } catch (err) {
      if (requestId !== detailRequestId.current) return;
      toast.error(err.response?.data?.message || "Không thể tải chi tiết sinh viên.");
      setSelectedStudent(null);
      console.error("Lỗi lấy chi tiết sinh viên:", err);
    } finally {
      if (requestId === detailRequestId.current) setDetailLoading(false);
    }
  };

  // Đóng modal và bỏ qua request đang chờ
  const handleCloseModal = () => {
    detailRequestId.current++;
    setSelectedStudent(null);
    setDetailLoading(false);
  };

  // ================= 6. XUẤT FILE EXCEL =================
  const handleExportExcel = async () => {
    if (exporting || !instructorId) return;
    try {
      setExporting(true);

      // Gọi API xuất danh sách sinh viên
      const data = await studentListService.exportStudents(instructorId, courseId, debouncedKeyword);

      // Tạo file Excel và tải xuống máy
      const blob = new Blob([data], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `DanhSachSinhVien_${courseId}.xlsx`;
      document.body.appendChild(link);
      link.click();
      link.remove();

      // Giải phóng đường dẫn tạm thời
      setTimeout(() => window.URL.revokeObjectURL(url), 1000);
      toast.success("Xuất danh sách sinh viên thành công!");
    } catch (err) {
      let message = "Không thể xuất danh sách sinh viên.";

      // Xử lý lỗi API trả về dưới dạng Blob
      if (err.response?.data instanceof Blob) {
        try {
          const errorData = JSON.parse(await err.response.data.text());
          message = errorData.message || message;
        } catch {
          // Giữ thông báo mặc định nếu không đọc được JSON
        }
      } else {
        message = err.response?.data?.message || message;
      }
      toast.error(message);
      console.error("Lỗi xuất Excel:", err);
    } finally {
      setExporting(false);
    }
  };

  // ================= 7. CÁC HÀM HỖ TRỢ =================

  // Quay lại trang chi tiết khóa học
  const handleBack = () => navigate(`/instructor/courses/${courseId}`);

  // Định dạng điểm số và ngày tháng
  const formatScore = (score) => score == null ? "--" : `${Number(score).toFixed(1)} / 10`;
  const formatDate = (date) => date ? new Date(date).toLocaleDateString("vi-VN") : "--";

  // Tính số thứ tự sinh viên
  const startIndex = (currentPage - 1) * pageSize;

  // ================= 8. XỬ LÝ TIẾN ĐỘ HỌC TẬP =================

  // Kiểm tra Backend đã trả dữ liệu tiến độ hay chưa
  const hasProgress = Array.isArray(selectedStudent?.lessonProgress) && selectedStudent.lessonProgress.every(lesson => typeof lesson.hasQuiz === "boolean");

  // Lấy danh sách bài học từ Backend
  const lessonProgress = hasProgress ? selectedStudent.lessonProgress : [];

  // Phân loại theo trạng thái trắc nghiệm đã xuất bản và kết quả nộp bài
  const completedLessons = lessonProgress.filter(lesson => lesson.hasQuiz && lesson.completed);
  const pendingLessons = lessonProgress.filter(lesson => lesson.hasQuiz && !lesson.completed);
  const noQuizLessons = lessonProgress.filter(lesson => !lesson.hasQuiz);
  const totalQuizLessons = completedLessons.length + pendingLessons.length;

  // Lấy phần trăm tiến độ do Backend tính, giới hạn từ 0 đến 100
  const progress = Math.min(100, Math.max(0, Number(selectedStudent?.progress ?? 0) || 0));

  // ================= 9. LỊCH SỬ KIỂM TRA =================
  const examHistory = selectedStudent?.examHistory || [];

  // ================= 10. XỬ LÝ PHÂN TRANG =================
  // Hiển thị tối đa 5 số trang liên tiếp
  const firstPage = Math.max(1, Math.min(currentPage - 2, totalPages - 4));
  const pageNumbers = Array.from({ length: Math.min(5, totalPages) }, (_, index) => firstPage + index);

  return (
    <div className="w-full min-h-screen bg-[#f8f9ff] pb-8 text-slate-800">

      {/* ================= BREADCRUMB ================= */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <button onClick={handleBack} className="w-9 h-9 flex items-center justify-center bg-white rounded-lg shadow-sm text-slate-600 hover:bg-blue-50 hover:text-blue-800 transition" title="Quay lại chi tiết khóa học">
          <ArrowLeft size={20} />
        </button>
        <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
          <button onClick={() => navigate("/instructor/courses")} className="hover:text-blue-800">Khóa học được phân công</button>
          <ChevronRight size={16} />
          <button onClick={handleBack} className="hover:text-blue-800">Chi tiết khóa học</button>
          <ChevronRight size={16} />
          <span className="font-semibold text-blue-800">Danh sách sinh viên</span>
        </div>
      </div>

      {/* ================= TIÊU ĐỀ TRANG ================= */}
      <div className="relative overflow-hidden bg-white rounded-xl p-6 shadow-sm mb-6">
        <div className="absolute -right-16 -top-16 w-56 h-56 rounded-full bg-blue-100/60 blur-2xl pointer-events-none" />
        <div className="relative z-10">
          <h1 className="text-[28px] font-bold text-slate-900 mb-3">Danh sách sinh viên</h1>
          <div className="flex flex-wrap items-center gap-3">

            {/* Tên khóa học */}
            <div className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-50 text-blue-800 text-sm font-medium">
              <BookOpen size={18} /> {courseName || "Khóa học"}
            </div>

            {/* Tổng số sinh viên đã ghi danh */}
            <div className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-100 text-sm">
              <span>Tổng số: <strong className="text-blue-800">{totalStudents}</strong> sinh viên đã ghi danh thành công</span>
              <CheckCircle2 size={17} className="text-blue-600" />
            </div>
          </div>
        </div>
      </div>

      {/* ================= TÌM KIẾM VÀ XUẤT EXCEL ================= */}
      <div className="bg-white rounded-xl p-4 shadow-sm mb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative w-full max-w-xl">
          <Search size={20} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input type="search" value={keyword} onChange={handleSearch} placeholder="Tìm kiếm theo mã sinh viên, họ tên hoặc email..." className="w-full pl-11 pr-4 py-2.5 rounded-lg bg-blue-50 text-sm outline-none focus:ring-2 focus:ring-blue-300 transition" />
        </div>

        {/* Nút xuất Excel */}
        <button onClick={handleExportExcel} disabled={exporting || loading || !!error || totalElements === 0 || keyword.trim() !== debouncedKeyword} className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-white shadow-sm border border-slate-100 text-sm font-semibold hover:bg-blue-50 hover:text-blue-800 transition disabled:opacity-50 disabled:cursor-not-allowed">
          <span className="p-1 rounded bg-blue-100 text-blue-800">
            {exporting ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
          </span>
          {exporting ? "Đang xuất Excel..." : "Xuất Excel"}
        </button>
      </div>

      {/* ================= BẢNG DANH SÁCH SINH VIÊN ================= */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="w-full overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[860px]">
            <thead>
              <tr className="bg-[#eff4ff] text-slate-600 text-xs uppercase tracking-wider">
                <th className="py-4 px-4 text-center w-14">STT</th>
                <th className="py-4 px-4 w-28">Mã SV</th>
                <th className="py-4 px-5">Họ và tên</th>
                <th className="py-4 px-5">Email</th>
                <th className="py-4 px-4 text-center w-44">Điểm trắc nghiệm TB</th>
                <th className="py-4 px-4 text-center w-48">Điểm KT cuối chương TB</th>
                <th className="py-4 px-5 text-right w-36">Thao tác</th>
              </tr>
            </thead>

            <tbody>
              {/* Trạng thái đang tải */}
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-slate-500">
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 size={22} className="animate-spin text-blue-600" /> Đang tải danh sách sinh viên...
                    </div>
                  </td>
                </tr>
              ) : error ? (

                /* Trạng thái lỗi */
                <tr>
                  <td colSpan={7} className="py-12 text-center">
                    <p className="text-red-500 mb-3">{error}</p>
                    {instructorId && (
                      <button onClick={() => setReloadKey(prev => prev + 1)} className="px-4 py-2 rounded-lg bg-blue-50 text-blue-800 text-sm font-semibold hover:bg-blue-100">Thử lại</button>
                    )}
                  </td>
                </tr>
              ) : students.length > 0 ? (

                /* Hiển thị danh sách sinh viên */
                students.map((student, index) => (
                  <tr key={student.studentId} className="hover:bg-blue-50/70 transition-colors text-sm border-b border-slate-50">
                    <td className="py-4 px-4 text-center text-slate-500">{startIndex + index + 1}</td>
                    <td className="py-4 px-4 font-mono font-semibold text-blue-800">{student.studentId}</td>
                    <td className="py-4 px-5 font-semibold text-slate-800">{student.fullName}</td>
                    <td className="py-4 px-5 text-slate-600">{student.email}</td>

                    {/* Điểm trung bình trắc nghiệm */}
                    <td className="py-4 px-4 text-center">
                      <span className={`inline-flex items-center justify-center px-3 py-1 rounded-full font-semibold ${student.quizScore != null && student.quizScore >= 7 ? "bg-blue-100 text-blue-800" : "bg-slate-100 text-slate-600"}`}>
                        {formatScore(student.quizScore)}
                      </span>
                    </td>

                    {/* Điểm trung bình kiểm tra cuối chương */}
                    <td className="py-4 px-4 text-center">
                      <span className={`inline-flex items-center justify-center px-3 py-1 rounded-full font-semibold ${student.examScore != null && student.examScore >= 7 ? "bg-blue-50 text-blue-600" : "bg-slate-100 text-slate-600"}`}>
                        {formatScore(student.examScore)}
                      </span>
                    </td>

                    {/* Nút xem chi tiết */}
                    <td className="py-4 px-5 text-right">
                      <button onClick={() => handleViewDetail(student)} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-blue-50 text-blue-800 hover:bg-blue-800 hover:text-white text-sm font-semibold transition whitespace-nowrap">
                        <Eye size={17} /> Xem chi tiết
                      </button>
                    </td>
                  </tr>
                ))
              ) : (

                /* Không có dữ liệu */
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    {debouncedKeyword ? "Không tìm thấy sinh viên phù hợp" : "Khóa học chưa có sinh viên ghi danh"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* ================= PHÂN TRANG ================= */}
        <div className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-sm text-slate-500">
            Hiển thị <span className="font-semibold text-slate-800">{students.length > 0 && !loading ? startIndex + 1 : 0}-{students.length > 0 && !loading ? startIndex + students.length : 0}</span> trên tổng số <span className="font-semibold text-blue-800">{totalElements}</span> sinh viên
          </div>

          <div className="flex items-center gap-1 text-sm">

            {/* Nút trang trước */}
            <button disabled={currentPage <= 1 || loading || !!error} onClick={() => setCurrentPage(prev => prev - 1)} className="flex items-center gap-1 px-3 py-2 rounded-lg text-slate-600 hover:bg-blue-50 disabled:opacity-40 disabled:cursor-not-allowed">
              <ChevronLeft size={18} /> Trước
            </button>

            {/* Trang đầu tiên */}
            {firstPage > 1 && (
              <>
                <button disabled={loading || !!error} onClick={() => setCurrentPage(1)} className="w-8 h-8 rounded-lg hover:bg-blue-50">1</button>
                {firstPage > 2 && <span className="px-1">...</span>}
              </>
            )}

            {/* Danh sách số trang */}
            {pageNumbers.map(page => (
              <button key={page} disabled={loading || !!error} onClick={() => setCurrentPage(page)} className={`w-8 h-8 rounded-lg font-medium transition ${currentPage === page ? "bg-[#00288e] text-white" : "text-slate-600 hover:bg-blue-50"}`}>
                {page}
              </button>
            ))}

            {/* Trang cuối cùng */}
            {pageNumbers[pageNumbers.length - 1] < totalPages && (
              <>
                {pageNumbers[pageNumbers.length - 1] < totalPages - 1 && <span className="px-1">...</span>}
                <button disabled={loading || !!error} onClick={() => setCurrentPage(totalPages)} className="w-8 h-8 rounded-lg hover:bg-blue-50">{totalPages}</button>
              </>
            )}

            {/* Nút trang sau */}
            <button disabled={currentPage >= totalPages || loading || !!error} onClick={() => setCurrentPage(prev => prev + 1)} className="flex items-center gap-1 px-3 py-2 rounded-lg text-slate-600 hover:bg-blue-50 disabled:opacity-40 disabled:cursor-not-allowed">
              Sau <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* ================= MODAL CHI TIẾT SINH VIÊN ================= */}
      {selectedStudent && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm" onClick={handleCloseModal}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="student-modal-title">

            {/* ================= MODAL HEADER ================= */}
            <div className="px-6 py-4 bg-[#eff4ff] flex items-center justify-between gap-4 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#00288e] text-white flex items-center justify-center shrink-0">
                  <GraduationCap size={23} />
                </div>
                <div>
                  <h2 id="student-modal-title" className="text-lg font-bold text-slate-900">Chi tiết tiến độ học tập - {selectedStudent.studentId}: {selectedStudent.fullName}</h2>
                  <p className="text-xs text-slate-500 mt-1">Báo cáo theo dõi tiến độ học tập</p>
                </div>
              </div>
              <button onClick={handleCloseModal} className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-500 hover:text-red-600 hover:bg-red-50 transition shrink-0" title="Đóng">
                <X size={22} />
              </button>
            </div>

            {/* ================= MODAL BODY ================= */}
            <div className="p-6 overflow-y-auto flex flex-col gap-6">

              {/* Thông tin cơ bản của sinh viên */}
              <div className="p-4 rounded-xl bg-[#e5eeff]">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className="text-base font-bold text-blue-800">{selectedStudent.fullName}</span>
                  <span className="font-mono text-xs font-semibold bg-blue-200 px-2 py-1 rounded text-blue-800">{selectedStudent.studentId}</span>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600">
                  <span className="flex items-center gap-1.5"><Mail size={16} /> {selectedStudent.email}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1.5"><BookOpen size={16} /> {selectedStudent.courseName || courseName}</span>
                </div>
              </div>

              {/* Loading khi lấy chi tiết sinh viên */}
              {detailLoading ? (
                <div className="py-16 flex items-center justify-center gap-2 text-sm text-slate-500">
                  <Loader2 size={22} className="animate-spin text-blue-600" /> Đang tải thông tin học tập...
                </div>
              ) : (
                <>
                  {/* ================= TIẾN ĐỘ HỌC TẬP ================= */}
                  <div className="flex flex-col gap-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h3 className="font-bold text-base flex items-center gap-2">
                        <ListChecks size={21} className="text-blue-800" /> Tiến độ học tập bài học
                      </h3>
                      {hasProgress && (
                        <span className="text-xs text-slate-500">{completedLessons.length} hoàn thành • {pendingLessons.length} chưa hoàn thành • {noQuizLessons.length} chưa có TN</span>
                      )}
                    </div>

                    {/* Kiểm tra dữ liệu tiến độ từ Backend */}
                    {!hasProgress ? (
                      <div className="p-5 rounded-xl bg-[#eff4ff] text-center text-sm text-slate-500">API chưa trả về dữ liệu tiến độ bài học đầy đủ (hasQuiz).</div>
                    ) : lessonProgress.length === 0 ? (
                      <div className="p-5 rounded-xl bg-[#eff4ff] text-center text-sm text-slate-500">Khóa học chưa có bài học đang hoạt động.</div>
                    ) : (
                      <>
                        {/* Thanh phần trăm tiến độ */}
                        <div className="p-4 rounded-xl bg-[#eff4ff]">
                          <div className="flex justify-between items-center mb-2 text-sm">
                            <span className="font-medium text-slate-600">Tiến độ hoàn thành trắc nghiệm bài học</span>
                            <span className="font-bold text-blue-800">{totalQuizLessons > 0 ? `${progress}%` : "--"}</span>
                          </div>
                          <div className="w-full h-2.5 rounded-full bg-blue-100 overflow-hidden" role="progressbar" aria-label="Tiến độ học tập" aria-valuenow={totalQuizLessons > 0 ? progress : undefined} aria-valuemin={0} aria-valuemax={100}>
                            <div className="h-full bg-[#00288e] rounded-full transition-all duration-500" style={{ width: `${totalQuizLessons > 0 ? progress : 0}%` }} />
                          </div>
                          <p className="text-xs text-slate-500 mt-2">{totalQuizLessons > 0 ? `Đã hoàn thành ${completedLessons.length}/${totalQuizLessons} bài học có trắc nghiệm` : "Chưa có trắc nghiệm đã xuất bản để tính tiến độ."}</p>
                          {noQuizLessons.length > 0 && <p className="text-xs text-slate-500 mt-1">Không tính {noQuizLessons.length} bài học chưa có trắc nghiệm đã xuất bản vào tiến độ.</p>}
                        </div>

                        {/* Danh sách bài học đã hoàn thành và chưa hoàn thành */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {[
                            { title: "Bài học đã hoàn thành", lessons: completedLessons, done: true },
                            { title: "Bài học chưa hoàn thành", lessons: pendingLessons, done: false }
                          ].map(({ title, lessons, done }) => (
                            <div key={title} className="flex flex-col gap-2 p-3 rounded-xl bg-[#eff4ff]">

                              {/* Tiêu đề từng nhóm bài học */}
                              <div className={`flex items-center gap-2 text-xs font-semibold px-1 ${done ? "text-blue-600" : "text-slate-500"}`}>
                                {done ? <CheckCircle2 size={18} /> : <Clock size={18} />} {title} ({lessons.length})
                              </div>

                              {/* Hiển thị từng bài học */}
                              {lessons.length > 0 ? lessons.map(lesson => (
                                <div key={lesson.lessonId} className="p-3 rounded-lg bg-white flex items-center justify-between gap-2 shadow-sm">
                                  <div className="flex items-center gap-2 min-w-0">
                                    {done ? <CheckCircle2 size={17} className="text-blue-600 shrink-0" /> : <Clock size={17} className="text-slate-400 shrink-0" />}
                                    <div className="min-w-0">
                                      <p className="text-xs font-medium break-words">{lesson.lessonTitle}</p>
                                      <p className="text-[11px] text-slate-500 mt-1">{lesson.chapterTitle}</p>
                                    </div>
                                  </div>
                                  <span className={`text-xs font-medium shrink-0 ${done ? "text-blue-600" : "text-slate-500"}`}>
                                    {done ? "100%" : "Chưa hoàn thành"}
                                  </span>
                                </div>
                              )) : (
                                <p className="py-4 text-center text-xs text-slate-500">
                                  {done ? "Chưa hoàn thành bài học nào." : "Không có bài trắc nghiệm đang chờ hoàn thành."}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>

                        {/* Bài học chưa có trắc nghiệm đã xuất bản */}
                        {noQuizLessons.length > 0 && (
                          <div className="flex flex-col gap-2 p-3 rounded-xl bg-[#eff4ff]">
                            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 px-1">
                              <FileQuestion size={18} /> Bài học chưa có trắc nghiệm ({noQuizLessons.length})
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              {noQuizLessons.map(lesson => (
                                <div key={lesson.lessonId} className="p-3 rounded-lg bg-white flex items-center justify-between gap-2 shadow-sm">
                                  <div className="flex items-center gap-2 min-w-0">
                                    <FileQuestion size={17} className="text-slate-400 shrink-0" />
                                    <div className="min-w-0">
                                      <p className="text-xs font-medium break-words">{lesson.lessonTitle}</p>
                                      <p className="text-[11px] text-slate-500 mt-1">{lesson.chapterTitle}</p>
                                    </div>
                                  </div>
                                  <span className="text-xs text-slate-500 shrink-0">Chưa có TN</span>
                                </div>
                              ))}
                            </div>
                            <p className="text-[11px] text-slate-500 px-1">Bao gồm bài học chưa tạo trắc nghiệm hoặc trắc nghiệm chưa xuất bản.</p>
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  {/* ================= LỊCH SỬ KIỂM TRA ================= */}
                  <div className="flex flex-col gap-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h3 className="font-bold text-base flex items-center gap-2">
                        <ClipboardCheck size={21} className="text-blue-800" /> Lịch sử làm bài kiểm tra
                      </h3>
                      <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-semibold">Đã làm: {examHistory.length} bài</span>
                    </div>

                    <div className="rounded-xl overflow-x-auto bg-[#eff4ff] shadow-sm">
                      <table className="w-full text-left min-w-[500px]">
                        <thead>
                          <tr className="bg-[#e5eeff] text-xs uppercase text-slate-600">
                            <th className="py-3 px-4">Tên bài kiểm tra</th>
                            <th className="py-3 px-4 text-center">Điểm số</th>
                            <th className="py-3 px-4 text-right">Ngày nộp bài</th>
                          </tr>
                        </thead>

                        <tbody>
                          {/* Hiển thị lịch sử kiểm tra từ Backend */}
                          {examHistory.length > 0 ? examHistory.map(exam => (
                            <tr key={exam.quizId} className="text-xs hover:bg-white/70 transition">
                              <td className="py-3 px-4 font-medium">
                                <div className="flex items-center gap-2">
                                  <CheckCircle2 size={17} className="text-blue-600 shrink-0" />
                                  <div>
                                    <div>{exam.title}</div>
                                    <div className="text-[11px] text-slate-500 mt-1">{exam.type === "LESSON_QUIZ" ? "Trắc nghiệm bài học" : "Kiểm tra cuối chương"}</div>
                                  </div>
                                </div>
                              </td>
                              <td className="py-3 px-4 text-center">
                                <span className="font-bold text-blue-800 px-2.5 py-1 rounded bg-blue-200 whitespace-nowrap">{formatScore(exam.score)}</span>
                              </td>
                              <td className="py-3 px-4 text-right text-slate-500 font-mono">{formatDate(exam.submittedAt)}</td>
                            </tr>
                          )) : (
                            <tr>
                              <td colSpan={3} className="py-10 text-center text-sm text-slate-500">Sinh viên chưa làm bài kiểm tra nào.</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* ================= MODAL FOOTER ================= */}
            <div className="px-6 py-4 bg-[#eff4ff] flex justify-end shrink-0">
              <button onClick={handleCloseModal} className="px-6 py-2 rounded-lg bg-[#00288e] text-white hover:bg-blue-700 text-sm font-semibold transition shadow-sm">Đóng</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentList;
