import api from './api';

// Lấy danh sách giao dịch có phân trang, lọc và tìm kiếm
export const getAdminPayments = async (params = {}) => {
  const response = await api.get('/admin/payments', { params });
  return response.data?.result || response.data;
};

// Lấy số liệu KPI thống kê
export const getAdminPaymentStatistics = async () => {
  const response = await api.get('/admin/payments/statistics');
  return response.data?.result || response.data;
};

// Lấy chi tiết giao dịch theo ID
export const getAdminPaymentDetail = async (paymentId) => {
  const response = await api.get(`/admin/payments/${paymentId}`);
  return response.data?.result || response.data;
};

// Cập nhật trạng thái và thông tin giao dịch
export const updateAdminPayment = async (paymentId, data) => {
  const response = await api.put(`/admin/payments/${paymentId}`, data);
  return response.data;
};

// Lấy danh sách giảng viên để lọc
export const getAdminPaymentInstructors = async () => {
  const response = await api.get('/admin/payments/instructors');
  return response.data?.result || response.data;
};

// Xuất danh sách giao dịch ra file Excel / CSV (hỗ trợ hiển thị tiếng Việt chuẩn UTF-8 trong Excel)
export const exportTransactionsToExcel = (transactions = []) => {
  if (!transactions || transactions.length === 0) return;

  const headers = [
    'Mã GD',
    'Mã cổng đối tác',
    'Họ tên học viên',
    'Email học viên',
    'Số điện thoại',
    'Khóa học',
    'Giảng viên',
    'Phương thức',
    'Số tiền (VNĐ)',
    'Thời gian tạo',
    'Trạng thái'
  ];

  const rows = transactions.map((tx) => [
    `"${tx.sysId || tx.orderId || ''}"`,
    `"${tx.gatewayTransactionId || ''}"`,
    `"${(tx.studentName || '').replace(/"/g, '""')}"`,
    `"${tx.studentEmail || ''}"`,
    `"${tx.studentPhone || ''}"`,
    `"${(tx.courseName || '').replace(/"/g, '""')}"`,
    `"${(tx.instructorName || '').replace(/"/g, '""')}"`,
    `"${tx.paymentMethod || ''}"`,
    `"${tx.amount ? Number(tx.amount).toLocaleString('vi-VN') : 0}"`,
    `"${tx.createdAt ? new Date(tx.createdAt).toLocaleString('vi-VN') : ''}"`,
    `"${tx.status === 'success' ? 'Thành công' : tx.status === 'pending' ? 'Chờ duyệt' : 'Thất bại'}"`
  ]);

  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `Bao_cao_giao_dich_EduSmart_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
