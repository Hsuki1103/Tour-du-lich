import { Tour, LichKhoiHanh, DanhGia, NguoiDung, DonDatTour } from '../models/index.js';
import { Op } from 'sequelize';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================
// LẤY DANH SÁCH TOUR
// ============================================
export const getTours = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 12,
      diem_den,
      khu_vuc,
      tu_ngay,
      den_ngay,
      tu_gia,
      den_gia,
      so_ngay,
      sort_by = 'ngay_tao',
      sort_order = 'DESC'
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const where = { trang_thai: 'Đang hoạt động' };

    if (diem_den) {
      where.diem_den = { [Op.like]: `%${diem_den}%` };
    }
    if (khu_vuc) {
      where.khu_vuc = khu_vuc;
    }
    if (so_ngay) {
      where.so_ngay = parseInt(so_ngay);
    }

    const tours = await Tour.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      distinct: true,
      order: [[sort_by, sort_order]]
    });

    const tourIds = tours.rows.map(t => t.ma_tour);

    const schedules = await LichKhoiHanh.findAll({
      where: {
        ma_tour: tourIds,
        ngay_khoi_hanh: { [Op.gte]: new Date() },
        trang_thai: 'Còn chỗ'
      },
      order: [['ngay_khoi_hanh', 'ASC']]
    });

    const reviews = await DanhGia.findAll({
      where: { ma_tour: tourIds },
      attributes: ['ma_tour', 'so_sao']
    });

    const tourData = tours.rows.map(tour => {
      const tourSchedules = schedules.filter(s => s.ma_tour === tour.ma_tour);
      const tourReviews = reviews.filter(r => r.ma_tour === tour.ma_tour);
      
      const avgRating = tourReviews.length > 0
        ? tourReviews.reduce((sum, r) => sum + r.so_sao, 0) / tourReviews.length
        : 0;

      return {
        ...tour.toJSON(),
        lichKhoiHanhs: tourSchedules,
        danhGias: tourReviews,
        averageRating: parseFloat(avgRating.toFixed(1)),
        totalReviews: tourReviews.length
      };
    });

    let filteredData = tourData;
    if (tu_gia || den_gia) {
      filteredData = tourData.filter(tour => {
        const minPrice = tour.lichKhoiHanhs && tour.lichKhoiHanhs.length > 0
          ? Math.min(...tour.lichKhoiHanhs.map(l => parseFloat(l.gia_nguoi_lon)))
          : 0;
        let pass = true;
        if (tu_gia) pass = pass && minPrice >= parseFloat(tu_gia);
        if (den_gia) pass = pass && minPrice <= parseFloat(den_gia);
        return pass;
      });
    }

    res.json({
      success: true,
      data: {
        items: filteredData,
        total: filteredData.length,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(filteredData.length / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get tours error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi lấy danh sách tour: ' + error.message
    });
  }
};

// ============================================
// LẤY CHI TIẾT TOUR
// ============================================
export const getTourDetail = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({
        success: false,
        message: 'ID tour không hợp lệ'
      });
    }

    const tour = await Tour.findByPk(parseInt(id));

    if (!tour) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy tour'
      });
    }

    const schedules = await LichKhoiHanh.findAll({
      where: {
        ma_tour: parseInt(id),
        ngay_khoi_hanh: { [Op.gte]: new Date() }
      },
      order: [['ngay_khoi_hanh', 'ASC']]
    });

    const reviews = await DanhGia.findAll({
      where: { ma_tour: parseInt(id) },
      include: [
        {
          model: NguoiDung,
          as: 'nguoiDung',
          attributes: ['ho_ten', 'anh_dai_dien']
        }
      ],
      order: [['ngay_danh_gia', 'DESC']]
    });

    const avgRating = reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.so_sao, 0) / reviews.length
      : 0;

    const tourData = {
      ma_tour: tour.ma_tour,
      ten_tour: tour.ten_tour,
      diem_den: tour.diem_den,
      khu_vuc: tour.khu_vuc,
      so_ngay: tour.so_ngay,
      mo_ta_ngan: tour.mo_ta_ngan,
      mo_ta_chi_tiet: tour.mo_ta_chi_tiet,
      lich_trinh: tour.lich_trinh,
      dich_vu_bao_gom: tour.dich_vu_bao_gom,
      chinh_sach_huy: tour.chinh_sach_huy,
      hinh_anh: tour.hinh_anh,
      hinh_anh_phu: tour.hinh_anh_phu,
      trang_thai: tour.trang_thai,
      lichKhoiHanhs: schedules.map(s => ({
        ma_lich_khoi_hanh: s.ma_lich_khoi_hanh,
        ngay_khoi_hanh: s.ngay_khoi_hanh,
        so_chot_toi_da: s.so_chot_toi_da,
        so_chot_da_dat: s.so_chot_da_dat,
        so_chot_con_lai: s.so_chot_toi_da - s.so_chot_da_dat,
        gia_nguoi_lon: s.gia_nguoi_lon,
        gia_tre_em: s.gia_tre_em,
        trang_thai: s.trang_thai
      })),
      danhGias: reviews,
      averageRating: parseFloat(avgRating.toFixed(1)),
      totalReviews: reviews.length
    };

    res.json({
      success: true,
      data: tourData
    });
  } catch (error) {
    console.error('Get tour detail error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi lấy chi tiết tour: ' + error.message
    });
  }
};

