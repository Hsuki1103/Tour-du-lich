import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const tempDir = path.join(__dirname, '../../uploads/vouchers');

// Tạo thư mục nếu chưa có
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

export const generateVoucherPDF = async (bookingData) => {
  return new Promise((resolve, reject) => {
    try {
      const fileName = `voucher_${bookingData.ma_don_hang}_${Date.now()}.pdf`;
      const filePath = path.join(tempDir, fileName);

      const doc = new PDFDocument({
        size: 'A4',
        margin: 50
      });

      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);

      // Header
      doc
        .fontSize(24)
        .font('Helvetica-Bold')
        .fillColor('#e74c3c')
        .text('CÔNG TY DU LỊCH VIỆT', { align: 'center' })
        .moveDown(0.5);

      doc
        .fontSize(16)
        .font('Helvetica')
        .fillColor('#333')
        .text('VÉ ĐIỆN TỬ', { align: 'center' })
        .moveDown(1);

      // Divider
      doc
        .moveTo(50, doc.y)
        .lineTo(550, doc.y)
        .stroke('#e74c3c')
        .moveDown(1);

      // Thông tin đơn hàng
      doc
        .fontSize(12)
        .font('Helvetica-Bold')
        .fillColor('#333')
        .text('THÔNG TIN ĐƠN HÀNG', { underline: true })
        .moveDown(0.5);

      doc
        .font('Helvetica')
        .fontSize(11)
        .text(`Mã đơn hàng: #${bookingData.ma_don_hang}`)
        .text(`Ngày đặt: ${new Date(bookingData.ngay_dat).toLocaleString('vi-VN')}`)
        .text(`Trạng thái: ${bookingData.trang_thai_don_hang}`)
        .moveDown(1);

      // Thông tin tour
      doc
        .font('Helvetica-Bold')
        .fontSize(12)
        .text('THÔNG TIN TOUR', { underline: true })
        .moveDown(0.5);

      doc
        .font('Helvetica')
        .fontSize(11)
        .text(`Tên tour: ${bookingData.ten_tour}`)
        .text(`Điểm đến: ${bookingData.diem_den}`)
        .text(`Ngày khởi hành: ${new Date(bookingData.ngay_khoi_hanh).toLocaleDateString('vi-VN')}`)
        .text(`Số ngày: ${bookingData.so_ngay} ngày`)
        .moveDown(0.5);

      // Thông tin khách hàng
      doc
        .font('Helvetica-Bold')
        .fontSize(12)
        .text('THÔNG TIN KHÁCH HÀNG', { underline: true })
        .moveDown(0.5);

      doc
        .font('Helvetica')
        .fontSize(11)
        .text(`Họ tên: ${bookingData.ho_ten}`)
        .text(`Email: ${bookingData.email}`)
        .text(`Số điện thoại: ${bookingData.so_dien_thoai}`)
        .moveDown(0.5);

      // Thông tin hành khách
      if (bookingData.thong_tin_khach) {
        doc
          .font('Helvetica-Bold')
          .fontSize(12)
          .text('DANH SÁCH HÀNH KHÁCH', { underline: true })
          .moveDown(0.5);

        const khachList = typeof bookingData.thong_tin_khach === 'string' 
          ? JSON.parse(bookingData.thong_tin_khach) 
          : bookingData.thong_tin_khach;

        khachList.forEach((khach, index) => {
          doc
            .font('Helvetica')
            .fontSize(11)
            .text(`${index + 1}. ${khach.ho_ten} ${khach.loai_khach ? `(${khach.loai_khach})` : ''}`);
        });
        doc.moveDown(0.5);
      }

      // Chi tiết thanh toán
      doc
        .font('Helvetica-Bold')
        .fontSize(12)
        .text('CHI TIẾT THANH TOÁN', { underline: true })
        .moveDown(0.5);

      doc
        .font('Helvetica')
        .fontSize(11)
        .text(`Số lượng người lớn: ${bookingData.so_luong_nguoi_lon}`)
        .text(`Số lượng trẻ em: ${bookingData.so_luong_tre_em || 0}`)
        .text(`Tổng tiền: ${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(bookingData.tong_tien)}`)
        .text(`Trạng thái thanh toán: ${bookingData.trang_thai_thanh_toan}`)
        .moveDown(1);

      // Lưu ý
      doc
        .fontSize(10)
        .font('Helvetica')
        .fillColor('#666')
        .text('Lưu ý: Vui lòng mang theo vé này khi tham gia tour.', { align: 'center' })
        .text('Hotline hỗ trợ: 1900 1234', { align: 'center' });

      // Footer
      const pageBottom = doc.page.height - 50;
      doc
        .fontSize(8)
        .fillColor('#999')
        .text(`Mã vé: ${bookingData.ma_don_hang} | Ngày tạo: ${new Date().toLocaleString('vi-VN')}`, 
          pageBottom, 50, { align: 'center' });

      doc.end();

      stream.on('finish', () => {
        resolve({
          success: true,
          fileName: fileName,
          filePath: filePath
        });
      });

      stream.on('error', (error) => {
        reject(error);
      });

    } catch (error) {
      reject(error);
    }
  });
};

// Xóa file PDF cũ
export const cleanupOldVouchers = (hours = 24) => {
  try {
    const files = fs.readdirSync(tempDir);
    const now = Date.now();
    const maxAge = hours * 60 * 60 * 1000;

    files.forEach(file => {
      const filePath = path.join(tempDir, file);
      const stats = fs.statSync(filePath);
      if (now - stats.mtimeMs > maxAge) {
        fs.unlinkSync(filePath);
      }
    });
  } catch (error) {
    console.error('Error cleaning up vouchers:', error);
  }
};