import crypto from 'crypto';
import querystring from 'qs';
import moment from 'moment';

/**
 * Hàm sắp xếp tham số theo thứ tự alphabet
 */
function sortObject(obj) {
    const sorted = {};
    const keys = Object.keys(obj).sort();
    for (const key of keys) {
        if (obj[key] !== null && obj[key] !== undefined && obj[key] !== '') {
            sorted[key] = encodeURIComponent(obj[key]).replace(/%20/g, '+');
        }
    }
    return sorted;
}

/**
 * Tạo URL thanh toán VNPay
 */
export const createVNPayPayment = (orderInfo) => {
    try {
        const tmnCode = process.env.VNP_TMN_CODE?.trim();
        const hashSecret = process.env.VNP_HASH_SECRET?.trim();
        const vnpUrl = process.env.VNP_URL?.trim();
        const returnUrl = process.env.VNP_RETURN_URL?.trim();

        console.log('🔑 VNP_TMN_CODE:', tmnCode);
        console.log('🔑 VNP_HASH_SECRET:', hashSecret ? '✅ SET (length: ' + hashSecret.length + ')' : '❌ MISSING');
        console.log('🔑 VNP_URL:', vnpUrl);
        console.log('🔑 VNP_RETURN_URL:', returnUrl);

        if (!tmnCode || !hashSecret || !vnpUrl || !returnUrl) {
            return { success: false, message: 'Cấu hình VNPay chưa đầy đủ.' };
        }

        const amount = Math.round(parseFloat(orderInfo.so_tien) * 100);
        if (amount <= 0) {
            return { success: false, message: 'Số tiền không hợp lệ.' };
        }

        // ⭐ SỬ DỤNG TXN_REF TỪ ORDER INFO HOẶC TỰ TẠO
        const txnRef = orderInfo.txn_ref || `${orderInfo.ma_don_hang}_${Date.now()}`;

        let ipAddress = orderInfo.ip_address || '127.0.0.1';
        if (ipAddress === '::1' || ipAddress === '::ffff:127.0.0.1') {
            ipAddress = '127.0.0.1';
        }

        const vnp_Params = {
            'vnp_Version': '2.1.0',
            'vnp_Command': 'pay',
            'vnp_TmnCode': tmnCode,
            'vnp_Amount': amount,
            'vnp_CurrCode': 'VND',
            'vnp_TxnRef': txnRef,
            'vnp_OrderInfo': `Thanh toan don hang ${orderInfo.ma_don_hang}`,
            'vnp_OrderType': 'other',
            'vnp_Locale': 'vn',
            'vnp_ReturnUrl': returnUrl,
            'vnp_IpAddr': ipAddress,
            'vnp_CreateDate': moment().format('YYYYMMDDHHmmss'),
            'vnp_ExpireDate': moment().add(15, 'minutes').format('YYYYMMDDHHmmss'),
        };

        if (orderInfo.bankCode) {
            vnp_Params['vnp_BankCode'] = orderInfo.bankCode;
        }

        // Loại bỏ tham số rỗng
        const cleanParams = {};
        for (const key of Object.keys(vnp_Params)) {
            if (vnp_Params[key] !== null && vnp_Params[key] !== undefined && vnp_Params[key] !== '') {
                cleanParams[key] = String(vnp_Params[key]);
            }
        }

        // Sắp xếp theo alphabet
        const sortedParams = sortObject(cleanParams);

        // Tạo chuỗi ký
        const signData = querystring.stringify(sortedParams, { encode: false });
        console.log('📝 SignData:', signData);

        // Tạo chữ ký (HMAC SHA512)
        const hmac = crypto.createHmac('sha512', hashSecret);
        const secureHash = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');
        console.log('🔑 SecureHash:', secureHash);

        // Tạo URL thanh toán
        const paymentUrl = `${vnpUrl}?${querystring.stringify(sortedParams, { encode: false })}&vnp_SecureHash=${secureHash}`;
        console.log('✅ Payment URL created');

        return {
            success: true,
            paymentUrl: paymentUrl,
            qrPaymentUrl: orderInfo.qr_code ? paymentUrl : null,
            vnp_Params: { ...sortedParams, vnp_SecureHash: secureHash },
            txn_ref: txnRef
        };

    } catch (error) {
        console.error('❌ VNPay error:', error);
        return { success: false, message: 'Không thể tạo thanh toán VNPay: ' + error.message };
    }
};

