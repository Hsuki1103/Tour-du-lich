import crypto from 'crypto';
import qs from 'qs';
import moment from 'moment';
import dotenv from 'dotenv';

dotenv.config();

// ============================================
// TẠO THANH TOÁN VNPAY
// ============================================
export const createVNPayPayment = (orderInfo) => {
  try {
    console.log('💳 Creating VNPay payment with data:', {
      ma_don_hang: orderInfo.ma_don_hang,
      so_tien: orderInfo.so_tien,
      ip: orderInfo.ip_address
    });

    // Kiểm tra env
    if (!process.env.VNP_TMN_CODE || !process.env.VNP_HASH_SECRET) {
      return {
        success: false,
        message: 'VNPay configuration missing'
      };
    }

    // Đảm bảo số tiền là số nguyên (nhân 100)
    const amount = Math.round(parseFloat(orderInfo.so_tien) * 100);
    if (amount <= 0) {
      return {
        success: false,
        message: 'Số tiền không hợp lệ'
      };
    }

    // Tạo mã đơn hàng duy nhất
    const txnRef = `${orderInfo.ma_don_hang}`;

    const vnp_Params = {};
    vnp_Params['vnp_Version'] = '2.1.0';
    vnp_Params['vnp_Command'] = 'pay';
    vnp_Params['vnp_TmnCode'] = process.env.VNP_TMN_CODE;
    vnp_Params['vnp_Locale'] = 'vn';
    vnp_Params['vnp_CurrCode'] = 'VND';
    vnp_Params['vnp_TxnRef'] = txnRef;
    vnp_Params['vnp_OrderInfo'] = `Thanh toan don hang ${orderInfo.ma_don_hang}`;
    vnp_Params['vnp_OrderType'] = 'other';
    vnp_Params['vnp_Amount'] = amount;
    vnp_Params['vnp_ReturnUrl'] = process.env.VNP_RETURN_URL;
    vnp_Params['vnp_IpAddr'] = orderInfo.ip_address || '127.0.0.1';
    vnp_Params['vnp_CreateDate'] = moment().format('YYYYMMDDHHmmss');
    vnp_Params['vnp_ExpireDate'] = moment().add(15, 'minutes').format('YYYYMMDDHHmmss');

    console.log('📦 VNPay Params:', vnp_Params);

    // Sắp xếp tham số
    const sortedParams = sortObject(vnp_Params);
    const signData = qs.stringify(sortedParams, { encode: false });
    
    console.log('🔑 Sign Data:', signData);
    
    const hmac = crypto.createHmac('sha512', process.env.VNP_HASH_SECRET);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');
    
    vnp_Params['vnp_SecureHash'] = signed;
    
    const paymentUrl = `${process.env.VNP_URL}?${qs.stringify(vnp_Params, { encode: false })}`;
    
    console.log('✅ VNPay URL created');
    
    return {
      success: true,
      paymentUrl: paymentUrl,
      vnp_Params: vnp_Params
    };
  } catch (error) {
    console.error('❌ VNPay error:', error);
    return {
      success: false,
      message: 'Không thể tạo thanh toán VNPay: ' + error.message
    };
  }
};

// ============================================
// XÁC THỰC RETURN URL TỪ VNPAY
// ============================================
export const verifyVNPayReturn = (queryParams) => {
  try {
    const secureHash = queryParams['vnp_SecureHash'];
    delete queryParams['vnp_SecureHash'];
    delete queryParams['vnp_SecureHashType'];

    const sortedParams = sortObject(queryParams);
    const signData = qs.stringify(sortedParams, { encode: false });
    const hmac = crypto.createHmac('sha512', process.env.VNP_HASH_SECRET);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

    if (secureHash === signed) {
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
      return {
        success: false,
        message: 'Chữ ký không hợp lệ',
        data: queryParams
      };
    }
  } catch (error) {
    console.error('Verify VNPay error:', error);
    return {
      success: false,
      message: 'Lỗi xác thực thanh toán'
    };
  }
};

// ============================================
// HÀM HỖ TRỢ SẮP XẾP OBJECT
// ============================================
function sortObject(obj) {
  const sorted = {};
  const keys = Object.keys(obj).sort();
  for (const key of keys) {
    if (obj[key] !== null && obj[key] !== undefined && obj[key] !== '') {
      sorted[key] = obj[key];
    }
  }
  return sorted;
}