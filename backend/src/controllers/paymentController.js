import { DonDatTour, ThanhToan, LichKhoiHanh, Tour, NguoiDung, VaiTro } from '../models/index.js';
import { createVNPayPayment as createVNPayPaymentService, verifyVNPayReturn } from '../utils/vnpayService.js';
import { sendPaymentConfirmation } from '../utils/emailService.js';
import { generateVoucherPDF } from '../utils/pdfService.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// ⭐ LOAD ENV
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

// ============================================
// TẠO THANH TOÁN VNPAY
// ============================================
export const createVNPayPayment = async (req, res) => {
  try {
    const { ma_don_hang, phuong_thuc_thanh_toan } = req.body;

    console.log('💳 Creating VNPay payment for order:', ma_don_hang);
    console.log('📦 Payment method:', phuong_thuc_thanh_toan);

    // ⭐ KIỂM TRA CẤU HÌNH VNPAY
    const tmnCode = process.env.VNP_TMN_CODE;
    const hashSecret = process.env.VNP_HASH_SECRET;

    console.log('🔑 VNP_TMN_CODE:', tmnCode ? '✅ SET' : '❌ MISSING');
    console.log('🔑 VNP_HASH_SECRET:', hashSecret ? '✅ SET' : '❌ MISSING');

    if (!tmnCode || !hashSecret) {
      console.error('❌ VNPay config missing!');
      return res.status(500).json({
        success: false,
        message: 'Cấu hình VNPay chưa được thiết lập. Vui lòng liên hệ quản trị viên.'
      });
    }

    // Tìm đơn hàng
    const booking = await DonDatTour.findByPk(ma_don_hang, {
      include: [
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

    // Kiểm tra quyền
    if (req.user.ma_nguoi_dung !== booking.ma_nguoi_dung) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền thanh toán đơn hàng này'
      });
    }

    // Kiểm tra trạng thái đơn hàng
    if (booking.trang_thai_don_hang === 'Đã hủy') {
      return res.status(400).json({
        success: false,
        message: 'Đơn hàng đã bị hủy, không thể thanh toán'
      });
    }

    if (booking.trang_thai_thanh_toan === 'Đã thanh toán') {
      return res.status(400).json({
        success: false,
        message: 'Đơn hàng đã được thanh toán'
      });
    }

    // Tính số tiền cần thanh toán
    let soTienCanThanhToan;
    if (phuong_thuc_thanh_toan === 'coc') {
      soTienCanThanhToan = parseFloat(booking.tien_coc);
    } else if (phuong_thuc_thanh_toan === 'full') {
      soTienCanThanhToan = parseFloat(booking.tong_tien);
    } else {
      return res.status(400).json({
        success: false,
        message: 'Phương thức thanh toán không hợp lệ. Chỉ chấp nhận "coc" hoặc "full"'
      });
    }

    if (!soTienCanThanhToan || soTienCanThanhToan <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Số tiền thanh toán không hợp lệ'
      });
    }

    console.log('💰 Amount:', soTienCanThanhToan);

    // Tạo thanh toán VNPay
    const paymentResult = createVNPayPaymentService({
      ma_don_hang: booking.ma_don_hang,
      so_tien: soTienCanThanhToan,
      ip_address: req.ip || req.connection.remoteAddress || '127.0.0.1'
    });

    if (!paymentResult.success) {
      return res.status(400).json({
        success: false,
        message: paymentResult.message || 'Không thể tạo thanh toán VNPay'
      });
    }

    // Lưu thông tin thanh toán
    await ThanhToan.create({
      ma_don_hang: booking.ma_don_hang,
      so_tien: soTienCanThanhToan,
      phuong_thuc: 'VNPay',
      trang_thai: 'Chờ thanh toán',
      ma_giao_dich: paymentResult.vnp_Params.vnp_TxnRef,
      thong_tin: paymentResult.vnp_Params
    });

    console.log('✅ Payment URL created successfully');

    res.json({
      success: true,
      data: {
        payment_url: paymentResult.paymentUrl,
        ma_don_hang: booking.ma_don_hang,
        so_tien: soTienCanThanhToan
      }
    });
  } catch (error) {
    console.error('❌ Create VNPay payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi tạo thanh toán: ' + error.message
    });
  }
};

