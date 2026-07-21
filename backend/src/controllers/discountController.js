import { MaGiamGia, Tour } from '../models/index.js';
import { Op } from 'sequelize';

// Tạo mã giảm giá
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
      yeu_cau_toi_thieu
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

// Lấy danh sách mã giảm giá
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

// Lấy chi tiết mã giảm giá
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

// Cập nhật mã giảm giá
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

// Xóa mã giảm giá
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

// Xác thực mã giảm giá (public)
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

    // Kiểm tra hiệu lực
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
        so_luong_con_lai: discount.so_luong_con_lai
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