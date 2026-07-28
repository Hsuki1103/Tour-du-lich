// backend/src/utils/emailService.js
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

// ============================================
// GỬI OTP
// ============================================
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

// ============================================
// GỬI XÁC NHẬN ĐẶT TOUR
// ============================================
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

// ============================================
// GỬI XÁC NHẬN THANH TOÁN
// ============================================
export const sendPaymentConfirmation = async (email, bookingData) => {
  const subject = 'Xác nhận thanh toán - Công Ty Du Lịch Việt';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
      <div style="background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
        <h2 style="color: #e74c3c; text-align: center;">CÔNG TY DU LỊCH VIỆT</h2>
        <h3 style="text-align: center; color: #333;">Xác nhận thanh toán</h3>
        <div style="background-color: #f0f8ff; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p><strong>Mã đơn hàng:</strong> #${bookingData.ma_don_hang}</p>
          <p><strong>Tour:</strong> ${bookingData.ten_tour}</p>
          <p><strong>Số tiền:</strong> ${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(bookingData.so_tien)}</p>
          <p><strong>Phương thức:</strong> ${bookingData.phuong_thuc}</p>
          <p><strong>Trạng thái:</strong> ${bookingData.trang_thai}</p>
        </div>
        <p style="color: #555; text-align: center;">Cảm ơn bạn đã thanh toán!</p>
        <hr style="border: 1px solid #eee; margin: 20px 0;">
        <p style="color: #999; font-size: 12px; text-align: center;">Hotline hỗ trợ: 1900 1234</p>
      </div>
    </div>
  `;
  return await sendEmail(email, subject, html);
};

// ============================================
// GỬI THÔNG BÁO HỦY ĐƠN HÀNG
// ============================================
export const sendCancellationEmail = async (email, bookingData) => {
  const subject = 'Thông báo hủy đơn hàng - Công Ty Du Lịch Việt';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
      <div style="background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
        <h2 style="color: #e74c3c; text-align: center;">CÔNG TY DU LỊCH VIỆT</h2>
        <h3 style="text-align: center; color: #333;">Thông báo hủy đơn hàng</h3>
        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p><strong>Mã đơn hàng:</strong> #${bookingData.ma_don_hang}</p>
          <p><strong>Tour:</strong> ${bookingData.ten_tour}</p>
          <p><strong>Lý do hủy:</strong> ${bookingData.ly_do_huy}</p>
          <p><strong>Trạng thái thanh toán:</strong> ${bookingData.trang_thai_thanh_toan}</p>
          <p><strong>Số ngày còn lại:</strong> ${bookingData.days_until_departure || 0} ngày</p>
        </div>
        <div style="background-color: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p style="color: #856404; margin: 0;">
            <strong>💰 Thông tin hoàn tiền:</strong>
          </p>
          <ul style="color: #856404; margin: 10px 0 0 0; padding-left: 20px;">
            <li>Tỷ lệ hoàn tiền: <strong>${bookingData.refund_label}</strong></li>
            <li>Số tiền hoàn lại: <strong>${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(bookingData.so_tien_hoan_lai || 0)}</strong></li>
          </ul>
        </div>
        <p style="color: #555; text-align: center;">Cảm ơn bạn đã tin tưởng và sử dụng dịch vụ của chúng tôi.</p>
        <hr style="border: 1px solid #eee; margin: 20px 0;">
        <p style="color: #999; font-size: 12px; text-align: center;">Hotline hỗ trợ: 1900 1234</p>
      </div>
    </div>
  `;
  return await sendEmail(email, subject, html);
};

