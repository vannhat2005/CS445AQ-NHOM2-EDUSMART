import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getCourseCurriculum, getLessonDetail } from "../../services/student/lessonService";

const cx = (...items) => items.filter(Boolean).join(" ");
const isVideo = (item) => /video/i.test(item?.contentType || "");
const isPdf = (item) => /pdf/i.test(item?.contentType || "");
const isText = (item) => /text|document|html/i.test(item?.contentType || "");
const safeUrl = (value) => {
  if (!value || typeof value !== "string") return null;
  try {
    const url = new URL(value, window.location.origin);
    return ["https:", "http:"].includes(url.protocol) ? url.href : null;
  } catch { return null; }
};
const normalizeCurriculum = (data) => {
  const raw = Array.isArray(data) ? data : data?.chapters || data?.content || [];
  return raw.map((chapter, index) => ({
    id: chapter.chapterId ?? chapter.id ?? index,
    title: chapter.title ?? chapter.chapterTitle ?? `Chương ${index + 1}`,
    lessons: (chapter.lessons || chapter.lessonResponses || []).map((lesson, i) => ({
      id: lesson.lessonId ?? lesson.id,
      title: lesson.title ?? lesson.lessonTitle ?? `Bài ${i + 1}`,
    })).filter((lesson) => lesson.id != null),
  }));
};
const styles = {
  card: "rounded-2xl border border-slate-200 bg-white shadow-sm",
  tab: "rounded-lg px-3 py-2 text-sm font-semibold transition",
  button: "rounded-lg px-4 py-2 font-semibold transition disabled:cursor-not-allowed disabled:opacity-50",
};

