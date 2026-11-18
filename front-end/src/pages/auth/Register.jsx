
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import {
  GraduationCap,
  UserRound,
  AtSign,
  Mail,
  LockKeyhole,
  ShieldCheck,
  Eye,
  EyeOff,
  ArrowRight,
  LoaderCircle,
  CheckCircle2,
  Sparkles,
  BookOpen,
  Users,
} from "lucide-react";

import api from "../../services/api";
import Footer from "../../components/auth/Footer";

// ========================================
// HÌNH ẢNH TỪ STITCH AI
// ========================================

const REGISTER_IMAGE =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuBsV9dJExjg2qODiu-GHylRAXuaqvLTI7la4jUPwdEHSMWjybY-IzRyZn8elYs5-A31XjJzY3C_EcU_c2bES_IYkFYgLZTaxSQrxi5V86rS2bPkxRJcFoTMxjiRenGOJxYwI8AaeTt7Sha2FyPgNyxiubtohGKALYfDdgXc72izTt4y08M8uO8_Q9thBLAXfdEQ4-C-63b-8sVfTRAhM5LiQ2IJcPHbUrRhjKkfHXqp";

// ========================================
// DỮ LIỆU BAN ĐẦU
// ========================================

const initialForm = {
  fullName: "",
  username: "",
  email: "",
  password: "",
  confirmPassword: "",
};

// ========================================
// ĐỘ MẠNH MẬT KHẨU
// ========================================

function getPasswordStrength(password) {
  let score = 0;

  if (password.length >= 8) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) {
    score++;
  }
  if (/\d/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (!password) return { score: 0, label: "" };
  if (score <= 1) return { score, label: "Yếu" };
  if (score === 2) return { score, label: "Trung bình" };
  if (score === 3) return { score, label: "Khá" };

  return { score, label: "Mạnh" };
}

// ========================================
// STYLE TAILWIND DÙNG CHUNG
// ========================================

const inputClass = `
  h-11
  w-full
  rounded-xl
  border
  border-slate-200
  bg-[#f2f3ff]
  pl-10
  pr-4
  text-sm
  text-[#131b2e]
  outline-none
  transition
  placeholder:text-slate-400
  focus:border-[#0051d5]
  focus:bg-white
  focus:ring-2
  focus:ring-blue-100
  disabled:opacity-60
`;

const labelClass =
  "mb-1.5 block text-xs font-semibold text-[#131b2e]";

// ========================================
// REGISTER COMPONENT
// ========================================

