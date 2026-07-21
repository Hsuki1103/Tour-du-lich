import { body, param, query, validationResult } from 'express-validator';

// Validation middleware
export const validate = (validations) => {
  return async (req, res, next) => {
    await Promise.all(validations.map(validation => validation.run(req)));

    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    return res.status(400).json({
      success: false,
      errors: errors.array().map(err => ({
        field: err.path,
        message: err.msg
      }))
    });
  };
};

// Common validations - EXPORT ĐÚNG CÁCH
export const commonValidations = {
  // User validations
  register: [
    body('ho_ten').notEmpty().withMessage('Họ tên không được để trống'),
    body('email').isEmail().withMessage('Email không hợp lệ'),
    body('so_dien_thoai').matches(/^[0-9]{10,11}$/).withMessage('Số điện thoại không hợp lệ'),
    body('mat_khau').isLength({ min: 6 }).withMessage('Mật khẩu phải có ít nhất 6 ký tự'),
    body('xac_nhan_mat_khau').custom((value, { req }) => {
      if (value !== req.body.mat_khau) {
        throw new Error('Mật khẩu xác nhận không khớp');
      }
      return true;
    })
  ],

  login: [
    body('email').isEmail().withMessage('Email không hợp lệ'),
    body('mat_khau').notEmpty().withMessage('Mật khẩu không được để trống')
  ],

  updateProfile: [
    body('ho_ten').optional().notEmpty().withMessage('Họ tên không được để trống'),
    body('so_dien_thoai').optional().matches(/^[0-9]{10,11}$/).withMessage('Số điện thoại không hợp lệ'),
    body('ngay_sinh').optional().isDate().withMessage('Ngày sinh không hợp lệ'),
    body('gioi_tinh').optional().isIn(['Nam', 'Nữ', 'Khác']).withMessage('Giới tính không hợp lệ')
  ],

  // Tour validations
  createTour: [
    body('ten_tour').notEmpty().withMessage('Tên tour không được để trống'),
    body('diem_den').notEmpty().withMessage('Điểm đến không được để trống'),
    body('so_ngay').isInt({ min: 1, max: 30 }).withMessage('Số ngày phải từ 1 đến 30'),
    body('mo_ta_chi_tiet').optional().isString(),
    body('lich_trinh').optional().isString(),
    body('dich_vu_bao_gom').optional().isString(),
    body('chinh_sach_huy').optional().isString()
  ],

  // Schedule validations
  createSchedule: [
    body('ngay_khoi_hanh').isDate().withMessage('Ngày khởi hành không hợp lệ'),
    body('so_chot_toi_da').isInt({ min: 1 }).withMessage('Số chỗ tối đa phải lớn hơn 0'),
    body('gia_nguoi_lon').isFloat({ min: 0 }).withMessage('Giá người lớn không hợp lệ'),
    body('gia_tre_em').isFloat({ min: 0 }).withMessage('Giá trẻ em không hợp lệ')
  ],

  // Booking validations
  createBooking: [
    body('ma_lich_khoi_hanh').isInt({ min: 1 }).withMessage('Mã lịch khởi hành không hợp lệ'),
    body('so_luong_nguoi_lon').isInt({ min: 0 }).withMessage('Số lượng người lớn không hợp lệ'),
    body('so_luong_tre_em').isInt({ min: 0 }).withMessage('Số lượng trẻ em không hợp lệ'),
    body('thong_tin_khach').isArray({ min: 1 }).withMessage('Thông tin hành khách không hợp lệ'),
    body('yeu_cau_dac_biet').optional().isString()
  ],

  // Discount validations
  createDiscount: [
    body('ma_code').notEmpty().withMessage('Mã giảm giá không được để trống'),
    body('ten_chuong_trinh').notEmpty().withMessage('Tên chương trình không được để trống'),
    body('loai_giam').isIn(['Phần trăm', 'Số tiền']).withMessage('Loại giảm không hợp lệ'),
    body('muc_giam').isFloat({ min: 0 }).withMessage('Mức giảm không hợp lệ'),
    body('so_luong').isInt({ min: 1 }).withMessage('Số lượng phải lớn hơn 0'),
    body('ngay_bat_dau').isDate().withMessage('Ngày bắt đầu không hợp lệ'),
    body('ngay_ket_thuc').isDate().withMessage('Ngày kết thúc không hợp lệ')
  ],

  // Review validations
  createReview: [
    body('so_sao').isInt({ min: 1, max: 5 }).withMessage('Số sao phải từ 1 đến 5'),
    body('noi_dung').optional().isString().isLength({ min: 10 }).withMessage('Nội dung đánh giá phải có ít nhất 10 ký tự')
  ],

  // Pagination validations
  pagination: [
    query('page').optional().isInt({ min: 1 }).withMessage('Trang không hợp lệ'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Giới hạn không hợp lệ')
  ],

  // ID param
  idParam: [
    param('id').isInt({ min: 1 }).withMessage('ID không hợp lệ')
  ],

  // Filter validations
  searchTours: [
    query('diem_den').optional().isString(),
    query('tu_ngay').optional().isDate().withMessage('Ngày bắt đầu không hợp lệ'),
    query('den_ngay').optional().isDate().withMessage('Ngày kết thúc không hợp lệ'),
    query('tu_gia').optional().isFloat({ min: 0 }).withMessage('Giá tối thiểu không hợp lệ'),
    query('den_gia').optional().isFloat({ min: 0 }).withMessage('Giá tối đa không hợp lệ'),
    query('so_ngay').optional().isInt({ min: 1 }).withMessage('Số ngày không hợp lệ')
  ]
};

// Export individual validations for flexibility
export const registerValidation = commonValidations.register;
export const loginValidation = commonValidations.login;
export const updateProfileValidation = commonValidations.updateProfile;
export const createTourValidation = commonValidations.createTour;
export const createScheduleValidation = commonValidations.createSchedule;
export const createBookingValidation = commonValidations.createBooking;
export const createDiscountValidation = commonValidations.createDiscount;
export const createReviewValidation = commonValidations.createReview;
export const paginationValidation = commonValidations.pagination;
export const idParamValidation = commonValidations.idParam;
export const searchToursValidation = commonValidations.searchTours;