export const TOUR_CATEGORIES = {
  MienBac: 'Miền Bắc',
  MienTrung: 'Miền Trung',
  MienNam: 'Miền Nam',
};

export const TOUR_TYPES = [
  'Nghỉ dưỡng',
  'Khám phá',
  'Tâm linh',
  'Sinh thái',
  'Văn hóa',
  'Ẩm thực',
];

export const BOOKING_STATUS = {
  CHO_XAC_NHAN: 'Chờ xác nhận',
  DA_XAC_NHAN: 'Đã xác nhận',
  DANG_DIEN_RA: 'Đang diễn ra',
  DA_HOAN_THANH: 'Đã hoàn thành',
  DA_HUY: 'Đã hủy',
};

export const PAYMENT_STATUS = {
  CHUA_THANH_TOAN: 'Chưa thanh toán',
  DA_DAT_COC: 'Đã đặt cọc',
  DA_THANH_TOAN: 'Đã thanh toán',
};

export const GENDER_OPTIONS = ['Nam', 'Nữ', 'Khác'];

export const ROLE_OPTIONS = {
  KHACH_HANG: 'Khách hàng',
  NHAN_VIEN: 'Nhân viên',
  ADMIN: 'Admin',
};

export const CANCELLATION_POLICY = {
  BEFORE_7_DAYS: { percentage: 100, label: 'Hoàn 100%', days: 7 },
  BEFORE_3_DAYS: { percentage: 50, label: 'Hoàn 50%', days: 3 },
  AFTER_3_DAYS: { percentage: 0, label: 'Không hoàn tiền', days: 0 },
};

export const UPLOAD_FILE_TYPES = {
  IMAGE: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  PDF: ['application/pdf'],
};