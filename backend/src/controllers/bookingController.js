import {
  DonDatTour,
  LichKhoiHanh,
  Tour,
  NguoiDung,
  NhanVien,
  MaGiamGia,
  ThanhToan,
  VaiTro
} from '../models/index.js';
import { sendBookingConfirmation, sendCancellationEmail } from '../utils/emailService.js';
import { generateVoucherPDF } from '../utils/pdfService.js';
import { Op } from 'sequelize';
import fs from 'fs';

// ============================================
// TẠO ĐƠN ĐẶT TOUR MỚI
// ============================================
export const createBooking = async (req, res) => {
  const transaction = await DonDatTour.sequelize.transaction();

  try {
    const {
      ma_lich_khoi_hanh,
      so_luong_nguoi_lon,
      so_luong_tre_em,
      thong_tin_khach,
      yeu_cau_dac_biet,
      ma_giam_gia
    } = req.body;

    const ma_nguoi_dung = req.user.ma_nguoi_dung;

    const schedule = await LichKhoiHanh.findByPk(ma_lich_khoi_hanh, {
      include: [{ model: Tour, as: 'tour' }],
      transaction
    });

    if (!schedule) {
      throw new Error('Không tìm thấy lịch khởi hành');
    }

    if (schedule.trang_thai === 'Hết chỗ' || schedule.trang_thai === 'Đã hủy') {
      throw new Error('Lịch khởi hành này không còn chỗ trống');
    }

    const totalGuests = parseInt(so_luong_nguoi_lon) + parseInt(so_luong_tre_em || 0);
    
    const [results] = await DonDatTour.sequelize.query(
      `SELECT so_chot_toi_da, so_chot_da_dat 
       FROM lich_khoi_hanh 
       WHERE ma_lich_khoi_hanh = :scheduleId
       FOR UPDATE`,
      {
        replacements: { scheduleId: ma_lich_khoi_hanh },
        transaction
      }
    );

    const currentSchedule = results[0];
    const soChoConLai = currentSchedule.so_chot_toi_da - currentSchedule.so_chot_da_dat;

    if (soChoConLai < totalGuests) {
      throw new Error(`Chỉ còn ${soChoConLai} chỗ trống. Vui lòng giảm số lượng khách.`);
    }

    // Tính giá tiền
    let tongTien = (parseFloat(schedule.gia_nguoi_lon) * parseInt(so_luong_nguoi_lon)) +
                   (parseFloat(schedule.gia_tre_em) * parseInt(so_luong_tre_em || 0));

    let tienCoc = tongTien * 0.3;

    // Áp dụng mã giảm giá
    let maGiamGiaInfo = null;
    if (ma_giam_gia) {
      maGiamGiaInfo = await MaGiamGia.findByPk(ma_giam_gia, { transaction });
      
      if (maGiamGiaInfo) {
        const isValid = maGiamGiaInfo.kiemTraHieuLuc();
        if (!isValid) {
          throw new Error('Mã giảm giá không hợp lệ hoặc đã hết hạn');
        }

        if (maGiamGiaInfo.ap_dung_cho_tour) {
          const tourIds = JSON.parse(maGiamGiaInfo.ap_dung_cho_tour);
          if (!tourIds.includes(schedule.ma_tour)) {
            throw new Error('Mã giảm giá không áp dụng cho tour này');
          }
        }

        if (totalGuests < maGiamGiaInfo.yeu_cau_toi_thieu) {
          throw new Error(`Mã giảm giá yêu cầu tối thiểu ${maGiamGiaInfo.yeu_cau_toi_thieu} khách`);
        }

        tongTien = maGiamGiaInfo.tinhGiaSauGiam(tongTien);
        tienCoc = tongTien * 0.3;
      }
    }

    // Tạo đơn hàng
    const booking = await DonDatTour.create({
      ma_nguoi_dung,
      ma_lich_khoi_hanh,
      ma_giam_gia: ma_giam_gia || null,
      so_luong_nguoi_lon: parseInt(so_luong_nguoi_lon),
      so_luong_tre_em: parseInt(so_luong_tre_em || 0),
      thong_tin_khach: thong_tin_khach || [],
      yeu_cau_dac_biet: yeu_cau_dac_biet || null,
      tong_tien: tongTien,
      tien_coc: tienCoc,
      tien_con_lai: tongTien - tienCoc,
      trang_thai_thanh_toan: 'Chưa thanh toán',
      trang_thai_don_hang: 'Chờ xác nhận',
      ngay_dat: new Date()
    }, { transaction });

    // Cập nhật số chỗ
    await LichKhoiHanh.update(
      { 
        so_chot_da_dat: currentSchedule.so_chot_da_dat + totalGuests,
        trang_thai: currentSchedule.so_chot_toi_da === currentSchedule.so_chot_da_dat + totalGuests ? 'Hết chỗ' : 'Còn chỗ'
      },
      { where: { ma_lich_khoi_hanh }, transaction }
    );

    if (maGiamGiaInfo) {
      await MaGiamGia.update(
        { so_luong_da_dung: maGiamGiaInfo.so_luong_da_dung + 1 },
        { where: { ma_giam_gia }, transaction }
      );
    }

    await transaction.commit();

    // Gửi email (bỏ qua nếu lỗi)
    try {
      const user = await NguoiDung.findByPk(ma_nguoi_dung);
      const tour = await Tour.findByPk(schedule.ma_tour);

      await sendBookingConfirmation(user.email, {
        ma_don_hang: booking.ma_don_hang,
        ten_tour: tour.ten_tour,
        ngay_khoi_hanh: schedule.ngay_khoi_hanh,
        so_luong_nguoi_lon: booking.so_luong_nguoi_lon,
        so_luong_tre_em: booking.so_luong_tre_em,
        tong_tien: booking.tong_tien,
        trang_thai_thanh_toan: booking.trang_thai_thanh_toan
      });
    } catch (emailError) {
      console.log('⚠️ Email không gửi được, nhưng đơn hàng đã tạo thành công');
    }

    res.status(201).json({
      success: true,
      message: 'Đặt tour thành công!',
      data: {
        ma_don_hang: booking.ma_don_hang,
        tong_tien: booking.tong_tien,
        tien_coc: booking.tien_coc,
        trang_thai: booking.trang_thai_don_hang
      }
    });
  } catch (error) {
    if (transaction && transaction.finished !== 'commit') {
      await transaction.rollback();
    }
    console.error('Create booking error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Lỗi đặt tour'
    });
  }
};

