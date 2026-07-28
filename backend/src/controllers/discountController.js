// backend/src/controllers/discountController.js
import { MaGiamGia, Tour, NguoiDung, DonDatTour, VaiTro, KhachHangMaGiamGia } from '../models/index.js';
import { Op } from 'sequelize';
import sequelize from '../config/database.js';
import { sendDiscountEmail } from '../utils/emailService.js';

// ============================================
// ADMIN: TẠO MÃ GIẢM GIÁ
// ============================================
export const createDiscount = async (req, res) => {
  try {
    const {
      ma_code,
      ten_chuong_trinh,
      loai_giam,
      muc_giam,
      giam_toi_da,
      so_luong,
      ngay_bat_dau,
      ngay_ket_thuc,
      ap_dung_cho_tour,
      yeu_cau_toi_thieu,
      loai_ma
    } = req.body;

    // Kiểm tra mã code đã tồn tại
    const existing = await MaGiamGia.findOne({
      where: { ma_code: ma_code.toUpperCase() }
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Mã giảm giá đã tồn tại'
      });
    }

    const discount = await MaGiamGia.create({
      ma_code: ma_code.toUpperCase(),
      ten_chuong_trinh,
      loai_giam,
      muc_giam: parseFloat(muc_giam),
      giam_toi_da: giam_toi_da ? parseFloat(giam_toi_da) : null,
      so_luong: parseInt(so_luong),
      ngay_bat_dau: new Date(ngay_bat_dau),
      ngay_ket_thuc: new Date(ngay_ket_thuc),
      ap_dung_cho_tour: ap_dung_cho_tour || null,
      yeu_cau_toi_thieu: parseInt(yeu_cau_toi_thieu) || 1,
      loai_ma: loai_ma || 'public',
      trang_thai: 'Đang hoạt động'
    });

    res.status(201).json({
      success: true,
      message: 'Tạo mã giảm giá thành công',
      data: discount
    });
  } catch (error) {
    console.error('Create discount error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi tạo mã giảm giá: ' + error.message
    });
  }
};

// ============================================
// ADMIN: LẤY DANH SÁCH MÃ GIẢM GIÁ
// ============================================
export const getDiscounts = async (req, res) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const offset = (page - 1) * limit;

    const where = {};
    if (search) {
      where[Op.or] = [
        { ma_code: { [Op.like]: `%${search}%` } },
        { ten_chuong_trinh: { [Op.like]: `%${search}%` } }
      ];
    }

    const discounts = await MaGiamGia.findAndCountAll({
      where,
      order: [['ngay_tao', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      data: {
        items: discounts.rows,
        total: discounts.count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(discounts.count / limit)
      }
    });
  } catch (error) {
    console.error('Get discounts error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi lấy danh sách mã giảm giá: ' + error.message
    });
  }
};

// ============================================
// ADMIN: LẤY CHI TIẾT MÃ GIẢM GIÁ
// ============================================
export const getDiscountDetail = async (req, res) => {
  try {
    const { id } = req.params;

    const discount = await MaGiamGia.findByPk(id);

    if (!discount) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy mã giảm giá'
      });
    }

    res.json({
      success: true,
      data: discount
    });
  } catch (error) {
    console.error('Get discount detail error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi lấy chi tiết mã giảm giá: ' + error.message
    });
  }
};

// ============================================
// ADMIN: CẬP NHẬT MÃ GIẢM GIÁ
// ============================================
export const updateDiscount = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      ten_chuong_trinh,
      loai_giam,
      muc_giam,
      giam_toi_da,
      so_luong,
      ngay_bat_dau,
      ngay_ket_thuc,
      ap_dung_cho_tour,
      yeu_cau_toi_thieu,
      loai_ma,
      trang_thai
    } = req.body;

    const discount = await MaGiamGia.findByPk(id);

    if (!discount) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy mã giảm giá'
      });
    }

    await discount.update({
      ten_chuong_trinh: ten_chuong_trinh || discount.ten_chuong_trinh,
      loai_giam: loai_giam || discount.loai_giam,
      muc_giam: muc_giam ? parseFloat(muc_giam) : discount.muc_giam,
      giam_toi_da: giam_toi_da ? parseFloat(giam_toi_da) : discount.giam_toi_da,
      so_luong: so_luong ? parseInt(so_luong) : discount.so_luong,
      ngay_bat_dau: ngay_bat_dau ? new Date(ngay_bat_dau) : discount.ngay_bat_dau,
      ngay_ket_thuc: ngay_ket_thuc ? new Date(ngay_ket_thuc) : discount.ngay_ket_thuc,
      ap_dung_cho_tour: ap_dung_cho_tour || discount.ap_dung_cho_tour,
      yeu_cau_toi_thieu: yeu_cau_toi_thieu ? parseInt(yeu_cau_toi_thieu) : discount.yeu_cau_toi_thieu,
      loai_ma: loai_ma || discount.loai_ma,
      trang_thai: trang_thai || discount.trang_thai
    });

    res.json({
      success: true,
      message: 'Cập nhật mã giảm giá thành công',
      data: discount
    });
  } catch (error) {
    console.error('Update discount error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi cập nhật mã giảm giá: ' + error.message
    });
  }
};

