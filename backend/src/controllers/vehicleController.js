// backend/src/controllers/vehicleController.js
import { PhuongTien, LichKhoiHanh } from '../models/index.js';
import { Op } from 'sequelize';

// ============================================
// LẤY DANH SÁCH PHƯƠNG TIỆN
// ============================================
export const getVehicles = async (req, res) => {
  try {
    const { page = 1, limit = 20, search, loai_xe, trang_thai } = req.query;
    const offset = (page - 1) * limit;

    const where = {};
    if (search) {
      where[Op.or] = [
        { bien_so_xe: { [Op.like]: `%${search}%` } },
        { ten_xe: { [Op.like]: `%${search}%` } },
        { hang_xe: { [Op.like]: `%${search}%` } }
      ];
    }
    if (loai_xe) where.loai_xe = loai_xe;
    if (trang_thai) where.trang_thai = trang_thai;

    const vehicles = await PhuongTien.findAndCountAll({
      where,
      order: [['ngay_tao', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    const items = vehicles.rows.map(vehicle => ({
      ...vehicle.toJSON(),
      so_chot_toi_da: vehicle.getMaxSeats()
    }));

    res.json({
      success: true,
      data: {
        items,
        total: vehicles.count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(vehicles.count / limit)
      }
    });
  } catch (error) {
    console.error('Get vehicles error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi lấy danh sách phương tiện: ' + error.message
    });
  }
};

// ============================================
// LẤY CHI TIẾT PHƯƠNG TIỆN
// ============================================
export const getVehicleDetail = async (req, res) => {
  try {
    const { id } = req.params;

    const vehicle = await PhuongTien.findByPk(id);

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy phương tiện'
      });
    }

    const scheduleCount = await LichKhoiHanh.count({
      where: {
        ma_phuong_tien: id,
        trang_thai: {
          [Op.in]: ['Còn chỗ', 'Hết chỗ']
        }
      }
    });

    const data = vehicle.toJSON();
    data.so_chot_toi_da = vehicle.getMaxSeats();
    data.dang_su_dung = scheduleCount > 0;

    res.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Get vehicle detail error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi lấy chi tiết phương tiện: ' + error.message
    });
  }
};

// ============================================
// TẠO PHƯƠNG TIỆN
// ============================================
export const createVehicle = async (req, res) => {
  try {
    const {
      bien_so_xe,
      ten_xe,
      hang_xe,
      so_cho_ngoi,
      so_luong_xe,
      loai_xe,
      trang_thai
    } = req.body;

    const existing = await PhuongTien.findOne({
      where: { bien_so_xe: bien_so_xe.toUpperCase() }
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Biển số xe đã tồn tại trong hệ thống'
      });
    }

    const vehicle = await PhuongTien.create({
      bien_so_xe: bien_so_xe.toUpperCase(),
      ten_xe,
      hang_xe: hang_xe || null,
      so_cho_ngoi: parseInt(so_cho_ngoi),
      so_luong_xe: parseInt(so_luong_xe) || 1,
      loai_xe: loai_xe || 'Xe khách',
      trang_thai: trang_thai || 'Đang hoạt động'
    });

    const data = vehicle.toJSON();
    data.so_chot_toi_da = vehicle.getMaxSeats();

    res.status(201).json({
      success: true,
      message: 'Thêm phương tiện thành công',
      data
    });
  } catch (error) {
    console.error('Create vehicle error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi thêm phương tiện: ' + error.message
    });
  }
};

