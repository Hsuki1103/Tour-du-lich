// backend/src/controllers/bookingController.js
import {
    DonDatTour,
    LichKhoiHanh,
    Tour,
    NguoiDung,
    NhanVien,
    MaGiamGia,
    ThanhToan,
    VaiTro,
    DanhGia,
    KhachHangMaGiamGia
} from '../models/index.js';
import { 
    sendBookingConfirmation, 
    sendCancellationEmail, 
    sendRefundRequestEmail,
    sendRefundApprovedEmail,
    sendRefundRejectedEmail 
} from '../utils/emailService.js';
import { generateVoucherPDF } from '../utils/pdfService.js';
import { Op } from 'sequelize';
import fs from 'fs';
import sequelize from '../config/database.js';

// ============================================
// LẤY DANH SÁCH ĐƠN HÀNG CỦA USER
// ============================================
export const getMyBookings = async (req, res) => {
    try {
        const { page = 1, limit = 10, trang_thai } = req.query;
        const offset = (page - 1) * limit;

        console.log('📊 getMyBookings - User ID:', req.user.ma_nguoi_dung);
        console.log('📊 getMyBookings - Filter:', trang_thai);

        const where = { ma_nguoi_dung: req.user.ma_nguoi_dung };
        if (trang_thai) {
            where.trang_thai_don_hang = trang_thai;
        }

        const bookings = await DonDatTour.findAndCountAll({
            where,
            distinct: true,
            attributes: [
                'ma_don_hang',
                'ma_nguoi_dung',
                'ma_lich_khoi_hanh',
                'ma_giam_gia',
                'ma_nhan_vien_phu_trach',
                'so_luong_nguoi_lon',
                'so_luong_tre_em',
                'thong_tin_khach',
                'yeu_cau_dac_biet',
                'tong_tien',
                'tien_coc',
                'tien_con_lai',
                'trang_thai_thanh_toan',
                'trang_thai_don_hang',
                'ly_do_huy',
                'ngay_dat',
                'ngay_tao',
                'ngay_cap_nhat',
                'hoan_tien',
                'thong_tin_hoan_tien',
                'so_tien_hoan'
            ],
            include: [
                {
                    model: LichKhoiHanh,
                    as: 'lichKhoiHanh',
                    attributes: ['ma_lich_khoi_hanh', 'ngay_khoi_hanh', 'gia_nguoi_lon', 'gia_tre_em', 'trang_thai'],
                    include: [
                        { 
                            model: Tour, 
                            as: 'tour',
                            attributes: ['ma_tour', 'ten_tour', 'diem_den', 'so_ngay', 'hinh_anh']
                        }
                    ]
                }
            ],
            order: [['ngay_dat', 'DESC']],
            limit: parseInt(limit),
            offset: parseInt(offset)
        });

        console.log('📊 Found bookings:', bookings.count);

        const bookingIds = bookings.rows.map(b => b.ma_don_hang);
        
        let payments = [];
        let discounts = [];

        if (bookingIds.length > 0) {
            payments = await ThanhToan.findAll({
                where: { ma_don_hang: bookingIds },
                order: [['ngay_tao', 'DESC']]
            });

            const discountIds = bookings.rows.map(b => b.ma_giam_gia).filter(id => id);
            if (discountIds.length > 0) {
                discounts = await MaGiamGia.findAll({
                    where: { ma_giam_gia: discountIds }
                });
            }
        }

        const result = bookings.rows.map(booking => {
            const bookingData = booking.toJSON();
            const payment = payments.find(p => p.ma_don_hang === booking.ma_don_hang);
            bookingData.thanhToan = payment || null;
            const discount = discounts.find(d => d.ma_giam_gia === booking.ma_giam_gia);
            bookingData.maGiamGia = discount || null;
            return bookingData;
        });

        res.json({
            success: true,
            data: {
                items: result,
                total: bookings.count,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(bookings.count / limit)
            }
        });
    } catch (error) {
        console.error('❌ Get my bookings error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi lấy danh sách đơn hàng: ' + error.message
        });
    }
};