// ============================================
// LẤY DANH SÁCH ĐƠN HÀNG CỦA USER
// ============================================
export const getMyBookings = async (req, res) => {
  try {
    const { page = 1, limit = 10, trang_thai } = req.query;
    const offset = (page - 1) * limit;

    const where = { ma_nguoi_dung: req.user.ma_nguoi_dung };
    if (trang_thai) {
      where.trang_thai_don_hang = trang_thai;
    }

    const bookings = await DonDatTour.findAndCountAll({
      where,
      include: [
        {
          model: LichKhoiHanh,
          as: 'lichKhoiHanh',
          include: [{ model: Tour, as: 'tour' }]
        },
        {
          model: ThanhToan,
          as: 'thanhToan'
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
    console.error('Get my bookings error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi lấy danh sách đơn hàng: ' + error.message
    });
  }
};

// ============================================
// LẤY CHI TIẾT ĐƠN HÀNG
// ============================================
export const getBookingDetail = async (req, res) => {
  try {
    const { id } = req.params;

    const booking = await DonDatTour.findByPk(id, {
      include: [
        {
          model: LichKhoiHanh,
          as: 'lichKhoiHanh',
          include: [{ model: Tour, as: 'tour' }]
        },
        {
          model: ThanhToan,
          as: 'thanhToan'
        },
        {
          model: MaGiamGia,
          as: 'maGiamGia'
        }
      ]
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đơn hàng'
      });
    }

    if (req.user.ma_nguoi_dung !== booking.ma_nguoi_dung) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền xem đơn hàng này'
      });
    }

    res.json({
      success: true,
      data: booking
    });
  } catch (error) {
    console.error('Get booking detail error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi lấy chi tiết đơn hàng: ' + error.message
    });
  }
};