// ============================================
// LẤY CHI TIẾT LỊCH KHỞI HÀNH - ⭐ THÊM MỚI
// ============================================
export const getScheduleDetail = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({
        success: false,
        message: 'ID lịch khởi hành không hợp lệ'
      });
    }

    const schedule = await LichKhoiHanh.findByPk(parseInt(id), {
      include: [
        {
          model: Tour,
          as: 'tour',
          attributes: ['ten_tour', 'diem_den', 'khu_vuc']
        }
      ]
    });

    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy lịch khởi hành'
      });
    }

    res.json({
      success: true,
      data: schedule
    });
  } catch (error) {
    console.error('Get schedule detail error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi lấy chi tiết lịch khởi hành: ' + error.message
    });
  }
};

// ============================================
// TÌM KIẾM TOUR
// ============================================
export const searchTours = async (req, res) => {
  try {
    const { q, diem_den, khu_vuc, ngay_khoi_hanh, tu_gia, den_gia, so_ngay } = req.query;

    const where = { trang_thai: 'Đang hoạt động' };

    if (q) {
      where[Op.or] = [
        { ten_tour: { [Op.like]: `%${q}%` } },
        { diem_den: { [Op.like]: `%${q}%` } }
      ];
    }
    if (diem_den) {
      where.diem_den = { [Op.like]: `%${diem_den}%` };
    }
    if (khu_vuc) {
      where.khu_vuc = khu_vuc;
    }
    if (so_ngay) {
      where.so_ngay = parseInt(so_ngay);
    }

    const tours = await Tour.findAll({
      where,
      limit: 20,
      order: [['ngay_tao', 'DESC']]
    });

    res.json({
      success: true,
      data: tours,
      total: tours.length
    });
  } catch (error) {
    console.error('Search tours error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi tìm kiếm tour: ' + error.message
    });
  }
};

// ============================================
// ADMIN: TẠO TOUR
// ============================================
export const createTour = async (req, res) => {
  try {
    const {
      ten_tour,
      diem_den,
      khu_vuc,
      so_ngay,
      mo_ta_ngan,
      mo_ta_chi_tiet,
      lich_trinh,
      dich_vu_bao_gom,
      chinh_sach_huy
    } = req.body;

    let hinh_anh = null;
    if (req.file) {
      hinh_anh = `/uploads/tours/${req.file.filename}`;
    }

    const tour = await Tour.create({
      ten_tour,
      diem_den,
      khu_vuc,
      so_ngay: parseInt(so_ngay),
      mo_ta_ngan,
      mo_ta_chi_tiet,
      lich_trinh,
      dich_vu_bao_gom,
      chinh_sach_huy,
      hinh_anh,
      trang_thai: 'Đang hoạt động'
    });

    res.status(201).json({
      success: true,
      message: 'Tạo tour thành công',
      data: tour
    });
  } catch (error) {
    console.error('Create tour error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi tạo tour: ' + error.message
    });
  }
};

// ============================================
// ADMIN: CẬP NHẬT TOUR
// ============================================
export const updateTour = async (req, res) => {
  try {
    const { id } = req.params;
    const tour = await Tour.findByPk(id);
    
    if (!tour) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy tour'
      });
    }

    const {
      ten_tour,
      diem_den,
      khu_vuc,
      so_ngay,
      mo_ta_ngan,
      mo_ta_chi_tiet,
      lich_trinh,
      dich_vu_bao_gom,
      chinh_sach_huy,
      trang_thai
    } = req.body;

    let hinh_anh = tour.hinh_anh;
    if (req.file) {
      if (tour.hinh_anh) {
        const oldPath = path.join(__dirname, '../../', tour.hinh_anh);
        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
        }
      }
      hinh_anh = `/uploads/tours/${req.file.filename}`;
    }

    await tour.update({
      ten_tour: ten_tour || tour.ten_tour,
      diem_den: diem_den || tour.diem_den,
      khu_vuc: khu_vuc || tour.khu_vuc,
      so_ngay: so_ngay ? parseInt(so_ngay) : tour.so_ngay,
      mo_ta_ngan: mo_ta_ngan || tour.mo_ta_ngan,
      mo_ta_chi_tiet: mo_ta_chi_tiet || tour.mo_ta_chi_tiet,
      lich_trinh: lich_trinh || tour.lich_trinh,
      dich_vu_bao_gom: dich_vu_bao_gom || tour.dich_vu_bao_gom,
      chinh_sach_huy: chinh_sach_huy || tour.chinh_sach_huy,
      hinh_anh,
      trang_thai: trang_thai || tour.trang_thai
    });

    res.json({
      success: true,
      message: 'Cập nhật tour thành công',
      data: tour
    });
  } catch (error) {
    console.error('Update tour error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi cập nhật tour: ' + error.message
    });
  }
};