export default function Register() {
  const navigate = useNavigate();

  const [form, setForm] = useState(initialForm);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const strength = getPasswordStrength(form.password);

  // ========================================
  // CẬP NHẬT FORM
  // ========================================

  const updateField = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    setError("");
  };

  // ========================================
  // ĐĂNG KÝ - GIỮ KẾT NỐI BACKEND
  // ========================================

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (submitting) return;

    const fullName = form.fullName.trim();
    const username = form.username.trim();
    const email = form.email.trim();

    if (!fullName || !username || !email || !form.password) {
      setError("Vui lòng nhập đầy đủ thông tin.");
      return;
    }

    if (username.length < 3) {
      setError("Tên đăng nhập phải có ít nhất 3 ký tự.");
      return;
    }

    if (form.password.length < 8) {
      setError("Mật khẩu phải có ít nhất 8 ký tự.");
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError("Mật khẩu xác nhận không khớp.");
      return;
    }

    if (!acceptedTerms) {
      setError("Vui lòng đồng ý với điều khoản sử dụng.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const response = await api.post("/users/register", {
        fullName,
        username,
        email,
        password: form.password,
      });

      if (
        response.data?.code != null &&
        response.data.code !== 1000
      ) {
        throw new Error(
          response.data?.message || "Đăng ký thất bại."
        );
      }

      toast.success("Đăng ký tài khoản thành công!");

      navigate("/login", {
        replace: true,
      });
    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.response?.data?.detail ||
        err.message ||
        "Không thể đăng ký. Vui lòng thử lại.";

      setError(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  // ========================================
  // GIAO DIỆN
  // ========================================

  return (
    <div className="flex min-h-screen flex-col bg-[#faf8ff] font-sans text-[#131b2e]">

      <main className="flex flex-1 items-center justify-center px-4 py-5 sm:px-6 lg:px-8">

        {/* KHUNG CHÍNH - CÙNG KÍCH THƯỚC LOGIN */}
        <div
          className="
            grid w-full max-w-[1200px] grid-cols-1 overflow-hidden rounded-2xl bg-white shadow-2xl lg:min-h-[590px] lg:grid-cols-2
          "
        >

          {/* ========================================
              BÊN TRÁI - SHOWCASE STITCH AI
          ======================================== */}

          <section
            className="
              relative
              flex
              min-w-0
              flex-col
              justify-between
              overflow-hidden
              bg-gradient-to-br
              from-[#00288e]
              via-[#1e40af]
              to-[#316bf3]
              p-6
              text-white
              sm:p-7
              lg:p-8
            "
          >

            {/* HIỆU ỨNG NỀN */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-cyan-300/20 blur-3xl"
            />

            <div
              aria-hidden="true"
              className="pointer-events-none absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-indigo-300/20 blur-3xl"
            />

            <div className="relative z-10">

              {/* LOGO */}
              <div className="mb-4 flex items-center gap-3">

                <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/20 bg-white/15 shadow-lg">
                  <GraduationCap size={26} />
                </div>

                <span className="text-2xl font-extrabold tracking-tight">
                  EduSmart
                </span>
              </div>

              {/* NHÃN */}
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/15 px-3 py-1.5 text-[11px] font-semibold text-white">
                <Sparkles size={14} className="text-cyan-200" />
                Nền tảng học trực tuyến thế hệ mới
              </div>

              {/* TIÊU ĐỀ */}
              <h1 className="text-[27px] font-extrabold leading-[1.18] tracking-tight sm:text-[30px] lg:text-[32px]">
                Mở khóa tương lai
                <span className="mt-1 block text-cyan-200">
                  Học tập không giới hạn
                </span>
              </h1>

              {/* MÔ TẢ */}
              <p className="mt-3 max-w-md text-sm leading-6 text-blue-100">
                Bắt đầu hành trình phát triển kiến thức,
                kỹ năng và chinh phục mục tiêu của bạn
                cùng EduSmart.
              </p>

              {/* TÍNH NĂNG */}
              <div className="mt-4 flex flex-wrap gap-2">

                <span className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/15 px-2.5 py-1.5 text-[11px] font-semibold">
                  <BookOpen size={15} className="text-cyan-200" />
                  Kho học liệu phong phú
                </span>

                <span className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/15 px-2.5 py-1.5 text-[11px] font-semibold">
                  <Users size={15} className="text-cyan-200" />
                  Kết nối cộng đồng
                </span>

                <span className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/15 px-2.5 py-1.5 text-[11px] font-semibold">
                  <ShieldCheck size={15} className="text-cyan-200" />
                  Tài khoản bảo mật
                </span>

              </div>
            </div>

            {/* ========================================
                ẢNH MINH HỌA
            ======================================== */}

            <div className="relative z-10 my-4">

              <div className="relative overflow-hidden rounded-2xl border border-white/20 bg-white/10 p-1.5 shadow-xl">

                <div className="relative overflow-hidden rounded-xl">

                  <img
                    src={REGISTER_IMAGE}
                    alt="Học tập trực tuyến cùng EduSmart"
                    loading="lazy"
                    className="h-44 w-full object-cover object-center sm:h-48"
                  />

                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#00288e]/70 via-transparent to-transparent" />

                </div>

                {/* NHÃN TRÊN ẢNH */}
                <div className="absolute bottom-3 left-3 right-3 flex items-center gap-2 rounded-lg border border-white/20 bg-[#00288e]/80 px-3 py-2 text-xs font-semibold text-white backdrop-blur-md">

                  <Sparkles size={16} className="shrink-0 text-cyan-200" />

                  <span>
                    Học tập thông minh cùng EduSmart
                  </span>

                  <CheckCircle2
                    size={16}
                    className="ml-auto shrink-0 text-cyan-200"
                  />

                </div>
              </div>
            </div>

            {/* CHÂN TRANG BÊN TRÁI */}
            <div className="relative z-10 flex items-center gap-2 border-t border-white/15 pt-3 text-xs text-blue-100">
              <CheckCircle2
                size={16}
                className="shrink-0 text-cyan-300"
              />
              Học hỏi mỗi ngày, phát triển mỗi ngày.
            </div>

          </section>

          {/* ========================================
              BÊN PHẢI - FORM ĐĂNG KÝ
          ======================================== */}

          <section className="flex min-w-0 items-center justify-center bg-white px-6 py-6 sm:px-8 lg:px-10">

            <div className="w-full max-w-lg">

              {/* HEADER */}
              <div className="mb-5">

                <span className="inline-flex items-center gap-2 rounded-full bg-[#e2e7ff] px-3 py-1.5 text-[11px] font-semibold text-[#00288e]">
                  <ShieldCheck size={14} />
                  Đăng ký thành viên mới
                </span>

                <h2 className="mt-3 text-[26px] font-extrabold leading-tight tracking-tight text-[#131b2e]">
                  Tạo tài khoản EduSmart
                </h2>

                <p className="mt-2 text-xs leading-5 text-slate-500">
                  Điền thông tin bên dưới để bắt đầu hành trình
                  học tập của bạn.
                </p>

              </div>

              {/* ========================================
                  FORM
              ======================================== */}

              <form
                onSubmit={handleSubmit}
                className="space-y-3.5"
              >

                {/* HỌ TÊN + USERNAME */}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">

                  <div>
                    <label htmlFor="fullName" className={labelClass}>
                      Họ và tên <span className="text-red-500">*</span>
                    </label>

                    <div className="relative">

                      <UserRound
                        size={17}
                        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                      />

                      <input
                        id="fullName"
                        name="fullName"
                        type="text"
                        placeholder="Nguyễn Văn An"
                        autoComplete="name"
                        value={form.fullName}
                        onChange={updateField}
                        disabled={submitting}
                        required
                        className={inputClass}
                      />

                    </div>
                  </div>

                  <div>
                    <label htmlFor="registerUsername" className={labelClass}>
                      Tên đăng nhập <span className="text-red-500">*</span>
                    </label>

                    <div className="relative">

                      <AtSign
                        size={17}
                        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                      />

                      <input
                        id="registerUsername"
                        name="username"
                        type="text"
                        placeholder="annguyen.edu"
                        autoComplete="username"
                        value={form.username}
                        onChange={updateField}
                        disabled={submitting}
                        required
                        className={inputClass}
                      />

                    </div>
                  </div>

                </div>

                {/* EMAIL */}
                <div>
                  <label htmlFor="registerEmail" className={labelClass}>
                    Email <span className="text-red-500">*</span>
                  </label>

                  <div className="relative">

                    <Mail
                      size={17}
                      className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />

                    <input
                      id="registerEmail"
                      name="email"
                      type="email"
                      placeholder="example@gmail.com"
                      autoComplete="email"
                      value={form.email}
                      onChange={updateField}
                      disabled={submitting}
                      required
                      className={inputClass}
                    />

                  </div>
                </div>

                {/* MẬT KHẨU + XÁC NHẬN */}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">

                  {/* MẬT KHẨU */}
                  <div>
                    <label htmlFor="registerPassword" className={labelClass}>
                      Mật khẩu <span className="text-red-500">*</span>
                    </label>

                    <div className="relative">

                      <LockKeyhole
                        size={17}
                        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                      />

                      <input
                        id="registerPassword"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Ít nhất 8 ký tự"
                        autoComplete="new-password"
                        value={form.password}
                        onChange={updateField}
                        disabled={submitting}
                        required
                        minLength={8}
                        className={`${inputClass} pr-10`}
                      />

                      <button
                        type="button"
                        disabled={submitting}
                        onClick={() => setShowPassword((v) => !v)}
                        aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-blue-700"
                      >
                        {showPassword ? (
                          <Eye size={17} />
                        ) : (
                          <EyeOff size={17} />
                        )}
                      </button>

                    </div>
                  </div>

                  {/* XÁC NHẬN */}
                  <div>
                    <label htmlFor="confirmPassword" className={labelClass}>
                      Xác nhận mật khẩu <span className="text-red-500">*</span>
                    </label>

                    <div className="relative">

                      <ShieldCheck
                        size={17}
                        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                      />

                      <input
                        id="confirmPassword"
                        name="confirmPassword"
                        type={showConfirm ? "text" : "password"}
                        placeholder="Nhập lại mật khẩu"
                        autoComplete="new-password"
                        value={form.confirmPassword}
                        onChange={updateField}
                        disabled={submitting}
                        required
                        className={`${inputClass} pr-10`}
                      />

                      <button
                        type="button"
                        disabled={submitting}
                        onClick={() => setShowConfirm((v) => !v)}
                        aria-label={showConfirm ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-blue-700"
                      >
                        {showConfirm ? (
                          <Eye size={17} />
                        ) : (
                          <EyeOff size={17} />
                        )}
                      </button>

                    </div>
                  </div>

                </div>

                {/* ĐỘ MẠNH MẬT KHẨU */}
                {form.password && (
                  <div className="flex items-center gap-3">

                    <div className="flex flex-1 gap-1">
                      {[1, 2, 3, 4].map((level) => (
                        <div
                          key={level}
                          className={`h-1.5 flex-1 rounded-full ${
                            level <= strength.score
                              ? strength.score <= 1
                                ? "bg-red-500"
                                : strength.score === 2
                                ? "bg-amber-400"
                                : strength.score === 3
                                ? "bg-blue-500"
                                : "bg-green-500"
                              : "bg-slate-200"
                          }`}
                        />
                      ))}
                    </div>

                    <span className="shrink-0 text-[11px] text-slate-500">
                      Độ mạnh: {strength.label}
                    </span>

                  </div>
                )}

                {/* MẬT KHẨU KHỚP */}
                {form.confirmPassword &&
                  form.password === form.confirmPassword && (
                    <div className="flex items-center gap-1.5 text-[11px] text-green-600">
                      <CheckCircle2 size={14} />
                      Mật khẩu xác nhận khớp
                    </div>
                  )}

                {/* ĐIỀU KHOẢN */}
                <label className="flex cursor-pointer items-start gap-2.5">

                  <input
                    type="checkbox"
                    checked={acceptedTerms}
                    onChange={(event) =>
                      setAcceptedTerms(event.target.checked)
                    }
                    disabled={submitting}
                    required
                    className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-[#0051d5]"
                  />

                  <span className="text-[11px] leading-5 text-slate-500">
                    Tôi đồng ý với{" "}
                    <span className="font-semibold text-[#0051d5]">
                      Điều khoản sử dụng
                    </span>{" "}
                    và{" "}
                    <span className="font-semibold text-[#0051d5]">
                      Chính sách bảo mật
                    </span>{" "}
                    của EduSmart.
                  </span>

                </label>

                {/* LỖI BACKEND */}
                {error && (
                  <div
                    role="alert"
                    className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700"
                  >
                    {error}
                  </div>
                )}

                {/* NÚT ĐĂNG KÝ */}
                <button
                  type="submit"
                  disabled={submitting}
                  className="
                    group
                    flex
                    h-11
                    w-full
                    items-center
                    justify-center
                    gap-2
                    rounded-xl
                    bg-[#0051d5]
                    px-4
                    text-sm
                    font-bold
                    text-white
                    shadow-md
                    transition
                    hover:bg-[#00288e]
                    hover:shadow-lg
                    disabled:cursor-not-allowed
                    disabled:opacity-60
                  "
                >
                  {submitting ? (
                    <>
                      <LoaderCircle
                        size={18}
                        className="animate-spin"
                      />
                      Đang tạo tài khoản...
                    </>
                  ) : (
                    <>
                      Tạo tài khoản học tập
                      <ArrowRight
                        size={18}
                        className="transition-transform group-hover:translate-x-1"
                      />
                    </>
                  )}
                </button>

              </form>

              {/* ========================================
                  LIÊN KẾT ĐĂNG NHẬP
              ======================================== */}

              <div className="mt-5 border-t border-slate-100 pt-4 text-center text-xs text-slate-600">

                Đã có tài khoản EduSmart?{" "}

                <Link
                  to="/login"
                  className="font-bold text-[#0051d5] hover:underline"
                >
                  Đăng nhập ngay
                </Link>

              </div>

              <div className="mt-3 text-center">

                <Link
                  to="/student"
                  className="text-[11px] font-medium text-slate-500 hover:text-blue-700"
                >
                  Khám phá khóa học không cần đăng nhập
                </Link>

              </div>

            </div>
          </section>

        </div>
      </main>

      {/* FOOTER DÙNG CHUNG VỚI LOGIN */}
      <Footer />

    </div>
  );
}