// ============================================
// HỦY ĐƠN HÀNG (KHÁCH HÀNG)
// ============================================
export const cancelBooking = async (req, res) => {
  const transaction = await DonDatTour.sequelize.transaction();

  try {
    const { id } = req.params;
    const { ly_do } = req.body;

    const booking = await DonDatTour.findByPk(id, {
      include: [
        {
          model: LichKhoiHanh,
          as: 'lichKhoiHanh',
          include: [{ model: Tour, as: 'tour' }]
        }
      ]
    });

    if (!booking) {
      throw new Error('Không tìm thấy đơn hàng');
    }

    if (req.user.ma_nguoi_dung !== booking.ma_nguoi_dung) {
      throw new Error('Bạn không có quyền hủy đơn hàng này');
    }

    if (booking.trang_thai_don_hang === 'Đã hủy') {
      throw new Error('Đơn hàng đã được hủy trước đó');
    }

    if (booking.trang_thai_don_hang === 'Đã hoàn thành') {
      throw new Error('Không thể hủy đơn hàng đã hoàn thành');
    }

    const schedule = booking.lichKhoiHanh;
    const now = new Date();
    const departureDate = new Date(schedule.ngay_khoi_hanh);
    const daysUntilDeparture = Math.ceil((departureDate - now) / (1000 * 60 * 60 * 24));

    let refundPercentage = 0;
    if (daysUntilDeparture >= 7) {
      refundPercentage = 100;
    } else if (daysUntilDeparture >= 3) {
      refundPercentage = 50;
    } else {
      refundPercentage = 0;
    }

    const soTienHoanLai = (booking.tong_tien * refundPercentage) / 100;

    await booking.update({
      trang_thai_don_hang: 'Đã hủy',
      ly_do_huy: ly_do || 'Khách hàng hủy'
    }, { transaction });

    const totalGuests = booking.so_luong_nguoi_lon + booking.so_luong_tre_em;
    await LichKhoiHanh.update(
      { 
        so_chot_da_dat: schedule.so_chot_da_dat - totalGuests,
        trang_thai: 'Còn chỗ'
      },
      { where: { ma_lich_khoi_hanh: schedule.ma_lich_khoi_hanh }, transaction }
    );

    await transaction.commit();

    try {
      const user = await NguoiDung.findByPk(booking.ma_nguoi_dung);
      await sendCancellationEmail(user.email, {
        ma_don_hang: booking.ma_don_hang,
        ten_tour: schedule.tour.ten_tour,
        ly_do_huy: ly_do || 'Khách hàng hủy',
        so_tien_hoan_lai: soTienHoanLai
      });
    } catch (emailError) {
      console.log('⚠️ Email không gửi được');
    }

    res.json({
      success: true,
      message: 'Hủy đơn hàng thành công',
      data: {
        ma_don_hang: booking.ma_don_hang,
        so_tien_hoan_lai: soTienHoanLai,
        refund_percentage: refundPercentage
      }
    });
  } catch (error) {
    if (transaction && transaction.finished !== 'commit') {
      await transaction.rollback();
    }
    console.error('Cancel booking error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Lỗi hủy đơn hàng'
    });
  }
};

// ============================================
// TẢI VÉ ĐIỆN TỬ (PDF)
// ============================================
export const downloadVoucher = async (req, res) => {
  try {
    const { id } = req.params;

    const booking = await DonDatTour.findByPk(id, {
      include: [
        {
          model: LichKhoiHanh,
          as: 'lichKhoiHanh',
          include: [{ model: Tour, as: 'tour' }]
        },
        {
          model: NguoiDung,
          as: 'nguoiDung'
        }
      ]
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đơn hàng'
      });
    }

    if (req.user.ma_nguoi_dung !== booking.ma_nguoi_dung) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền tải vé này'
      });
    }

    if (booking.trang_thai_thanh_toan !== 'Đã thanh toán' && 
        booking.trang_thai_thanh_toan !== 'Đã đặt cọc') {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng thanh toán để tải vé điện tử'
      });
    }

    const result = await generateVoucherPDF({
      ma_don_hang: booking.ma_don_hang,
      ngay_dat: booking.ngay_dat,
      trang_thai_don_hang: booking.trang_thai_don_hang,
      ten_tour: booking.lichKhoiHanh.tour.ten_tour,
      diem_den: booking.lichKhoiHanh.tour.diem_den,
      ngay_khoi_hanh: booking.lichKhoiHanh.ngay_khoi_hanh,
      so_ngay: booking.lichKhoiHanh.tour.so_ngay,
      ho_ten: booking.nguoiDung.ho_ten,
      email: booking.nguoiDung.email,
      so_dien_thoai: booking.nguoiDung.so_dien_thoai,
      thong_tin_khach: booking.thong_tin_khach,
      so_luong_nguoi_lon: booking.so_luong_nguoi_lon,
      so_luong_tre_em: booking.so_luong_tre_em,
      tong_tien: booking.tong_tien,
      trang_thai_thanh_toan: booking.trang_thai_thanh_toan
    });

    res.download(result.filePath, result.fileName, (err) => {
      if (err) {
        console.error('Download error:', err);
      }
      setTimeout(() => {
        if (fs.existsSync(result.filePath)) {
          fs.unlinkSync(result.filePath);
        }
      }, 5000);
    });
  } catch (error) {
    console.error('Download voucher error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi tải vé điện tử: ' + error.message
    });
  }
};

