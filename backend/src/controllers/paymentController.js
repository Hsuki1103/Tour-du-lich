// backend/src/controllers/paymentController.js
import { DonDatTour, ThanhToan, LichKhoiHanh, Tour, NguoiDung, VaiTro } from '../models/index.js';
import { createVNPayPayment as createVNPayPaymentService, verifyVNPayReturn } from '../utils/vnpayService.js';
import { sendPaymentConfirmation } from '../utils/emailService.js';

// ============================================
// TẠO THANH TOÁN VNPAY
// ============================================
export const createVNPayPayment = async (req, res) => {
    try {
        const { ma_don_hang, phuong_thuc_thanh_toan, qr_code, so_tien, is_additional } = req.body;

        console.log('========================================');
        console.log('💳 Creating VNPay payment');
        console.log('📦 Order ID:', ma_don_hang);
        console.log('📦 Payment method:', phuong_thuc_thanh_toan);
        console.log('📦 Amount:', so_tien);
        console.log('📦 Is additional payment:', is_additional);
        console.log('========================================');

        if (!process.env.VNP_TMN_CODE || !process.env.VNP_HASH_SECRET) {
            console.error('❌ VNPay config missing!');
            return res.status(500).json({
                success: false,
                message: 'Cấu hình VNPay chưa được thiết lập.'
            });
        }

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

        if (req.user.ma_nguoi_dung !== booking.ma_nguoi_dung) {
            return res.status(403).json({
                success: false,
                message: 'Bạn không có quyền thanh toán đơn hàng này'
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

        let soTienCanThanhToan;

        // ⭐ KIỂM TRA NẾU LÀ THANH TOÁN BỔ SUNG
        if (is_additional && so_tien) {
            // ⭐ THANH TOÁN BỔ SUNG - LẤY SỐ TIỀN TỪ REQUEST
            soTienCanThanhToan = parseFloat(so_tien);
            
            // ⭐ KIỂM TRA SỐ TIỀN KHÔNG VƯỢT QUÁ TIỀN CÒN LẠI
            const tienConLai = parseFloat(booking.tien_con_lai || 0);
            if (soTienCanThanhToan > tienConLai) {
                return res.status(400).json({
                    success: false,
                    message: `Số tiền thanh toán (${soTienCanThanhToan}) vượt quá số tiền còn lại (${tienConLai})`
                });
            }
            
            // ⭐ NẾU THANH TOÁN ĐÚNG BẰNG TIỀN CÒN LẠI -> CẬP NHẬT THÀNH ĐÃ THANH TOÁN
            if (Math.abs(soTienCanThanhToan - tienConLai) < 0.01) {
                // Thanh toán đủ số tiền còn lại
                await booking.update({
                    trang_thai_thanh_toan: 'Đã thanh toán',
                    tien_con_lai: 0
                });
            }
        } else if (phuong_thuc_thanh_toan === 'coc') {
            // ⭐ THANH TOÁN ĐẶT CỌC
            soTienCanThanhToan = parseFloat(booking.tien_coc);
        } else if (phuong_thuc_thanh_toan === 'full') {
            // ⭐ THANH TOÁN TOÀN BỘ
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

        console.log('💰 Amount to pay:', soTienCanThanhToan);

        // ⭐ TẠO MÃ GIAO DỊCH DUY NHẤT CHO VNPAY
        const txnRef = `${ma_don_hang}_${Date.now()}`;
        console.log('📝 VNPay TxnRef:', txnRef);

        const paymentResult = createVNPayPaymentService({
            ma_don_hang: ma_don_hang,
            txn_ref: txnRef,
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

        // ⭐ LƯU THÔNG TIN THANH TOÁN
        await ThanhToan.create({
            ma_don_hang: booking.ma_don_hang,
            so_tien: soTienCanThanhToan,
            phuong_thuc: qr_code ? 'VNPayQR' : 'VNPay',
            trang_thai: 'Chờ thanh toán',
            ma_giao_dich: txnRef,
            thong_tin: {
                ...paymentResult.vnp_Params,
                qr_code: qr_code || false,
                txn_ref: txnRef,
                is_additional: is_additional || false,
                payment_method: phuong_thuc_thanh_toan
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
                is_qr: qr_code || false,
                txn_ref: txnRef,
                is_additional: is_additional || false
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

        const result = verifyVNPayReturn(queryParams);

        if (!result.success) {
            console.error('❌ IPN verification failed:', result.message);
            return res.status(200).json({ RspCode: '97', Message: 'Verification failed' });
        }

        const { vnp_TxnRef, vnp_Amount, vnp_ResponseCode, vnp_PayDate } = result.data;

        // ⭐ LẤY MA_DON_HANG TỪ TXN_REF (cắt bỏ phần timestamp)
        const ma_don_hang = parseInt(vnp_TxnRef.split('_')[0]);
        console.log('📊 Extracted ma_don_hang:', ma_don_hang);

        const booking = await DonDatTour.findByPk(ma_don_hang, {
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
            console.error('❌ IPN: Booking not found:', ma_don_hang);
            return res.status(200).json({ RspCode: '02', Message: 'Order not found' });
        }

        if (booking.trang_thai_thanh_toan === 'Đã thanh toán') {
            console.log('✅ IPN: Order already paid:', ma_don_hang);
            return res.status(200).json({ RspCode: '00', Message: 'Confirm Success' });
        }

        if (vnp_ResponseCode === '00') {
            const soTienDaThanhToan = parseInt(vnp_Amount) / 100;
            console.log('💰 IPN - Amount paid:', soTienDaThanhToan);

            // ⭐ LẤY THÔNG TIN THANH TOÁN ĐỂ BIẾT LÀ THANH TOÁN BỔ SUNG HAY KHÔNG
            let thanhToan = await ThanhToan.findOne({
                where: { ma_don_hang: ma_don_hang, ma_giao_dich: vnp_TxnRef },
                order: [['ngay_tao', 'DESC']]
            });

            if (!thanhToan) {
                // ⭐ NẾU KHÔNG TÌM THẤY, TẠO MỚI
                thanhToan = await ThanhToan.create({
                    ma_don_hang: ma_don_hang,
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

            // ⭐ KIỂM TRA XEM LÀ THANH TOÁN BỔ SUNG HAY KHÔNG
            const isAdditional = thanhToan.thong_tin?.is_additional || false;
            const currentTienConLai = parseFloat(booking.tien_con_lai || 0);

            let trangThaiThanhToan = 'Đã thanh toán';
            let trangThaiDonHang = 'Đã xác nhận';
            let tienConLaiMoi = 0;

            if (isAdditional) {
                // ⭐ THANH TOÁN BỔ SUNG - CẬP NHẬT TIỀN CÒN LẠI
                tienConLaiMoi = currentTienConLai - soTienDaThanhToan;
                
                if (tienConLaiMoi > 0) {
                    trangThaiThanhToan = 'Đã đặt cọc';
                    trangThaiDonHang = 'Đã xác nhận';
                } else {
                    trangThaiThanhToan = 'Đã thanh toán';
                    trangThaiDonHang = 'Đã xác nhận';
                    tienConLaiMoi = 0;
                }
            } else {
                // ⭐ THANH TOÁN LẦN ĐẦU
                if (soTienDaThanhToan < booking.tong_tien) {
                    trangThaiThanhToan = 'Đã đặt cọc';
                    trangThaiDonHang = 'Chờ xác nhận';
                    tienConLaiMoi = booking.tong_tien - soTienDaThanhToan;
                } else {
                    trangThaiThanhToan = 'Đã thanh toán';
                    trangThaiDonHang = 'Đã xác nhận';
                    tienConLaiMoi = 0;
                }
            }

            await booking.update({
                trang_thai_thanh_toan: trangThaiThanhToan,
                tien_con_lai: tienConLaiMoi,
                trang_thai_don_hang: trangThaiDonHang
            });

            console.log(`✅ IPN: Order ${ma_don_hang} updated successfully!`);
            console.log(`   - Status: ${trangThaiThanhToan}`);
            console.log(`   - Remaining: ${tienConLaiMoi}`);

            try {
                await sendPaymentConfirmation(booking.nguoiDung.email, {
                    ma_don_hang: ma_don_hang,
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
            console.log(`❌ IPN: Payment failed for order ${ma_don_hang}, code: ${vnp_ResponseCode}`);
            
            let thanhToan = await ThanhToan.findOne({
                where: { ma_don_hang: ma_don_hang },
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
// ⭐ XỬ LÝ RETURN URL - QUAN TRỌNG
// ============================================
export const handleVNPayReturn = async (req, res) => {
    try {
        const queryParams = req.query;
        console.log('========================================');
        console.log('📥 VNPAY RETURN RECEIVED!');
        console.log('📥 Full URL:', req.originalUrl);
        console.log('📥 Query:', JSON.stringify(queryParams, null, 2));
        console.log('========================================');

        const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000';

        const responseCode = queryParams['vnp_ResponseCode'];
        const vnp_TxnRef = queryParams['vnp_TxnRef'];
        const vnp_Amount = queryParams['vnp_Amount'];
        const vnp_PayDate = queryParams['vnp_PayDate'];

        console.log('📊 vnp_ResponseCode:', responseCode);
        console.log('📊 vnp_TxnRef:', vnp_TxnRef);
        console.log('📊 vnp_Amount:', vnp_Amount);

        // ⭐ Xác thực chữ ký
        const result = verifyVNPayReturn(queryParams);
        console.log('📊 Verify result success:', result.success);

        if (!result.success) {
            console.error('❌ Verification failed:', result.message);
            const encodedMessage = encodeURIComponent(result.message);
            return res.redirect(`${CLIENT_URL}/payment-result?status=failed&code=07&message=${encodedMessage}`);
        }

        // ⭐ XỬ LÝ THEO RESPONSE CODE
        if (responseCode === '00') {
            console.log('✅✅✅ PAYMENT SUCCESS for order:', vnp_TxnRef);
            
            // ⭐ LẤY MA_DON_HANG TỪ TXN_REF
            const ma_don_hang = parseInt(vnp_TxnRef.split('_')[0]);
            console.log('📊 Extracted ma_don_hang:', ma_don_hang);
            
            // ⭐ CẬP NHẬT ĐƠN HÀNG
            const booking = await DonDatTour.findByPk(ma_don_hang);
            
            if (booking) {
                const soTien = parseInt(vnp_Amount) / 100;
                console.log('💰 Order total:', booking.tong_tien);
                console.log('💰 Paid amount:', soTien);
                console.log('💰 Current remaining:', booking.tien_con_lai);
                
                // ⭐ KIỂM TRA XEM CÓ PHẢI THANH TOÁN BỔ SUNG KHÔNG
                // Bằng cách kiểm tra số tiền đã thanh toán + số tiền đã trả trước đó
                const thanhToanCu = await ThanhToan.findOne({
                    where: { ma_don_hang: ma_don_hang },
                    order: [['ngay_tao', 'DESC']]
                });

                const isAdditional = thanhToanCu?.thong_tin?.is_additional || false;
                const tienDaThanhToanTruoc = parseFloat(booking.tong_tien) - parseFloat(booking.tien_con_lai || 0);
                
                console.log('💰 Previous paid:', tienDaThanhToanTruoc);
                console.log('💰 Is additional:', isAdditional);
                
                let trangThaiThanhToan = 'Đã thanh toán';
                let trangThaiDonHang = 'Đã xác nhận';
                let tienConLai = 0;

                if (isAdditional || tienDaThanhToanTruoc > 0) {
                    // ⭐ THANH TOÁN BỔ SUNG - CẬP NHẬT TIỀN CÒN LẠI
                    tienConLai = parseFloat(booking.tien_con_lai || 0) - soTien;
                    
                    if (tienConLai > 0) {
                        trangThaiThanhToan = 'Đã đặt cọc';
                        trangThaiDonHang = 'Đã xác nhận';
                    } else {
                        trangThaiThanhToan = 'Đã thanh toán';
                        trangThaiDonHang = 'Đã xác nhận';
                        tienConLai = 0;
                    }
                } else {
                    // ⭐ THANH TOÁN LẦN ĐẦU
                    if (soTien >= parseFloat(booking.tong_tien)) {
                        trangThaiThanhToan = 'Đã thanh toán';
                        trangThaiDonHang = 'Đã xác nhận';
                        tienConLai = 0;
                    } else {
                        trangThaiThanhToan = 'Đã đặt cọc';
                        trangThaiDonHang = 'Chờ xác nhận';
                        tienConLai = parseFloat(booking.tong_tien) - soTien;
                    }
                }
                
                await booking.update({
                    trang_thai_thanh_toan: trangThaiThanhToan,
                    trang_thai_don_hang: trangThaiDonHang,
                    tien_con_lai: tienConLai
                });
                
                console.log(`✅ Updated order ${ma_don_hang}:`);
                console.log(`   - Payment status: ${trangThaiThanhToan}`);
                console.log(`   - Order status: ${trangThaiDonHang}`);
                console.log(`   - Remaining: ${tienConLai}`);
                
                // Tạo hoặc cập nhật payment record
                let thanhToan = await ThanhToan.findOne({
                    where: { ma_don_hang: ma_don_hang, ma_giao_dich: vnp_TxnRef },
                    order: [['ngay_tao', 'DESC']]
                });

                if (!thanhToan) {
                    await ThanhToan.create({
                        ma_don_hang: ma_don_hang,
                        so_tien: soTien,
                        phuong_thuc: 'VNPay',
                        trang_thai: 'Đã thanh toán',
                        ma_giao_dich: vnp_TxnRef,
                        ngay_thanh_toan: new Date(vnp_PayDate),
                        thong_tin: {
                            return_response: queryParams,
                            return_processed_at: new Date().toISOString(),
                            is_additional: isAdditional || tienDaThanhToanTruoc > 0
                        }
                    });
                    console.log('✅ Created payment record');
                } else {
                    await thanhToan.update({
                        trang_thai: 'Đã thanh toán',
                        ngay_thanh_toan: new Date(vnp_PayDate),
                        thong_tin: {
                            ...thanhToan.thong_tin,
                            return_response: queryParams,
                            return_processed_at: new Date().toISOString(),
                            is_additional: isAdditional || tienDaThanhToanTruoc > 0
                        }
                    });
                    console.log('✅ Updated payment record');
                }
            } else {
                console.log('⚠️ Booking not found:', ma_don_hang);
            }
            
            // ⭐ REDIRECT VỀ FRONTEND
            console.log(`🔗 Redirecting to: ${CLIENT_URL}/payment-result?status=success&order=${ma_don_hang}`);
            return res.redirect(`${CLIENT_URL}/payment-result?status=success&order=${ma_don_hang}`);
            
        } else {
            // ⭐ XỬ LÝ THẤT BẠI
            const errorMessages = {
                '02': 'Mã đơn hàng không hợp lệ',
                '03': 'Số tiền không hợp lệ',
                '04': 'Thông tin thanh toán không hợp lệ',
                '05': 'Giao dịch thất bại',
                '06': 'Lỗi hệ thống VNPay',
                '07': 'Lỗi chữ ký - Sai thông tin cấu hình',
                '08': 'Lỗi dữ liệu gửi lên VNPay',
                '09': 'Lỗi cấu hình VNPay',
                '10': 'Lỗi kết nối VNPay',
                '11': 'Giao dịch đã tồn tại',
                '12': 'Thẻ không hợp lệ',
                '13': 'Số dư không đủ - Vui lòng kiểm tra lại',
                '14': 'Thẻ đã hết hạn',
                '15': 'Thẻ bị khóa',
                '16': 'Ngân hàng từ chối giao dịch',
                '17': 'Không xác thực được thông tin',
                '18': 'Mã OTP không hợp lệ',
                '19': 'OTP đã hết thời gian hiệu lực',
                '20': 'Giao dịch bị hủy bởi khách hàng',
                '21': 'Giao dịch đã được thanh toán',
                '22': 'Giao dịch không thành công',
                '23': 'Giao dịch đang chờ xử lý',
                '24': 'Giao dịch đã được hoàn tiền'
            };
            
            const errorMsg = errorMessages[responseCode] || `Lỗi không xác định (mã: ${responseCode})`;
            console.log(`❌ Payment FAILED - ${errorMsg}`);
            
            const encodedMessage = encodeURIComponent(errorMsg);
            return res.redirect(`${CLIENT_URL}/payment-result?status=failed&code=${responseCode}&message=${encodedMessage}`);
        }

    } catch (error) {
        console.error('❌ VNPay return error:', error);
        const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000';
        const encodedMessage = encodeURIComponent('Lỗi xử lý thanh toán: ' + error.message);
        return res.redirect(`${CLIENT_URL}/payment-result?status=failed&code=99&message=${encodedMessage}`);
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

        const thanhToan = await ThanhToan.findOne({
            where: { ma_don_hang },
            order: [['ngay_tao', 'DESC']]
        });

        res.json({
            success: true,
            data: {
                tong_tien: booking.tong_tien,
                tien_coc: booking.tien_coc || 0,
                tien_con_lai: booking.tien_con_lai || 0,
                trang_thai_thanh_toan: booking.trang_thai_thanh_toan,
                trang_thai_don_hang: booking.trang_thai_don_hang,
                thanhToan: thanhToan || null,
                so_tien_da_thanh_toan: parseFloat(booking.tong_tien) - parseFloat(booking.tien_con_lai || 0)
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