
import { useState } from "react";
import {
  Link,
  Navigate,
  useLocation,
  useNavigate,
} from "react-router-dom";
import toast from "react-hot-toast";
import {
  ArrowRight,
  AtSign,
  Eye,
  EyeOff,
  KeyRound,
  LoaderCircle,
  LockKeyhole,
} from "lucide-react";

import AuthShowcase from "../../components/auth/AuthShowcase";
import Footer from "../../components/auth/Footer";
import { useAuth } from "../../context/AuthContext";

// ========================================
// ROLE HELPERS
// ========================================

const normalizeRole = (role) =>
  String(role || "")
    .replace(/^ROLE_/i, "")
    .toUpperCase();

const getRedirectByRole = (role) => {
  const normalized = normalizeRole(role);

  return (
    {
      ADMIN: "/admin",
      INSTRUCTOR: "/instructor",
      STUDENT: "/student",
    }[normalized] || "/student"
  );
};

const canAccessPath = (path, role) => {
  if (
    !path ||
    !path.startsWith("/") ||
    path.startsWith("//")
  ) {
    return false;
  }

  const normalized = normalizeRole(role);

  if (
    path === "/admin" ||
    path.startsWith("/admin/")
  ) {
    return normalized === "ADMIN";
  }

  if (
    path === "/instructor" ||
    path.startsWith("/instructor/")
  ) {
    return normalized === "INSTRUCTOR";
  }

  if (
    path === "/student" ||
    path.startsWith("/student/")
  ) {
    return normalized === "STUDENT";
  }

  return false;
};