// ============================================
// TẠO ĐƠN ĐẶT TOUR MỚI (SỬA LỖI MÃ GIẢM GIÁ)
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

        // Kiểm tra đơn hàng tồn tại
        const existingBooking = await DonDatTour.findOne({
            where: {
                ma_nguoi_dung,
                ma_lich_khoi_hanh,
                trang_thai_thanh_toan: ['Chưa thanh toán', 'Đã đặt cọc'],
                trang_thai_don_hang: ['Chờ xác nhận', 'Đã xác nhận']
            }
        });

        if (existingBooking) {
            await transaction.rollback();
            return res.status(400).json({
                success: false,
                message: 'Bạn đã có đơn hàng cho tour này. Vui lòng thanh toán hoặc hủy đơn cũ trước khi đặt mới.',
                data: {
                    ma_don_hang: existingBooking.ma_don_hang,
                    trang_thai: existingBooking.trang_thai_don_hang
                }
            });
        }

        // Kiểm tra lịch khởi hành
        const schedule = await LichKhoiHanh.findByPk(ma_lich_khoi_hanh, {
            include: [{ model: Tour, as: 'tour' }],
            transaction
        });

        if (!schedule) {
            await transaction.rollback();
            throw new Error('Không tìm thấy lịch khởi hành');
        }

        if (schedule.trang_thai === 'Hết chỗ' || schedule.trang_thai === 'Đã hủy') {
            await transaction.rollback();
            throw new Error('Lịch khởi hành này không còn chỗ trống');
        }

        const totalGuests = parseInt(so_luong_nguoi_lon) + parseInt(so_luong_tre_em || 0);
        
        // Khóa bản ghi để tránh tranh chấp
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
            await transaction.rollback();
            throw new Error(`Chỉ còn ${soChoConLai} chỗ trống. Vui lòng giảm số lượng khách.`);
        }

        let tongTien = (parseFloat(schedule.gia_nguoi_lon) * parseInt(so_luong_nguoi_lon)) +
                       (parseFloat(schedule.gia_tre_em) * parseInt(so_luong_tre_em || 0));

        let tienCoc = tongTien * 0.3;

        let maGiamGiaInfo = null;

        // ⭐ XỬ LÝ MÃ GIẢM GIÁ
        if (ma_giam_gia) {
            maGiamGiaInfo = await MaGiamGia.findByPk(ma_giam_gia, { transaction });
            
            if (maGiamGiaInfo) {
                const isValid = maGiamGiaInfo.kiemTraHieuLuc();
                if (!isValid) {
                    await transaction.rollback();
                    throw new Error('Mã giảm giá không hợp lệ hoặc đã hết hạn');
                }

                if (maGiamGiaInfo.ap_dung_cho_tour) {
                    const tourIds = JSON.parse(maGiamGiaInfo.ap_dung_cho_tour);
                    if (!tourIds.includes(schedule.ma_tour)) {
                        await transaction.rollback();
                        throw new Error('Mã giảm giá không áp dụng cho tour này');
                    }
                }

                if (totalGuests < maGiamGiaInfo.yeu_cau_toi_thieu) {
                    await transaction.rollback();
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
            ngay_dat: new Date(),
            hoan_tien: 'Chưa yêu cầu'
        }, { transaction });

        // Cập nhật số chỗ
        await LichKhoiHanh.update(
            { 
                so_chot_da_dat: currentSchedule.so_chot_da_dat + totalGuests,
                trang_thai: currentSchedule.so_chot_toi_da === currentSchedule.so_chot_da_dat + totalGuests ? 'Hết chỗ' : 'Còn chỗ'
            },
            { where: { ma_lich_khoi_hanh }, transaction }
        );

        // ⭐ XỬ LÝ MÃ GIẢM GIÁ - CHỈ ĐÁNH DẤU ĐÃ SỬ DỤNG, KHÔNG GIẢM SỐ LƯỢNG
        if (maGiamGiaInfo) {
            // ⭐ ĐÁNH DẤU ĐÃ SỬ DỤNG TRONG BẢNG TRUNG GIAN
            try {
                // Import hàm từ discountController
                const { markDiscountUsed } = await import('./discountController.js');
                await markDiscountUsed(ma_nguoi_dung, ma_giam_gia);
                console.log('✅ Đã đánh dấu mã giảm giá đã sử dụng cho khách hàng');
            } catch (error) {
                console.log('⚠️ Không thể đánh dấu mã giảm giá đã sử dụng:', error.message);
            }
            
            // ⭐ KHÔNG GIẢM SỐ LƯỢNG Ở ĐÂY
            // Số lượng sẽ được giảm khi Admin xác nhận đơn hàng
        }

        await transaction.commit();

        // Gửi email xác nhận
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
        if (transaction && transaction.finished === undefined) {
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
                },
                {
                    model: DanhGia,
                    as: 'danhGia'
                },
                {
                    model: NguoiDung,
                    as: 'nguoiDung',
                    attributes: ['ho_ten', 'email', 'so_dien_thoai']
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
            const isStaff = user?.vaiTro?.ten_vai_tro === 'Admin' || 
                           user?.vaiTro?.ten_vai_tro === 'Nhân viên';
            if (!isStaff) {
                return res.status(403).json({
                    success: false,
                    message: 'Bạn không có quyền xem đơn hàng này'
                });
            }
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
// HỦY ĐƠN HÀNG (CẬP NHẬT CƠ CHẾ HOÀN TIỀN & MỞ KHÓA MÃ)
// ============================================
export const cancelBooking = async (req, res) => {
    const transaction = await DonDatTour.sequelize.transaction();

    try {
        const { id } = req.params;
        const { ly_do } = req.body;

        console.log('📝 CANCEL BOOKING - Order ID:', id);
        console.log('📝 CANCEL BOOKING - User ID:', req.user.ma_nguoi_dung);
        console.log('📝 CANCEL BOOKING - Reason:', ly_do);

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
            await transaction.rollback();
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
            const isStaff = user?.vaiTro?.ten_vai_tro === 'Admin' || 
                           user?.vaiTro?.ten_vai_tro === 'Nhân viên';
            if (!isStaff) {
                await transaction.rollback();
                return res.status(403).json({
                    success: false,
                    message: 'Bạn không có quyền hủy đơn hàng này'
                });
            }
        }

        // Kiểm tra trạng thái đơn hàng
        if (booking.trang_thai_don_hang === 'Đã hủy') {
            await transaction.rollback();
            return res.status(400).json({
                success: false,
                message: 'Đơn hàng đã được hủy trước đó'
            });
        }

        if (booking.trang_thai_don_hang === 'Đã hoàn thành') {
            await transaction.rollback();
            return res.status(400).json({
                success: false,
                message: 'Không thể hủy đơn hàng đã hoàn thành'
            });
        }

        const schedule = booking.lichKhoiHanh;
        const now = new Date();
        const departureDate = new Date(schedule.ngay_khoi_hanh);
        const daysUntilDeparture = Math.ceil((departureDate - now) / (1000 * 60 * 60 * 24));

        console.log('📊 Days until departure:', daysUntilDeparture);
        console.log('💰 Payment status:', booking.trang_thai_thanh_toan);

        // ⭐ CƠ CHẾ TÍNH HOÀN TIỀN
        let refundPercentage = 0;
        let refundLabel = 'Không hoàn tiền';
        let soTienHoanLai = 0;

        const isPaid = booking.trang_thai_thanh_toan === 'Đã thanh toán';

        if (isPaid) {
            if (daysUntilDeparture >= 7) {
                refundPercentage = 100;
                refundLabel = 'Hoàn 100%';
            } else if (daysUntilDeparture >= 3) {
                refundPercentage = 50;
                refundLabel = 'Hoàn 50%';
            } else if (daysUntilDeparture > 0) {
                refundPercentage = 0;
                refundLabel = 'Không hoàn tiền (dưới 3 ngày)';
            } else {
                refundLabel = 'Đã quá hạn hủy';
            }
            soTienHoanLai = (booking.tong_tien * refundPercentage) / 100;
        } else {
            if (booking.trang_thai_thanh_toan === 'Đã đặt cọc') {
                refundLabel = 'Không hoàn tiền (đã đặt cọc)';
            } else {
                refundLabel = 'Không hoàn tiền (chưa thanh toán)';
            }
            refundPercentage = 0;
            soTienHoanLai = 0;
        }

        console.log('💰 Refund percentage:', refundPercentage, ' - ', refundLabel);
        console.log('💰 Refund amount:', soTienHoanLai);

        // Cập nhật đơn hàng
        await booking.update({
            trang_thai_don_hang: 'Đã hủy',
            ly_do_huy: ly_do || (req.user.ma_nguoi_dung === booking.ma_nguoi_dung ? 'Khách hàng hủy' : 'Admin hủy'),
            hoan_tien: refundPercentage > 0 ? 'Chưa yêu cầu' : 'Chưa yêu cầu',
            so_tien_hoan: soTienHoanLai
        }, { transaction });

        // Hoàn trả số chỗ
        const totalGuests = booking.so_luong_nguoi_lon + booking.so_luong_tre_em;
        await LichKhoiHanh.update(
            { 
                so_chot_da_dat: schedule.so_chot_da_dat - totalGuests,
                trang_thai: 'Còn chỗ'
            },
            { where: { ma_lich_khoi_hanh: schedule.ma_lich_khoi_hanh }, transaction }
        );

        // ⭐ MỞ KHÓA MÃ GIẢM GIÁ NẾU ĐƠN HÀNG CHƯA XÁC NHẬN
        if (booking.trang_thai_don_hang === 'Chờ xác nhận' && booking.ma_giam_gia) {
            try {
                const { markDiscountUnused } = await import('./discountController.js');
                await markDiscountUnused(booking.ma_nguoi_dung, booking.ma_giam_gia);
                console.log('✅ Đã mở khóa mã giảm giá cho đơn hàng chờ xác nhận');
            } catch (error) {
                console.log('⚠️ Không thể mở khóa mã giảm giá:', error.message);
            }
        }

        // Cập nhật thanh toán nếu có
        if (booking.trang_thai_thanh_toan !== 'Chưa thanh toán') {
            const thanhToan = await ThanhToan.findOne({
                where: { ma_don_hang: booking.ma_don_hang },
                order: [['ngay_tao', 'DESC']]
            });

            if (thanhToan) {
                await thanhToan.update({
                    trang_thai: soTienHoanLai > 0 ? 'Đã hoàn tiền' : 'Đã hủy',
                    thong_tin: {
                        ...thanhToan.thong_tin,
                        refund_amount: soTienHoanLai,
                        refund_percentage: refundPercentage,
                        refund_label: refundLabel,
                        cancelled_at: new Date().toISOString(),
                        days_until_departure: daysUntilDeparture,
                        payment_status_at_cancel: booking.trang_thai_thanh_toan
                    }
                }, { transaction });
            }
        }

        await transaction.commit();

        // Gửi email thông báo
        try {
            await sendCancellationEmail(booking.nguoiDung.email, {
                ma_don_hang: booking.ma_don_hang,
                ten_tour: schedule.tour.ten_tour,
                ly_do_huy: booking.ly_do_huy,
                so_tien_hoan_lai: soTienHoanLai,
                refund_percentage: refundPercentage,
                refund_label: refundLabel,
                days_until_departure: daysUntilDeparture,
                trang_thai_thanh_toan: booking.trang_thai_thanh_toan
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
                refund_percentage: refundPercentage,
                refund_label: refundLabel,
                ly_do_huy: booking.ly_do_huy,
                days_until_departure: daysUntilDeparture,
                trang_thai_thanh_toan: booking.trang_thai_thanh_toan
            }
        });

    } catch (error) {
        if (transaction && transaction.finished === undefined) {
            await transaction.rollback();
        }
        console.error('Cancel booking error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hủy đơn hàng: ' + error.message
        });
    }
};