// ============================================
// CẬP NHẬT PHƯƠNG TIỆN
// ============================================
export const updateVehicle = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      bien_so_xe,
      ten_xe,
      hang_xe,
      so_cho_ngoi,
      so_luong_xe,
      loai_xe,
      trang_thai
    } = req.body;

    const vehicle = await PhuongTien.findByPk(id);

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy phương tiện'
      });
    }

    if (bien_so_xe && bien_so_xe.toUpperCase() !== vehicle.bien_so_xe) {
      const existing = await PhuongTien.findOne({
        where: {
          bien_so_xe: bien_so_xe.toUpperCase(),
          ma_phuong_tien: { [Op.ne]: id }
        }
      });
      if (existing) {
        return res.status(400).json({
          success: false,
          message: 'Biển số xe đã tồn tại trong hệ thống'
        });
      }
    }

    if (trang_thai && trang_thai !== 'Đang hoạt động') {
      const inUse = await LichKhoiHanh.count({
        where: {
          ma_phuong_tien: id,
          trang_thai: {
            [Op.in]: ['Còn chỗ', 'Hết chỗ']
          }
        }
      });

      if (inUse > 0) {
        return res.status(400).json({
          success: false,
          message: 'Không thể đổi trạng thái vì phương tiện đang được sử dụng trong lịch khởi hành'
        });
      }
    }

    await vehicle.update({
      bien_so_xe: bien_so_xe ? bien_so_xe.toUpperCase() : vehicle.bien_so_xe,
      ten_xe: ten_xe || vehicle.ten_xe,
      hang_xe: hang_xe || vehicle.hang_xe,
      so_cho_ngoi: so_cho_ngoi ? parseInt(so_cho_ngoi) : vehicle.so_cho_ngoi,
      so_luong_xe: so_luong_xe ? parseInt(so_luong_xe) : vehicle.so_luong_xe,
      loai_xe: loai_xe || vehicle.loai_xe,
      trang_thai: trang_thai || vehicle.trang_thai
    });

    const data = vehicle.toJSON();
    data.so_chot_toi_da = vehicle.getMaxSeats();

    res.json({
      success: true,
      message: 'Cập nhật phương tiện thành công',
      data
    });
  } catch (error) {
    console.error('Update vehicle error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi cập nhật phương tiện: ' + error.message
    });
  }
};

// ============================================
// XÓA PHƯƠNG TIỆN
// ============================================
export const deleteVehicle = async (req, res) => {
  try {
    const { id } = req.params;

    const vehicle = await PhuongTien.findByPk(id);

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy phương tiện'
      });
    }

    const inUse = await LichKhoiHanh.count({
      where: {
        ma_phuong_tien: id,
        trang_thai: {
          [Op.in]: ['Còn chỗ', 'Hết chỗ']
        }
      }
    });

    if (inUse > 0) {
      return res.status(400).json({
        success: false,
        message: 'Không thể xóa phương tiện đang được sử dụng trong lịch khởi hành'
      });
    }

    await vehicle.destroy();

    res.json({
      success: true,
      message: 'Xóa phương tiện thành công'
    });
  } catch (error) {
    console.error('Delete vehicle error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi xóa phương tiện: ' + error.message
    });
  }
};

// ============================================
// LẤY DANH SÁCH PHƯƠNG TIỆN ĐANG HOẠT ĐỘNG
// ============================================
export const getActiveVehicles = async (req, res) => {
  try {
    const vehicles = await PhuongTien.findAll({
      where: {
        trang_thai: 'Đang hoạt động'
      },
      order: [['ten_xe', 'ASC']]
    });

    const items = vehicles.map(vehicle => ({
      ...vehicle.toJSON(),
      so_chot_toi_da: vehicle.getMaxSeats()
    }));

    res.json({
      success: true,
      data: items
    });
  } catch (error) {
    console.error('Get active vehicles error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi lấy danh sách phương tiện: ' + error.message
    });
  }
};

// ============================================
// TÍNH SỐ CHỖ TỐI ĐA TỪ PHƯƠNG TIỆN
// ============================================
export const calculateMaxSeats = async (req, res) => {
  try {
    const { ma_phuong_tien } = req.body;

    if (!ma_phuong_tien) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng chọn phương tiện'
      });
    }

    const vehicle = await PhuongTien.findByPk(ma_phuong_tien);

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy phương tiện'
      });
    }

    const maxSeats = vehicle.getMaxSeats();

    res.json({
      success: true,
      data: {
        ma_phuong_tien: vehicle.ma_phuong_tien,
        bien_so_xe: vehicle.bien_so_xe,
        ten_xe: vehicle.ten_xe,
        so_cho_ngoi: vehicle.so_cho_ngoi,
        so_luong_xe: vehicle.so_luong_xe,
        so_chot_toi_da: maxSeats,
        so_tai_xe: vehicle.so_luong_xe
      }
    });
  } catch (error) {
    console.error('Calculate max seats error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi tính số chỗ: ' + error.message
    });
  }
};