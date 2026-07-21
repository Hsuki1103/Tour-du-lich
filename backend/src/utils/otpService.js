import { OTP } from '../models/index.js';
import { sendOTPEmail } from './emailService.js';
import crypto from 'crypto';

// Tạo mã OTP 6 số
export const generateOTP = () => {
  return crypto.randomInt(100000, 999999).toString();
};

// Tạo và gửi OTP
export const createAndSendOTP = async (email, loai = 'xac_thuc') => {
  try {
    // Xóa OTP cũ
    await OTP.destroy({
      where: { email, loai, da_su_dung: false }
    });

    const otpCode = generateOTP();
    const expiresAt = new Date(Date.now() + 3 * 60 * 1000); // 3 phút

    // Lưu OTP vào database
    await OTP.create({
      email,
      otp_code: otpCode,
      loai,
      thoi_gian_het_han: expiresAt,
      da_su_dung: false
    });

    // Gửi email
    await sendOTPEmail(email, otpCode, loai);

    return { success: true, message: 'Mã OTP đã được gửi đến email của bạn.' };
  } catch (error) {
    console.error('Error creating OTP:', error);
    throw new Error('Không thể tạo mã OTP. Vui lòng thử lại.');
  }
};

// Xác minh OTP
export const verifyOTP = async (email, otpCode, loai = 'xac_thuc') => {
  try {
    const otpRecord = await OTP.findOne({
      where: {
        email,
        otp_code: otpCode,
        loai,
        da_su_dung: false
      },
      order: [['ngay_tao', 'DESC']]
    });

    if (!otpRecord) {
      return { success: false, message: 'Mã OTP không hợp lệ.' };
    }

    // Kiểm tra hết hạn
    const now = new Date();
    if (now > otpRecord.thoi_gian_het_han) {
      return { success: false, message: 'Mã OTP đã hết hạn. Vui lòng yêu cầu mã mới.' };
    }

    // Đánh dấu đã sử dụng
    otpRecord.da_su_dung = true;
    await otpRecord.save();

    return { success: true, message: 'Xác thực OTP thành công.' };
  } catch (error) {
    console.error('Error verifying OTP:', error);
    throw new Error('Không thể xác thực OTP. Vui lòng thử lại.');
  }
};

// Xóa OTP đã hết hạn (chạy định kỳ)
export const cleanupExpiredOTP = async () => {
  try {
    const result = await OTP.destroy({
      where: {
        thoi_gian_het_han: {
          [Op.lt]: new Date()
        }
      }
    });
    console.log(`🧹 Cleaned up ${result} expired OTP records`);
    return result;
  } catch (error) {
    console.error('Error cleaning up OTP:', error);
    return 0;
  }
};