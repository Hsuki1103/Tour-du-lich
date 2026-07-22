import { DonDatTour, ThanhToan, LichKhoiHanh, Tour, NguoiDung, VaiTro } from '../models/index.js';
import { createVNPayPayment as createVNPayPaymentService, verifyVNPayReturn } from '../utils/vnpayService.js';
import { sendPaymentConfirmation } from '../utils/emailService.js';
import { generateVoucherPDF } from '../utils/pdfService.js';

// ============================================
// TẠO THANH TOÁN VNPAY
// ============================================
export const createVNPayPayment = async (req, res) => {
    try {
        const { ma_don_hang, phuong_thuc_thanh_toan, qr_code } = req.body;

        console.log('========================================');
        console.log('💳 Creating VNPay payment');
        console.log('📦 Order ID:', ma_don_hang);
        console.log('📦 Payment method:', phuong_thuc_thanh_toan);
        console.log('📱 QR Code:', qr_code ? 'YES' : 'NO');
        console.log('========================================');

        // Kiểm tra biến môi trường
        console.log('🔑 VNP_TMN_CODE:', process.env.VNP_TMN_CODE || '❌ MISSING');
        console.log('🔑 VNP_HASH_SECRET:', process.env.VNP_HASH_SECRET ? '✅ SET' : '❌ MISSING');

        if (!process.env.VNP_TMN_CODE || !process.env.VNP_HASH_SECRET) {
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

        // Kiểm tra trạng thái
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

        // Tính tiền
        let soTienCanThanhToan;
        if (phuong_thuc_thanh_toan === 'coc') {
            soTienCanThanhToan = parseFloat(booking.tien_coc);
        } else if (phuong_thuc_thanh_toan === 'full') {
            soTienCanThanhToan = parseFloat(booking.tong_tien);
        } else {
            return res.status(400).json({
                success: false,
                message: 'Phương thức thanh toán không hợp lệ'
            });
        }

        if (!soTienCanThanhToan || soTienCanThanhToan <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Số tiền thanh toán không hợp lệ'
            });
        }

        console.log('💰 Amount:', soTienCanThanhToan);

        // Tạo thanh toán VNPAY
        const paymentResult = createVNPayPaymentService({
            ma_don_hang: booking.ma_don_hang,
            so_tien: soTienCanThanhToan,
            ip_address: req.ip || req.connection.remoteAddress || '127.0.0.1',
            qr_code: qr_code || false
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
            phuong_thuc: qr_code ? 'VNPayQR' : 'VNPay',
            trang_thai: 'Chờ thanh toán',
            ma_giao_dich: paymentResult.vnp_Params.vnp_TxnRef,
            thong_tin: {
                ...paymentResult.vnp_Params,
                qr_code: qr_code || false
            }
        });

        console.log('✅ Payment URL created successfully');

        res.json({
            success: true,
            data: {
                payment_url: paymentResult.paymentUrl,
                qr_payment_url: paymentResult.qrPaymentUrl || null,
                ma_don_hang: booking.ma_don_hang,
                so_tien: soTienCanThanhToan,
                is_qr: qr_code || false
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
// XỬ LÝ IPN TỪ VNPAY
// ============================================
export const handleVNPayIPN = async (req, res) => {
    try {
        const queryParams = req.query;
        console.log('📥 VNPay IPN received:', queryParams);
        console.log('📥 IPN - Full URL:', req.originalUrl);

        // Kiểm tra chữ ký
        const result = verifyVNPayReturn(queryParams);
        console.log('📥 IPN - Verify result:', result);

        if (!result.success) {
            console.error('❌ IPN verification failed:', result.message);
            return res.status(200).json({ RspCode: '97', Message: 'Verification failed' });
        }

        const { vnp_TxnRef, vnp_Amount, vnp_ResponseCode, vnp_PayDate } = result.data;
        console.log('📊 IPN - Order:', vnp_TxnRef);
        console.log('📊 IPN - Response Code:', vnp_ResponseCode);
        console.log('📊 IPN - Amount:', vnp_Amount);

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
            console.error('❌ IPN: Booking not found:', vnp_TxnRef);
            return res.status(200).json({ RspCode: '02', Message: 'Order not found' });
        }

        console.log('📊 IPN - Current status:', booking.trang_thai_thanh_toan);
        console.log('📊 IPN - Total:', booking.tong_tien);
        console.log('📊 IPN - Deposit:', booking.tien_coc);

        // Kiểm tra tránh cập nhật trùng
        if (booking.trang_thai_thanh_toan === 'Đã thanh toán') {
            console.log('✅ IPN: Order already paid:', vnp_TxnRef);
            return res.status(200).json({ RspCode: '00', Message: 'Confirm Success' });
        }

        // Xử lý kết quả
        if (vnp_ResponseCode === '00') {
            const soTienDaThanhToan = parseInt(vnp_Amount) / 100;
            console.log('💰 IPN - Amount paid:', soTienDaThanhToan);

            // Tìm hoặc tạo thanh toán
            let thanhToan = await ThanhToan.findOne({
                where: { ma_don_hang: booking.ma_don_hang },
                order: [['ngay_tao', 'DESC']]
            });

            if (!thanhToan) {
                console.log('📊 IPN - Creating new payment record');
                thanhToan = await ThanhToan.create({
                    ma_don_hang: booking.ma_don_hang,
                    so_tien: soTienDaThanhToan,
                    phuong_thuc: 'VNPay',
                    trang_thai: 'Đã thanh toán',
                    ma_giao_dich: vnp_TxnRef,
                    ngay_thanh_toan: new Date(vnp_PayDate),
                    thong_tin: {
                        ipn_response: queryParams,
                        ipn_processed_at: new Date().toISOString()
                    }
                });
                console.log('✅ IPN: Created payment record');
            } else {
                console.log('📊 IPN - Updating existing payment record');
                await thanhToan.update({
                    trang_thai: 'Đã thanh toán',
                    ngay_thanh_toan: new Date(vnp_PayDate),
                    thong_tin: {
                        ...thanhToan.thong_tin,
                        ipn_response: queryParams,
                        ipn_processed_at: new Date().toISOString()
                    }
                });
                console.log('✅ IPN: Updated payment record');
            }

            // Xác định trạng thái
            let trangThaiThanhToan = 'Đã thanh toán';
            let trangThaiDonHang = 'Đã xác nhận';
            
            if (soTienDaThanhToan < booking.tong_tien) {
                trangThaiThanhToan = 'Đã đặt cọc';
                trangThaiDonHang = 'Chờ xác nhận';
            }

            console.log('📊 IPN - New payment status:', trangThaiThanhToan);
            console.log('📊 IPN - New order status:', trangThaiDonHang);
            console.log('📊 IPN - Remaining:', booking.tong_tien - soTienDaThanhToan);

            // Cập nhật đơn hàng
            await booking.update({
                trang_thai_thanh_toan: trangThaiThanhToan,
                tien_con_lai: booking.tong_tien - soTienDaThanhToan,
                trang_thai_don_hang: trangThaiDonHang
            });

            console.log(`✅ IPN: Order ${vnp_TxnRef} updated successfully!`);
            console.log(`   Payment: ${trangThaiThanhToan}`);
            console.log(`   Order: ${trangThaiDonHang}`);
            console.log(`   Remaining: ${booking.tong_tien - soTienDaThanhToan}`);

            // Gửi email xác nhận
            try {
                await sendPaymentConfirmation(booking.nguoiDung.email, {
                    ma_don_hang: booking.ma_don_hang,
                    ten_tour: booking.lichKhoiHanh.tour.ten_tour,
                    so_tien: soTienDaThanhToan,
                    phuong_thuc: 'VNPay',
                    trang_thai: 'Thành công'
                });
                console.log('✅ IPN: Email sent');
            } catch (emailError) {
                console.log('⚠️ IPN: Email không gửi được');
            }

            return res.status(200).json({
                RspCode: '00',
                Message: 'Confirm Success'
            });

        } else {
            console.log(`❌ IPN: Payment failed for order ${vnp_TxnRef}, code: ${vnp_ResponseCode}`);
            
            let thanhToan = await ThanhToan.findOne({
                where: { ma_don_hang: booking.ma_don_hang },
                order: [['ngay_tao', 'DESC']]
            });

            if (thanhToan) {
                await thanhToan.update({
                    trang_thai: 'Thất bại',
                    thong_tin: {
                        ...thanhToan.thong_tin,
                        ipn_response: queryParams,
                        ipn_processed_at: new Date().toISOString()
                    }
                });
            }

            return res.status(200).json({
                RspCode: '00',
                Message: 'Confirm Success'
            });
        }

    } catch (error) {
        console.error('❌ IPN error:', error);
        return res.status(200).json({
            RspCode: '99',
            Message: 'Internal server error'
        });
    }
};

// ============================================
// XỬ LÝ RETURN URL - FALLBACK
// ============================================
export const handleVNPayReturn = async (req, res) => {
    try {
        const queryParams = req.query;
        console.log('📥 VNPay Return:', queryParams);

        const result = verifyVNPayReturn(queryParams);

        if (!result.success) {
            console.error('❌ Return verification failed:', result.message);
            return res.redirect(`${process.env.CLIENT_URL || 'http://localhost:3000'}/payment-result?status=failed&message=${encodeURIComponent(result.message)}`);
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

        console.log('📊 Return - Current status:', booking.trang_thai_thanh_toan);

        // Nếu IPN chưa xử lý, xử lý ở đây (FALLBACK)
        if (booking.trang_thai_thanh_toan === 'Chưa thanh toán' && vnp_ResponseCode === '00') {
            console.log('🔄 Return URL processing as fallback for order:', vnp_TxnRef);
            
            const soTienDaThanhToan = parseInt(vnp_Amount) / 100;
            console.log('💰 Return - Amount paid:', soTienDaThanhToan);

            // Tạo thanh toán
            let thanhToan = await ThanhToan.findOne({
                where: { ma_don_hang: booking.ma_don_hang },
                order: [['ngay_tao', 'DESC']]
            });

            if (!thanhToan) {
                thanhToan = await ThanhToan.create({
                    ma_don_hang: booking.ma_don_hang,
                    so_tien: soTienDaThanhToan,
                    phuong_thuc: 'VNPay',
                    trang_thai: 'Đã thanh toán',
                    ma_giao_dich: vnp_TxnRef,
                    ngay_thanh_toan: new Date(vnp_PayDate),
                    thong_tin: {
                        return_response: queryParams,
                        return_processed_at: new Date().toISOString()
                    }
                });
                console.log('✅ Return: Created payment record');
            } else {
                await thanhToan.update({
                    trang_thai: 'Đã thanh toán',
                    ngay_thanh_toan: new Date(vnp_PayDate),
                    thong_tin: {
                        ...thanhToan.thong_tin,
                        return_response: queryParams,
                        return_processed_at: new Date().toISOString()
                    }
                });
                console.log('✅ Return: Updated payment record');
            }

            // Xác định trạng thái
            let trangThaiThanhToan = 'Đã thanh toán';
            let trangThaiDonHang = 'Đã xác nhận';
            
            if (soTienDaThanhToan < booking.tong_tien) {
                trangThaiThanhToan = 'Đã đặt cọc';
                trangThaiDonHang = 'Chờ xác nhận';
            }

            await booking.update({
                trang_thai_thanh_toan: trangThaiThanhToan,
                tien_con_lai: booking.tong_tien - soTienDaThanhToan,
                trang_thai_don_hang: trangThaiDonHang
            });

            console.log(`✅ Return: Order ${vnp_TxnRef} updated to ${trangThaiThanhToan}`);

            // Gửi email
            try {
                await sendPaymentConfirmation(booking.nguoiDung.email, {
                    ma_don_hang: booking.ma_don_hang,
                    ten_tour: booking.lichKhoiHanh.tour.ten_tour,
                    so_tien: soTienDaThanhToan,
                    phuong_thuc: 'VNPay',
                    trang_thai: 'Thành công'
                });
                console.log('✅ Return: Email sent');
            } catch (emailError) {
                console.log('⚠️ Return: Email không gửi được');
            }
        }

        // Chuyển hướng về trang kết quả
        if (vnp_ResponseCode === '00') {
            return res.redirect(`${process.env.CLIENT_URL || 'http://localhost:3000'}/payment-result?status=success&order=${booking.ma_don_hang}`);
        } else {
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

        // Lấy thanh toán mới nhất
        const thanhToan = await ThanhToan.findOne({
            where: { ma_don_hang },
            order: [['ngay_tao', 'DESC']]
        });

        // Trả về đầy đủ thông tin
        res.json({
            success: true,
            data: {
                tong_tien: booking.tong_tien,
                tien_coc: booking.tien_coc || 0,
                tien_con_lai: booking.tien_con_lai || 0,
                trang_thai_thanh_toan: booking.trang_thai_thanh_toan,
                trang_thai_don_hang: booking.trang_thai_don_hang,
                thanhToan: thanhToan || null
            }
        });

    } catch (error) {
        console.error('❌ Get payment status error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi kiểm tra thanh toán: ' + error.message
        });
    }
};