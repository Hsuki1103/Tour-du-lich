import { NguoiDung, VaiTro, DonDatTour } from '../models/index.js';
import { Op } from 'sequelize';

// Lấy thông tin profile
export const getProfile = async (req, res) => {
  try {
    const user = await NguoiDung.findByPk(req.user.ma_nguoi_dung, {
      attributes: { exclude: ['mat_khau'] },
      include: [
        {
          model: VaiTro,
          as: 'vaiTro',
          attributes: ['ten_vai_tro']
        }
      ]
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng'
      });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi lấy thông tin: ' + error.message
    });
  }
};

// Cập nhật profile
export const updateProfile = async (req, res) => {
  try {
    const { ho_ten, so_dien_thoai, ngay_sinh, gioi_tinh, dia_chi, so_cccd } = req.body;

    const user = await NguoiDung.findByPk(req.user.ma_nguoi_dung);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng'
      });
    }

    // Kiểm tra số điện thoại trùng
    if (so_dien_thoai && so_dien_thoai !== user.so_dien_thoai) {
      const existingUser = await NguoiDung.findOne({
        where: {
          so_dien_thoai: so_dien_thoai,
          ma_nguoi_dung: { [Op.ne]: user.ma_nguoi_dung }
        }
      });

      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Số điện thoại đã được sử dụng'
        });
      }
    }

    // Cập nhật
    await user.update({
      ho_ten: ho_ten || user.ho_ten,
      so_dien_thoai: so_dien_thoai || user.so_dien_thoai,
      ngay_sinh: ngay_sinh || user.ngay_sinh,
      gioi_tinh: gioi_tinh || user.gioi_tinh,
      dia_chi: dia_chi || user.dia_chi,
      so_cccd: so_cccd || user.so_cccd
    });

    const updatedUser = await NguoiDung.findByPk(req.user.ma_nguoi_dung, {
      attributes: { exclude: ['mat_khau'] }
    });

    res.json({
      success: true,
      message: 'Cập nhật thông tin thành công',
      data: updatedUser
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi cập nhật thông tin: ' + error.message
    });
  }
};

// Upload avatar
export const uploadAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng chọn ảnh để upload'
      });
    }

    const user = await NguoiDung.findByPk(req.user.ma_nguoi_dung);
    
    // Lưu đường dẫn ảnh
    const imageUrl = `/uploads/avatars/${req.file.filename}`;
    await user.update({ anh_dai_dien: imageUrl });

    res.json({
      success: true,
      message: 'Upload ảnh đại diện thành công',
      data: { url: imageUrl }
    });
  } catch (error) {
    console.error('Upload avatar error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi upload ảnh: ' + error.message
    });
  }
};

// Lấy lịch sử đặt tour của người dùng
export const getBookingHistory = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const offset = (page - 1) * limit;

    const where = { ma_nguoi_dung: req.user.ma_nguoi_dung };
    if (status) {
      where.trang_thai_don_hang = status;
    }

    const bookings = await DonDatTour.findAndCountAll({
      where,
      include: [
        {
          association: 'lichKhoiHanh',
          include: ['tour']
        },
        {
          association: 'thanhToan'
        },
        {
          association: 'danhGia'
        }
      ],
      order: [['ngay_dat', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      data: {
        items: bookings.rows,
        total: bookings.count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(bookings.count / limit)
      }
    });
  } catch (error) {
    console.error('Get booking history error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi lấy lịch sử đặt tour: ' + error.message
    });
  }
};