// ============================================
// ADMIN: XÓA MÃ GIẢM GIÁ
// ============================================
export const deleteDiscount = async (req, res) => {
  try {
    const { id } = req.params;

    const discount = await MaGiamGia.findByPk(id);

    if (!discount) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy mã giảm giá'
      });
    }

    await discount.destroy();

    res.json({
      success: true,
      message: 'Xóa mã giảm giá thành công'
    });
  } catch (error) {
    console.error('Delete discount error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi xóa mã giảm giá: ' + error.message
    });
  }
};

// ============================================
// ⭐ PUBLIC: XÁC THỰC MÃ GIẢM GIÁ (SỬA LỖI)
// ============================================
export const validateDiscount = async (req, res) => {
  try {
    const { code, tour_id, so_luong_khach } = req.body;

    if (!code) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập mã giảm giá'
      });
    }

    const discount = await MaGiamGia.findOne({
      where: { ma_code: code.toUpperCase() }
    });

    if (!discount) {
      return res.status(404).json({
        success: false,
        message: 'Mã giảm giá không tồn tại'
      });
    }

    // Kiểm tra hiệu lực cơ bản
    if (!discount.kiemTraHieuLuc()) {
      let message = 'Mã giảm giá không hợp lệ';
      if (discount.trang_thai === 'Đã hết') message = 'Mã giảm giá đã hết lượt sử dụng';
      if (discount.trang_thai === 'Hết hạn') message = 'Mã giảm giá đã hết hạn';
      if (discount.trang_thai !== 'Đang hoạt động') message = 'Mã giảm giá không khả dụng';
      
      return res.status(400).json({
        success: false,
        message
      });
    }

    // ⭐ KIỂM TRA MÃ ĐÃ ĐƯỢC SỬ DỤNG - PHÂN BIỆT TRẠNG THÁI ĐƠN HÀNG
    if (req.user) {
      // ⭐ KIỂM TRA MÃ ĐÃ ĐƯỢC SỬ DỤNG TRONG ĐƠN HÀNG ĐÃ XÁC NHẬN/HOÀN THÀNH
      const usedInBooking = await DonDatTour.findOne({
        where: {
          ma_nguoi_dung: req.user.ma_nguoi_dung,
          ma_giam_gia: discount.ma_giam_gia,
          trang_thai_don_hang: {
            [Op.in]: ['Đã xác nhận', 'Đang diễn ra', 'Đã hoàn thành']
          }
        }
      });

      if (usedInBooking) {
        return res.status(400).json({
          success: false,
          message: '❌ Bạn đã sử dụng mã giảm giá này cho đơn hàng đã được xác nhận. Mỗi mã chỉ được sử dụng một lần.'
        });
      }

      // ⭐ KIỂM TRA ĐƠN HÀNG ĐANG CHỜ XÁC NHẬN - VẪN CÒN HIỆU LỰC
      const pendingBooking = await DonDatTour.findOne({
        where: {
          ma_nguoi_dung: req.user.ma_nguoi_dung,
          ma_giam_gia: discount.ma_giam_gia,
          trang_thai_don_hang: 'Chờ xác nhận'
        }
      });

      if (pendingBooking) {
        // ⭐ CHO PHÉP SỬ DỤNG LẠI VÌ ĐƠN CHƯA XÁC NHẬN
        console.log('ℹ️ Đơn hàng đang chờ xác nhận, cho phép sử dụng lại mã');
      }

      // ⭐ KIỂM TRA MÃ ĐÃ ĐƯỢC SỬ DỤNG TRONG BẢNG KHACH_HANG_MA_GIAM_GIA
      const usedInMyDiscounts = await KhachHangMaGiamGia.findOne({
        where: {
          ma_nguoi_dung: req.user.ma_nguoi_dung,
          ma_giam_gia: discount.ma_giam_gia,
          da_su_dung: true
        }
      });

      // ⭐ NẾU ĐÃ ĐÁNH DẤU SỬ DỤNG NHƯNG KHÔNG CÓ ĐƠN NÀO ĐANG CHỜ HOẶC XÁC NHẬN -> KHÓA
      if (usedInMyDiscounts && !pendingBooking) {
        // ⭐ KIỂM TRA XEM ĐƠN HÀNG NÀO ĐÃ DÙNG MÃ NÀY NHƯNG ĐÃ HỦY
        const cancelledBooking = await DonDatTour.findOne({
          where: {
            ma_nguoi_dung: req.user.ma_nguoi_dung,
            ma_giam_gia: discount.ma_giam_gia,
            trang_thai_don_hang: 'Đã hủy'
          }
        });

        // ⭐ NẾU ĐƠN ĐÃ HỦY VÀ CHƯA CÓ ĐƠN MỚI -> CHO PHÉP DÙNG LẠI
        if (cancelledBooking) {
          console.log('ℹ️ Đơn hàng đã hủy, mở khóa mã cho khách hàng');
          // ⭐ MỞ KHÓA MÃ
          await markDiscountUnused(req.user.ma_nguoi_dung, discount.ma_giam_gia);
        } else {
          return res.status(400).json({
            success: false,
            message: '❌ Mã giảm giá này đã được sử dụng. Mỗi mã chỉ được sử dụng một lần.'
          });
        }
      }

      // ⭐ NẾU LÀ MÃ PRIVATE, KIỂM TRA ĐÃ ĐƯỢC GỬI CHƯA
      if (discount.loai_ma === 'private') {
        const userDiscount = await KhachHangMaGiamGia.findOne({
          where: {
            ma_nguoi_dung: req.user.ma_nguoi_dung,
            ma_giam_gia: discount.ma_giam_gia,
            da_su_dung: false
          }
        });

        if (!userDiscount) {
          return res.status(403).json({
            success: false,
            message: '❌ Mã giảm giá này không dành cho bạn. Vui lòng kiểm tra email hoặc tab "Mã của tôi".'
          });
        }
      }
    }

    // Kiểm tra áp dụng cho tour
    if (discount.ap_dung_cho_tour && tour_id) {
      const tourIds = JSON.parse(discount.ap_dung_cho_tour);
      if (!tourIds.includes(parseInt(tour_id))) {
        return res.status(400).json({
          success: false,
          message: 'Mã giảm giá không áp dụng cho tour này'
        });
      }
    }

    // Kiểm tra số lượng khách tối thiểu
    if (so_luong_khach && so_luong_khach < discount.yeu_cau_toi_thieu) {
      return res.status(400).json({
        success: false,
        message: `Mã giảm giá yêu cầu tối thiểu ${discount.yeu_cau_toi_thieu} khách`
      });
    }

    res.json({
      success: true,
      data: {
        ma_giam_gia: discount.ma_giam_gia,
        ma_code: discount.ma_code,
        ten_chuong_trinh: discount.ten_chuong_trinh,
        loai_giam: discount.loai_giam,
        muc_giam: discount.muc_giam,
        giam_toi_da: discount.giam_toi_da,
        yeu_cau_toi_thieu: discount.yeu_cau_toi_thieu,
        so_luong_con_lai: discount.so_luong_con_lai,
        loai_ma: discount.loai_ma
      }
    });
  } catch (error) {
    console.error('Validate discount error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi xác thực mã giảm giá: ' + error.message
    });
  }
};