// ============================================
// XỬ LÝ RETURN URL TỪ VNPAY
// ============================================
export const handleVNPayReturn = async (req, res) => {
  try {
    const queryParams = req.query;
    console.log('📥 VNPay Return:', queryParams);

    const result = verifyVNPayReturn(queryParams);

    if (!result.success) {
      return res.redirect(`${process.env.CLIENT_URL || 'http://localhost:3000'}/payment-result?status=failed&message=${result.message}`);
    }

    const { vnp_TxnRef, vnp_Amount, vnp_ResponseCode, vnp_PayDate } = result.data;

    // Tìm đơn hàng
    const booking = await DonDatTour.findByPk(vnp_TxnRef, {
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
      return res.redirect(`${process.env.CLIENT_URL || 'http://localhost:3000'}/payment-result?status=failed&message=Không tìm thấy đơn hàng`);
    }

    // Tìm thanh toán
    const thanhToan = await ThanhToan.findOne({
      where: { ma_don_hang: booking.ma_don_hang },
      order: [['ngay_tao', 'DESC']]
    });

    if (!thanhToan) {
      return res.redirect(`${process.env.CLIENT_URL || 'http://localhost:3000'}/payment-result?status=failed&message=Không tìm thấy thông tin thanh toán`);
    }

    if (vnp_ResponseCode === '00') {
      // Thanh toán thành công
      const soTienDaThanhToan = parseInt(vnp_Amount) / 100;

      await thanhToan.update({
        trang_thai: 'Đã thanh toán',
        ngay_thanh_toan: new Date(vnp_PayDate)
      });

      let trangThaiThanhToan = 'Đã thanh toán';
      if (soTienDaThanhToan < booking.tong_tien) {
        trangThaiThanhToan = 'Đã đặt cọc';
      }

      await booking.update({
        trang_thai_thanh_toan: trangThaiThanhToan,
        tien_con_lai: booking.tong_tien - soTienDaThanhToan
      });

      // Gửi email xác nhận thanh toán
      try {
        await sendPaymentConfirmation(booking.nguoiDung.email, {
          ma_don_hang: booking.ma_don_hang,
          ten_tour: booking.lichKhoiHanh.tour.ten_tour,
          so_tien: soTienDaThanhToan,
          phuong_thuc: 'VNPay',
          trang_thai: 'Thành công'
        });
      } catch (emailError) {
        console.log('⚠️ Email không gửi được');
      }

      // Tạo vé điện tử
      try {
        await generateVoucherPDF({
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
          trang_thai_thanh_toan: trangThaiThanhToan
        });
      } catch (pdfError) {
        console.log('⚠️ PDF không tạo được');
      }

      return res.redirect(`${process.env.CLIENT_URL || 'http://localhost:3000'}/payment-result?status=success&order=${booking.ma_don_hang}`);
    } else {
      // Thanh toán thất bại
      await thanhToan.update({
        trang_thai: 'Thất bại'
      });

      return res.redirect(`${process.env.CLIENT_URL || 'http://localhost:3000'}/payment-result?status=failed&message=Thanh toán thất bại`);
    }
  } catch (error) {
    console.error('❌ VNPay return error:', error);
    return res.redirect(`${process.env.CLIENT_URL || 'http://localhost:3000'}/payment-result?status=failed&message=Lỗi xử lý thanh toán`);
  }
};

// ============================================
// KIỂM TRA TRẠNG THÁI THANH TOÁN
// ============================================
export const getPaymentStatus = async (req, res) => {
  try {
    const { ma_don_hang } = req.params;

    console.log('📊 Checking payment status for order:', ma_don_hang);

    // Tìm đơn hàng
    const booking = await DonDatTour.findByPk(ma_don_hang, {
      include: [
        {
          model: ThanhToan,
          as: 'thanhToan',
          order: [['ngay_tao', 'DESC']]
        },
        {
          model: NguoiDung,
          as: 'nguoiDung',
          attributes: ['ho_ten', 'email']
        }
      ]
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đơn hàng'
      });
    }

    // Kiểm tra quyền
    if (req.user.ma_nguoi_dung !== booking.ma_nguoi_dung) {
      const user = await NguoiDung.findByPk(req.user.ma_nguoi_dung, {
        include: [{ model: VaiTro, as: 'vaiTro' }]
      });
      if (user?.vaiTro?.ten_vai_tro !== 'Admin' && user?.vaiTro?.ten_vai_tro !== 'Nhân viên') {
        return res.status(403).json({
          success: false,
          message: 'Bạn không có quyền xem thông tin này'
        });
      }
    }

    // Tìm thanh toán mới nhất
    const thanhToan = await ThanhToan.findOne({
      where: { ma_don_hang },
      order: [['ngay_tao', 'DESC']]
    });

    if (!thanhToan) {
      return res.json({
        success: true,
        data: {
          trang_thai: booking.trang_thai_thanh_toan,
          trang_thai_don_hang: booking.trang_thai_don_hang,
          tong_tien: booking.tong_tien,
          tien_coc: booking.tien_coc,
          tien_con_lai: booking.tien_con_lai
        }
      });
    }

    res.json({
      success: true,
      data: thanhToan
    });
  } catch (error) {
    console.error('❌ Get payment status error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi kiểm tra thanh toán: ' + error.message
    });
  }
};