// ========================================
// LOGIN PAGE
// ========================================

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();

  const {
    login,
    user,
    isAuthenticated,
    loading,
  } = useAuth();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] =
    useState(false);

  const [submitting, setSubmitting] =
    useState(false);

  const [error, setError] = useState("");

  const previousPath =
    location.state?.from?.pathname;

  const previousSearch =
    location.state?.from?.search || "";

  const previousHash =
    location.state?.from?.hash || "";

  // ========================================
  // LOGIN HANDLER - GIỮ NGUYÊN BACKEND
  // ========================================

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (submitting) return;

    const trimmed = username.trim();

    if (!trimmed) {
      setError("Vui lòng nhập tên đăng nhập.");
      return;
    }

    if (!password) {
      setError("Vui lòng nhập mật khẩu.");
      return;
    }

    setError("");
    setSubmitting(true);

    try {
      const result = await login(
        trimmed,
        password
      );

      const role = normalizeRole(result?.role);

      toast.success("Đăng nhập thành công!");

      const destination = canAccessPath(
        previousPath,
        role
      )
        ? previousPath +
          previousSearch +
          previousHash
        : getRedirectByRole(role);

      navigate(destination, {
        replace: true,
      });
    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.response?.data?.detail ||
        err.message ||
        "Đăng nhập thất bại. Vui lòng thử lại.";

      setError(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  // ========================================
  // RESTORE SESSION LOADING
  // ========================================

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center gap-3 bg-[#faf8ff] text-slate-600">
        <LoaderCircle
          size={24}
          className="animate-spin text-blue-600"
        />

        <span className="text-sm font-medium">
          Đang kiểm tra phiên đăng nhập...
        </span>
      </div>
    );
  }

  // ========================================
  // ALREADY AUTHENTICATED
  // ========================================

  if (isAuthenticated) {
    const destination = canAccessPath(
      previousPath,
      user?.role
    )
      ? previousPath +
        previousSearch +
        previousHash
      : getRedirectByRole(user?.role);

    return (
      <Navigate
        to={destination}
        replace
      />
    );
  }

  // ========================================
  // LOGIN UI - TAILWIND
  // ========================================

  return (
    <div className="flex min-h-screen flex-col bg-[#faf8ff] font-sans text-[#131b2e]">

      {/* MAIN CONTENT */}
      <main className="flex flex-1 items-center justify-center px-4 py-5 sm:px-6 lg:px-8">

        {/* LOGIN CARD */}
        <div className="grid w-full max-w-[1200px] grid-cols-1 overflow-hidden rounded-2xl bg-white shadow-2xl lg:min-h-[590px] lg:grid-cols-2">

          {/* LEFT SHOWCASE */}
          <div className="min-w-0">
            <AuthShowcase />
          </div>

          {/* RIGHT FORM */}
          <section className="flex min-w-0 items-center justify-center bg-white px-6 py-7 sm:px-9 lg:px-10 lg:py-8">

            <div className="w-full max-w-md">

              {/* HEADING */}
              <div className="mb-6">

                <span className="inline-flex items-center gap-2 rounded-full bg-[#e2e7ff] px-3 py-1.5 text-xs font-semibold text-[#00288e]">
                  <LockKeyhole size={15} />
                  Cổng đăng nhập an toàn
                </span>

                <h1 className="mt-4 text-2xl font-extrabold leading-tight tracking-tight text-[#131b2e] sm:text-[28px]">
                  Chào mừng trở lại EduSmart
                </h1>

                <p className="mt-2 text-sm leading-6 text-[#444653]">
                  Tiếp tục chinh phục mục tiêu tri thức
                  và kiến thức mới ngay hôm nay.
                </p>

              </div>

              {/* LOGIN FORM */}
              <form
                onSubmit={handleSubmit}
                className="space-y-4"
              >

                {/* USERNAME */}
                <div>
                  <label
                    htmlFor="username"
                    className="mb-1.5 block text-sm font-semibold text-[#131b2e]"
                  >
                    Tên đăng nhập
                  </label>

                  <div className="relative">

                    <AtSign
                      size={19}
                      className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
                    />

                    <input
                      id="username"
                      name="username"
                      type="text"
                      autoComplete="username"
                      required
                      disabled={submitting}
                      value={username}
                      onChange={(e) => {
                        setUsername(e.target.value);

                        if (error) {
                          setError("");
                        }
                      }}
                      placeholder="Nhập tên đăng nhập"
                      className="h-11 w-full rounded-xl border border-slate-200 bg-[#f2f3ff] pl-12 pr-4 text-sm text-[#131b2e] outline-none transition focus:border-[#0051d5] focus:bg-white focus:ring-2 focus:ring-blue-200 disabled:opacity-60"
                    />

                  </div>
                </div>

                {/* PASSWORD */}
                <div>
                  <label
                    htmlFor="password"
                    className="mb-1.5 block text-sm font-semibold text-[#131b2e]"
                  >
                    Mật khẩu
                  </label>

                  <div className="relative">

                    <KeyRound
                      size={19}
                      className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
                    />

                    <input
                      id="password"
                      name="password"
                      type={
                        showPassword
                          ? "text"
                          : "password"
                      }
                      autoComplete="current-password"
                      required
                      disabled={submitting}
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);

                        if (error) {
                          setError("");
                        }
                      }}
                      placeholder="Nhập mật khẩu của bạn"
                      className="h-11 w-full rounded-xl border border-slate-200 bg-[#f2f3ff] pl-12 pr-12 text-sm text-[#131b2e] outline-none transition focus:border-[#0051d5] focus:bg-white focus:ring-2 focus:ring-blue-200 disabled:opacity-60"
                    />

                    <button
                      type="button"
                      disabled={submitting}
                      onClick={() =>
                        setShowPassword((v) => !v)
                      }
                      aria-label={
                        showPassword
                          ? "Ẩn mật khẩu"
                          : "Hiện mật khẩu"
                      }
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-blue-700"
                    >
                      {showPassword ? (
                        <Eye size={19} />
                      ) : (
                        <EyeOff size={19} />
                      )}
                    </button>

                  </div>
                </div>

                {/* FORGOT PASSWORD */}
                <div className="flex flex-wrap items-center justify-between gap-3 text-sm">

                  <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                    <LockKeyhole size={13} />
                    Bảo vệ tài khoản của bạn
                  </span>

                  <Link
                    to="/forgot-password"
                    className="font-semibold text-[#0051d5] hover:underline"
                  >
                    Quên mật khẩu?
                  </Link>

                </div>

                {/* ERROR MESSAGE */}
                {error && (
                  <div
                    role="alert"
                    className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                  >
                    {error}
                  </div>
                )}

                {/* SUBMIT BUTTON */}
                <button
                  type="submit"
                  disabled={submitting}
                  className="group flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#0051d5] px-5 text-sm font-bold text-white shadow-md transition hover:bg-[#00288e] hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
                >

                  {submitting ? (
                    <>
                      <LoaderCircle
                        size={19}
                        className="animate-spin"
                      />
                      Đang xác thực...
                    </>
                  ) : (
                    <>
                      Đăng nhập tài khoản

                      <ArrowRight
                        size={19}
                        className="transition-transform group-hover:translate-x-1"
                      />
                    </>
                  )}

                </button>

              </form>

              {/* REGISTER LINK */}
              <div className="mt-6 border-t border-slate-100 pt-5 text-center text-sm text-slate-600">

                Chưa có tài khoản EduSmart?{" "}

                <Link
                  to="/register"
                  className="font-semibold text-[#0051d5] hover:underline"
                >
                  Đăng ký ngay
                </Link>

              </div>

              {/* EXPLORE */}
              <div className="mt-3 text-center">

                <Link
                  to="/student"
                  className="text-xs font-medium text-slate-500 hover:text-blue-700"
                >
                  Khám phá khóa học không cần đăng nhập
                </Link>

              </div>

            </div>
          </section>

        </div>
      </main>

      {/* FOOTER */}
      <Footer />

    </div>
  );
}