// ============================================
// ADMIN: LẤY TẤT CẢ ĐƠN HÀNG
// ============================================
export const getAllBookings = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      trang_thai,
      tu_ngay,
      den_ngay,
      search,
      chi_cua_toi
    } = req.query;
    const offset = (page - 1) * limit;

    const where = {};
    if (trang_thai) {
      where.trang_thai_don_hang = trang_thai;
    }

    if (tu_ngay || den_ngay) {
      where.ngay_dat = {};
      if (tu_ngay) where.ngay_dat[Op.gte] = new Date(tu_ngay);
      if (den_ngay) where.ngay_dat[Op.lte] = new Date(den_ngay);
    }

    // Lọc đơn hàng của nhân viên phụ trách
    if (chi_cua_toi === 'true') {
      const nhanVien = await NhanVien.findOne({
        where: { ma_nguoi_dung: req.user.ma_nguoi_dung }
      });
      if (nhanVien) {
        where.ma_nhan_vien_phu_trach = nhanVien.ma_nhan_vien;
      } else {
        return res.json({
          success: true,
          data: {
            items: [],
            total: 0,
            page: parseInt(page),
            limit: parseInt(limit),
            totalPages: 0
          }
        });
      }
    }

    const bookings = await DonDatTour.findAndCountAll({
      where,
      include: [
        {
          model: LichKhoiHanh,
          as: 'lichKhoiHanh',
          include: [{ model: Tour, as: 'tour' }]
        },
        {
          model: NguoiDung,
          as: 'nguoiDung',
          attributes: ['ho_ten', 'email', 'so_dien_thoai']
        },
        {
          model: ThanhToan,
          as: 'thanhToan'
        },
        {
          model: NhanVien,
          as: 'nhanVienPhuTrach',
          include: [
            {
              model: NguoiDung,
              as: 'nguoiDung',
              attributes: ['ho_ten']
            }
          ]
        }
      ],
      order: [['ngay_dat', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    let items = bookings.rows;
    if (search) {
      items = items.filter(booking => {
        const searchLower = search.toLowerCase();
        return booking.nguoiDung.ho_ten.toLowerCase().includes(searchLower) ||
               booking.nguoiDung.email.toLowerCase().includes(searchLower) ||
               booking.nguoiDung.so_dien_thoai.includes(search) ||
               booking.lichKhoiHanh.tour.ten_tour.toLowerCase().includes(searchLower);
      });
    }

    res.json({
      success: true,
      data: {
        items,
        total: items.length,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(items.length / limit)
      }
    });
  } catch (error) {
    console.error('Get all bookings error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi lấy danh sách đơn hàng: ' + error.message
    });
  }
};

// ============================================
// ADMIN: XÁC NHẬN ĐƠN HÀNG
// ============================================
export const confirmBooking = async (req, res) => {
  try {
    const { id } = req.params;

    const booking = await DonDatTour.findByPk(id, {
      include: [
        {
          model: NguoiDung,
          as: 'nguoiDung'
        },
        {
          model: LichKhoiHanh,
          as: 'lichKhoiHanh',
          include: [{ model: Tour, as: 'tour' }]
        }
      ]
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đơn hàng'
      });
    }

    if (booking.trang_thai_don_hang !== 'Chờ xác nhận') {
      return res.status(400).json({
        success: false,
        message: 'Đơn hàng không ở trạng thái chờ xác nhận'
      });
    }

    // Gán nhân viên phụ trách
    const nhanVien = await NhanVien.findOne({
      where: { ma_nguoi_dung: req.user.ma_nguoi_dung }
    });

    await booking.update({
      trang_thai_don_hang: 'Đã xác nhận',
      ma_nhan_vien_phu_trach: nhanVien ? nhanVien.ma_nhan_vien : null
    });

    try {
      await sendBookingConfirmation(booking.nguoiDung.email, {
        ma_don_hang: booking.ma_don_hang,
        ten_tour: booking.lichKhoiHanh.tour.ten_tour,
        ngay_khoi_hanh: booking.lichKhoiHanh.ngay_khoi_hanh,
        so_luong_nguoi_lon: booking.so_luong_nguoi_lon,
        so_luong_tre_em: booking.so_luong_tre_em,
        tong_tien: booking.tong_tien,
        trang_thai_thanh_toan: booking.trang_thai_thanh_toan
      });
    } catch (emailError) {
      console.log('⚠️ Email không gửi được');
    }

    res.json({
      success: true,
      message: 'Xác nhận đơn hàng thành công',
      data: booking
    });
  } catch (error) {
    console.error('Confirm booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi xác nhận đơn hàng: ' + error.message
    });
  }
};