// ============================================
// ADMIN: XÁC NHẬN ĐƠN HÀNG (GIẢM SỐ LƯỢNG MÃ GIẢM GIÁ)
// ============================================
export const confirmBooking = async (req, res) => {
    const transaction = await DonDatTour.sequelize.transaction();

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
            await transaction.rollback();
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy đơn hàng'
            });
        }

        if (booking.trang_thai_don_hang !== 'Chờ xác nhận') {
            await transaction.rollback();
            return res.status(400).json({
                success: false,
                message: 'Đơn hàng không ở trạng thái chờ xác nhận'
            });
        }

        const nhanVien = await NhanVien.findOne({
            where: { ma_nguoi_dung: req.user.ma_nguoi_dung },
            transaction
        });

        await booking.update({
            trang_thai_don_hang: 'Đã xác nhận',
            ma_nhan_vien_phu_trach: nhanVien ? nhanVien.ma_nhan_vien : null
        }, { transaction });

        // ⭐ GIẢM SỐ LƯỢNG MÃ GIẢM GIÁ KHI XÁC NHẬN ĐƠN HÀNG
        if (booking.ma_giam_gia) {
            const maGiamGia = await MaGiamGia.findByPk(booking.ma_giam_gia, { transaction });
            if (maGiamGia) {
                await maGiamGia.update({
                    so_luong_da_dung: maGiamGia.so_luong_da_dung + 1
                }, { transaction });
                console.log('✅ Đã giảm số lượng mã giảm giá khi xác nhận đơn hàng');
            }
        }

        await transaction.commit();

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
        if (transaction && transaction.finished === undefined) {
            await transaction.rollback();
        }
        console.error('Confirm booking error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi xác nhận đơn hàng: ' + error.message
        });
    }
};
// ============================================
// KHÁCH HÀNG: YÊU CẦU HOÀN TIỀN (SỬA LỖI)
// ============================================
export const requestRefund = async (req, res) => {
    try {
        const {
            ma_don_hang,
            phuong_thuc,
            ten_ngan_hang,
            so_tai_khoan,
            chu_tai_khoan,
            chi_nhanh,
            so_dien_thoai,
            ghi_chu,
            so_tien_hoan
        } = req.body;

        const ma_nguoi_dung = req.user.ma_nguoi_dung;

        console.log('========================================');
        console.log('📝 REQUEST REFUND - Order ID:', ma_don_hang);
        console.log('📝 Method:', phuong_thuc);
        console.log('========================================');

        const booking = await DonDatTour.findByPk(ma_don_hang, {
            include: [
                {
                    model: NguoiDung,
                    as: 'nguoiDung',
                    attributes: ['ho_ten', 'email']
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

        if (booking.ma_nguoi_dung !== ma_nguoi_dung) {
            return res.status(403).json({
                success: false,
                message: 'Bạn không có quyền thực hiện thao tác này'
            });
        }

        if (booking.trang_thai_don_hang !== 'Đã hủy') {
            return res.status(400).json({
                success: false,
                message: 'Chỉ có thể yêu cầu hoàn tiền cho đơn hàng đã hủy'
            });
        }

        // ⭐ KIỂM TRA TRẠNG THÁI HOÀN TIỀN
        if (booking.hoan_tien && booking.hoan_tien === 'Đã yêu cầu') {
            return res.status(400).json({
                success: false,
                message: 'Bạn đã gửi yêu cầu hoàn tiền cho đơn hàng này, vui lòng chờ xử lý'
            });
        }

        if (booking.hoan_tien && booking.hoan_tien === 'Đã hoàn') {
            return res.status(400).json({
                success: false,
                message: 'Đơn hàng này đã được hoàn tiền'
            });
        }

        if (booking.hoan_tien && booking.hoan_tien === 'Từ chối') {
            return res.status(400).json({
                success: false,
                message: 'Yêu cầu hoàn tiền của bạn đã bị từ chối. Vui lòng liên hệ hỗ trợ để biết thêm chi tiết.'
            });
        }

        if (parseFloat(booking.so_tien_hoan || 0) <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Đơn hàng này không đủ điều kiện hoàn tiền'
            });
        }

        // ⭐ LƯU THÔNG TIN YÊU CẦU HOÀN TIỀN
        const thongTinHoanTien = {
            phuong_thuc,
            ten_ngan_hang: ten_ngan_hang || null,
            so_tai_khoan: so_tai_khoan || null,
            chu_tai_khoan: chu_tai_khoan || null,
            chi_nhanh: chi_nhanh || null,
            so_dien_thoai: so_dien_thoai || null,
            ghi_chu: ghi_chu || null,
            ngay_yeu_cau: new Date().toISOString()
        };

        // ⭐ CẬP NHẬT TRẠNG THÁI -> Đã yêu cầu
        await booking.update({
            hoan_tien: 'Đã yêu cầu',
            thong_tin_hoan_tien: thongTinHoanTien
        });

        console.log('✅ Updated refund status to: Đã yêu cầu');

        // Gửi email xác nhận
        try {
            await sendRefundRequestEmail(booking.nguoiDung.email, {
                ma_don_hang: booking.ma_don_hang,
                ten_tour: booking.lichKhoiHanh?.tour?.ten_tour || 'N/A',
                so_tien: booking.so_tien_hoan || 0,
                phuong_thuc: phuong_thuc === 'chuyen_khoan' ? 'Chuyển khoản ngân hàng' : 'Tiền mặt tại văn phòng',
                ngay_yeu_cau: new Date()
            });
            console.log('✅ Email sent to customer');
        } catch (emailError) {
            console.log('⚠️ Email không gửi được:', emailError.message);
        }

        res.json({
            success: true,
            message: 'Yêu cầu hoàn tiền đã được gửi. Chúng tôi sẽ xử lý trong vòng 3-5 ngày làm việc.',
            data: {
                ma_don_hang,
                so_tien_hoan: booking.so_tien_hoan || 0,
                phuong_thuc,
                trang_thai: 'Đã yêu cầu',
                ngay_yeu_cau: new Date().toISOString()
            }
        });

    } catch (error) {
        console.error('❌ requestRefund error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi gửi yêu cầu hoàn tiền: ' + error.message
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
// KHÁCH HÀNG: XÁC NHẬN THANH TOÁN TẠI VĂN PHÒNG
// ============================================
export const confirmOfflinePayment = async (req, res) => {
    try {
        const { id } = req.params;
        const ma_nguoi_dung = req.user.ma_nguoi_dung;

        console.log('📝 confirmOfflinePayment - Order ID:', id);

        const booking = await DonDatTour.findByPk(id, {
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

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy đơn hàng'
            });
        }

        if (booking.ma_nguoi_dung !== ma_nguoi_dung) {
            return res.status(403).json({
                success: false,
                message: 'Bạn không có quyền thực hiện thao tác này'
            });
        }

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

        const currentNote = booking.yeu_cau_dac_biet || '';
        const offlineNote = `[KHÁCH HÀNG CHỌN THANH TOÁN TẠI VĂN PHÒNG - ${new Date().toLocaleString('vi-VN')}]`;
        
        await booking.update({
            yeu_cau_dac_biet: currentNote ? `${currentNote}\n${offlineNote}` : offlineNote
        });

        res.json({
            success: true,
            message: 'Đã ghi nhận yêu cầu thanh toán tại văn phòng. Vui lòng đến văn phòng công ty để hoàn tất thanh toán.',
            data: {
                ma_don_hang: booking.ma_don_hang,
                trang_thai_don_hang: booking.trang_thai_don_hang,
                trang_thai_thanh_toan: booking.trang_thai_thanh_toan,
                tong_tien: booking.tong_tien,
                yeu_cau_dac_biet: booking.yeu_cau_dac_biet,
                thong_tin_cong_ty: {
                    dia_chi: '123 Đường ABC, Quận 1, TP.HCM',
                    gio_lam_viec: 'Thứ 2 - Thứ 7 (8:00 - 17:30)',
                    hotline: '1900 1234'
                }
            }
        });

    } catch (error) {
        console.error('❌ confirmOfflinePayment error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi ghi nhận thanh toán: ' + error.message
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
            distinct: true,
            attributes: [
                'ma_don_hang',
                'ma_nguoi_dung',
                'ma_lich_khoi_hanh',
                'ma_giam_gia',
                'ma_nhan_vien_phu_trach',
                'so_luong_nguoi_lon',
                'so_luong_tre_em',
                'thong_tin_khach',
                'yeu_cau_dac_biet',
                'tong_tien',
                'tien_coc',
                'tien_con_lai',
                'trang_thai_thanh_toan',
                'trang_thai_don_hang',
                'ly_do_huy',
                'ngay_dat',
                'ngay_tao',
                'ngay_cap_nhat',
                'hoan_tien',
                'thong_tin_hoan_tien',
                'so_tien_hoan'
            ],
            include: [
                {
                    model: LichKhoiHanh,
                    as: 'lichKhoiHanh',
                    attributes: ['ma_lich_khoi_hanh', 'ngay_khoi_hanh', 'gia_nguoi_lon', 'gia_tre_em', 'trang_thai'],
                    include: [
                        { 
                            model: Tour, 
                            as: 'tour',
                            attributes: ['ma_tour', 'ten_tour', 'diem_den', 'so_ngay', 'hinh_anh']
                        }
                    ]
                },
                {
                    model: NguoiDung,
                    as: 'nguoiDung',
                    attributes: ['ho_ten', 'email', 'so_dien_thoai']
                }
            ],
            order: [['ngay_dat', 'DESC']],
            limit: parseInt(limit),
            offset: parseInt(offset)
        });

        const bookingIds = bookings.rows.map(b => b.ma_don_hang);
        const payments = await ThanhToan.findAll({
            where: { ma_don_hang: bookingIds },
            order: [['ngay_tao', 'DESC']]
        });

        const result = bookings.rows.map(booking => {
            const bookingData = booking.toJSON();
            const payment = payments.find(p => p.ma_don_hang === booking.ma_don_hang);
            bookingData.thanhToan = payment || null;
            return bookingData;
        });

        res.json({
            success: true,
            data: {
                items: result,
                total: bookings.count,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(bookings.count / limit)
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
    let transaction;

    try {
        const { id } = req.params;
        const { so_luong_nguoi_lon, so_luong_tre_em, thong_tin_khach } = req.body;

        transaction = await DonDatTour.sequelize.transaction();

        const booking = await DonDatTour.findByPk(id, {
            include: [
                {
                    model: LichKhoiHanh,
                    as: 'lichKhoiHanh',
                    include: [{ model: Tour, as: 'tour' }]
                }
            ],
            transaction
        });

        if (!booking) {
            await transaction.rollback();
            throw new Error('Không tìm thấy đơn hàng');
        }

        if (req.user.ma_nguoi_dung !== booking.ma_nguoi_dung) {
            await transaction.rollback();
            throw new Error('Bạn không có quyền chỉnh sửa đơn hàng này');
        }

        if (booking.trang_thai_don_hang === 'Đã hủy') {
            await transaction.rollback();
            throw new Error('Đơn hàng đã bị hủy, không thể chỉnh sửa');
        }
        if (booking.trang_thai_don_hang === 'Đã hoàn thành') {
            await transaction.rollback();
            throw new Error('Đơn hàng đã hoàn thành, không thể chỉnh sửa');
        }
        if (booking.trang_thai_don_hang === 'Đang diễn ra') {
            await transaction.rollback();
            throw new Error('Tour đang diễn ra, không thể chỉnh sửa');
        }

        const schedule = booking.lichKhoiHanh;
        const now = new Date();
        const departureDate = new Date(schedule.ngay_khoi_hanh);
        const daysUntilDeparture = Math.ceil((departureDate - now) / (1000 * 60 * 60 * 24));

        if (daysUntilDeparture < 7) {
            await transaction.rollback();
            throw new Error(`Chỉ có thể chỉnh sửa đơn hàng trước 7 ngày khởi hành. Còn ${daysUntilDeparture} ngày.`);
        }

        const newAdultCount = parseInt(so_luong_nguoi_lon) || 0;
        const newChildCount = parseInt(so_luong_tre_em) || 0;
        const totalNewGuests = newAdultCount + newChildCount;

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
                await transaction.rollback();
                throw new Error(`Chỉ còn ${availableSeats} chỗ trống, không đủ để thêm ${diffGuests} khách`);
            }
        }

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

        const updateData = {
            so_luong_nguoi_lon: newAdultCount,
            so_luong_tre_em: newChildCount,
            tong_tien: newTotal,
            tien_coc: newTotal * 0.3,
            tien_con_lai: newTotal * 0.7
        };

        if (thong_tin_khach && Array.isArray(thong_tin_khach) && thong_tin_khach.length > 0) {
            updateData.thong_tin_khach = thong_tin_khach;
        }

        await booking.update(updateData, { transaction });

        await LichKhoiHanh.update(
            { 
                so_chot_da_dat: currentBooked + diffGuests,
                trang_thai: totalSeats === currentBooked + diffGuests ? 'Hết chỗ' : 'Còn chỗ'
            },
            { where: { ma_lich_khoi_hanh: schedule.ma_lich_khoi_hanh }, transaction }
        );

        await transaction.commit();

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
        if (transaction && transaction.finished === undefined) {
            await transaction.rollback();
        }
        console.error('Update booking by customer error:', error);
        res.status(400).json({
            success: false,
            message: error.message || 'Lỗi cập nhật đơn hàng'
        });
    }
};

// ============================================
// ADMIN: LẤY DANH SÁCH YÊU CẦU HOÀN TIỀN
// ============================================
export const getRefundRequests = async (req, res) => {
    try {
        const { page = 1, limit = 20, status, search } = req.query;
        const offset = (page - 1) * limit;

        const where = {
            trang_thai_don_hang: 'Đã hủy',
            hoan_tien: {
                [Op.ne]: 'Chưa yêu cầu'  // Lấy tất cả trừ Chưa yêu cầu
            }
        };

        // ⭐ LỌC THEO STATUS - HỖ TRỢ CẢ 'Từ chối'
        if (status) {
            where.hoan_tien = status;
        }

        // ⭐ TÌM KIẾM
        if (search) {
            where[Op.or] = [
                { '$nguoiDung.ho_ten$': { [Op.like]: `%${search}%` } },
                { '$nguoiDung.email$': { [Op.like]: `%${search}%` } },
                { ma_don_hang: { [Op.like]: `%${search}%` } }
            ];
        }

        // ⭐ THÊM LOG ĐỂ DEBUG
        console.log('📊 getRefundRequests - where:', JSON.stringify(where, null, 2));

        const refunds = await DonDatTour.findAndCountAll({
            where,
            distinct: true,
            attributes: [
                'ma_don_hang',
                'ma_nguoi_dung',
                'tong_tien',
                'so_tien_hoan',
                'hoan_tien',
                'thong_tin_hoan_tien',
                'ly_do_huy',
                'ngay_dat',
                'ngay_cap_nhat'
            ],
            include: [
                {
                    model: NguoiDung,
                    as: 'nguoiDung',
                    attributes: ['ho_ten', 'email', 'so_dien_thoai', 'anh_dai_dien']
                },
                {
                    model: LichKhoiHanh,
                    as: 'lichKhoiHanh',
                    attributes: ['ngay_khoi_hanh'],
                    include: [
                        { 
                            model: Tour, 
                            as: 'tour',
                            attributes: ['ten_tour', 'diem_den']
                        }
                    ]
                }
            ],
            order: [['ngay_cap_nhat', 'DESC']],
            limit: parseInt(limit),
            offset: parseInt(offset)
        });

        // ⭐ THỐNG KÊ
        const totalRefundAmount = await DonDatTour.sum('so_tien_hoan', {
            where: {
                trang_thai_don_hang: 'Đã hủy',
                hoan_tien: 'Đã hoàn'
            }
        });

        const pendingCount = await DonDatTour.count({
            where: {
                trang_thai_don_hang: 'Đã hủy',
                hoan_tien: 'Đã yêu cầu'
            }
        });

        // ⭐ LOG KẾT QUẢ
        console.log('📊 getRefundRequests - found:', refunds.count);
        console.log('📊 getRefundRequests - statuses:', refunds.rows.map(r => r.hoan_tien));

        res.json({
            success: true,
            data: {
                items: refunds.rows,
                total: refunds.count,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(refunds.count / limit),
                stats: {
                    total_refund_amount: totalRefundAmount || 0,
                    pending_count: pendingCount,
                    total_requests: refunds.count
                }
            }
        });
    } catch (error) {
        console.error('Get refund requests error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi lấy danh sách hoàn tiền: ' + error.message
        });
    }
};
// ============================================
// ADMIN: XEM CHI TIẾT YÊU CẦU HOÀN TIỀN (SỬA LỖI)
// ============================================
export const getRefundDetail = async (req, res) => {
    try {
        const { id } = req.params;

        // ⭐ KIỂM TRA ID HỢP LỆ
        if (!id || isNaN(parseInt(id))) {
            return res.status(400).json({
                success: false,
                message: 'ID đơn hàng không hợp lệ'
            });
        }

        const refund = await DonDatTour.findByPk(parseInt(id), {
            attributes: [
                'ma_don_hang',
                'ma_nguoi_dung',
                'tong_tien',
                'so_tien_hoan',
                'hoan_tien',
                'thong_tin_hoan_tien',
                'ly_do_huy',
                'ngay_dat',
                'ngay_cap_nhat',
                'trang_thai_thanh_toan'
            ],
            include: [
                {
                    model: NguoiDung,
                    as: 'nguoiDung',
                    attributes: ['ma_nguoi_dung', 'ho_ten', 'email', 'so_dien_thoai', 'anh_dai_dien']
                },
                {
                    model: LichKhoiHanh,
                    as: 'lichKhoiHanh',
                    attributes: ['ngay_khoi_hanh', 'ma_tour'],
                    include: [
                        { 
                            model: Tour, 
                            as: 'tour',
                            attributes: ['ma_tour', 'ten_tour', 'diem_den', 'so_ngay']
                        }
                    ]
                },
                {
                    model: ThanhToan,
                    as: 'thanhToan',
                    attributes: ['ma_thanh_toan', 'so_tien', 'phuong_thuc', 'ma_giao_dich', 'ngay_thanh_toan', 'trang_thai']
                }
            ]
        });

        if (!refund) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy yêu cầu hoàn tiền'
            });
        }

        // ⭐ KIỂM TRA ĐIỀU KIỆN HOÀN TIỀN
        if (refund.trang_thai_don_hang !== 'Đã hủy') {
            return res.status(400).json({
                success: false,
                message: 'Đơn hàng chưa được hủy, không có yêu cầu hoàn tiền'
            });
        }

        // ⭐ KIỂM TRA NẾU CHƯA CÓ YÊU CẦU HOÀN TIỀN
        if (!refund.thong_tin_hoan_tien) {
            return res.status(400).json({
                success: false,
                message: 'Đơn hàng này chưa có yêu cầu hoàn tiền'
            });
        }

        // ⭐ CHUYỂN ĐỔI DỮ LIỆU JSON ĐỂ HIỂN THỊ ĐẦY ĐỦ
        const refundData = refund.toJSON();
        
        // ⭐ ĐẢM BẢO thong_tin_hoan_tien LÀ OBJECT
        if (typeof refundData.thong_tin_hoan_tien === 'string') {
            try {
                refundData.thong_tin_hoan_tien = JSON.parse(refundData.thong_tin_hoan_tien);
            } catch (e) {
                refundData.thong_tin_hoan_tien = {};
            }
        }

        // ⭐ THÊM THÔNG TIN BỔ SUNG CHO DỄ HIỂN THỊ
        if (refundData.thong_tin_hoan_tien) {
            if (refundData.thong_tin_hoan_tien.phuong_thuc === 'chuyen_khoan') {
                refundData.thong_tin_hoan_tien.phuong_thuc_label = 'Chuyển khoản ngân hàng';
            } else if (refundData.thong_tin_hoan_tien.phuong_thuc === 'tien_mat') {
                refundData.thong_tin_hoan_tien.phuong_thuc_label = 'Tiền mặt tại văn phòng';
            } else {
                refundData.thong_tin_hoan_tien.phuong_thuc_label = refundData.thong_tin_hoan_tien.phuong_thuc || 'Chưa xác định';
            }
        }

        // ⭐ LOG ĐỂ DEBUG
        console.log('📊 Refund detail response:', {
            ma_don_hang: refundData.ma_don_hang,
            hoan_tien: refundData.hoan_tien,
            so_tien_hoan: refundData.so_tien_hoan,
            thong_tin_hoan_tien: refundData.thong_tin_hoan_tien
        });

        res.json({
            success: true,
            data: refundData
        });
    } catch (error) {
        console.error('Get refund detail error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi lấy chi tiết hoàn tiền: ' + error.message
        });
    }
};
// ============================================
// ADMIN: XÁC NHẬN HOÀN TIỀN
// ============================================
export const approveRefund = async (req, res) => {
    const transaction = await DonDatTour.sequelize.transaction();

    try {
        const { id } = req.params;
        const { ghi_chu_admin } = req.body;

        console.log('========================================');
        console.log('📝 APPROVE REFUND - Order ID:', id);
        console.log('📝 Note:', ghi_chu_admin);
        console.log('========================================');

        const booking = await DonDatTour.findByPk(id, {
            include: [
                {
                    model: NguoiDung,
                    as: 'nguoiDung',
                    attributes: ['ho_ten', 'email']
                },
                {
                    model: LichKhoiHanh,
                    as: 'lichKhoiHanh',
                    include: [{ model: Tour, as: 'tour' }]
                }
            ]
        });

        if (!booking) {
            await transaction.rollback();
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy đơn hàng'
            });
        }

        if (booking.trang_thai_don_hang !== 'Đã hủy') {
            await transaction.rollback();
            return res.status(400).json({
                success: false,
                message: 'Đơn hàng chưa được hủy'
            });
        }

        if (booking.hoan_tien !== 'Đã yêu cầu') {
            await transaction.rollback();
            return res.status(400).json({
                success: false,
                message: 'Đơn hàng này chưa có yêu cầu hoàn tiền hoặc đã được xử lý'
            });
        }

        // ⭐ LƯU THÔNG TIN DUYỆT
        const currentRefundInfo = booking.thong_tin_hoan_tien || {};
        
        const thongTinHoanTien = {
            ...currentRefundInfo,
            duyet_bởi: req.user.ma_nguoi_dung,
            ngay_duyet: new Date().toISOString(),
            ghi_chu_admin: ghi_chu_admin || null
        };

        // ⭐ CẬP NHẬT TRẠNG THÁI -> Đã hoàn
        await booking.update({
            hoan_tien: 'Đã hoàn',
            thong_tin_hoan_tien: thongTinHoanTien
        }, { transaction });

        const thanhToan = await ThanhToan.findOne({
            where: { ma_don_hang: booking.ma_don_hang },
            order: [['ngay_tao', 'DESC']],
            transaction
        });

        if (thanhToan) {
            await thanhToan.update({
                trang_thai: 'Đã hoàn tiền',
                thong_tin: {
                    ...thanhToan.thong_tin,
                    refund_approved_at: new Date().toISOString(),
                    refund_approved_by: req.user.ma_nguoi_dung,
                    refund_note: ghi_chu_admin || null
                }
            }, { transaction });
        }

        await transaction.commit();

        console.log('✅ Updated refund status to: Đã hoàn');

        try {
            await sendRefundApprovedEmail(booking.nguoiDung.email, {
                ma_don_hang: booking.ma_don_hang,
                ten_tour: booking.lichKhoiHanh.tour.ten_tour,
                so_tien: booking.so_tien_hoan,
                phuong_thuc: booking.thong_tin_hoan_tien?.phuong_thuc || 'Chuyển khoản'
            });
            console.log('✅ Email sent to customer');
        } catch (emailError) {
            console.log('⚠️ Email không gửi được:', emailError.message);
        }

        res.json({
            success: true,
            message: 'Xác nhận hoàn tiền thành công',
            data: {
                ma_don_hang: booking.ma_don_hang,
                so_tien_hoan: booking.so_tien_hoan,
                trang_thai: 'Đã hoàn',
                ngay_duyet: new Date().toISOString()
            }
        });

    } catch (error) {
        if (transaction && transaction.finished === undefined) {
            await transaction.rollback();
        }
        console.error('❌ Approve refund error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi xác nhận hoàn tiền: ' + error.message
        });
    }
};
// ============================================
// ADMIN: TỪ CHỐI HOÀN TIỀN (SỬA LỖI - BẢN FULL)
// ============================================
export const rejectRefund = async (req, res) => {
    const transaction = await DonDatTour.sequelize.transaction();

    try {
        const { id } = req.params;
        const { ly_do_tu_choi } = req.body;

        console.log('========================================');
        console.log('📝 REJECT REFUND - Order ID:', id);
        console.log('📝 Reason:', ly_do_tu_choi);
        console.log('========================================');

        // ⭐ KIỂM TRA ID HỢP LỆ
        if (!id || isNaN(parseInt(id))) {
            await transaction.rollback();
            return res.status(400).json({
                success: false,
                message: 'ID đơn hàng không hợp lệ'
            });
        }

        // ⭐ KIỂM TRA LÝ DO TỪ CHỐI
        if (!ly_do_tu_choi || !ly_do_tu_choi.trim()) {
            await transaction.rollback();
            return res.status(400).json({
                success: false,
                message: 'Vui lòng nhập lý do từ chối'
            });
        }

        // ⭐ LẤY ĐƠN HÀNG VỚI TRANSACTION
        const booking = await DonDatTour.findByPk(parseInt(id), {
            include: [
                {
                    model: NguoiDung,
                    as: 'nguoiDung',
                    attributes: ['ho_ten', 'email']
                },
                {
                    model: LichKhoiHanh,
                    as: 'lichKhoiHanh',
                    include: [{ model: Tour, as: 'tour' }]
                }
            ],
            transaction
        });

        if (!booking) {
            await transaction.rollback();
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy đơn hàng'
            });
        }

        console.log('📊 Current booking status:', {
            ma_don_hang: booking.ma_don_hang,
            trang_thai_don_hang: booking.trang_thai_don_hang,
            hoan_tien: booking.hoan_tien,
            so_tien_hoan: booking.so_tien_hoan,
            thong_tin_hoan_tien: booking.thong_tin_hoan_tien
        });

        // ⭐ KIỂM TRA ĐƠN HÀNG ĐÃ HỦY CHƯA
        if (booking.trang_thai_don_hang !== 'Đã hủy') {
            await transaction.rollback();
            return res.status(400).json({
                success: false,
                message: 'Đơn hàng chưa được hủy'
            });
        }

        // ⭐ KIỂM TRA TRẠNG THÁI HOÀN TIỀN
        if (booking.hoan_tien === 'Từ chối') {
            await transaction.rollback();
            return res.status(400).json({
                success: false,
                message: 'Đơn hàng này đã bị từ chối trước đó'
            });
        }

        if (booking.hoan_tien === 'Đã hoàn') {
            await transaction.rollback();
            return res.status(400).json({
                success: false,
                message: 'Đơn hàng này đã được hoàn tiền'
            });
        }

        if (booking.hoan_tien !== 'Đã yêu cầu') {
            await transaction.rollback();
            return res.status(400).json({
                success: false,
                message: 'Đơn hàng này chưa có yêu cầu hoàn tiền'
            });
        }

        // ⭐ LƯU SỐ TIỀN YÊU CẦU BAN ĐẦU VÀO thong_tin_hoan_tien
        const soTienYeuCau = parseFloat(booking.so_tien_hoan || 0);
        
        // Lấy thông tin hiện tại
        let currentRefundInfo = {};
        if (booking.thong_tin_hoan_tien) {
            try {
                currentRefundInfo = typeof booking.thong_tin_hoan_tien === 'string' 
                    ? JSON.parse(booking.thong_tin_hoan_tien) 
                    : booking.thong_tin_hoan_tien;
            } catch (e) {
                currentRefundInfo = {};
            }
        }
        
        const thongTinHoanTien = {
            // ⭐ GIỮ NGUYÊN THÔNG TIN CŨ
            phuong_thuc: currentRefundInfo.phuong_thuc || 'chuyen_khoan',
            ten_ngan_hang: currentRefundInfo.ten_ngan_hang || null,
            so_tai_khoan: currentRefundInfo.so_tai_khoan || null,
            chu_tai_khoan: currentRefundInfo.chu_tai_khoan || null,
            chi_nhanh: currentRefundInfo.chi_nhanh || null,
            so_dien_thoai: currentRefundInfo.so_dien_thoai || null,
            ghi_chu: currentRefundInfo.ghi_chu || null,
            ngay_yeu_cau: currentRefundInfo.ngay_yeu_cau || new Date().toISOString(),
            // ⭐ LƯU SỐ TIỀN YÊU CẦU BAN ĐẦU
            so_tien_yeu_cau: soTienYeuCau,
            // ⭐ THÊM THÔNG TIN TỪ CHỐI
            tu_choi_bởi: req.user.ma_nguoi_dung,
            ngay_tu_choi: new Date().toISOString(),
            ly_do_tu_choi: ly_do_tu_choi.trim()
        };

        console.log('📊 Refund info to save:', thongTinHoanTien);

        // ⭐ CẬP NHẬT ĐƠN HÀNG - SET so_tien_hoan = 0 NHƯNG ĐÃ LƯU SỐ TIỀN YÊU CẦU VÀO JSON
        await booking.update({
            hoan_tien: 'Từ chối',
            thong_tin_hoan_tien: thongTinHoanTien,
            so_tien_hoan: 0
        }, { transaction });

        // ⭐ LOG SAU KHI CẬP NHẬT
        console.log('✅ Updated booking:', {
            ma_don_hang: booking.ma_don_hang,
            hoan_tien: 'Từ chối',
            so_tien_hoan: 0,
            thong_tin_hoan_tien: thongTinHoanTien
        });

        // ⭐ CẬP NHẬT THANH TOÁN NẾU CÓ
        const thanhToan = await ThanhToan.findOne({
            where: { ma_don_hang: booking.ma_don_hang },
            order: [['ngay_tao', 'DESC']],
            transaction
        });

        if (thanhToan) {
            await thanhToan.update({
                trang_thai: 'Đã hủy',
                thong_tin: {
                    ...thanhToan.thong_tin,
                    refund_rejected_at: new Date().toISOString(),
                    refund_rejected_by: req.user.ma_nguoi_dung,
                    refund_reject_reason: ly_do_tu_choi.trim()
                }
            }, { transaction });
        }

        await transaction.commit();

        // ⭐ LẤY LẠI DỮ LIỆU SAU KHI CẬP NHẬT ĐỂ TRẢ VỀ
        const updatedBooking = await DonDatTour.findByPk(parseInt(id), {
            include: [
                {
                    model: NguoiDung,
                    as: 'nguoiDung',
                    attributes: ['ho_ten', 'email']
                }
            ]
        });

        console.log('✅ Final refund status:', {
            ma_don_hang: updatedBooking.ma_don_hang,
            hoan_tien: updatedBooking.hoan_tien,
            so_tien_hoan: updatedBooking.so_tien_hoan,
            thong_tin_hoan_tien: updatedBooking.thong_tin_hoan_tien
        });

        // Gửi email thông báo từ chối
        try {
            await sendRefundRejectedEmail(booking.nguoiDung.email, {
                ma_don_hang: booking.ma_don_hang,
                ten_tour: booking.lichKhoiHanh?.tour?.ten_tour || 'N/A',
                ly_do_tu_choi: ly_do_tu_choi.trim()
            });
            console.log('✅ Email sent to customer');
        } catch (emailError) {
            console.log('⚠️ Email không gửi được:', emailError.message);
        }

        res.json({
            success: true,
            message: 'Từ chối hoàn tiền thành công',
            data: {
                ma_don_hang: booking.ma_don_hang,
                hoan_tien: 'Từ chối',
                so_tien_hoan: 0,
                so_tien_yeu_cau: soTienYeuCau,
                ly_do_tu_choi: ly_do_tu_choi.trim(),
                ngay_tu_choi: new Date().toISOString()
            }
        });

    } catch (error) {
        if (transaction && transaction.finished === undefined) {
            await transaction.rollback();
        }
        console.error('❌ Reject refund error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi từ chối hoàn tiền: ' + error.message
        });
    }
};
// ============================================
// ADMIN: THỐNG KÊ HOÀN TIỀN
// ============================================
export const getRefundStats = async (req, res) => {
    try {
        const { start_date, end_date } = req.query;

        const where = {
            trang_thai_don_hang: 'Đã hủy'
        };

        if (start_date || end_date) {
            where.ngay_cap_nhat = {};
            if (start_date) where.ngay_cap_nhat[Op.gte] = new Date(start_date);
            if (end_date) where.ngay_cap_nhat[Op.lte] = new Date(end_date);
        }

        const totalRefunded = await DonDatTour.sum('so_tien_hoan', {
            where: {
                ...where,
                hoan_tien: 'Đã hoàn'
            }
        });

        const totalPending = await DonDatTour.sum('so_tien_hoan', {
            where: {
                ...where,
                hoan_tien: 'Đã yêu cầu'
            }
        });

        const stats = await DonDatTour.findAll({
            attributes: [
                'hoan_tien',
                [sequelize.fn('COUNT', sequelize.col('ma_don_hang')), 'count'],
                [sequelize.fn('SUM', sequelize.col('so_tien_hoan')), 'total_amount']
            ],
            where,
            group: ['hoan_tien']
        });

        const monthlyStats = await DonDatTour.findAll({
            attributes: [
                [sequelize.fn('DATE_FORMAT', sequelize.col('ngay_cap_nhat'), '%Y-%m'), 'month'],
                [sequelize.fn('COUNT', sequelize.col('ma_don_hang')), 'count'],
                [sequelize.fn('SUM', sequelize.col('so_tien_hoan')), 'total_amount']
            ],
            where: {
                ...where,
                hoan_tien: 'Đã hoàn'
            },
            group: [sequelize.fn('DATE_FORMAT', sequelize.col('ngay_cap_nhat'), '%Y-%m')],
            order: [[sequelize.literal('month'), 'DESC']],
            limit: 12
        });

        res.json({
            success: true,
            data: {
                total_refunded: totalRefunded || 0,
                total_pending: totalPending || 0,
                stats_by_status: stats.map(item => ({
                    status: item.hoan_tien,
                    count: parseInt(item.dataValues.count || 0),
                    total_amount: parseFloat(item.dataValues.total_amount || 0)
                })),
                monthly_stats: monthlyStats.map(item => ({
                    month: item.dataValues.month,
                    count: parseInt(item.dataValues.count || 0),
                    total_amount: parseFloat(item.dataValues.total_amount || 0)
                }))
            }
        });
    } catch (error) {
        console.error('Get refund stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi lấy thống kê hoàn tiền: ' + error.message
        });
    }
};