// ============================================
// GỬI XÁC NHẬN YÊU CẦU HOÀN TIỀN
// ============================================
export const sendRefundRequestEmail = async (email, refundData) => {
  const subject = 'Xác nhận yêu cầu hoàn tiền - Công Ty Du Lịch Việt';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
      <div style="background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
        <h2 style="color: #e74c3c; text-align: center;">CÔNG TY DU LỊCH VIỆT</h2>
        <h3 style="text-align: center; color: #333;">Xác nhận yêu cầu hoàn tiền</h3>
        <div style="background-color: #f0f8ff; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p><strong>Mã đơn hàng:</strong> #${refundData.ma_don_hang}</p>
          <p><strong>Tour:</strong> ${refundData.ten_tour || 'N/A'}</p>
          <p><strong>Số tiền hoàn:</strong> ${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(refundData.so_tien)}</p>
          <p><strong>Phương thức:</strong> ${refundData.phuong_thuc || 'Chuyển khoản'}</p>
          <p><strong>Ngày yêu cầu:</strong> ${new Date(refundData.ngay_yeu_cau).toLocaleString('vi-VN')}</p>
        </div>
        <div style="background-color: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p style="color: #856404; margin: 0;">
            <strong>📌 Lưu ý quan trọng:</strong>
          </p>
          <ul style="color: #856404; margin: 10px 0 0 0; padding-left: 20px;">
            <li>Thời gian xử lý hoàn tiền: <strong>3-5 ngày làm việc</strong></li>
            <li>Vui lòng kiểm tra email để theo dõi tiến trình</li>
            <li>Nếu có thắc mắc, vui lòng liên hệ hotline: <strong>1900 1234</strong></li>
          </ul>
        </div>
        <p style="color: #555; text-align: center;">Cảm ơn bạn đã tin tưởng và sử dụng dịch vụ của chúng tôi.</p>
        <hr style="border: 1px solid #eee; margin: 20px 0;">
        <p style="color: #999; font-size: 12px; text-align: center;">Hotline hỗ trợ: 1900 1234</p>
      </div>
    </div>
  `;
  return await sendEmail(email, subject, html);
};

// ============================================
// GỬI THÔNG BÁO ĐÃ HOÀN TIỀN
// ============================================
export const sendRefundApprovedEmail = async (email, refundData) => {
  const subject = 'Thông báo hoàn tiền thành công - Công Ty Du Lịch Việt';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
      <div style="background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
        <h2 style="color: #e74c3c; text-align: center;">CÔNG TY DU LỊCH VIỆT</h2>
        <h3 style="text-align: center; color: #333;">✅ Hoàn tiền thành công</h3>
        <div style="background-color: #f0f8ff; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p><strong>Mã đơn hàng:</strong> #${refundData.ma_don_hang}</p>
          <p><strong>Tour:</strong> ${refundData.ten_tour || 'N/A'}</p>
          <p><strong>Số tiền hoàn:</strong> ${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(refundData.so_tien)}</p>
          <p><strong>Phương thức:</strong> ${refundData.phuong_thuc || 'Chuyển khoản'}</p>
          <p><strong>Thời gian:</strong> ${new Date().toLocaleString('vi-VN')}</p>
        </div>
        <div style="background-color: #d4edda; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p style="color: #155724; margin: 0;">
            <strong>📌 Lưu ý:</strong> Số tiền đã được chuyển đến tài khoản của bạn. 
            Vui lòng kiểm tra trong vòng 1-3 ngày làm việc.
          </p>
        </div>
        <p style="color: #555; text-align: center;">Cảm ơn bạn đã tin tưởng và sử dụng dịch vụ của chúng tôi.</p>
        <hr style="border: 1px solid #eee; margin: 20px 0;">
        <p style="color: #999; font-size: 12px; text-align: center;">Hotline hỗ trợ: 1900 1234</p>
      </div>
    </div>
  `;
  return await sendEmail(email, subject, html);
};