export default function LessonLearningPage() {
  const { courseId, lessonId } = useParams();
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const [lesson, setLesson] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [curriculumError, setCurriculumError] = useState("");
  const [tab, setTab] = useState("overview");
  const [sidebarTab, setSidebarTab] = useState("syllabus");
  const [expandedChapter, setExpandedChapter] = useState(null);
  const [selectedVideoId, setSelectedVideoId] = useState(null);
  const [selectedPdfId, setSelectedPdfId] = useState(null);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [volume, setVolume] = useState(1);
  const [aiInput, setAiInput] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");
    setLesson(null);
    setSelectedVideoId(null);
    setSelectedPdfId(null);
    setTab("overview");
    setPlaying(false);
    getLessonDetail(courseId, lessonId, controller.signal)
      .then(setLesson)
      .catch((err) => {
        if (controller.signal.aborted) return;
        const status = err?.response?.status;
        setError(status === 401 ? "Vui lòng đăng nhập để học." : status === 403
          ? "Bạn chưa có quyền học khóa học này. Hãy kiểm tra trạng thái thanh toán."
          : status === 404 ? "Không tìm thấy bài học trong khóa học đã xuất bản."
          : err?.response?.data?.message || err.message || "Không tải được bài học.");
      })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [courseId, lessonId]);

  useEffect(() => {
    const controller = new AbortController();
    setChapters([]);
    setCurriculumError("");
    getCourseCurriculum(courseId, controller.signal)
      .then((data) => setChapters(normalizeCurriculum(data)))
      .catch(() => { if (!controller.signal.aborted) setCurriculumError("Chưa tải được danh sách chương và bài học."); });
    return () => controller.abort();
  }, [courseId]);

  const contents = lesson?.contents || [];
  const videos = useMemo(() => contents.filter(isVideo), [contents]);
  const pdfs = useMemo(() => contents.filter(isPdf), [contents]);
  const texts = useMemo(() => contents.filter(isText), [contents]);
  const quizzes = lesson?.quizzes || [];
  const currentVideo = videos.find((v) => v.contentId === selectedVideoId) || videos[0];
  const currentPdf = pdfs.find((p) => p.contentId === selectedPdfId) || pdfs[0];
  const videoUrl = safeUrl(currentVideo?.contentData);
  const pdfUrl = safeUrl(currentPdf?.contentData);
  const flatLessons = chapters.flatMap((c) => c.lessons);
  const currentIndex = flatLessons.findIndex((l) => String(l.id) === String(lessonId));
  const previous = currentIndex > 0 ? flatLessons[currentIndex - 1] : null;
  const next = currentIndex >= 0 ? flatLessons[currentIndex + 1] : null;
  const activeChapter = chapters.find((c) => c.lessons.some((l) => String(l.id) === String(lessonId)));
  const shownChapter = expandedChapter ?? activeChapter?.id;
  const goToLesson = (id) => navigate(`/student/courses/${courseId}/lessons/${id}`);
  const formatTime = (value) => {
    const n = Math.floor(Number(value) || 0);
    return `${Math.floor(n / 60).toString().padStart(2, "0")}:${(n % 60).toString().padStart(2, "0")}`;
  };
  const togglePlay = async () => {
    if (!videoRef.current) return;
    try { if (videoRef.current.paused) await videoRef.current.play(); else videoRef.current.pause(); }
    catch { setPlaying(false); }
  };
  const seek = (seconds) => {
    if (videoRef.current) videoRef.current.currentTime = Math.max(0, Math.min(duration || Infinity, videoRef.current.currentTime + seconds));
  };
  const setPlaybackSpeed = (value) => {
    const nextSpeed = Number(value);
    setSpeed(nextSpeed);
    if (videoRef.current) videoRef.current.playbackRate = nextSpeed;
  };

  if (loading) return <div className="mx-auto max-w-7xl p-8 text-slate-600">Đang tải nội dung bài học...</div>;
  if (error) return (
    <main className="mx-auto max-w-2xl p-6">
      <div className={cx(styles.card, "p-8 text-center")}>
        <h1 className="mb-3 text-xl font-bold text-slate-900">Không thể mở bài học</h1>
        <p className="mb-6 text-red-600">{error}</p>
        <button onClick={() => navigate(`/student/courses/${courseId}`)} className={cx(styles.button, "bg-blue-700 text-white")}>Quay về khóa học</button>
      </div>
    </main>
  );
  if (!lesson) return null;

  return (
    <div className="min-h-screen bg-slate-50 pt-20 text-slate-900">
      <nav className="border-b border-slate-200 bg-white px-4 py-4">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-2 text-sm text-slate-500">
          <button className="font-medium text-blue-700 hover:underline" onClick={() => navigate("/student/my-courses")}>Khóa học của tôi</button>
          <span>/</span>
          <button className="hover:underline" onClick={() => navigate(`/student/courses/${courseId}`)}>{lesson.courseTitle}</button>
          <span>/</span><span>{lesson.chapterTitle}</span><span>/</span>
          <span className="font-semibold text-blue-700">{lesson.lessonTitle}</span>
        </div>
      </nav>
      <main className="mx-auto grid max-w-7xl grid-cols-1 items-start gap-6 px-4 py-6 lg:grid-cols-12">
        <section className="min-w-0 space-y-5 lg:col-span-8">
          <div className="overflow-hidden rounded-2xl bg-slate-950 shadow-lg">
            {videoUrl ? (
              <video key={videoUrl} ref={videoRef} src={videoUrl} controls playsInline preload="metadata"
                className="aspect-video w-full bg-slate-950 object-contain"
                onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)}
                onTimeUpdate={(e) => setTime(e.currentTarget.currentTime)}
                onLoadedMetadata={(e) => { setDuration(e.currentTarget.duration || 0); e.currentTarget.volume = volume; e.currentTarget.playbackRate = speed; }}
              />
            ) : (
              <div className="flex aspect-video items-center justify-center px-6 text-center text-slate-300">Bài học chưa có video hoặc đường dẫn video không hợp lệ.</div>
            )}
            <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm text-white">
              <div className="flex items-center gap-3">
                <button disabled={!videoUrl} onClick={() => seek(-10)} title="Lùi 10 giây">↶ 10s</button>
                <button disabled={!videoUrl} onClick={togglePlay} className="rounded-lg bg-blue-600 px-3 py-1.5 font-semibold">{playing ? "Tạm dừng" : "Phát"}</button>
                <button disabled={!videoUrl} onClick={() => seek(10)} title="Tiến 10 giây">10s ↷</button>
                <span className="font-mono text-xs text-slate-300">{formatTime(time)} / {formatTime(duration)}</span>
              </div>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-1">Âm lượng <input aria-label="Âm lượng" type="range" min="0" max="1" step="0.05" value={volume} onChange={(e) => { const v = Number(e.target.value); setVolume(v); if (videoRef.current) videoRef.current.volume = v; }} className="w-16" /></label>
                <select aria-label="Tốc độ phát" value={speed} onChange={(e) => setPlaybackSpeed(e.target.value)} className="rounded bg-slate-800 p-1 text-white"><option value="0.75">0.75x</option><option value="1">1x</option><option value="1.25">1.25x</option><option value="1.5">1.5x</option><option value="2">2x</option></select>
                <button disabled={!videoUrl} onClick={() => videoRef.current?.requestFullscreen?.()} title="Toàn màn hình">⛶</button>
              </div>
            </div>
          </div>
          <div className={cx(styles.card, "flex flex-col items-center justify-between gap-4 p-5 md:flex-row")}>
            <button disabled={!previous} onClick={() => goToLesson(previous.id)} className={cx(styles.button, "w-full bg-slate-100 text-slate-700 hover:bg-slate-200 md:w-auto")}>← Bài trước</button>
            <div className="min-w-0 text-center md:text-left">
              <div className="mb-1 text-xs font-bold uppercase tracking-wider text-blue-700">{lesson.chapterTitle}</div>
              <h1 className="text-xl font-bold leading-tight">{lesson.lessonTitle}</h1>
            </div>
            <button disabled={!next} onClick={() => goToLesson(next.id)} className={cx(styles.button, "w-full bg-blue-700 text-white hover:bg-blue-800 md:w-auto")}>Bài tiếp theo →</button>
          </div>
          <div className={cx(styles.card, "p-5")}>
            <div className="mb-5 flex flex-wrap gap-2 rounded-xl bg-slate-100 p-1.5">
              {[["overview", "Tổng quan bài giảng"], ["pdf", `Tài liệu PDF (${pdfs.length})`], ["quiz", `Bài tập (${quizzes.length})`], ["notes", "Ghi chú"]].map(([key, label]) => (
                <button key={key} onClick={() => setTab(key)} className={cx(styles.tab, tab === key ? "bg-white text-blue-700 shadow-sm" : "text-slate-600 hover:bg-white/60")}>{label}</button>
              ))}
            </div>
            {tab === "overview" && <div className="space-y-5">
              <h2 className="text-lg font-bold">Nội dung và mục tiêu học tập</h2>
              {texts.length ? texts.map((item) => <article key={item.contentId} className="rounded-xl bg-slate-50 p-4"><h3 className="mb-2 font-semibold">{item.title}</h3><p className="whitespace-pre-wrap break-words text-sm leading-7 text-slate-700">{item.contentData}</p></article>) : <p className="text-slate-500">Bài học chưa có nội dung văn bản.</p>}
              {videos.length > 1 && <div><h3 className="mb-2 font-semibold">Video trong bài học</h3>{videos.map((v) => <button key={v.contentId} onClick={() => { setSelectedVideoId(v.contentId); setPlaying(false); }} className={cx("mb-2 block w-full rounded-lg p-3 text-left", currentVideo?.contentId === v.contentId ? "bg-blue-50 text-blue-800" : "bg-slate-50")}>▶ {v.title}</button>)}</div>}
            </div>}
            {tab === "pdf" && <div className="space-y-4">
              {pdfs.length ? <><div className="flex flex-wrap gap-2">{pdfs.map((p) => <button key={p.contentId} onClick={() => setSelectedPdfId(p.contentId)} className={cx(styles.tab, currentPdf?.contentId === p.contentId ? "bg-blue-100 text-blue-800" : "bg-slate-100")}>📄 {p.title}</button>)}</div>
                {pdfUrl ? <><div className="flex justify-end"><a href={pdfUrl} target="_blank" rel="noopener noreferrer" className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white">Mở / tải PDF</a></div><iframe title={currentPdf?.title || "Tài liệu PDF"} src={pdfUrl} className="h-[550px] w-full rounded-xl border border-slate-200" /></> : <p>Đường dẫn PDF không hợp lệ.</p>}</> : <p className="text-slate-500">Bài học chưa có tài liệu PDF.</p>}
            </div>}
            {tab === "quiz" && <div className="space-y-3">{quizzes.length ? quizzes.map((q) => <div key={q.quizId} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 p-4"><div><p className="text-xs font-semibold text-blue-700">Trắc nghiệm</p><h3 className="font-semibold">{q.title}</h3></div><span className="text-sm text-slate-500">Chưa kết nối API làm bài Quiz</span></div>) : <p className="text-slate-500">Bài học chưa có bài tập.</p>}</div>}
            {tab === "notes" && <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">Chức năng lưu ghi chú cần bổ sung API Backend. Hiện chưa hỗ trợ lưu ghi chú vào Database.</p>}
          </div>
        </section>
        <aside className="min-w-0 lg:sticky lg:top-6 lg:col-span-4">
          <div className={cx(styles.card, "overflow-hidden")}>
            <div className="grid grid-cols-2 gap-1 bg-slate-100 p-2">
              <button onClick={() => setSidebarTab("syllabus")} className={cx(styles.tab, sidebarTab === "syllabus" ? "bg-white text-blue-700 shadow" : "text-slate-600")}>☷ Bài học</button>
              <button onClick={() => setSidebarTab("ai")} className={cx(styles.tab, sidebarTab === "ai" ? "bg-white text-blue-700 shadow" : "text-slate-600")}>✦ Hỏi đáp AI</button>
            </div>
            {sidebarTab === "syllabus" ? <div className="max-h-[720px] space-y-3 overflow-y-auto p-4">
              <div className="rounded-xl bg-slate-50 p-4"><div className="flex justify-between text-sm font-semibold"><span>Danh sách bài học</span><span>{flatLessons.length} bài</span></div><p className="mt-2 text-xs text-slate-500">Tiến độ hoàn thành cần API Backend riêng.</p></div>
              {curriculumError && <p className="text-sm text-amber-700">{curriculumError}</p>}
              {chapters.length ? chapters.map((chapter) => <div key={chapter.id} className="overflow-hidden rounded-xl border border-slate-200">
                <button className="flex w-full items-center justify-between gap-2 bg-slate-50 p-3 text-left text-sm font-bold hover:bg-slate-100" onClick={() => setExpandedChapter(shownChapter === chapter.id ? "closed" : chapter.id)}><span>{chapter.title}</span><span>{shownChapter === chapter.id ? "⌃" : "⌄"}</span></button>
                {shownChapter === chapter.id && <div className="space-y-1 p-2">{chapter.lessons.map((item) => <button key={item.id} onClick={() => goToLesson(item.id)} className={cx("block w-full rounded-lg px-3 py-2 text-left text-sm", String(item.id) === String(lessonId) ? "bg-blue-100 font-bold text-blue-800" : "text-slate-700 hover:bg-slate-50")}>{String(item.id) === String(lessonId) ? "▶ " : "○ "}{item.title}</button>)}</div>}
              </div>) : !curriculumError && <p className="text-sm text-slate-500">Không có dữ liệu chương/bài học từ API.</p>}
              <div className="rounded-xl border border-slate-200 p-3"><h3 className="mb-2 text-sm font-bold">Nội dung bài đang xem</h3>{contents.map((item) => <button key={item.contentId} onClick={() => { if (isVideo(item)) { setSelectedVideoId(item.contentId); setTab("overview"); } else if (isPdf(item)) { setSelectedPdfId(item.contentId); setTab("pdf"); } else setTab("overview"); }} className="block w-full rounded-lg px-2 py-2 text-left text-xs text-slate-700 hover:bg-blue-50">{isVideo(item) ? "▶" : isPdf(item) ? "📄" : "▤"} {item.title}</button>)}</div>
            </div> : <div className="flex min-h-[450px] flex-col justify-between gap-4 p-4"><div><h3 className="font-bold text-blue-700">Trợ lý EduSmart AI</h3><p className="mt-2 rounded-xl bg-slate-50 p-3 text-sm text-slate-600">Giao diện AI đã sẵn sàng. Cần API chat Backend để gửi câu hỏi và nhận phản hồi thực tế.</p><div className="mt-4 flex flex-wrap gap-2">{["Giải thích lại khái niệm này", "Cho tôi ví dụ thực tế", "Lỗi hay gặp khi học bài"].map((s) => <button key={s} onClick={() => setAiInput(s)} className="rounded-full bg-slate-100 px-3 py-2 text-xs hover:bg-blue-50">💡 {s}</button>)}</div></div><div className="flex gap-2"><input value={aiInput} onChange={(e) => setAiInput(e.target.value)} placeholder="Hỏi AI về bài học..." className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm" /><button disabled title="Chưa có API chat AI" className="rounded-lg bg-slate-300 px-3 py-2 text-white">Gửi</button></div></div>}
          </div>
        </aside>
      </main>
    </div>
  );
}