/**
 * Xác thực dữ liệu từ VNPay trả về
 */
export const verifyVNPayReturn = (queryParams) => {
    try {
        const hashSecret = process.env.VNP_HASH_SECRET?.trim();
        
        // Lưu lại secure hash
        const secureHash = queryParams['vnp_SecureHash'];
        
        // Loại bỏ secure hash
        delete queryParams['vnp_SecureHash'];
        delete queryParams['vnp_SecureHashType'];

        // Giải mã URL tất cả tham số
        const decodedParams = {};
        for (const key of Object.keys(queryParams)) {
            if (queryParams[key] !== null && queryParams[key] !== undefined && queryParams[key] !== '') {
                decodedParams[key] = decodeURIComponent(queryParams[key]);
            }
        }

        // Sắp xếp theo alphabet
        const sortedParams = sortObject(decodedParams);

        // Tạo chuỗi ký
        const signData = querystring.stringify(sortedParams, { encode: false });
        console.log('📝 verify - SignData:', signData);

        // Tạo chữ ký mới
        const hmac = crypto.createHmac('sha512', hashSecret);
        const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');
        console.log('🔑 verify - Calculated Hash:', signed);
        console.log('🔑 verify - Received Hash:', secureHash);

        // So sánh
        if (secureHash === signed) {
            console.log('✅ verify - Hash matched!');
            const responseCode = queryParams['vnp_ResponseCode'];
            console.log('📊 Response Code:', responseCode);
            
            if (responseCode === '00') {
                return {
                    success: true,
                    message: 'Thanh toán thành công',
                    data: queryParams
                };
            } else {
                const errorMessages = {
                    '02': 'Mã đơn hàng không hợp lệ',
                    '03': 'Số tiền không hợp lệ',
                    '04': 'Thông tin thanh toán không hợp lệ',
                    '05': 'Giao dịch thất bại',
                    '06': 'Lỗi hệ thống VNPay',
                    '07': 'Lỗi chữ ký',
                    '08': 'Lỗi dữ liệu',
                    '09': 'Lỗi cấu hình',
                    '10': 'Lỗi kết nối',
                    '11': 'Giao dịch đã tồn tại',
                    '12': 'Thẻ không hợp lệ',
                    '13': 'Số dư không đủ',
                    '14': 'Thẻ đã hết hạn',
                    '15': 'Thẻ bị khóa',
                    '16': 'Ngân hàng từ chối',
                    '17': 'Không xác thực được',
                    '18': 'OTP không hợp lệ',
                    '19': 'OTP đã hết thời gian',
                    '20': 'Giao dịch bị hủy',
                    '21': 'Giao dịch đã được thanh toán',
                    '22': 'Giao dịch không thành công',
                    '23': 'Đang chờ xử lý',
                    '24': 'Đã được hoàn tiền'
                };
                const errorMsg = errorMessages[responseCode] || `Lỗi không xác định (mã: ${responseCode})`;
                console.log(`❌ Payment failed - ${errorMsg}`);
                
                return {
                    success: false,
                    message: `Thanh toán thất bại: ${errorMsg}`,
                    data: queryParams
                };
            }
        } else {
            console.error('❌ verify - Hash mismatch!');
            console.error('  Received:', secureHash);
            console.error('  Calculated:', signed);
            return {
                success: false,
                message: 'Chữ ký không hợp lệ',
                data: queryParams
            };
        }
    } catch (error) {
        console.error('❌ verify - Error:', error);
        return {
            success: false,
            message: 'Lỗi xác thực thanh toán: ' + error.message
        };
    }
};