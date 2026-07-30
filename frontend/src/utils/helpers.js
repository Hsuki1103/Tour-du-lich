// frontend/src/utils/helpers.js

// ============================================
// ⭐ HÀM LẤY URL ẢNH ĐẦY ĐỦ
// ============================================
export const getImageUrl = (path) => {
  if (!path) return null;
  
  // Nếu đã là URL đầy đủ (http, https)
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  
  // Nếu path bắt đầu bằng /uploads/
  if (path.startsWith('/uploads/')) {
    // Lấy base URL từ API (localhost:5000)
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    // Chuyển /api thành gốc để lấy file static
    const baseUrl = apiUrl.replace('/api', '');
    return `${baseUrl}${path}`;
  }
  
  // Fallback: trả về path gốc
  return path;
};

// ============================================
// HÀM FORMAT CURRENCY
// ============================================
export const formatCurrency = (amount) => {
  if (!amount) return '0₫';
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount);
};

// ============================================
// HÀM FORMAT DATE
// ============================================
export const formatDate = (date, format = 'DD/MM/YYYY') => {
  if (!date) return '';
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};

// ============================================
// HÀM FORMAT DATE TIME
// ============================================
export const formatDateTime = (date) => {
  if (!date) return '';
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${day}/${month}/${year} ${hours}:${minutes}`;
};

// ============================================
// HÀM LẤY MÀU THEO TRẠNG THÁI
// ============================================
export const getStatusColor = (status) => {
  const colors = {
    'Chờ xác nhận': 'warning',
    'Chờ thanh toán': 'warning',
    'Đã xác nhận': 'success',
    'Đang diễn ra': 'info',
    'Đã hoàn thành': 'success',
    'Đã hủy': 'danger',
    'Chưa thanh toán': 'warning',
    'Đã đặt cọc': 'info',
    'Đã thanh toán': 'success',
  };
  return colors[status] || 'gray';
};

export const getStatusLabel = (status) => {
  const labels = {
    'Chờ xác nhận': 'Chờ xác nhận',
    'Chờ thanh toán': 'Chờ thanh toán',
    'Đã xác nhận': 'Đã xác nhận',
    'Đang diễn ra': 'Đang diễn ra',
    'Đã hoàn thành': 'Đã hoàn thành',
    'Đã hủy': 'Đã hủy',
    'Chưa thanh toán': 'Chưa thanh toán',
    'Đã đặt cọc': 'Đã đặt cọc',
    'Đã thanh toán': 'Đã thanh toán',
  };
  return labels[status] || status;
};