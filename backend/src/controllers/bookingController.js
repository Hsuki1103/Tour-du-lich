import {
    DonDatTour,
    LichKhoiHanh,
    Tour,
    NguoiDung,
    NhanVien,
    MaGiamGia,
    ThanhToan,
    VaiTro,
    DanhGia
} from '../models/index.js';
import { sendBookingConfirmation, sendCancellationEmail } from '../utils/emailService.js';
import { generateVoucherPDF } from '../utils/pdfService.js';
import { Op } from 'sequelize';
import fs from 'fs';

// ============================================
// LẤY DANH SÁCH ĐƠN HÀNG CỦA USER (FIX TRÙNG LẶP)
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

        // ⭐ CÁCH 1: CHỈ LẤY ĐƠN HÀNG, KHÔNG JOIN THANH TOÁN
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
                'ngay_cap_nhat'
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

        // ⭐ LẤY THANH TOÁN VÀ MÃ GIẢM GIÁ RIÊNG (KHÔNG JOIN)
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

        // ⭐ GHÉP DỮ LIỆU THỦ CÔNG (KHÔNG BỊ TRÙNG)
        const result = bookings.rows.map(booking => {
            const bookingData = booking.toJSON();
            
            // Tìm thanh toán
            const payment = payments.find(p => p.ma_don_hang === booking.ma_don_hang);
            bookingData.thanhToan = payment || null;
            
            // Tìm mã giảm giá
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

        // Kiểm tra đơn hàng đã tồn tại
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
            ly_do_huy: ly_do || (req.user.ma_nguoi_dung === booking.ma_nguoi_dung ? 'Khách hàng hủy' : 'Admin hủy')
        }, { transaction });

        const totalGuests = booking.so_luong_nguoi_lon + booking.so_luong_tre_em;
        await LichKhoiHanh.update(
            { 
                so_chot_da_dat: schedule.so_chot_da_dat - totalGuests,
                trang_thai: 'Còn chỗ'
            },
            { where: { ma_lich_khoi_hanh: schedule.ma_lich_khoi_hanh }, transaction }
        );

        if (booking.trang_thai_thanh_toan !== 'Chưa thanh toán') {
            const thanhToan = await ThanhToan.findOne({
                where: { ma_don_hang: booking.ma_don_hang },
                order: [['ngay_tao', 'DESC']]
            });

            if (thanhToan) {
                await thanhToan.update({
                    trang_thai: 'Đã hoàn tiền',
                    thong_tin: {
                        ...thanhToan.thong_tin,
                        refund_amount: soTienHoanLai,
                        refund_percentage: refundPercentage,
                        cancelled_at: new Date().toISOString()
                    }
                }, { transaction });
            }
        }

        await transaction.commit();

        try {
            const user = await NguoiDung.findByPk(booking.ma_nguoi_dung);
            await sendCancellationEmail(user.email, {
                ma_don_hang: booking.ma_don_hang,
                ten_tour: schedule.tour.ten_tour,
                ly_do_huy: booking.ly_do_huy,
                so_tien_hoan_lai: soTienHoanLai,
                refund_percentage: refundPercentage
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
                ly_do_huy: booking.ly_do_huy
            }
        });

    } catch (error) {
        if (transaction && transaction.finished !== 'commit') {
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
                'ngay_cap_nhat'
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

        // Lấy thanh toán riêng
        const bookingIds = bookings.rows.map(b => b.ma_don_hang);
        const payments = await ThanhToan.findAll({
            where: { ma_don_hang: bookingIds },
            order: [['ngay_tao', 'DESC']]
        });

        // Ghép dữ liệu
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
// ADMIN: XÁC NHẬN ĐƠN HÀNG
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
        if (transaction && transaction.finished !== 'commit') {
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

        await booking.update({
            so_luong_nguoi_lon: newAdultCount,
            so_luong_tre_em: newChildCount,
            tong_tien: newTotal,
            tien_coc: newTotal * 0.3,
            tien_con_lai: newTotal * 0.7
        }, { transaction });

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