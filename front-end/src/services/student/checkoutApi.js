
/**
 * EduSmart - Checkout API
 * Thanh toán MoMo / ZaloPay
 */

const API_BASE = (
  import.meta.env.VITE_API_URL ||
  "http://localhost:8080"
).replace(/\/+$/, "");

// ==========================================
// LẤY ACCESS TOKEN
// ==========================================

export function getToken() {
  return (
    localStorage.getItem("accessToken") ||
    localStorage.getItem("token") ||
    ""
  );
}

// ==========================================
// XỬ LÝ REQUEST CHUNG
// ==========================================

async function request(
  path,
  { method = "GET", signal, body } = {}
) {
  const token = getToken();

  const url = /^https?:\/\//i.test(path)
    ? path
    : `${API_BASE}/${String(path).replace(/^\/+/, "")}`;

  const response = await fetch(url, {
    method,
    signal,
    credentials: "include",
    headers: {
      ...(body !== undefined
        ? { "Content-Type": "application/json" }
        : {}),
      ...(token
        ? { Authorization: `Bearer ${token}` }
        : {}),
    },
    ...(body !== undefined
      ? { body: JSON.stringify(body) }
      : {}),
  });

  const text = await response.text();

  let data = null;

  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  // Kiểm tra HTTP status
  if (!response.ok) {
    throw new Error(
      data?.message ||
      data?.error ||
      `Lỗi HTTP ${response.status}`
    );
  }

  // Kiểm tra mã phản hồi của Spring Boot
  if (
    data &&
    typeof data === "object" &&
    data.code != null &&
    Number(data.code) !== 1000
  ) {
    throw new Error(
      data.message ||
      `Yêu cầu thất bại (code: ${data.code})`
    );
  }

  // Hỗ trợ ApiResponse { code, message, result }
  return data?.result ?? data;
}

// ==========================================
// CHUẨN HÓA PHƯƠNG THỨC THANH TOÁN
// ==========================================

function normalizeProvider(method) {
  const value = String(method || "")
    .trim()
    .toLowerCase();

  if (value === "momo") {
    return "momo";
  }

  if (
    value === "zalopay" ||
    value === "zalo pay" ||
    value === "zalo-pay"
  ) {
    return "zalopay";
  }

  throw new Error(
    "Phương thức thanh toán không hợp lệ. Chỉ hỗ trợ MoMo hoặc ZaloPay."
  );
}

// ==========================================
// TẠO THANH TOÁN MOMO / ZALOPAY
// ==========================================

export async function createCheckoutPayment(
  registrationId,
  method
) {
  if (
    registrationId === undefined ||
    registrationId === null ||
    String(registrationId).trim() === ""
  ) {
    throw new Error(
      "Không tìm thấy mã đăng ký khóa học."
    );
  }

  const provider = normalizeProvider(method);

  const path =
    `/api/student/checkout/` +
    `${encodeURIComponent(registrationId)}` +
    `/pay/${provider}`;

  return request(path, {
    method: "POST",
  });
}

// ==========================================
// XÁC NHẬN THANH TOÁN
// ==========================================

export async function confirmCheckoutPayment(registrationId) {
  if (
    registrationId === undefined ||
    registrationId === null ||
    String(registrationId).trim() === ""
  ) {
    throw new Error("Không tìm thấy mã đăng ký để xác nhận thanh toán.");
  }

  const path = `/api/student/courses/${encodeURIComponent(registrationId)}/confirm-payment`;

  return request(path, {
    method: "POST",
  });
}

// ==========================================
// LẤY ĐƯỜNG DẪN API KIỂM TRA TRẠNG THÁI
// ==========================================

function getStatusTemplate(method) {
  const provider = normalizeProvider(method);

  if (provider === "momo") {
    return (
      import.meta.env.VITE_MOMO_STATUS_PATH || ""
    ).trim();
  }

  return (
    import.meta.env.VITE_ZALOPAY_STATUS_PATH || ""
  ).trim();
}

// ==========================================
// KIỂM TRA CÓ API TRẠNG THÁI CHƯA
// ==========================================

export function hasStatusEndpoint(method) {
  try {
    return Boolean(getStatusTemplate(method));
  } catch {
    return false;
  }
}

// ==========================================
// KIỂM TRA TRẠNG THÁI THANH TOÁN
// ==========================================

export async function checkCheckoutStatus(
  registrationId,
  method
) {
  if (
    registrationId === undefined ||
    registrationId === null ||
    String(registrationId).trim() === ""
  ) {
    throw new Error(
      "Thiếu mã đăng ký để kiểm tra thanh toán."
    );
  }

  const template = getStatusTemplate(method);

  if (!template) {
    throw new Error(
      `Chưa cấu hình API kiểm tra trạng thái cho ${method}.`
    );
  }

  const id = encodeURIComponent(registrationId);

  const path = template
    .replace(/\{registrationId\}/g, id)
    .replace(/:registrationId\b/g, id);

  return request(path, {
    method: "GET",
  });
}