// ============================================
// PUBLIC: LẤY DANH SÁCH MÃ GIẢM GIÁ (CHỈ PUBLIC)
// ============================================
export const getPublicDiscounts = async (req, res) => {
  try {
    const { page = 1, limit = 20, tour_id } = req.query;
    const offset = (page - 1) * limit;
    const now = new Date();

    const where = {
      trang_thai: 'Đang hoạt động',
      loai_ma: 'public',
      ngay_bat_dau: { [Op.lte]: now },
      ngay_ket_thuc: { [Op.gte]: now },
      so_luong: { [Op.gt]: sequelize.col('so_luong_da_dung') }
    };

    if (tour_id) {
      where[Op.or] = [
        { ap_dung_cho_tour: null },
        { ap_dung_cho_tour: { [Op.like]: `%${tour_id}%` } }
      ];
    }

    const discounts = await MaGiamGia.findAndCountAll({
      where,
      attributes: [
        'ma_giam_gia',
        'ma_code',
        'ten_chuong_trinh',
        'loai_giam',
        'muc_giam',
        'giam_toi_da',
        'so_luong',
        'so_luong_da_dung',
        'ngay_bat_dau',
        'ngay_ket_thuc',
        'yeu_cau_toi_thieu',
        'ap_dung_cho_tour',
        'loai_ma'
      ],
      order: [['ngay_tao', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    const items = discounts.rows.map(d => {
      const data = d.toJSON();
      data.so_luong_con_lai = data.so_luong - data.so_luong_da_dung;
      return data;
    });

    res.json({
      success: true,
      data: {
        items,
        total: discounts.count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(discounts.count / limit)
      }
    });
  } catch (error) {
    console.error('Get public discounts error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi lấy danh sách mã giảm giá: ' + error.message
    });
  }
};

// ============================================
// PUBLIC: LẤY CHI TIẾT MÃ GIẢM GIÁ CÔNG KHAI
// ============================================
export const getPublicDiscountDetail = async (req, res) => {
  try {
    const { id } = req.params;
    const now = new Date();

    const discount = await MaGiamGia.findOne({
      where: {
        ma_giam_gia: id,
        trang_thai: 'Đang hoạt động',
        loai_ma: 'public',
        ngay_bat_dau: { [Op.lte]: now },
        ngay_ket_thuc: { [Op.gte]: now },
        so_luong: { [Op.gt]: sequelize.col('so_luong_da_dung') }
      },
      attributes: [
        'ma_giam_gia',
        'ma_code',
        'ten_chuong_trinh',
        'loai_giam',
        'muc_giam',
        'giam_toi_da',
        'so_luong',
        'so_luong_da_dung',
        'ngay_bat_dau',
        'ngay_ket_thuc',
        'yeu_cau_toi_thieu',
        'ap_dung_cho_tour',
        'loai_ma'
      ]
    });

    if (!discount) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy mã giảm giá hoặc mã đã hết hạn'
      });
    }

    const data = discount.toJSON();
    data.so_luong_con_lai = data.so_luong - data.so_luong_da_dung;

    let tours = [];
    if (data.ap_dung_cho_tour) {
      try {
        const tourIds = JSON.parse(data.ap_dung_cho_tour);
        tours = await Tour.findAll({
          where: { ma_tour: tourIds },
          attributes: ['ma_tour', 'ten_tour', 'diem_den']
        });
      } catch (e) {
        console.error('Parse tours error:', e);
      }
    }

    res.json({
      success: true,
      data: {
        ...data,
        tours
      }
    });
  } catch (error) {
    console.error('Get public discount detail error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi lấy chi tiết mã giảm giá: ' + error.message
    });
  }
};

