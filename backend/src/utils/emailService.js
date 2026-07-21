import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Kiểm tra cấu hình email
const isEmailConfigured = process.env.EMAIL_USER && process.env.EMAIL_PASS;

let transporter = null;

if (isEmailConfigured) {
  transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT),
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
} else {
  console.log('⚠️ Email not configured, skipping email sending');
}

export const sendEmail = async (to, subject, html) => {
  if (!isEmailConfigured || !transporter) {
    console.log('⚠️ Email skipped - not configured');
    return { success: true, message: 'Email skipped' };
  }

  try {
    const mailOptions = {
      from: `"Công Ty Du Lịch Việt" <${process.env.EMAIL_USER}>`,
      to: to,
      subject: subject,
      html: html
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent to ${to}: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error('❌ Email error:', error.message);
    return { success: false, error: error.message };
  }
};

// Gửi OTP
export const sendOTPEmail = async (email, otp, loai = 'xac_thuc') => {
  const subject = 'Mã xác thực - Công Ty Du Lịch Việt';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
      <div style="background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
        <h2 style="color: #e74c3c; text-align: center;">CÔNG TY DU LỊCH VIỆT</h2>
        <h3 style="text-align: center; color: #333;">Mã xác thực của bạn</h3>
        <div style="text-align: center; margin: 30px 0;">
          <div style="display: inline-block; background-color: #e74c3c; color: #ffffff; font-size: 32px; font-weight: bold; padding: 15px 30px; border-radius: 5px; letter-spacing: 5px;">
            ${otp}
          </div>
        </div>
        <p style="color: #555; text-align: center;">Mã OTP này có hiệu lực trong <strong>3 phút</strong>.</p>
        <p style="color: #555; text-align: center;">Vui lòng không chia sẻ mã OTP này với bất kỳ ai.</p>
        <hr style="border: 1px solid #eee; margin: 20px 0;">
        <p style="color: #999; font-size: 12px; text-align: center;">Nếu bạn không yêu cầu mã này, vui lòng bỏ qua email này.</p>
      </div>
    </div>
  `;
  return await sendEmail(email, subject, html);
};

// Gửi xác nhận đặt tour
export const sendBookingConfirmation = async (email, bookingData) => {
  const subject = 'Xác nhận đặt tour thành công - Công Ty Du Lịch Việt';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
      <div style="background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
        <h2 style="color: #e74c3c; text-align: center;">CÔNG TY DU LỊCH VIỆT</h2>
        <h3 style="text-align: center; color: #333;">Xác nhận đặt tour</h3>
        <div style="background-color: #f0f8ff; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p><strong>Mã đơn hàng:</strong> #${bookingData.ma_don_hang}</p>
          <p><strong>Tour:</strong> ${bookingData.ten_tour}</p>
          <p><strong>Ngày khởi hành:</strong> ${new Date(bookingData.ngay_khoi_hanh).toLocaleDateString('vi-VN')}</p>
          <p><strong>Số lượng khách:</strong> ${bookingData.so_luong_nguoi_lon} người lớn${bookingData.so_luong_tre_em > 0 ? `, ${bookingData.so_luong_tre_em} trẻ em` : ''}</p>
          <p><strong>Tổng tiền:</strong> ${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(bookingData.tong_tien)}</p>
          <p><strong>Trạng thái thanh toán:</strong> ${bookingData.trang_thai_thanh_toan}</p>
        </div>
        <p style="color: #555; text-align: center;">Cảm ơn bạn đã tin tưởng và lựa chọn Công Ty Du Lịch Việt.</p>
        <p style="color: #555; text-align: center;">Chúng tôi sẽ liên hệ với bạn trong thời gian sớm nhất để xác nhận chi tiết.</p>
        <hr style="border: 1px solid #eee; margin: 20px 0;">
        <p style="color: #999; font-size: 12px; text-align: center;">Hotline hỗ trợ: 1900 1234</p>
      </div>
    </div>
  `;
  return await sendEmail(email, subject, html);
};

// Gửi xác nhận thanh toán
export const sendPaymentConfirmation = async (email, bookingData) => {
  // Tương tự...
  return await sendEmail(email, 'Xác nhận thanh toán', '<p>Thanh toán thành công</p>');
};

// Gửi thông báo hủy tour
export const sendCancellationEmail = async (email, bookingData) => {
  return await sendEmail(email, 'Thông báo hủy đơn hàng', '<p>Đơn hàng đã được hủy</p>');
};