// ============================================
// GỬI THÔNG BÁO TỪ CHỐI HOÀN TIỀN
// ============================================
export const sendRefundRejectedEmail = async (email, refundData) => {
  const subject = 'Thông báo từ chối hoàn tiền - Công Ty Du Lịch Việt';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
      <div style="background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
        <h2 style="color: #e74c3c; text-align: center;">CÔNG TY DU LỊCH VIỆT</h2>
        <h3 style="text-align: center; color: #e74c3c;">❌ Thông báo từ chối hoàn tiền</h3>
        <div style="background-color: #f8d7da; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p><strong>Mã đơn hàng:</strong> #${refundData.ma_don_hang}</p>
          <p><strong>Tour:</strong> ${refundData.ten_tour || 'N/A'}</p>
          <p><strong>Lý do từ chối:</strong> ${refundData.ly_do_tu_choi}</p>
        </div>
        <div style="background-color: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p style="color: #856404; margin: 0;">
            <strong>📌 Lưu ý:</strong> Nếu bạn có thắc mắc, vui lòng liên hệ hotline để được hỗ trợ.
          </p>
        </div>
        <p style="color: #555; text-align: center;">Cảm ơn bạn đã tin tưởng và sử dụng dịch vụ của chúng tôi.</p>
        <hr style="border: 1px solid #eee; margin: 20px 0;">
        <p style="color: #999; font-size: 12px; text-align: center;">Hotline hỗ trợ: 1900 1234</p>
      </div>
    </div>
  `;
  return await sendEmail(email, subject, html);
};

// ============================================
// ⭐ GỬI EMAIL MÃ GIẢM GIÁ CHO KHÁCH HÀNG
// ============================================
export const sendDiscountEmail = async (email, discountData) => {
  const subject = '🎁 Mã giảm giá đặc biệt dành cho bạn - Công Ty Du Lịch Việt';
  
  const discountValue = discountData.loai_giam === 'Phần trăm' 
    ? `${discountData.muc_giam}%` 
    : new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(discountData.muc_giam);
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
      <div style="background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
        <div style="text-align: center; border-bottom: 3px solid #e74c3c; padding-bottom: 20px; margin-bottom: 20px;">
          <h2 style="color: #e74c3c; margin: 0;">CÔNG TY DU LỊCH VIỆT</h2>
          <p style="color: #666; margin: 5px 0 0;">🎁 MÃ GIẢM GIÁ ĐẶC BIỆT</p>
        </div>

        <div style="text-align: center; padding: 20px 0;">
          <p style="color: #555; font-size: 16px;">Xin chào <strong>${discountData.ho_ten}</strong>,</p>
          <p style="color: #555; font-size: 16px;">Cảm ơn bạn đã tin tưởng và sử dụng dịch vụ của chúng tôi!</p>
          <p style="color: #555; font-size: 16px;">Chúng tôi xin gửi tặng bạn mã giảm giá đặc biệt:</p>
        </div>

        <div style="background: linear-gradient(135deg, #e74c3c, #c0392b); padding: 20px; border-radius: 10px; text-align: center; margin: 20px 0;">
          <p style="color: #fff; font-size: 14px; margin: 0; opacity: 0.9;">MÃ GIẢM GIÁ</p>
          <p style="color: #fff; font-size: 36px; font-weight: bold; letter-spacing: 5px; margin: 10px 0; font-family: monospace;">
            ${discountData.ma_code}
          </p>
          <p style="color: #fff; font-size: 18px; margin: 5px 0;">
            Giảm <strong>${discountValue}</strong>
            ${discountData.giam_toi_da ? `(Tối đa ${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(discountData.giam_toi_da)})` : ''}
          </p>
        </div>

        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p style="margin: 5px 0; color: #333; font-size: 14px;">
            <strong>📋 Thông tin chương trình:</strong>
          </p>
          <p style="margin: 5px 0; color: #555; font-size: 14px;">
            📝 ${discountData.ten_chuong_trinh}
          </p>
          <p style="margin: 5px 0; color: #555; font-size: 14px;">
            👥 Yêu cầu tối thiểu: <strong>${discountData.yeu_cau_toi_thieu} khách</strong>
          </p>
          <p style="margin: 5px 0; color: #555; font-size: 14px;">
            📅 Hạn sử dụng: <strong>${new Date(discountData.ngay_ket_thuc).toLocaleDateString('vi-VN')}</strong>
          </p>
        </div>

        <div style="background-color: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #ffc107;">
          <p style="margin: 0; color: #856404; font-size: 14px;">
            <strong>💡 Hướng dẫn sử dụng:</strong>
          </p>
          <ul style="margin: 10px 0 0; padding-left: 20px; color: #856404; font-size: 14px;">
            <li>Nhập mã <strong>${discountData.ma_code}</strong> khi đặt tour</li>
            <li>Áp dụng cho đơn hàng có số khách từ ${discountData.yeu_cau_toi_thieu} trở lên</li>
            <li>Mã có hiệu lực đến hết ngày ${new Date(discountData.ngay_ket_thuc).toLocaleDateString('vi-VN')}</li>
          </ul>
        </div>

        <div style="text-align: center; margin: 25px 0 10px;">
          <a href="${process.env.CLIENT_URL || 'http://localhost:3000'}/tours" 
             style="display: inline-block; background-color: #e74c3c; color: #fff; padding: 12px 30px; border-radius: 5px; text-decoration: none; font-weight: bold;">
            🚀 ĐẶT TOUR NGAY
          </a>
        </div>

        <div style="border-top: 1px solid #eee; padding-top: 20px; margin-top: 20px;">
          <p style="color: #999; font-size: 12px; text-align: center; margin: 0;">
            Nếu bạn có bất kỳ thắc mắc nào, vui lòng liên hệ hotline: <strong>1900 1234</strong>
          </p>
          <p style="color: #999; font-size: 12px; text-align: center; margin: 5px 0 0;">
            © 2024 Công Ty Du Lịch Việt. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  `;
  
  return await sendEmail(email, subject, html);
};