// ============================================
// ADMIN: XÓA TOUR
// ============================================
export const deleteTour = async (req, res) => {
  try {
    const { id } = req.params;
    const tour = await Tour.findByPk(id);
    
    if (!tour) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy tour'
      });
    }

    if (tour.hinh_anh) {
      const imagePath = path.join(__dirname, '../../', tour.hinh_anh);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    await tour.destroy();
    res.json({
      success: true,
      message: 'Xóa tour thành công'
    });
  } catch (error) {
    console.error('Delete tour error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi xóa tour: ' + error.message
    });
  }
};

// ============================================
// ADMIN: TẠO LỊCH KHỞI HÀNH
// ============================================
export const createSchedule = async (req, res) => {
  try {
    const { ma_tour, ngay_khoi_hanh, so_chot_toi_da, gia_nguoi_lon, gia_tre_em } = req.body;

    const tour = await Tour.findByPk(ma_tour);
    if (!tour) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy tour'
      });
    }

    const existingSchedule = await LichKhoiHanh.findOne({
      where: {
        ma_tour,
        ngay_khoi_hanh: new Date(ngay_khoi_hanh)
      }
    });

    if (existingSchedule) {
      return res.status(400).json({
        success: false,
        message: 'Ngày khởi hành này đã tồn tại'
      });
    }

    const schedule = await LichKhoiHanh.create({
      ma_tour,
      ngay_khoi_hanh: new Date(ngay_khoi_hanh),
      so_chot_toi_da: parseInt(so_chot_toi_da),
      so_chot_da_dat: 0,
      gia_nguoi_lon: parseFloat(gia_nguoi_lon),
      gia_tre_em: parseFloat(gia_tre_em),
      trang_thai: 'Còn chỗ'
    });

    res.status(201).json({
      success: true,
      message: 'Tạo lịch khởi hành thành công',
      data: schedule
    });
  } catch (error) {
    console.error('Create schedule error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi tạo lịch khởi hành: ' + error.message
    });
  }
};

// ============================================
// ADMIN: CẬP NHẬT LỊCH KHỞI HÀNH
// ============================================
export const updateSchedule = async (req, res) => {
  try {
    const { id } = req.params;
    const schedule = await LichKhoiHanh.findByPk(id);
    
    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy lịch khởi hành'
      });
    }

    const { ngay_khoi_hanh, so_chot_toi_da, gia_nguoi_lon, gia_tre_em, trang_thai } = req.body;

    await schedule.update({
      ngay_khoi_hanh: ngay_khoi_hanh ? new Date(ngay_khoi_hanh) : schedule.ngay_khoi_hanh,
      so_chot_toi_da: so_chot_toi_da ? parseInt(so_chot_toi_da) : schedule.so_chot_toi_da,
      gia_nguoi_lon: gia_nguoi_lon ? parseFloat(gia_nguoi_lon) : schedule.gia_nguoi_lon,
      gia_tre_em: gia_tre_em ? parseFloat(gia_tre_em) : schedule.gia_tre_em,
      trang_thai: trang_thai || schedule.trang_thai
    });

    res.json({
      success: true,
      message: 'Cập nhật lịch khởi hành thành công',
      data: schedule
    });
  } catch (error) {
    console.error('Update schedule error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi cập nhật lịch khởi hành: ' + error.message
    });
  }
};

// ============================================
// ADMIN: XÓA LỊCH KHỞI HÀNH
// ============================================
export const deleteSchedule = async (req, res) => {
  try {
    const { id } = req.params;
    const schedule = await LichKhoiHanh.findByPk(id);
    
    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy lịch khởi hành'
      });
    }

    await schedule.destroy();
    res.json({
      success: true,
      message: 'Xóa lịch khởi hành thành công'
    });
  } catch (error) {
    console.error('Delete schedule error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi xóa lịch khởi hành: ' + error.message
    });
  }
};