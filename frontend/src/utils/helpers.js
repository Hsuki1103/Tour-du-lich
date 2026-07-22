export const formatCurrency = (amount) => {
    if (!amount) return '0₫';
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
    }).format(amount);
};

export const formatDate = (date, format = 'DD/MM/YYYY') => {
    if (!date) return '';
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
};

export const formatDateTime = (date) => {
    if (!date) return '';
    return new Date(date).toLocaleString('vi-VN');
};

export const getStatusColor = (status) => {
    const colors = {
        'Chờ xác nhận': 'warning',
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