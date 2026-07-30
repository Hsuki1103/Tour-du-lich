// backend/src/controllers/tourController.js
import { Tour, LichKhoiHanh, DanhGia, NguoiDung, DonDatTour, PhuongTien, LichKhoiHanhPhuongTien } from '../models/index.js';
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
      sort_order = 'DESC',
      trang_thai,
      search
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const where = {};

    if (trang_thai) {
      where.trang_thai = trang_thai;
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

    if (search) {
      where[Op.or] = [
        { ten_tour: { [Op.like]: `%${search}%` } },
        { diem_den: { [Op.like]: `%${search}%` } }
      ];
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
      include: [
        {
          model: PhuongTien,
          as: 'phuongTiens',
          through: { attributes: ['so_luong_xe'] }
        }
      ],
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

      let hinhAnhPhu = [];
      try {
        hinhAnhPhu = tour.hinh_anh_phu ? JSON.parse(tour.hinh_anh_phu) : [];
      } catch (e) {
        hinhAnhPhu = [];
      }

      return {
        ...tour.toJSON(),
        hinh_anh_phu: hinhAnhPhu,
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
// ⭐ LẤY CHI TIẾT TOUR - ĐÃ SỬA
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

    // ⭐ LẤY DỮ LIỆU ẢNH PHỤ
    let hinhAnhPhu = [];
    if (tour.hinh_anh_phu) {
      try {
        hinhAnhPhu = typeof tour.hinh_anh_phu === 'string' 
          ? JSON.parse(tour.hinh_anh_phu) 
          : tour.hinh_anh_phu;
      } catch (e) {
        console.error('Parse hinh_anh_phu error:', e);
        hinhAnhPhu = [];
      }
    }
    
    if (!Array.isArray(hinhAnhPhu)) {
      hinhAnhPhu = [];
    }

    console.log('📸 hinh_anh_phu for tour', id, ':', hinhAnhPhu);

    const schedules = await LichKhoiHanh.findAll({
      where: {
        ma_tour: parseInt(id)
      },
      include: [
        {
          model: PhuongTien,
          as: 'phuongTiens',
          through: { attributes: [] }
        }
      ],
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

    // ⭐ ĐẢM BẢO hinh_anh_phu LÀ ARRAY
    if (!Array.isArray(hinhAnhPhu)) {
      hinhAnhPhu = [];
    }

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
      hinh_anh: tour.hinh_anh || null,
      hinh_anh_phu: hinhAnhPhu, // ⭐ QUAN TRỌNG: TRẢ VỀ MẢNG
      trang_thai: tour.trang_thai,
      lichKhoiHanhs: schedules.map(s => {
        const sData = s.toJSON();
        let totalSeats = 0;
        if (sData.phuongTiens && sData.phuongTiens.length > 0) {
          sData.phuongTiens.forEach(vehicle => {
            totalSeats += vehicle.so_cho_ngoi - 1;
          });
        }
        if (totalSeats === 0) totalSeats = sData.so_chot_toi_da;
        return {
          ...sData,
          so_chot_toi_da: totalSeats,
          so_chot_con_lai: totalSeats - sData.so_chot_da_dat
        };
      }),
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
// ADMIN: TẠO TOUR
// ============================================
export const createTour = async (req, res) => {
  const transaction = await Tour.sequelize.transaction();

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
      chinh_sach_huy,
      trang_thai,
      lich_khoi_hanh
    } = req.body;

    console.log('📝 Creating tour:', { ten_tour, diem_den, trang_thai });
    console.log('📝 Schedules received:', lich_khoi_hanh);
    console.log('📝 Files received:', req.files);

    let hinh_anh = null;
    let hinh_anh_phu = [];

    if (req.files) {
      if (req.files.hinh_anh && req.files.hinh_anh.length > 0) {
        hinh_anh = `/uploads/tours/${req.files.hinh_anh[0].filename}`;
        console.log('📸 Main image saved:', hinh_anh);
      }

      if (req.files.hinh_anh_phu && req.files.hinh_anh_phu.length > 0) {
        hinh_anh_phu = req.files.hinh_anh_phu.map(file => `/uploads/tours/${file.filename}`);
        console.log('📸 Sub images saved:', hinh_anh_phu);
      }
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
      hinh_anh_phu: hinh_anh_phu.length > 0 ? JSON.stringify(hinh_anh_phu) : null,
      trang_thai: trang_thai || 'Đang hoạt động'
    }, { transaction });

    console.log('✅ Tour created:', tour.ma_tour);

    if (lich_khoi_hanh) {
      let schedules = [];
      try {
        schedules = typeof lich_khoi_hanh === 'string' 
          ? JSON.parse(lich_khoi_hanh) 
          : lich_khoi_hanh;
      } catch (e) {
        console.error('Parse schedules error:', e);
        schedules = [];
      }

      console.log('📝 Saving schedules:', schedules.length);

      if (schedules.length > 0) {
        for (const schedule of schedules) {
          const newSchedule = await LichKhoiHanh.create({
            ma_tour: tour.ma_tour,
            ngay_khoi_hanh: new Date(schedule.ngay_khoi_hanh),
            so_chot_toi_da: parseInt(schedule.so_chot_toi_da),
            so_chot_da_dat: 0,
            gia_nguoi_lon: parseFloat(schedule.gia_nguoi_lon),
            gia_tre_em: parseFloat(schedule.gia_tre_em),
            trang_thai: 'Còn chỗ'
          }, { transaction });

          if (schedule.phuong_tiens && schedule.phuong_tiens.length > 0) {
            for (const pt of schedule.phuong_tiens) {
              await LichKhoiHanhPhuongTien.create({
                ma_lich_khoi_hanh: newSchedule.ma_lich_khoi_hanh,
                ma_phuong_tien: parseInt(pt.ma_phuong_tien),
                so_luong_xe: parseInt(pt.so_luong_xe) || 1
              }, { transaction });
            }
          }
        }
        console.log(`✅ ${schedules.length} schedules saved`);
      }
    }

    await transaction.commit();

    const tourWithSchedules = await Tour.findByPk(tour.ma_tour, {
      include: [
        {
          model: LichKhoiHanh,
          as: 'lichKhoiHanhs',
          include: [
            {
              model: PhuongTien,
              as: 'phuongTiens',
              through: { attributes: ['so_luong_xe'] }
            }
          ]
        }
      ]
    });

    res.status(201).json({
      success: true,
      message: 'Tạo tour thành công',
      data: tourWithSchedules
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Create tour error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi tạo tour: ' + error.message
    });
  }
};

// ============================================
// ADMIN: CẬP NHẬT TOUR - ĐÃ SỬA
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
      trang_thai,
      hinh_anh_phu_existing
    } = req.body;

    console.log('📝 Updating tour:', { id, ten_tour, trang_thai });
    console.log('📸 hinh_anh_phu_existing:', hinh_anh_phu_existing);
    console.log('📸 Files hinh_anh_phu:', req.files?.hinh_anh_phu?.length || 0);

    // Xử lý ảnh chính
    let hinh_anh = tour.hinh_anh;
    if (req.files && req.files.hinh_anh && req.files.hinh_anh.length > 0) {
      if (tour.hinh_anh) {
        const oldPath = path.join(__dirname, '../../', tour.hinh_anh);
        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
          console.log('🗑️ Deleted old main image:', oldPath);
        }
      }
      hinh_anh = `/uploads/tours/${req.files.hinh_anh[0].filename}`;
      console.log('📸 New main image saved:', hinh_anh);
    }

    // ⭐⭐⭐ XỬ LÝ ẢNH PHỤ
    let hinh_anh_phu_array = [];

    // 1. Lấy ảnh phụ cũ từ database
    try {
      const oldImages = tour.hinh_anh_phu ? JSON.parse(tour.hinh_anh_phu) : [];
      hinh_anh_phu_array = [...oldImages];
      console.log('📸 Old images from DB:', hinh_anh_phu_array);
    } catch (e) {
      console.log('📸 No old images or parse error');
      hinh_anh_phu_array = [];
    }

    // 2. ⭐⭐⭐ XỬ LÝ DANH SÁCH ẢNH CŨ CẦN GIỮ
    if (hinh_anh_phu_existing !== undefined && hinh_anh_phu_existing !== null) {
      try {
        const keptImages = typeof hinh_anh_phu_existing === 'string' 
          ? JSON.parse(hinh_anh_phu_existing) 
          : hinh_anh_phu_existing;
        
        console.log('📸 Kept images from frontend:', keptImages);
        
        if (Array.isArray(keptImages)) {
          // ⭐ CHỈ GIỮ NHỮNG ẢNH CÓ TRONG DANH SÁCH KEPT
          hinh_anh_phu_array = hinh_anh_phu_array.filter(img => keptImages.includes(img));
          console.log('📸 After filter (kept):', hinh_anh_phu_array);
        }
      } catch (e) {
        console.error('Parse hinh_anh_phu_existing error:', e);
      }
    } else {
      // ⭐ NẾU KHÔNG CÓ hinh_anh_phu_existing, XÓA TẤT CẢ ẢNH CŨ
      console.log('📸 No hinh_anh_phu_existing, removing all old images');
      try {
        const oldImages = tour.hinh_anh_phu ? JSON.parse(tour.hinh_anh_phu) : [];
        for (const img of oldImages) {
          const imagePath = path.join(__dirname, '../../', img);
          if (fs.existsSync(imagePath)) {
            fs.unlinkSync(imagePath);
            console.log('🗑️ Deleted old sub image:', imagePath);
          }
        }
      } catch (e) {}
      hinh_anh_phu_array = [];
    }

    // 3. ⭐⭐⭐ THÊM ẢNH PHỤ MỚI
    if (req.files && req.files.hinh_anh_phu && req.files.hinh_anh_phu.length > 0) {
      const newImages = req.files.hinh_anh_phu.map(file => `/uploads/tours/${file.filename}`);
      hinh_anh_phu_array = [...hinh_anh_phu_array, ...newImages];
      console.log('📸 New images added:', newImages);
    }

    // 4. Xóa ảnh phụ cũ không còn được giữ
    try {
      const oldImages = tour.hinh_anh_phu ? JSON.parse(tour.hinh_anh_phu) : [];
      const removedImages = oldImages.filter(img => !hinh_anh_phu_array.includes(img));
      for (const img of removedImages) {
        const imagePath = path.join(__dirname, '../../', img);
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
          console.log('🗑️ Deleted removed sub image:', imagePath);
        }
      }
    } catch (e) {
      console.error('Delete old images error:', e);
    }

    console.log('📸 FINAL hinh_anh_phu_array:', hinh_anh_phu_array);

    // Cập nhật tour
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
      hinh_anh: hinh_anh,
      hinh_anh_phu: hinh_anh_phu_array.length > 0 ? JSON.stringify(hinh_anh_phu_array) : null,
      trang_thai: trang_thai || tour.trang_thai
    });

    // Lấy lại tour với lịch khởi hành
    const tourWithSchedules = await Tour.findByPk(id, {
      include: [
        {
          model: LichKhoiHanh,
          as: 'lichKhoiHanhs',
          include: [
            {
              model: PhuongTien,
              as: 'phuongTiens',
              through: { attributes: ['so_luong_xe'] }
            }
          ]
        }
      ]
    });

    res.json({
      success: true,
      message: 'Cập nhật tour thành công',
      data: tourWithSchedules
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
        console.log('🗑️ Deleted main image:', imagePath);
      }
    }

    let hinhAnhPhu = [];
    try {
      hinhAnhPhu = tour.hinh_anh_phu ? JSON.parse(tour.hinh_anh_phu) : [];
    } catch (e) {
      hinhAnhPhu = [];
    }
    for (const img of hinhAnhPhu) {
      const imagePath = path.join(__dirname, '../../', img);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
        console.log('🗑️ Deleted sub image:', imagePath);
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
// LẤY CHI TIẾT LỊCH KHỞI HÀNH
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
        },
        {
          model: PhuongTien,
          as: 'phuongTiens',
          through: { attributes: ['so_luong_xe'] }
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