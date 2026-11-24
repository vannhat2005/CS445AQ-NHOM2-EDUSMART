
import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { GraduationCap, ShieldCheck, LockKeyhole, Mail, ArrowRight, ArrowLeft, CheckCircle2, Eye, EyeOff, RefreshCw, Clock3, Shield, KeyRound, Check } from "lucide-react";
import { sendForgotPasswordOtp, resendForgotPasswordOtp, verifyForgotPasswordOtp, resetForgotPassword, getForgotPasswordError } from "../../services/forgotPasswordApi";

const steps = [{ number: 1, title: "Gửi Email" }, { number: 2, title: "Nhập OTP" }, { number: 3, title: "Đổi mật khẩu" }];
const inputClass = "w-full h-12 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-800 outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100";

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(Array(6).fill(""));
  const [timeLeft, setTimeLeft] = useState(180);
  const [resendTimeLeft, setResendTimeLeft] = useState(0);
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const otpRefs = useRef([]);

  // Đồng hồ đếm ngược OTP
  useEffect(() => {
    if (step !== 2 || timeLeft <= 0) return;
    const timer = setInterval(() => setTimeLeft(prev => Math.max(prev - 1, 0)), 1000);
    return () => clearInterval(timer);
  }, [step, timeLeft]);

  // Đồng hồ giới hạn gửi lại OTP
  useEffect(() => {
    if (step !== 2 || resendTimeLeft <= 0) return;
    const timer = setInterval(() => setResendTimeLeft(prev => Math.max(prev - 1, 0)), 1000);
    return () => clearInterval(timer);
  }, [step, resendTimeLeft]);

  const formatTime = seconds => `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
  const validateEmail = value => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

  // Bước 1: Gửi OTP
  const handleSendOtp = async e => {
    e.preventDefault();
    const normalizedEmail = email.trim();
    if (!normalizedEmail) return toast.error("Vui lòng nhập địa chỉ Email!");
    if (!validateEmail(normalizedEmail)) return toast.error("Địa chỉ Email không hợp lệ!");
    try {
      setLoading(true);
      const response = await sendForgotPasswordOtp(normalizedEmail);
      setEmail(normalizedEmail);
      setOtp(Array(6).fill(""));
      setResetToken("");
      setTimeLeft(180);
      setResendTimeLeft(60);
      setStep(2);
      toast.success(response.message || "Nếu Email đã đăng ký, mã OTP sẽ được gửi đến hộp thư!");
    } catch (error) {
      toast.error(getForgotPasswordError(error));
    } finally {
      setLoading(false);
    }
  };

  // Xử lý nhập OTP
  const handleOtpChange = (index, value) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    setOtp(prev => { const updated = [...prev]; updated[index] = digit; return updated; });
    if (digit && index < 5) otpRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) otpRefs.current[index - 1]?.focus();
    if (e.key === "ArrowLeft" && index > 0) otpRefs.current[index - 1]?.focus();
    if (e.key === "ArrowRight" && index < 5) otpRefs.current[index + 1]?.focus();
  };

  const handleOtpPaste = e => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    const updated = Array(6).fill("");
    pasted.split("").forEach((digit, index) => { updated[index] = digit; });
    setOtp(updated);
    if (pasted.length > 0) otpRefs.current[Math.min(pasted.length, 5)]?.focus();
  };

  // Bước 2: Xác thực OTP
  const handleVerifyOtp = async e => {
    e.preventDefault();
    const otpCode = otp.join("");
    if (otpCode.length !== 6) return toast.error("Vui lòng nhập đầy đủ 6 số OTP!");
    if (timeLeft <= 0) return toast.error("Mã OTP đã hết hạn. Vui lòng gửi lại mã!");
    try {
      setLoading(true);
      const response = await verifyForgotPasswordOtp(email, otpCode);
      const token = response.result?.resetToken;
      if (!token) throw new Error("Không nhận được reset token từ Backend!");
      setResetToken(token);
      setStep(3);
      toast.success("Xác thực OTP thành công!");
    } catch (error) {
      toast.error(getForgotPasswordError(error));
    } finally {
      setLoading(false);
    }
  };

  // Gửi lại OTP
  const handleResendOtp = async () => {
    if (loading) return;
    if (resendTimeLeft > 0) return toast.error(`Vui lòng đợi ${resendTimeLeft} giây!`);
    try {
      setLoading(true);
      const response = await resendForgotPasswordOtp(email);
      setOtp(Array(6).fill(""));
      setResetToken("");
      setTimeLeft(180);
      setResendTimeLeft(60);
      otpRefs.current[0]?.focus();
      toast.success(response.message || "Đã xử lý yêu cầu gửi lại OTP!");
    } catch (error) {
      toast.error(getForgotPasswordError(error));
    } finally {
      setLoading(false);
    }
  };

  // Độ mạnh mật khẩu: chỉ bắt buộc tối thiểu 8 ký tự
  const isPasswordValid = newPassword.length >= 8;
  const hasUppercase = /[A-Z]/.test(newPassword);
  const hasNumberOrSpecial = /[\d\W_]/.test(newPassword);
  const passwordStrength = Number(isPasswordValid) + Number(hasUppercase) + Number(hasNumberOrSpecial);
  const strengthLabel = passwordStrength === 3 ? "Mạnh" : passwordStrength === 2 ? "Trung bình" : passwordStrength === 1 ? "Yếu" : "Chưa có";
  const isPasswordMatched = confirmPassword.length > 0 && newPassword === confirmPassword;

  // Bước 3: Đặt lại mật khẩu
  const handleResetPassword = async e => {
    e.preventDefault();
    if (!newPassword) return toast.error("Vui lòng nhập mật khẩu mới!");
    if (!isPasswordValid) return toast.error("Mật khẩu phải có ít nhất 8 ký tự!");
    if (!confirmPassword) return toast.error("Vui lòng xác nhận mật khẩu mới!");
    if (!isPasswordMatched) return toast.error("Mật khẩu xác nhận không khớp!");
    if (!resetToken) { toast.error("Phiên xác thực không hợp lệ. Vui lòng xác thực OTP lại!"); setStep(2); return; }
    try {
      setLoading(true);
      const response = await resetForgotPassword(resetToken, newPassword, confirmPassword);
      toast.success(response.message || "Đặt lại mật khẩu thành công!");
      setResetToken("");
      setOtp(Array(6).fill(""));
      setNewPassword("");
      setConfirmPassword("");
      navigate("/login", { replace: true });
    } catch (error) {
      toast.error(getForgotPasswordError(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f7ff] flex flex-col font-sans text-slate-800">
      <main className="flex-1 flex items-center justify-center px-4 py-8 md:py-12">
        <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">

          {/* CỘT TRÁI - THÔNG TIN EDUSMART */}
          <div className="lg:col-span-5 relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#102e91] via-[#1e40af] to-[#2563eb] p-7 md:p-8 text-white shadow-xl flex flex-col justify-between gap-7">
            <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-white/10 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -left-20 w-72 h-72 rounded-full bg-sky-400/20 blur-3xl pointer-events-none" />
            <div className="relative z-10 space-y-6">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-white/15 flex items-center justify-center shrink-0"><GraduationCap size={26} /></div>
                  <div>
                    <h2 className="text-xl font-extrabold tracking-tight">EduSmart</h2>
                    <p className="text-[10px] tracking-[0.12em] text-blue-100 font-semibold">HỌC VIỆN TRỰC TUYẾN</p>
                  </div>
                </div>
                <span className="text-[11px] bg-white/10 px-2.5 py-1.5 rounded-full flex items-center gap-1.5 whitespace-nowrap"><ShieldCheck size={14} className="text-sky-200" /> An toàn học viên</span>
              </div>

              <div>
                <span className="inline-flex items-center gap-2 rounded-lg bg-white/10 px-3 py-1.5 text-xs font-semibold text-blue-100"><ShieldCheck size={15} /> Bảo mật tài khoản EduSmart</span>
                <h1 className="text-[25px] md:text-[28px] xl:text-[30px] font-bold leading-snug tracking-tight mt-4">
                  {step === 1 ? "Khôi phục quyền truy cập nhanh chóng." : step === 2 ? "Xác minh tài khoản của bạn." : "Thiết lập mật khẩu mới an toàn."}
                </h1>
                <p className="mt-3 text-sm leading-relaxed text-blue-100">
                  {step === 1 ? "Khôi phục tài khoản học tập của bạn thông qua mã xác thực được gửi đến Email đăng ký." : step === 2 ? "Nhập mã OTP để xác minh quyền sở hữu tài khoản trước khi thiết lập mật khẩu mới." : "Bảo vệ tài khoản và toàn bộ quá trình học tập với mật khẩu mới."}
                </p>
              </div>
            </div>

            <div className="relative z-10 space-y-4">
              <div className="rounded-2xl bg-white/10 border border-white/10 p-4 backdrop-blur-sm">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 bg-white/15 rounded-xl flex items-center justify-center shrink-0"><LockKeyhole size={24} className="text-sky-200" /></div>
                  <div>
                    <h3 className="font-bold text-sm sm:text-base">Quy trình xác thực 3 bước</h3>
                    <p className="text-xs text-blue-100 mt-1">Email - OTP - Mật khẩu mới</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 mt-4">
                  {steps.map(item => (
                    <div key={item.number} className={`rounded-xl p-2.5 text-center border ${step === item.number ? "bg-white/20 border-white/30" : "bg-white/5 border-white/10"}`}>
                      <div className="text-lg font-bold flex justify-center">{item.number < step ? <CheckCircle2 size={22} /> : `0${item.number}`}</div>
                      <div className="text-[10px] sm:text-[11px] text-blue-100 mt-1 whitespace-nowrap">{item.title}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-2.5">
                {["Xác minh thông qua Email đăng ký", "Mã OTP có thời hạn sử dụng", "Bảo vệ thông tin và tiến độ học tập"].map(item => (
                  <div key={item} className="flex items-center gap-2.5 text-[13px] text-blue-100"><CheckCircle2 size={17} className="text-sky-300 shrink-0" />{item}</div>
                ))}
              </div>
            </div>
          </div>

          {/* CỘT PHẢI - FORM */}
          <div className="lg:col-span-7 bg-white rounded-3xl shadow-xl border border-slate-100 p-6 sm:p-9 lg:p-11 flex flex-col justify-between">
            <div>
              {/* THANH TIẾN TRÌNH */}
              <div className="relative w-full mb-9 pt-1">
                <div className="absolute top-[22px] left-[16.6667%] right-[16.6667%] h-[2px] bg-slate-200" />
                <div className="absolute top-[22px] left-[16.6667%] h-[2px] bg-blue-500 transition-all duration-300" style={{ width: step === 1 ? "0%" : step === 2 ? "33.3333%" : "66.6667%" }} />
                <div className="relative z-10 grid grid-cols-3">
                  {steps.map(item => {
                    const completed = item.number < step;
                    const active = item.number === step;
                    return (
                      <div key={item.number} className="flex flex-col items-center gap-1.5">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center border-2 text-sm font-bold transition-all duration-300 ${completed ? "bg-blue-500 border-blue-500 text-white" : active ? "bg-blue-600 border-blue-600 text-white shadow-md" : "bg-slate-100 border-slate-100 text-slate-400"}`}>
                          {completed ? <Check size={21} strokeWidth={3} /> : item.number}
                        </div>
                        <span className={`text-[11px] sm:text-xs font-semibold text-center whitespace-nowrap ${completed || active ? "text-blue-900" : "text-slate-500"}`}>{item.title}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* BƯỚC 1: GỬI EMAIL */}
              {step === 1 && (
                <div>
                  <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-xs font-semibold"><Mail size={15} /> Bước 1: Quên mật khẩu</span>
                  <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-5">Quên mật khẩu?</h2>
                  <p className="text-sm text-slate-500 mt-3 leading-relaxed">Nhập địa chỉ Email liên kết với tài khoản EduSmart của bạn để nhận mã xác thực OTP khôi phục mật khẩu.</p>
                  <form onSubmit={handleSendOtp} noValidate className="mt-8 space-y-6">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Địa chỉ Email học tập <span className="text-red-500">*</span></label>
                      <div className="relative">
                        <Mail size={19} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Nhập email của bạn" autoComplete="email" className={`${inputClass} pl-11 pr-11`} />
                        {validateEmail(email) && <CheckCircle2 size={19} className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-500" />}
                      </div>
                    </div>
                    <button type="submit" disabled={loading} className="w-full h-12 bg-blue-700 hover:bg-blue-800 text-white rounded-xl font-semibold text-sm flex items-center justify-center gap-2 shadow-md transition-all disabled:opacity-60">
                      {loading ? "Đang gửi OTP..." : "Gửi mã xác nhận OTP"} {!loading && <ArrowRight size={19} />}
                    </button>
                  </form>
                </div>
              )}

              {/* BƯỚC 2: NHẬP OTP */}
              {step === 2 && (
                <div>
                  <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-xs font-semibold"><ShieldCheck size={15} /> Bước 2: Xác minh tài khoản</span>
                  <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-5">Xác thực mã bảo mật OTP</h2>
                  <p className="text-sm text-slate-500 mt-3 leading-relaxed">Nhập mã xác thực gồm 6 chữ số được gửi đến Email <span className="font-semibold text-blue-700 break-all">{email}</span>. Vui lòng kiểm tra hộp thư đến hoặc thư rác.</p>
                  <form onSubmit={handleVerifyOtp} noValidate className="mt-8 space-y-6">
                    <div>
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                        <label className="text-sm font-bold text-slate-900 whitespace-nowrap">Nhập mã OTP 6 số <span className="text-red-500">*</span></label>
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 whitespace-nowrap">
                          <Clock3 size={16} className="text-blue-700" />
                          <span>Mã có hiệu lực trong:</span>
                          <span className={`font-bold text-sm ${timeLeft <= 30 ? "text-red-600" : "text-blue-700"}`}>{formatTime(timeLeft)}</span>
                        </div>
                      </div>
                      <div className="grid grid-cols-6 gap-2 sm:gap-3">
                        {otp.map((digit, index) => (
                          <input key={index} ref={el => { otpRefs.current[index] = el; }} type="text" inputMode="numeric" autoComplete={index === 0 ? "one-time-code" : "off"} maxLength={1} value={digit} onChange={e => handleOtpChange(index, e.target.value)} onKeyDown={e => handleOtpKeyDown(index, e)} onPaste={handleOtpPaste} className="w-full min-w-0 h-12 sm:h-14 rounded-xl border-2 border-slate-200 bg-white text-center text-xl sm:text-2xl font-bold text-blue-900 outline-none transition-all focus:border-blue-600 focus:ring-2 focus:ring-blue-100" />
                        ))}
                      </div>
                      <div className="flex justify-center mt-5">
                        <div className="flex items-center gap-1.5 text-sm">
                          <RefreshCw size={16} className="text-blue-700 shrink-0" />
                          <span className="text-slate-600">Chưa nhận được mã?</span>
                          <button type="button" onClick={handleResendOtp} disabled={loading || resendTimeLeft > 0} className="font-semibold text-blue-700 hover:text-blue-900 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap">
                            {resendTimeLeft > 0 ? `Gửi lại sau ${resendTimeLeft}s` : "Gửi lại mã"}
                          </button>
                        </div>
                      </div>
                    </div>
                    <button type="submit" disabled={loading} className="w-full h-12 bg-blue-700 hover:bg-blue-800 text-white rounded-xl font-semibold text-sm flex items-center justify-center gap-2 shadow-md transition-all disabled:opacity-60">
                      {loading ? "Đang xác thực..." : "Xác thực và Tiếp tục"} {!loading && <ArrowRight size={19} />}
                    </button>
                  </form>
                </div>
              )}

              {/* BƯỚC 3: ĐỔI MẬT KHẨU */}
              {step === 3 && (
                <div>
                  <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-xs font-semibold"><KeyRound size={15} /> Bước 3: Tạo mật khẩu mới</span>
                  <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-5">Tạo mật khẩu mới</h2>
                  <p className="text-sm text-slate-500 mt-3 leading-relaxed">Thiết lập mật khẩu mới để bảo vệ tài khoản học tập EduSmart.</p>

                  <form onSubmit={handleResetPassword} noValidate className="mt-7 space-y-5">
                    {/* MẬT KHẨU MỚI */}
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Mật khẩu mới <span className="text-red-500">*</span></label>
                      <div className="relative">
                        <LockKeyhole size={19} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input type={showPassword ? "text" : "password"} value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Nhập mật khẩu mới" autoComplete="new-password" className={`${inputClass} pl-11 pr-12`} />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600">
                          {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
                        </button>
                      </div>

                      {/* THANH ĐỘ MẠNH MẬT KHẨU GIỐNG GIAO DIỆN CŨ */}
                      <div className="mt-3 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-medium text-slate-600">Độ mạnh mật khẩu:</span>
                          <span className={`font-semibold ${passwordStrength === 3 ? "text-blue-700" : passwordStrength === 2 ? "text-amber-600" : "text-slate-500"}`}>{strengthLabel}</span>
                        </div>
                        <div className="grid grid-cols-3 gap-1">
                          {[1, 2, 3].map(level => <div key={level} className={`h-1.5 rounded-full transition-all ${passwordStrength >= level ? "bg-blue-600" : "bg-slate-200"}`} />)}
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-[11px]">
                          {[
                            { label: "Tối thiểu 8 ký tự", valid: isPasswordValid },
                            { label: "Có chữ hoa", valid: hasUppercase },
                            { label: "Số / ký tự đặc biệt", valid: hasNumberOrSpecial }
                          ].map(rule => (
                            <div key={rule.label} className={`flex items-center gap-1.5 ${rule.valid ? "text-blue-700" : "text-slate-400"}`}>
                              <CheckCircle2 size={13} className="shrink-0" />
                              <span>{rule.label}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* XÁC NHẬN MẬT KHẨU */}
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Xác nhận mật khẩu mới <span className="text-red-500">*</span></label>
                      <div className="relative">
                        <LockKeyhole size={19} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input type={showConfirmPassword ? "text" : "password"} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Nhập lại mật khẩu mới" autoComplete="new-password" className={`${inputClass} pl-11 pr-12`} />
                        <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600">
                          {showConfirmPassword ? <EyeOff size={19} /> : <Eye size={19} />}
                        </button>
                      </div>
                      {confirmPassword && (
                        <p className={`text-xs mt-2 flex items-center gap-1 ${isPasswordMatched ? "text-emerald-600" : "text-red-500"}`}>
                          <CheckCircle2 size={14} />{isPasswordMatched ? "Mật khẩu trùng khớp" : "Mật khẩu không khớp"}
                        </p>
                      )}
                    </div>

                    <button type="submit" disabled={loading} className="w-full h-12 bg-blue-700 hover:bg-blue-800 text-white rounded-xl font-semibold text-sm flex items-center justify-center gap-2 shadow-md transition-all disabled:opacity-60">
                      {loading ? "Đang cập nhật..." : "Cập nhật mật khẩu & Đăng nhập"} {!loading && <ArrowRight size={19} />}
                    </button>
                  </form>
                </div>
              )}
            </div>

            {/* QUAY LẠI ĐĂNG NHẬP */}
            <div className="mt-10 pt-6 border-t border-slate-100 flex justify-center">
              <Link to="/login" className="flex items-center gap-2 text-sm font-semibold text-blue-700 hover:text-blue-900 transition-colors">
                <ArrowLeft size={17} /> Quay lại đăng nhập
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* FOOTER */}
      <footer className="py-5 px-4 border-t border-slate-100 bg-white">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-2"><Shield size={15} className="text-blue-600" /> Bảo vệ tài khoản học tập EduSmart</div>
          <div>© 2026 EduSmart. Tất cả quyền được bảo lưu.</div>
        </div>
      </footer>
    </div>
  );
};

export default ForgotPassword;