// ============================================
// ⭐ LẤY DANH SÁCH MÃ GIẢM GIÁ CỦA KHÁCH HÀNG
// ============================================
export const getMyDiscounts = async (req, res) => {
  try {
    const ma_nguoi_dung = req.user.ma_nguoi_dung;
    const now = new Date();

    const myDiscounts = await KhachHangMaGiamGia.findAll({
      where: {
        ma_nguoi_dung: ma_nguoi_dung,
        da_su_dung: false
      },
      include: [
        {
          model: MaGiamGia,
          as: 'maGiamGia',
          where: {
            trang_thai: 'Đang hoạt động',
            ngay_bat_dau: { [Op.lte]: now },
            ngay_ket_thuc: { [Op.gte]: now }
          },
          required: true
        }
      ],
      order: [['ngay_nhan', 'DESC']]
    });

    const validDiscounts = myDiscounts.filter(item => {
      const discount = item.maGiamGia;
      if (!discount) return false;
      return discount.so_luong > discount.so_luong_da_dung;
    });

    res.json({
      success: true,
      data: validDiscounts.map(item => ({
        ma: item.ma,
        ma_giam_gia: item.ma_giam_gia,
        da_su_dung: item.da_su_dung,
        ngay_nhan: item.ngay_nhan,
        loai_ma: item.maGiamGia.loai_ma,
        ma_code: item.maGiamGia.ma_code,
        ten_chuong_trinh: item.maGiamGia.ten_chuong_trinh,
        loai_giam: item.maGiamGia.loai_giam,
        muc_giam: item.maGiamGia.muc_giam,
        giam_toi_da: item.maGiamGia.giam_toi_da,
        ngay_bat_dau: item.maGiamGia.ngay_bat_dau,
        ngay_ket_thuc: item.maGiamGia.ngay_ket_thuc,
        yeu_cau_toi_thieu: item.maGiamGia.yeu_cau_toi_thieu,
        so_luong_con_lai: item.maGiamGia.so_luong - item.maGiamGia.so_luong_da_dung
      })),
      total: validDiscounts.length
    });
  } catch (error) {
    console.error('Get my discounts error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi lấy danh sách mã giảm giá: ' + error.message
    });
  }
};