// ============================================
// ADMIN: CẬP NHẬT ĐƠN HÀNG
// ============================================
export const updateBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      ma_nguoi_dung,
      ma_lich_khoi_hanh,
      so_luong_nguoi_lon,
      so_luong_tre_em,
      tong_tien,
      trang_thai_thanh_toan,
      trang_thai_don_hang,
      thong_tin_khach,
      yeu_cau_dac_biet
    } = req.body;

    const booking = await DonDatTour.findByPk(id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đơn hàng'
      });
    }

    await booking.update({
      ma_nguoi_dung: ma_nguoi_dung || booking.ma_nguoi_dung,
      ma_lich_khoi_hanh: ma_lich_khoi_hanh || booking.ma_lich_khoi_hanh,
      so_luong_nguoi_lon: so_luong_nguoi_lon !== undefined ? so_luong_nguoi_lon : booking.so_luong_nguoi_lon,
      so_luong_tre_em: so_luong_tre_em !== undefined ? so_luong_tre_em : booking.so_luong_tre_em,
      tong_tien: tong_tien !== undefined ? tong_tien : booking.tong_tien,
      trang_thai_thanh_toan: trang_thai_thanh_toan || booking.trang_thai_thanh_toan,
      trang_thai_don_hang: trang_thai_don_hang || booking.trang_thai_don_hang,
      thong_tin_khach: thong_tin_khach || booking.thong_tin_khach,
      yeu_cau_dac_biet: yeu_cau_dac_biet || booking.yeu_cau_dac_biet
    });

    const updatedBooking = await DonDatTour.findByPk(id, {
      include: [
        {
          model: LichKhoiHanh,
          as: 'lichKhoiHanh',
          include: [{ model: Tour, as: 'tour' }]
        },
        {
          model: NguoiDung,
          as: 'nguoiDung',
          attributes: ['ho_ten', 'email', 'so_dien_thoai']
        }
      ]
    });

    res.json({
      success: true,
      message: 'Cập nhật đơn hàng thành công',
      data: updatedBooking
    });
  } catch (error) {
    console.error('Update booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi cập nhật đơn hàng: ' + error.message
    });
  }
};

