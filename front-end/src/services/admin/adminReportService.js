import api from '../api';

export const adminReportService = {
  getOverview: async (params = {}) => {
    const res = await api.get('/admin/reports/overview', { params });
    return res.data?.result || res.data;
  },

  exportExcel: async (params = {}) => {
    const res = await api.get('/admin/reports/export-excel', {
      params,
      responseType: 'blob',
    });
    
    // Tạo link tải file trên browser
    const blob = new Blob([res.data], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'BaoCao_ThongKe_EduSmart.csv');
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },
};
