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

        const txnRef = `${orderInfo.ma_don_hang}`;

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
            'vnp_OrderInfo': `Thanh toan don hang ${orderInfo.ma_don_hang}`.replace(/ /g, '_'),
            'vnp_OrderType': 'other',
            'vnp_Locale': 'vn',
            'vnp_ReturnUrl': returnUrl,
            'vnp_IpAddr': ipAddress,
            'vnp_CreateDate': moment().format('YYYYMMDDHHmmss'),
            'vnp_ExpireDate': moment().add(15, 'minutes').format('YYYYMMDDHHmmss'),
        };

        // ⭐ KHÔNG TỰ ĐỘNG THÊM vnp_BankCode
        if (orderInfo.bankCode) {
            vnp_Params['vnp_BankCode'] = orderInfo.bankCode;
        }

        // ⭐ LOẠI BỎ THAM SỐ RỖNG
        const cleanParams = {};
        for (const key of Object.keys(vnp_Params)) {
            if (vnp_Params[key] !== null && vnp_Params[key] !== undefined && vnp_Params[key] !== '') {
                cleanParams[key] = String(vnp_Params[key]);
            }
        }

        // ⭐ SẮP XẾP THEO ALPHABET
        const sortedParams = sortObject(cleanParams);

        // ⭐ TẠO CHUỖI KÝ (KHÔNG ENCODE)
        const signData = querystring.stringify(sortedParams, { encode: false });
        console.log('📝 SignData:', signData);

        // ⭐ TẠO CHỮ KÝ (HMAC SHA512)
        const hmac = crypto.createHmac('sha512', hashSecret);
        const secureHash = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');
        console.log('🔑 SecureHash:', secureHash);

        // ⭐ TẠO URL THANH TOÁN
        const paymentUrl = `${vnpUrl}?${querystring.stringify(sortedParams, { encode: false })}&vnp_SecureHash=${secureHash}`;
        console.log('✅ Payment URL created');

        return {
            success: true,
            paymentUrl: paymentUrl,
            qrPaymentUrl: orderInfo.qr_code ? paymentUrl : null,
            vnp_Params: { ...sortedParams, vnp_SecureHash: secureHash }
        };

    } catch (error) {
        console.error('❌ VNPay error:', error);
        return { success: false, message: 'Không thể tạo thanh toán VNPay: ' + error.message };
    }
};

/**
 * Xác thực dữ liệu từ VNPay trả về (IPN và Return URL)
 */
export const verifyVNPayReturn = (queryParams) => {
    try {
        const hashSecret = process.env.VNP_HASH_SECRET?.trim();
        
        // ⭐ LƯU LẠI SECURE HASH
        const secureHash = queryParams['vnp_SecureHash'];
        
        // ⭐ LOẠI BỎ SECURE HASH
        delete queryParams['vnp_SecureHash'];
        delete queryParams['vnp_SecureHashType'];

        // ⭐ GIẢI MÃ URL TẤT CẢ THAM SỐ
        const decodedParams = {};
        for (const key of Object.keys(queryParams)) {
            if (queryParams[key] !== null && queryParams[key] !== undefined && queryParams[key] !== '') {
                decodedParams[key] = decodeURIComponent(queryParams[key]);
            }
        }

        // ⭐ SẮP XẾP THEO ALPHABET
        const sortedParams = sortObject(decodedParams);

        // ⭐ TẠO CHUỖI KÝ (KHÔNG ENCODE)
        const signData = querystring.stringify(sortedParams, { encode: false });
        console.log('📝 verify - SignData:', signData);

        // ⭐ TẠO CHỮ KÝ MỚI
        const hmac = crypto.createHmac('sha512', hashSecret);
        const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');
        console.log('🔑 verify - Calculated Hash:', signed);
        console.log('🔑 verify - Received Hash:', secureHash);

        // ⭐ SO SÁNH
        if (secureHash === signed) {
            console.log('✅ verify - Hash matched!');
            const responseCode = queryParams['vnp_ResponseCode'];
            if (responseCode === '00') {
                return {
                    success: true,
                    message: 'Thanh toán thành công',
                    data: queryParams
                };
            } else {
                return {
                    success: false,
                    message: 'Thanh toán thất bại',
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