// ============================================
// KHÁCH HÀNG: CHỈNH SỬA ĐƠN HÀNG (TRƯỚC 7 NGÀY)
// ============================================
export const updateBookingByCustomer = async (req, res) => {
  const transaction = await DonDatTour.sequelize.transaction();

  try {
    const { id } = req.params;
    const { so_luong_nguoi_lon, so_luong_tre_em } = req.body;

    // 1. Tìm đơn hàng
    const booking = await DonDatTour.findByPk(id, {
      include: [
        {
          model: LichKhoiHanh,
          as: 'lichKhoiHanh',
          include: [{ model: Tour, as: 'tour' }]
        }
      ]
    });

    if (!booking) {
      throw new Error('Không tìm thấy đơn hàng');
    }

    // 2. Kiểm tra quyền
    if (req.user.ma_nguoi_dung !== booking.ma_nguoi_dung) {
      throw new Error('Bạn không có quyền chỉnh sửa đơn hàng này');
    }

    // 3. Kiểm tra trạng thái đơn hàng
    if (booking.trang_thai_don_hang === 'Đã hủy') {
      throw new Error('Đơn hàng đã bị hủy, không thể chỉnh sửa');
    }
    if (booking.trang_thai_don_hang === 'Đã hoàn thành') {
      throw new Error('Đơn hàng đã hoàn thành, không thể chỉnh sửa');
    }
    if (booking.trang_thai_don_hang === 'Đang diễn ra') {
      throw new Error('Tour đang diễn ra, không thể chỉnh sửa');
    }

    // 4. Kiểm tra thời gian (>= 7 ngày)
    const schedule = booking.lichKhoiHanh;
    const now = new Date();
    const departureDate = new Date(schedule.ngay_khoi_hanh);
    const daysUntilDeparture = Math.ceil((departureDate - now) / (1000 * 60 * 60 * 24));

    if (daysUntilDeparture < 7) {
      throw new Error(`Chỉ có thể chỉnh sửa đơn hàng trước 7 ngày khởi hành. Còn ${daysUntilDeparture} ngày.`);
    }

    // 5. Lấy số lượng mới
    const newAdultCount = parseInt(so_luong_nguoi_lon) || 0;
    const newChildCount = parseInt(so_luong_tre_em) || 0;
    const totalNewGuests = newAdultCount + newChildCount;

    // 6. Kiểm tra số chỗ
    const [results] = await DonDatTour.sequelize.query(
      `SELECT so_chot_toi_da, so_chot_da_dat 
       FROM lich_khoi_hanh 
       WHERE ma_lich_khoi_hanh = :scheduleId
       FOR UPDATE`,
      {
        replacements: { scheduleId: schedule.ma_lich_khoi_hanh },
        transaction
      }
    );

    const currentSchedule = results[0];
    const currentBooked = currentSchedule.so_chot_da_dat;
    const totalSeats = currentSchedule.so_chot_toi_da;
    const oldTotalGuests = booking.so_luong_nguoi_lon + booking.so_luong_tre_em;
    const diffGuests = totalNewGuests - oldTotalGuests;

    if (diffGuests > 0) {
      const availableSeats = totalSeats - currentBooked;
      if (availableSeats < diffGuests) {
        throw new Error(`Chỉ còn ${availableSeats} chỗ trống, không đủ để thêm ${diffGuests} khách`);
      }
    }

    // 7. Tính giá mới
    const adultPrice = parseFloat(schedule.gia_nguoi_lon);
    const childPrice = parseFloat(schedule.gia_tre_em);
    const newTotal = (newAdultCount * adultPrice) + (newChildCount * childPrice);
    const oldTotal = parseFloat(booking.tong_tien);
    const diffAmount = newTotal - oldTotal;

    let message = '';
    let refundAmount = 0;
    let additionalAmount = 0;

    if (diffAmount > 0) {
      additionalAmount = diffAmount;
      message = `Bạn cần thanh toán thêm ${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(diffAmount)}`;
    } else if (diffAmount < 0) {
      refundAmount = Math.abs(diffAmount);
      message = `Bạn sẽ được hoàn lại ${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(refundAmount)}`;
    } else {
      message = 'Không có thay đổi về số tiền';
    }

    // 8. Cập nhật đơn hàng
    await booking.update({
      so_luong_nguoi_lon: newAdultCount,
      so_luong_tre_em: newChildCount,
      tong_tien: newTotal,
      tien_coc: newTotal * 0.3,
      tien_con_lai: newTotal * 0.7
    }, { transaction });

    // 9. Cập nhật số chỗ
    await LichKhoiHanh.update(
      { 
        so_chot_da_dat: currentBooked + diffGuests,
        trang_thai: totalSeats === currentBooked + diffGuests ? 'Hết chỗ' : 'Còn chỗ'
      },
      { where: { ma_lich_khoi_hanh: schedule.ma_lich_khoi_hanh }, transaction }
    );

    await transaction.commit();

    // 10. Lấy lại thông tin
    const updatedBooking = await DonDatTour.findByPk(id, {
      include: [
        {
          model: LichKhoiHanh,
          as: 'lichKhoiHanh',
          include: [{ model: Tour, as: 'tour' }]
        },
        {
          model: ThanhToan,
          as: 'thanhToan'
        }
      ]
    });

    res.json({
      success: true,
      message: 'Cập nhật đơn hàng thành công',
      data: {
        booking: updatedBooking,
        diff_amount: diffAmount,
        additional_amount: additionalAmount,
        refund_amount: refundAmount,
        message: message,
        days_until_departure: daysUntilDeparture
      }
    });
  } catch (error) {
    if (transaction && transaction.finished !== 'commit') {
      await transaction.rollback();
    }
    console.error('Update booking by customer error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Lỗi cập nhật đơn hàng'
    });
  }
};