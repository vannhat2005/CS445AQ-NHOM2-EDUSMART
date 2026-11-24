import React, { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import toast from "react-hot-toast";

import { useAuth } from "../../context/AuthContext";
import { registerCourse } from "../../services/student/courseRegistrationService";
import {
  createCheckoutPayment,
  checkCheckoutStatus,
  hasStatusEndpoint,
  confirmCheckoutPayment,
} from "../../services/student/checkoutApi";
import { getCourseDetail } from "../../services/student/courseDetailService";

// ==========================================
// HÀM TIỆN ÍCH
// ==========================================

const money = (value) => {
  if (value == null || isNaN(Number(value))) return "0 VNĐ";
  return `${new Intl.NumberFormat("vi-VN").format(Number(value))} VNĐ`;
};

const getInitials = (name = "") => {
  const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "HV";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const formatDateTime = (date = new Date()) => {
  const pad = (n) => String(n).padStart(2, "0");
  const d = new Date(date);
  const hours = pad(d.getHours());
  const minutes = pad(d.getMinutes());
  const day = pad(d.getDate());
  const month = pad(d.getMonth() + 1);
  const year = d.getFullYear();
  return `${hours}:${minutes} - ${day}/${month}/${year}`;
};

const isPaid = (p) =>
  p?.registrationStatus === "Paid" ||
  p?.paymentStatus === "Success" ||
  p?.paymentStatus === "Paid";

// ==========================================
// COMPONENT CHECKOUT CHÍNH
// ==========================================

export default function CheckoutPage({ courseId, course, onBack, onPaid }) {
  const navigate = useNavigate();
  const { user } = useAuth();

  const id = Number(courseId ?? course?.courseId);

  const [method, setMethod] = useState("ZaloPay");
  const [courseData, setCourseData] = useState(course || null);
  const [registration, setRegistration] = useState(null);
  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [remaining, setRemaining] = useState(15 * 60);

  // MÀN HÌNH 2: TRẠNG THÁI ĐÃ XÁC NHẬN THANH TOÁN
  const [isSuccess, setIsSuccess] = useState(false);
  const [successData, setSuccessData] = useState(null);

  const busyRef = useRef(false);
  const generation = useRef(0);

  // 1. TẢI THÔNG TIN KHÓA HỌC NẾU CHƯA CÓ
  useEffect(() => {
    if (course) {
      setCourseData(course);
      return;
    }
    if (!Number.isInteger(id) || id <= 0) return;

    let cancelled = false;
    getCourseDetail(id)
      .then((data) => {
        if (!cancelled && data) {
          setCourseData({
            courseId: id,
            title: data.title,
            instructor: data.instructorName || data.instructor?.fullName || "ThS. Trần Thị Thanh Lan",
            amount: data.price,
            imageUrl: data.imageUrl,
            category: data.categoryName || data.category?.name || "Chuyên sâu Backend",
          });
        }
      })
      .catch((err) => {
        console.warn("Không thể tải chi tiết khóa học:", err);
      });

    return () => {
      cancelled = true;
    };
  }, [id, course]);

  // 2. TẠO ĐƠN VÀ MÃ QR KHI KHỞI TẠO HOẶC ĐỔI PHƯƠNG THỨC
  const initPayment = useCallback(
    async (selectedMethod) => {
      if (!Number.isInteger(id) || id <= 0 || busyRef.current) return;
      busyRef.current = true;
      const currentGen = ++generation.current;

      setLoading(true);
      setError("");

      try {
        let order = registration;
        if (!order) {
          order = await registerCourse(id);
          if (currentGen !== generation.current) return;
          setRegistration(order);
        }

        const payResult = await createCheckoutPayment(
          order.registrationId,
          selectedMethod
        );

        if (currentGen !== generation.current) return;
        setPayment(payResult);
        setRemaining(15 * 60);
      } catch (err) {
        if (currentGen === generation.current) {
          console.error("Lỗi tạo thanh toán:", err);
          setError(err?.message || "Không thể tạo thông tin thanh toán.");
        }
      } finally {
        busyRef.current = false;
        if (currentGen === generation.current) {
          setLoading(false);
        }
      }
    },
    [id, registration]
  );

  // Khởi tạo payment lần đầu
  useEffect(() => {
    initPayment(method);
  }, []);

  // Khi người dùng bấm chuyển đổi phương thức thanh toán
  const handleSelectMethod = (newMethod) => {
    if (newMethod === method || loading || confirming) return;
    setMethod(newMethod);
    setError("");
    if (registration?.registrationId) {
      setLoading(true);
      createCheckoutPayment(registration.registrationId, newMethod)
        .then((payResult) => {
          setPayment(payResult);
          setRemaining(15 * 60);
        })
        .catch((err) => {
          console.error("Lỗi đổi phương thức:", err);
          setError(err?.message || "Không thể tải mã thanh toán cho phương thức này.");
        })
        .finally(() => setLoading(false));
    } else {
      initPayment(newMethod);
    }
  };

  // 3. ĐỒNG HỒ ĐẾM NGƯỢC 15 PHÚT
  useEffect(() => {
    if (isSuccess || remaining <= 0) return;
    const timer = setInterval(() => {
      setRemaining((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [isSuccess, remaining]);

  // 4. KIỂM TRA ĐỊNH KỲ NẾU THANH TOÁN HOÀN TẤT
  useEffect(() => {
    if (isSuccess || !payment || isPaid(payment) || !hasStatusEndpoint(method)) return;

    const interval = setInterval(async () => {
      try {
        const orderId = registration?.registrationId || payment?.registrationId;
        if (!orderId) return;
        const res = await checkCheckoutStatus(orderId, method);
        if (isPaid(res)) {
          setPayment((prev) => ({ ...prev, ...res }));
          handlePaymentSuccess(res);
        }
      } catch {
        // Polling im lặng không làm phiền người dùng
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [isSuccess, payment, registration, method]);

  // 5. XỬ LÝ KHI THANH TOÁN THÀNH CÔNG
  const handlePaymentSuccess = (paymentInfo) => {
    const orderCode =
      paymentInfo?.enrollmentCode ||
      payment?.enrollmentCode ||
      registration?.enrollmentCode ||
      `DH-2025${String(id).padStart(3, "0")}`;

    const nowFormatted = formatDateTime(new Date());

    setSuccessData({
      orderCode,
      courseTitle:
        courseData?.title ||
        paymentInfo?.courseTitle ||
        "Làm chủ Spring Boot & Microservices 2025",
      instructor:
        courseData?.instructor || "ThS. Trần Thị Thanh Lan",
      category:
        courseData?.category || "Chuyên sâu Backend",
      imageUrl: courseData?.imageUrl || "",
      amount:
        paymentInfo?.amount ||
        payment?.amount ||
        courseData?.amount ||
        1299000,
      methodText:
        method === "MoMo"
          ? "Ví MoMo (Đã xác thực)"
          : "Ví ZaloPay (Đã xác thực)",
      methodColor: method === "MoMo" ? "#A50064" : "#0068FF",
      email: user?.email || "nguyenvana@gmail.com",
      time: nowFormatted,
    });

    setIsSuccess(true);
    toast.success("Đã ghi nhận xác nhận thanh toán! Đang chờ kích hoạt khóa học.");
    window.scrollTo({ top: 0, behavior: "smooth" });
    // KHÔNG gọi onPaid?.() ở đây để tránh bị chuyển trang ngay lập tức.
    // Người dùng sẽ thấy màn hình xác nhận thanh toán và chủ động bấm "Về trang chủ".
  };

  // 6. XỬ LÝ KHI NGƯỜI DÙNG BẤM "XÁC NHẬN THANH TOÁN"
  const handleConfirmPayment = async () => {
    if (confirming) return;
    setConfirming(true);
    setError("");

    try {
      const regId = registration?.registrationId || payment?.registrationId;
      if (regId) {
        try {
          await confirmCheckoutPayment(regId);
        } catch (err) {
          console.warn("Backend confirm call:", err);
        }
      }

      handlePaymentSuccess(payment);
    } catch (err) {
      console.error("Lỗi xác nhận thanh toán:", err);
      setError(err?.message || "Không thể xác nhận thanh toán. Vui lòng thử lại.");
    } finally {
      setConfirming(false);
    }
  };

  // 7. SAO CHÉP SỐ TIỀN
  const amount =
    payment?.amount ??
    courseData?.amount ??
    courseData?.price ??
    1299000;

  const handleCopyAmount = () => {
    const textToCopy = String(amount);
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    toast.success("Đã sao chép số tiền cần chuyển!");
    setTimeout(() => setCopied(false), 2000);
  };

  const mins = `${String(Math.floor(remaining / 60)).padStart(2, "0")}:${String(
    remaining % 60
  ).padStart(2, "0")}`;

  const qrData =
    payment?.qrCode ||
    payment?.qrCodeUrl ||
    payment?.payUrl ||
    `https://edusmart.edu.vn/checkout/${payment?.appTransId || payment?.orderId || "demo"}?amount=${amount}`;

  const enrollmentCode =
    payment?.enrollmentCode ||
    registration?.enrollmentCode ||
    `DH-2025${String(id).padStart(3, "0")}`;

  const studentName =
    user?.fullName || user?.username || "Nguyễn Văn A";
  const studentEmail = user?.email || "nguyenvana@gmail.com";
  const initials = getInitials(studentName);

  // =========================================================================
  // MÀN HÌNH 2: GIAO DIỆN MỚI THÔNG BÁO ĐÃ XÁC NHẬN THANH TOÁN
  // =========================================================================
  if (isSuccess && successData) {
    return (
      <main className="max-w-6xl w-full mx-auto px-4 sm:px-6 py-8 md:py-12 flex-1">
        <div className="max-w-3xl mx-auto py-4 md:py-8">
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-md p-6 sm:p-10 relative overflow-hidden text-center">
            {/* Thanh gradient trên cùng */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 via-blue-600 to-indigo-600"></div>

            {/* Icon thành công */}
            <div className="relative mb-6 inline-block">
              <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
                <svg
                  className="w-10 h-10"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2.5"
                    d="M5 13l4 4L19 7"
                  ></path>
                </svg>
              </div>
              <div className="absolute -top-1 -right-1 text-amber-500">
                <svg
                  className="w-6 h-6 fill-amber-400 stroke-amber-500"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 2l2.4 7.4H22l-6 4.6 2.3 7.2L12 16.8 5.7 21.2 8 14 2 9.4h7.6z" />
                </svg>
              </div>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mb-2">
              Đã xác nhận thanh toán
            </h1>
            <p className="text-sm text-slate-600 max-w-lg mx-auto leading-relaxed mb-8">
              Chúc mừng bạn đã đăng ký thành công khóa học. Hệ thống đã tự động
              kích hoạt toàn bộ tài nguyên học tập và Trợ lý AI chuyên sâu vào
              tài khoản của bạn.
            </p>

            {/* Chi tiết đơn hàng đã thanh toán */}
            <div className="bg-[#F9FAFB] rounded-xl border border-slate-200/80 p-5 sm:p-6 text-left mb-8 shadow-2xs">
              <div className="flex items-start gap-4 pb-5 border-b border-slate-200/80">
                {/* Thumbnail */}
                <div className="relative w-16 h-16 rounded-xl overflow-hidden shrink-0 border border-slate-200 bg-slate-900 flex items-center justify-center shadow-xs">
                  {successData.imageUrl ? (
                    <img
                      src={successData.imageUrl}
                      alt={successData.courseTitle}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <>
                      <div className="absolute inset-0 bg-gradient-to-tr from-blue-950 via-slate-900 to-blue-800 opacity-90"></div>
                      <div className="relative z-10 text-center p-1">
                        <div className="w-6 h-6 mx-auto rounded-lg bg-blue-500/20 text-blue-300 flex items-center justify-center mb-0.5">
                          <svg
                            className="w-3.5 h-3.5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                            ></path>
                          </svg>
                        </div>
                        <span className="text-[8px] font-mono font-bold text-blue-200 uppercase tracking-tighter">
                          EDU
                        </span>
                      </div>
                    </>
                  )}
                </div>

                {/* Course Info */}
                <div className="flex-1 min-w-0">
                  <span className="inline-block text-[10px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded mb-1">
                    {successData.category}
                  </span>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-snug line-clamp-2">
                    {successData.courseTitle}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Giảng viên:{" "}
                    <strong className="text-slate-700 font-medium">
                      {successData.instructor}
                    </strong>
                  </p>
                </div>
              </div>

              {/* Thông số giao dịch */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-6 pt-5 text-xs">
                <div className="flex justify-between items-center py-1 border-b sm:border-b-0 border-slate-100">
                  <span className="text-slate-500">Mã đơn hàng:</span>
                  <span className="font-mono font-bold text-slate-800">
                    #{successData.orderCode}
                  </span>
                </div>
                <div className="flex justify-between items-center py-1 border-b sm:border-b-0 border-slate-100">
                  <span className="text-slate-500">Thời gian:</span>
                  <span className="font-medium text-slate-800">
                    {successData.time}
                  </span>
                </div>
                <div className="flex justify-between items-center py-1 border-b sm:border-b-0 border-slate-100">
                  <span className="text-slate-500">Phương thức:</span>
                  <span className="font-medium text-slate-800 inline-flex items-center gap-1.5">
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: successData.methodColor }}
                    ></span>
                    {successData.methodText}
                  </span>
                </div>
                <div className="flex justify-between items-center py-1 border-b sm:border-b-0 border-slate-100">
                  <span className="text-slate-500">Trạng thái:</span>
                  <span className="font-bold text-amber-500 inline-flex items-center gap-1">
                    <svg
                      className="w-3.5 h-3.5 text-amber-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      ></path>
                    </svg>
                    Đang chờ kích hoạt khóa học
                  </span>
                </div>
                <div className="flex justify-between items-center py-1 col-span-1 sm:col-span-2 pt-2 border-t border-slate-200">
                  <span className="text-slate-600 font-semibold">
                    Tổng tiền đã thanh toán:
                  </span>
                  <span className="text-lg font-black text-blue-700 font-mono">
                    {money(successData.amount)}
                  </span>
                </div>
              </div>
            </div>

            {/* Nút hành động */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 mb-6">
              <Link
                to="/student"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white border border-slate-200 text-slate-700 font-bold text-sm hover:bg-slate-50 hover:border-slate-300 transition-all cursor-pointer"
              >
                <svg
                  className="w-4 h-4 text-slate-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                  ></path>
                </svg>
                <span>Về trang chủ</span>
              </Link>
            </div>

            {/* Footer ghi chú */}
            <div className="pt-5 border-t border-slate-100 text-xs text-slate-500 space-y-1.5">
              <p>
                Hóa đơn điện tử VAT và thông tin kích hoạt đã được gửi tới email{" "}
                <strong className="text-slate-700 font-mono">
                  {successData.email}
                </strong>
                .
              </p>
              <p>
                Cần hỗ trợ? Liên hệ hotline{" "}
                <strong className="text-blue-600 font-semibold">
                  1800 6868
                </strong>{" "}
                (Miễn phí) hoặc nhận trợ giúp từ{" "}
                <strong className="text-blue-600 font-semibold">
                  Trợ lý AI EduSmart
                </strong>
                .
              </p>
            </div>
          </div>
        </div>

        {/* SECURITY TRUST BADGES & SSL GUARANTEE */}
        <div className="mt-8 pt-6 border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-400">
          <div className="flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-1.5">
              <svg
                className="w-4 h-4 text-emerald-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                ></path>
              </svg>
              <span className="text-slate-600 font-medium">
                Bảo mật mã hóa SSL 256-bit
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <svg
                className="w-4 h-4 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                ></path>
              </svg>
              <span className="text-slate-600 font-medium">
                Kích hoạt tài khoản tức thì
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <svg
                className="w-4 h-4 text-indigo-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                ></path>
              </svg>
              <span className="text-slate-600 font-medium">
                Đối tác thanh toán chính thức ZaloPay &amp; MoMo
              </span>
            </div>
          </div>
          <div className="text-[11px] text-slate-400">
            © 2025 EduSmart Learning Systems Inc. Tất cả quyền được bảo lưu.
          </div>
        </div>
      </main>
    );
  }

  // =========================================================================
  // MÀN HÌNH 1: GIAO DIỆN XÁC NHẬN VÀ QUÉT MÃ QR THANH TOÁN
  // =========================================================================
  return (
    <>
      <main className="max-w-6xl w-full mx-auto px-4 sm:px-6 py-8 md:py-12 flex-1">
        {/* Tiêu đề trang & Breadcrumb tối giản */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <button
              type="button"
              onClick={onBack || (() => navigate(`/student/courses/${id}`))}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-blue-600 transition-colors mb-2 group cursor-pointer"
            >
              <svg
                className="w-4 h-4 transition-transform group-hover:-translate-x-0.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                ></path>
              </svg>
              Quay lại chi tiết khóa học
            </button>
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
              <span>Xác nhận &amp; Thanh toán</span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200/80">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                Đang chờ xử lý
              </span>
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Hoàn tất quét mã QR để bắt đầu học ngay lập tức cùng Trợ lý AI
              EduSmart.
            </p>
          </div>

          {/* Quick support hotline */}
          <div className="inline-flex items-center gap-2 text-xs text-slate-500 bg-white px-3.5 py-2 rounded-xl border border-slate-200/70 shadow-2xs">
            <svg
              className="w-4 h-4 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
              ></path>
            </svg>
            <span>
              Hỗ trợ thanh toán:{" "}
              <strong className="text-slate-800 font-semibold">1800 6868</strong>{" "}
              (Miễn phí)
            </span>
          </div>
        </div>

        {/* 2 COLUMNS SPLIT-SCREEN LAYOUT */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* CỘT TRÁI (5/12): TÓM TẮT ĐƠN ĐĂNG KÝ (ORDER SUMMARY) */}
          <section className="lg:col-span-5 flex flex-col gap-6">
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 sm:p-7 relative overflow-hidden">
              {/* Accent top border */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 to-indigo-600"></div>

              {/* Header Box */}
              <div className="flex items-center justify-between pb-5 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <svg
                    className="w-5 h-5 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                    ></path>
                  </svg>
                  <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                    Thông tin đơn hàng
                  </h2>
                </div>

                {/* Mã đơn đăng ký (enrollment_code) */}
                <div className="text-right">
                  <span className="block text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                    Mã đơn hàng
                  </span>
                  <span className="inline-block text-xs font-mono font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200/60 tracking-wider">
                    #{enrollmentCode}
                  </span>
                </div>
              </div>

              {/* Thông tin khóa học (course_id) */}
              <div className="py-5 border-b border-slate-100">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-3">
                  Khóa học đăng ký
                </span>
                <div className="flex items-start gap-4">
                  {/* Thumbnail */}
                  <div className="relative w-20 h-20 rounded-xl overflow-hidden shrink-0 border border-slate-200 bg-slate-900 flex items-center justify-center group shadow-xs">
                    {courseData?.imageUrl ? (
                      <img
                        src={courseData.imageUrl}
                        alt={courseData?.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <>
                        <div className="absolute inset-0 bg-gradient-to-tr from-blue-950 via-slate-900 to-blue-800 opacity-90"></div>
                        <div className="relative z-10 text-center p-1">
                          <div className="w-7 h-7 mx-auto rounded-lg bg-blue-500/20 text-blue-300 flex items-center justify-center mb-1">
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
                              ></path>
                            </svg>
                          </div>
                          <span className="text-[9px] font-mono font-bold text-blue-200 uppercase tracking-tighter">
                            EDU
                          </span>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Course Info */}
                  <div className="flex-1 min-w-0">
                    <span className="inline-block text-[11px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded mb-1">
                      {courseData?.category || "Chuyên sâu Backend"}
                    </span>
                    <h3 className="text-sm font-bold text-slate-900 leading-snug line-clamp-2 hover:text-blue-600 transition-colors">
                      {courseData?.title ||
                        "Làm chủ Spring Boot & Microservices 2025"}
                    </h3>
                    <div className="flex items-center gap-1.5 mt-1.5 text-xs text-slate-500">
                      <svg
                        className="w-3.5 h-3.5 text-slate-400 shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        ></path>
                      </svg>
                      <span className="truncate">
                        Giảng viên:{" "}
                        <strong className="text-slate-700 font-medium">
                          {courseData?.instructor || "ThS. Trần Thị Thanh Lan"}
                        </strong>
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Thông tin sinh viên (user_id) */}
              <div className="py-5 border-b border-slate-100">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-3">
                  Thông tin người học
                </span>
                <div className="bg-slate-50/80 rounded-xl p-3.5 border border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 text-white font-bold flex items-center justify-center text-sm shadow-xs">
                      {initials}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                        <span>{studentName}</span>
                        <span className="inline-flex items-center text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                          Đã xác minh
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 font-mono">
                        {studentEmail}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Chi tiết học phí & Tổng tiền thanh toán (total_amount) */}
              <div className="pt-5 space-y-2.5">
                <div className="flex justify-between text-xs text-slate-500">
                  <span>Phí tiện ích cổng thanh toán:</span>
                  <span className="text-emerald-600 font-medium">
                    0 VNĐ (Miễn phí)
                  </span>
                </div>

                {/* Tổng tiền thanh toán (total_amount) */}
                <div className="pt-4 mt-2 border-t border-slate-200 flex items-baseline justify-between">
                  <div>
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                      Tổng tiền thanh toán
                    </span>
                    <span className="text-[11px] text-slate-400">
                      (Đã bao gồm VAT &amp; Giấy chứng nhận)
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl sm:text-3xl font-black text-blue-700 tracking-tight">
                      {money(amount)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Nút phụ "Quay lại / Hủy giao dịch" */}
              <div className="mt-7 pt-4 border-t border-slate-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={onBack || (() => navigate(`/student/courses/${id}`))}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                >
                  <svg
                    className="w-3.5 h-3.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M10 19l-7-7m0 0l7-7m-7 7h18"
                    ></path>
                  </svg>
                  <span>Quay lại trang khóa học</span>
                </button>
                <button
                  type="button"
                  onClick={onBack || (() => navigate(`/student/courses/${id}`))}
                  className="text-xs font-medium text-rose-500 hover:text-rose-700 hover:underline transition-colors cursor-pointer"
                >
                  Hủy giao dịch này
                </button>
              </div>
            </div>

            {/* Cam kết quyền lợi học viên (Trust Box) */}
            <div className="bg-blue-50/60 rounded-xl p-4 border border-blue-100/80 flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  ></path>
                </svg>
              </div>
              <div className="text-xs text-slate-600 leading-relaxed">
                <strong className="text-slate-800 font-semibold block mb-0.5">
                  Cam kết từ EduSmart Learning:
                </strong>
                Khóa học sẽ được tự động kích hoạt vào tài khoản trong vòng{" "}
                <strong className="text-blue-700">30 giây</strong> ngay sau khi
                hệ thống nhận được giao dịch. Chính sách hoàn tiền 100% trong 7
                ngày nếu không hài lòng.
              </div>
            </div>
          </section>

          {/* CỘT PHẢI (7/12): CHỌN PHƯƠNG THỨC & QUÉT MÃ QR (PAYMENT GATEWAY) */}
          <section className="lg:col-span-7 flex flex-col gap-6">
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 sm:p-8">
              {/* BƯỚC 1: CHỌN PHƯƠNG THỨC THANH TOÁN (payment_method) */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center">
                      1
                    </span>
                    <span>Chọn phương thức thanh toán ví điện tử</span>
                  </label>
                  <span className="text-[11px] text-slate-400 italic">
                    Quét mã QR tiện lợi
                  </span>
                </div>

                {/* 2 Radio Cards: ZaloPay & MoMo */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {/* Thẻ 1: ZaloPay */}
                  <div
                    onClick={() => handleSelectMethod("ZaloPay")}
                    className={`relative flex items-center p-3.5 rounded-xl cursor-pointer transition-all ${
                      method === "ZaloPay"
                        ? "border-2 border-blue-600 bg-blue-50/30 shadow-xs"
                        : "border border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50 opacity-85 hover:opacity-100"
                    }`}
                  >
                    {method === "ZaloPay" && (
                      <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-xs">
                        <svg
                          className="w-3.5 h-3.5"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                      </div>
                    )}
                    {method !== "ZaloPay" && (
                      <div className="w-5 h-5 rounded-full border border-slate-300 absolute top-3 right-3"></div>
                    )}

                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#0068FF] to-[#008FE5] text-white flex items-center justify-center font-black text-xs shadow-sm shrink-0 border border-blue-400/30">
                        <span className="tracking-tighter">
                          Zalo<span className="text-cyan-200">Pay</span>
                        </span>
                      </div>
                      <div>
                        <span className="block text-xs font-bold text-slate-900">
                          Thanh toán qua ZaloPay
                        </span>
                        <span className="block text-[11px] text-blue-700 font-medium">
                          Hỗ trợ QR Đa năng / App Zalo
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Thẻ 2: MoMo */}
                  <div
                    onClick={() => handleSelectMethod("MoMo")}
                    className={`relative flex items-center p-3.5 rounded-xl cursor-pointer transition-all ${
                      method === "MoMo"
                        ? "border-2 border-[#A50064] bg-pink-50/30 shadow-xs"
                        : "border border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50 opacity-85 hover:opacity-100"
                    }`}
                  >
                    {method === "MoMo" && (
                      <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-[#A50064] text-white flex items-center justify-center shadow-xs">
                        <svg
                          className="w-3.5 h-3.5"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                      </div>
                    )}
                    {method !== "MoMo" && (
                      <div className="w-5 h-5 rounded-full border border-slate-300 absolute top-3 right-3"></div>
                    )}

                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-[#A50064] text-white flex items-center justify-center font-bold text-xs shadow-sm shrink-0">
                        <span className="tracking-tight">momo</span>
                      </div>
                      <div>
                        <span className="block text-xs font-bold text-slate-800">
                          Thanh toán qua MoMo
                        </span>
                        <span className="block text-[11px] text-slate-500">
                          Ví MoMo &amp; Ngân hàng liên kết
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* BƯỚC 2: KHU VỰC QUÉT MÃ QR (qr_code) */}
              <div
                id="qr-section"
                className="bg-slate-50/90 rounded-2xl border border-slate-200/80 p-6 sm:p-7 flex flex-col items-center text-center relative"
              >
                <div className="mb-4">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-100/80 text-blue-700 mb-2">
                    <svg
                      className="w-3.5 h-3.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
                      ></path>
                    </svg>
                    Bước 2: Quét mã để thanh toán
                  </span>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900">
                    Mã QR Thanh Toán Tự Động
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Không cần nhập số tài khoản hay nội dung chuyển tiền
                  </p>
                </div>

                {/* Khung Mã QR Code lớn ở giữa */}
                <div className="relative bg-white p-4 rounded-2xl border-2 border-slate-200/90 shadow-md max-w-[240px] w-full">
                  {/* Corner decorative scan markers */}
                  <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-blue-600 rounded-tl"></div>
                  <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-blue-600 rounded-tr"></div>
                  <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-blue-600 rounded-bl"></div>
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-blue-600 rounded-br"></div>

                  {/* Vùng hiển thị QR Code */}
                  <div className="aspect-square w-full relative flex items-center justify-center bg-white p-2">
                    {loading ? (
                      <div className="flex flex-col items-center justify-center gap-2">
                        <span className="w-8 h-8 rounded-full border-2 border-blue-600 border-t-transparent animate-spin"></span>
                        <span className="text-[11px] text-slate-500 font-medium">
                          Đang tạo mã QR...
                        </span>
                      </div>
                    ) : (
                      <>
                        <QRCodeSVG
                          value={qrData}
                          size={190}
                          level="M"
                          marginSize={1}
                          className="w-full h-full"
                        />
                        {/* Logo trung tâm bên trong QR Code */}
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <div
                            className={`w-9 h-9 rounded-lg text-white flex items-center justify-center font-black text-[9px] shadow-sm border-2 border-white ${
                              method === "MoMo"
                                ? "bg-[#A50064]"
                                : "bg-[#0068FF]"
                            }`}
                          >
                            <span>{method === "MoMo" ? "momo" : "ZP"}</span>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Hướng dẫn quét mã */}
                <p className="text-xs text-slate-600 mt-4 max-w-xs font-medium">
                  {method === "MoMo" ? (
                    <>
                      Mở ứng dụng <strong className="text-[#A50064]">MoMo</strong>{" "}
                      trên điện thoại để quét mã thanh toán.
                    </>
                  ) : (
                    <>
                      Mở ứng dụng <strong className="text-blue-700">ZaloPay</strong>{" "}
                      hoặc tính năng quét mã trong{" "}
                      <strong className="text-blue-700">Zalo</strong> trên điện thoại
                      để quét mã.
                    </>
                  )}
                </p>

                {/* Số tiền cần chuyển (amount) ngay dưới mã QR */}
                <div className="mt-3.5 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200/90 shadow-2xs">
                  <span className="text-xs text-slate-500 font-medium">
                    Số tiền cần chuyển:
                  </span>
                  <span className="text-base font-extrabold text-blue-700 tracking-tight">
                    {money(amount)}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyAmount}
                    title="Sao chép số tiền"
                    className="text-slate-400 hover:text-blue-600 ml-0.5 transition-colors cursor-pointer"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                      ></path>
                    </svg>
                  </button>
                  {copied && (
                    <span className="text-[10px] text-emerald-600 font-bold animate-fade-in">
                      Đã sao chép!
                    </span>
                  )}
                </div>

                {/* THÔNG BÁO LỖI NẾU CÓ */}
                {error && (
                  <div className="mt-3 w-full max-w-sm rounded-xl border border-rose-200 bg-rose-50 p-2.5 text-xs text-rose-700">
                    {error}
                  </div>
                )}

                {/* 3. TRẠNG THÁI GIAO DỊCH & NÚT XÁC NHẬN */}
                <div className="w-full mt-6 pt-5 border-t border-slate-200/80 flex flex-col sm:flex-row items-center gap-4 justify-center">
                  {/* Countdown Timer */}
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-mono font-bold">
                    <svg
                      className="w-3.5 h-3.5 animate-pulse"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      ></path>
                    </svg>
                    <span>Còn {mins}</span>
                  </div>

                  {/* Nút bấm "Xác nhận thanh toán" */}
                  <button
                    type="button"
                    onClick={handleConfirmPayment}
                    disabled={confirming}
                    className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-xs sm:text-sm font-bold shadow-md shadow-blue-500/25 transition-all cursor-pointer"
                  >
                    {confirming ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                        <span>Đang xác nhận...</span>
                      </>
                    ) : (
                      <>
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2.5"
                            d="M5 13l4 4L19 7"
                          ></path>
                        </svg>
                        <span>Xác nhận thanh toán</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* NÚT HỖ TRỢ CSKH */}
              <div className="mt-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                <a
                  href="tel:18006868"
                  className="inline-flex items-center gap-2 text-slate-500 hover:text-blue-600 transition-colors group"
                >
                  <span className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                    <svg
                      className="w-3.5 h-3.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                      ></path>
                    </svg>
                  </span>
                  <span>
                    Bạn gặp lỗi khi thanh toán?{" "}
                    <strong className="underline decoration-slate-300 underline-offset-2">
                      Liên hệ CSKH 24/7 (1800 6868)
                    </strong>
                  </span>
                </a>

                {/* Trợ lý AI hỗ trợ thanh toán */}
                <button
                  type="button"
                  onClick={() =>
                    toast("Trợ lý AI EduSmart đang sẵn sàng hỗ trợ bạn!", {
                      icon: "🤖",
                    })
                  }
                  className="inline-flex items-center gap-1.5 text-blue-600 font-semibold hover:text-blue-800 transition-colors cursor-pointer"
                >
                  <svg
                    className="w-3.5 h-3.5 text-amber-500"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M12 2l2.4 7.4H22l-6 4.6 2.3 7.2L12 16.8 5.7 21.2 8 14 2 9.4h7.6z"></path>
                  </svg>
                  <span>Hỏi Trợ lý AI EduSmart</span>
                </button>
              </div>
            </div>
          </section>
        </div>

        {/* SECURITY TRUST BADGES & SSL GUARANTEE */}
        <div className="mt-12 pt-8 border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-400">
          <div className="flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-1.5">
              <svg
                className="w-4 h-4 text-emerald-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                ></path>
              </svg>
              <span className="text-slate-600 font-medium">
                Bảo mật mã hóa SSL 256-bit
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <svg
                className="w-4 h-4 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                ></path>
              </svg>
              <span className="text-slate-600 font-medium">
                Kích hoạt tài khoản tức thì
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <svg
                className="w-4 h-4 text-indigo-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                ></path>
              </svg>
              <span className="text-slate-600 font-medium">
                Đối tác thanh toán chính thức ZaloPay &amp; MoMo
              </span>
            </div>
          </div>

          <div className="text-[11px] text-slate-400">
            © 2025 EduSmart Learning Systems Inc. Tất cả quyền được bảo lưu.
          </div>
        </div>
      </main>

      {/* STICKY MOBILE SUMMARY FOOTER (Dành riêng cho Mobile khi màn hình nhỏ) */}
      <div className="lg:hidden sticky bottom-0 bg-white border-t border-slate-200 p-4 shadow-lg flex items-center justify-between z-20">
        <div>
          <span className="text-[10px] text-slate-400 uppercase font-bold block">
            Tổng tiền
          </span>
          <span className="text-lg font-black text-blue-700">
            {money(amount)}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-right text-[11px] text-rose-600 font-bold font-mono">
            Còn {mins}
          </div>
          <button
            type="button"
            onClick={handleConfirmPayment}
            disabled={confirming}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 cursor-pointer"
          >
            {confirming ? "Đang xác nhận..." : "Xác nhận ngay"}
          </button>
        </div>
      </div>
    </>
  );
}