// ============================================
// ⭐ ĐÁNH DẤU ĐÃ SỬ DỤNG MÃ GIẢM GIÁ KHI ĐẶT TOUR
// ============================================
export const markDiscountUsed = async (ma_nguoi_dung, ma_giam_gia) => {
  try {
    const record = await KhachHangMaGiamGia.findOne({
      where: {
        ma_nguoi_dung: ma_nguoi_dung,
        ma_giam_gia: ma_giam_gia,
        da_su_dung: false
      }
    });

    if (record) {
      await record.update({
        da_su_dung: true,
        ngay_su_dung: new Date()
      });
      console.log(`✅ Đã đánh dấu mã ${ma_giam_gia} đã sử dụng cho khách hàng ${ma_nguoi_dung}`);
      return true;
    }
    
    // ⭐ NẾU KHÔNG TÌM THẤY BẢN GHI CHƯA SỬ DỤNG, TẠO MỚI
    const existingRecord = await KhachHangMaGiamGia.findOne({
      where: {
        ma_nguoi_dung: ma_nguoi_dung,
        ma_giam_gia: ma_giam_gia
      }
    });

    if (!existingRecord) {
      await KhachHangMaGiamGia.create({
        ma_nguoi_dung: ma_nguoi_dung,
        ma_giam_gia: ma_giam_gia,
        da_su_dung: true,
        ngay_nhan: new Date(),
        ngay_su_dung: new Date()
      });
      console.log(`✅ Đã tạo và đánh dấu mã ${ma_giam_gia} đã sử dụng cho khách hàng ${ma_nguoi_dung}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('❌ Mark discount used error:', error);
    return false;
  }
};

// ============================================
// ⭐ ĐÁNH DẤU CHƯA SỬ DỤNG MÃ GIẢM GIÁ KHI HỦY ĐƠN
// ============================================
export const markDiscountUnused = async (ma_nguoi_dung, ma_giam_gia) => {
  try {
    const record = await KhachHangMaGiamGia.findOne({
      where: {
        ma_nguoi_dung: ma_nguoi_dung,
        ma_giam_gia: ma_giam_gia,
        da_su_dung: true
      }
    });

    if (record) {
      await record.update({
        da_su_dung: false,
        ngay_su_dung: null
      });
      console.log(`✅ Đã mở khóa mã ${ma_giam_gia} cho khách hàng ${ma_nguoi_dung}`);
      return true;
    }
    
    // ⭐ NẾU KHÔNG TÌM THẤY BẢN GHI ĐÃ SỬ DỤNG, KIỂM TRA BẢN GHI CHƯA SỬ DỤNG
    const unusedRecord = await KhachHangMaGiamGia.findOne({
      where: {
        ma_nguoi_dung: ma_nguoi_dung,
        ma_giam_gia: ma_giam_gia,
        da_su_dung: false
      }
    });

    if (!unusedRecord) {
      // ⭐ NẾU KHÔNG CÓ BẢN GHI NÀO, TẠO MỚI
      await KhachHangMaGiamGia.create({
        ma_nguoi_dung: ma_nguoi_dung,
        ma_giam_gia: ma_giam_gia,
        da_su_dung: false,
        ngay_nhan: new Date()
      });
      console.log(`✅ Đã tạo bản ghi mã ${ma_giam_gia} chưa sử dụng cho khách hàng ${ma_nguoi_dung}`);
      return true;
    }
    
    return true;
  } catch (error) {
    console.error('❌ Mark discount unused error:', error);
    return false;
  }
};

// ============================================
// ⭐ GỬI MÃ GIẢM GIÁ CHO KHÁCH HÀNG
// ============================================
export const sendDiscountToCustomers = async (req, res) => {
  try {
    const { 
      ma_giam_gia, 
      customer_ids, 
      send_to_all = false,
      min_spent = 0,
      max_spent = null
    } = req.body;

    console.log('📤 Sending discount to customers:', { ma_giam_gia, customer_ids, send_to_all, min_spent, max_spent });

    const discount = await MaGiamGia.findByPk(ma_giam_gia);
    if (!discount) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy mã giảm giá'
      });
    }

    let customers = [];

    if (send_to_all) {
      const customerRole = await VaiTro.findOne({
        where: { ten_vai_tro: 'Khách hàng' }
      });

      if (!customerRole) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy vai trò khách hàng'
        });
      }

      const allCustomers = await NguoiDung.findAll({
        where: {
          ma_vai_tro: customerRole.ma_vai_tro,
          trang_thai: 'Đang hoạt động'
        },
        attributes: ['ma_nguoi_dung', 'ho_ten', 'email', 'so_dien_thoai']
      });

      for (const user of allCustomers) {
        const totalSpent = await DonDatTour.sum('tong_tien', {
          where: {
            ma_nguoi_dung: user.ma_nguoi_dung,
            trang_thai_don_hang: {
              [Op.notIn]: ['Đã hủy']
            }
          }
        });

        const spent = totalSpent || 0;
        let pass = true;
        if (min_spent && spent < parseFloat(min_spent)) pass = false;
        if (max_spent && spent > parseFloat(max_spent)) pass = false;
        
        if (pass) {
          customers.push(user);
        }
      }
    } else if (customer_ids && customer_ids.length > 0) {
      customers = await NguoiDung.findAll({
        where: {
          ma_nguoi_dung: customer_ids,
          trang_thai: 'Đang hoạt động'
        },
        attributes: ['ma_nguoi_dung', 'ho_ten', 'email', 'so_dien_thoai']
      });
    } else {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng chọn khách hàng hoặc chọn gửi cho tất cả'
      });
    }

    if (customers.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy khách hàng nào đáp ứng điều kiện'
      });
    }

    const isPrivate = discount.loai_ma === 'private';
    let savedCount = 0;
    let emailSentCount = 0;
    let failedEmails = [];

    for (const customer of customers) {
      if (isPrivate) {
        const existing = await KhachHangMaGiamGia.findOne({
          where: {
            ma_nguoi_dung: customer.ma_nguoi_dung,
            ma_giam_gia: ma_giam_gia,
            da_su_dung: false
          }
        });

        if (!existing) {
          await KhachHangMaGiamGia.create({
            ma_nguoi_dung: customer.ma_nguoi_dung,
            ma_giam_gia: ma_giam_gia,
            da_su_dung: false,
            ngay_nhan: new Date()
          });
          savedCount++;
        }
      }

      try {
        await sendDiscountEmail(customer.email, {
          ho_ten: customer.ho_ten,
          ma_code: discount.ma_code,
          ten_chuong_trinh: discount.ten_chuong_trinh,
          loai_giam: discount.loai_giam,
          muc_giam: discount.muc_giam,
          giam_toi_da: discount.giam_toi_da,
          ngay_ket_thuc: discount.ngay_ket_thuc,
          yeu_cau_toi_thieu: discount.yeu_cau_toi_thieu,
          loai_ma: discount.loai_ma
        });
        emailSentCount++;
      } catch (error) {
        console.error(`❌ Failed to send email to ${customer.email}:`, error.message);
        failedEmails.push(customer.email);
      }
    }

    res.json({
      success: true,
      message: `Đã gửi mã giảm giá cho ${customers.length} khách hàng`,
      data: {
        total_customers: customers.length,
        saved_count: savedCount,
        email_sent: emailSentCount,
        failed_emails: failedEmails,
        discount_code: discount.ma_code,
        loai_ma: discount.loai_ma,
        discount: discount
      }
    });
  } catch (error) {
    console.error('Send discount to customers error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi gửi mã giảm giá: ' + error.message
    });
  }
};