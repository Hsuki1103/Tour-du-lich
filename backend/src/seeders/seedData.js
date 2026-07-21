import { 
  VaiTro, 
  NguoiDung, 
  Admin, 
  NhanVien, 
  Tour, 
  LichKhoiHanh,
  MaGiamGia,
  DonDatTour,
  ThanhToan,
  DanhGia
} from '../models/index.js';
import bcrypt from 'bcryptjs';
import { Op } from 'sequelize';

export const seedDatabase = async () => {
  console.log('🌱 Seeding database with sample data...');

  // ============================================
  // 1. SEED ROLES
  // ============================================
  const roles = await VaiTro.bulkCreate([
    { ten_vai_tro: 'Admin', mo_ta: 'Quản trị viên hệ thống' },
    { ten_vai_tro: 'Nhân viên', mo_ta: 'Nhân viên công ty du lịch' },
    { ten_vai_tro: 'Khách hàng', mo_ta: 'Khách hàng sử dụng dịch vụ' }
  ], { ignoreDuplicates: true });
  console.log(`✅ Created ${roles.length} roles`);

  // ============================================
  // 2. SEED USERS
  // ============================================
  const salt = await bcrypt.genSalt(10);
  const adminPassword = await bcrypt.hash('admin123', salt);
  const empPassword = await bcrypt.hash('employee123', salt);
  const custPassword = await bcrypt.hash('customer123', salt);

  // Admin
  const [adminUser] = await NguoiDung.findOrCreate({
    where: { email: 'admin@dulichviet.com' },
    defaults: {
      ma_vai_tro: 1,
      ho_ten: 'Nguyễn Quản Trị',
      email: 'admin@dulichviet.com',
      so_dien_thoai: '0900000001',
      mat_khau: adminPassword,
      anh_dai_dien: 'https://res.cloudinary.com/demo/image/upload/v1/avatars/admin.jpg',
      ngay_sinh: '1990-01-15',
      gioi_tinh: 'Nam',
      dia_chi: '123 Đường ABC, Quận 1, TP.HCM',
      trang_thai: 'Đang hoạt động'
    }
  });
  console.log(`✅ Admin: admin@dulichviet.com / admin123`);

  await Admin.findOrCreate({
    where: { ma_nguoi_dung: adminUser.ma_nguoi_dung },
    defaults: { ma_nguoi_dung: adminUser.ma_nguoi_dung }
  });

  // Employee 1
  const [empUser1] = await NguoiDung.findOrCreate({
    where: { email: 'nhanvien1@dulichviet.com' },
    defaults: {
      ma_vai_tro: 2,
      ho_ten: 'Trần Văn Nhân',
      email: 'nhanvien1@dulichviet.com',
      so_dien_thoai: '0900000002',
      mat_khau: empPassword,
      anh_dai_dien: 'https://res.cloudinary.com/demo/image/upload/v1/avatars/employee1.jpg',
      ngay_sinh: '1995-03-20',
      gioi_tinh: 'Nam',
      dia_chi: '456 Đường XYZ, Quận 2, TP.HCM',
      trang_thai: 'Đang hoạt động'
    }
  });
  console.log(`✅ Employee 1: nhanvien1@dulichviet.com / employee123`);

  await NhanVien.findOrCreate({
    where: { ma_nguoi_dung: empUser1.ma_nguoi_dung },
    defaults: {
      ma_nguoi_dung: empUser1.ma_nguoi_dung,
      chuc_vu: 'Trưởng phòng kinh doanh',
      phong_ban: 'Kinh doanh',
      ngay_vao_lam: new Date('2023-01-01')
    }
  });

  // Employee 2
  const [empUser2] = await NguoiDung.findOrCreate({
    where: { email: 'nhanvien2@dulichviet.com' },
    defaults: {
      ma_vai_tro: 2,
      ho_ten: 'Lê Thị Hương',
      email: 'nhanvien2@dulichviet.com',
      so_dien_thoai: '0900000003',
      mat_khau: empPassword,
      anh_dai_dien: 'https://res.cloudinary.com/demo/image/upload/v1/avatars/employee2.jpg',
      ngay_sinh: '1992-07-10',
      gioi_tinh: 'Nữ',
      dia_chi: '789 Đường DEF, Quận 3, TP.HCM',
      trang_thai: 'Đang hoạt động'
    }
  });
  console.log(`✅ Employee 2: nhanvien2@dulichviet.com / employee123`);

  await NhanVien.findOrCreate({
    where: { ma_nguoi_dung: empUser2.ma_nguoi_dung },
    defaults: {
      ma_nguoi_dung: empUser2.ma_nguoi_dung,
      chuc_vu: 'Nhân viên tư vấn',
      phong_ban: 'Tư vấn',
      ngay_vao_lam: new Date('2023-06-15')
    }
  });

  // Customer 1
  const [custUser1] = await NguoiDung.findOrCreate({
    where: { email: 'customer1@gmail.com' },
    defaults: {
      ma_vai_tro: 3,
      ho_ten: 'Nguyễn Văn An',
      email: 'customer1@gmail.com',
      so_dien_thoai: '0912345678',
      mat_khau: custPassword,
      anh_dai_dien: 'https://res.cloudinary.com/demo/image/upload/v1/avatars/customer1.jpg',
      ngay_sinh: '1988-05-12',
      gioi_tinh: 'Nam',
      dia_chi: '12 Nguyễn Huệ, Quận 1, TP.HCM',
      so_cccd: '123456789012',
      trang_thai: 'Đang hoạt động'
    }
  });
  console.log(`✅ Customer 1: customer1@gmail.com / customer123`);

  // Customer 2
  const [custUser2] = await NguoiDung.findOrCreate({
    where: { email: 'customer2@gmail.com' },
    defaults: {
      ma_vai_tro: 3,
      ho_ten: 'Trần Thị Mai',
      email: 'customer2@gmail.com',
      so_dien_thoai: '0987654321',
      mat_khau: custPassword,
      anh_dai_dien: 'https://res.cloudinary.com/demo/image/upload/v1/avatars/customer2.jpg',
      ngay_sinh: '1995-11-25',
      gioi_tinh: 'Nữ',
      dia_chi: '34 Lê Lợi, Quận 1, TP.HCM',
      so_cccd: '987654321098',
      trang_thai: 'Đang hoạt động'
    }
  });
  console.log(`✅ Customer 2: customer2@gmail.com / customer123`);

  // Customer 3
  const [custUser3] = await NguoiDung.findOrCreate({
    where: { email: 'customer3@gmail.com' },
    defaults: {
      ma_vai_tro: 3,
      ho_ten: 'Phạm Văn Bình',
      email: 'customer3@gmail.com',
      so_dien_thoai: '0934567890',
      mat_khau: custPassword,
      anh_dai_dien: 'https://res.cloudinary.com/demo/image/upload/v1/avatars/customer3.jpg',
      ngay_sinh: '1990-09-08',
      gioi_tinh: 'Nam',
      dia_chi: '56 Hai Bà Trưng, Quận 3, TP.HCM',
      so_cccd: '456789012345',
      trang_thai: 'Đang hoạt động'
    }
  });
  console.log(`✅ Customer 3: customer3@gmail.com / customer123`);

  // ============================================
  // 3. SEED TOURS (WITH IMAGES)
  // ============================================
  const tourData = [
    {
      ten_tour: 'Tour Đà Nẵng - Hội An - Bà Nà 4N3Đ',
      diem_den: 'Đà Nẵng, Hội An',
      khu_vuc: 'Miền Trung',
      so_ngay: 4,
      mo_ta_ngan: 'Khám phá thành phố biển Đà Nẵng, phố cổ Hội An và Bà Nà Hills',
      mo_ta_chi_tiet: `Tour 4 ngày 3 đêm khám phá Đà Nẵng - Hội An - Bà Nà Hills.

📍 ĐIỂM NỔI BẬT:
• Tham quan Bà Nà Hills với cầu Vàng nổi tiếng
• Dạo phố cổ Hội An về đêm với những chiếc đèn lồng lung linh
• Tắm biển Đà Nẵng - một trong những bãi biển đẹp nhất hành tinh
• Khám phá bán đảo Sơn Trà với đỉnh cao 693m
• Thưởng thức hải sản tươi sống tại bãi biển Mỹ Khê

🏨 DỊCH VỤ BAO GỒM:
• Khách sạn 4 sao tiêu chuẩn quốc tế
• Xe đưa đón suốt tour
• Bữa sáng buffet tại khách sạn
• Bữa trưa các ngày theo chương trình
• Vé tham quan các điểm theo chương trình
• Hướng dẫn viên tiếng Việt chuyên nghiệp

📅 LỊCH TRÌNH:
Ngày 1: TP.HCM - Đà Nẵng - Bà Nà Hills
Ngày 2: Bà Nà Hills - Đà Nẵng - Hội An
Ngày 3: Hội An - Đà Nẵng
Ngày 4: Đà Nẵng - TP.HCM`,
      lich_trinh: `📅 NGÀY 1: TP.HCM - ĐÀ NẴNG - BÀ NÀ HILLS
🛫 07:00: Xe đón tại sân bay Đà Nẵng
🚌 08:30: Di chuyển đến Bà Nà Hills
🎡 09:30: Tham quan Bà Nà Hills, cầu Vàng
🍽️ 12:00: Ăn trưa tại nhà hàng Bà Nà
🎠 14:00: Vui chơi tại Fantasy Park
🏨 17:00: Về khách sạn, nhận phòng
🌃 19:00: Tối tự do khám phá phố Hội An

📅 NGÀY 2: BÀ NÀ HILLS - ĐÀ NẴNG - HỘI AN
🍳 07:30: Ăn sáng tại khách sạn
🏖️ 09:00: Di chuyển về Đà Nẵng, tham quan bãi biển Mỹ Khê
🏛️ 11:00: Tham quan chùa Linh Ứng, bán đảo Sơn Trà
🍽️ 12:30: Ăn trưa
🏮 14:00: Di chuyển đến Hội An
🚶 15:00: Tham quan phố cổ Hội An: Chùa Cầu, nhà cổ, hội quán
🌃 18:00: Thả đèn hoa đăng trên sông Hoài
🏨 20:00: Về khách sạn nghỉ ngơi

📅 NGÀY 3: HỘI AN - ĐÀ NẴNG
🍳 08:00: Ăn sáng và trải nghiệm văn hóa địa phương
🛶 09:30: Tham quan làng gốm Thanh Hà
🌾 11:00: Trải nghiệm làm nón lá, đèn lồng
🍽️ 12:30: Ăn trưa với đặc sản cao lầu, bánh mì Phượng
🏖️ 14:30: Quay trở lại Đà Nẵng, tham quan bãi biển Mỹ Khê
🌅 17:30: Chiêm ngưỡng hoàng hôn trên bán đảo Sơn Trà
🍽️ 19:00: Ăn tối hải sản tại bãi biển
🏨 21:00: Về khách sạn

📅 NGÀY 4: ĐÀ NẴNG - TP.HCM
🍳 08:00: Ăn sáng tại khách sạn
🛍️ 09:30: Mua sắm đặc sản Đà Nẵng
✈️ 11:30: Đến sân bay, làm thủ tục bay về
🛬 13:00: Về TP.HCM, kết thúc chuyến đi`,
      dich_vu_bao_gom: `✅ DỊCH VỤ BAO GỒM:
• Khách sạn 4 sao (3 đêm) tiêu chuẩn quốc tế
• Xe ô tô du lịch đời mới có điều hòa
• Bữa sáng buffet tại khách sạn (3 bữa)
• Bữa trưa theo chương trình (3 bữa)
• Bữa tối theo chương trình (2 bữa)
• Vé tham quan Bà Nà Hills (cáp treo, Fantasy Park)
• Vé tham quan các điểm theo chương trình
• Hướng dẫn viên tiếng Việt chuyên nghiệp
• Nước uống trên xe (1 chai/ngày)
• Bảo hiểm du lịch (20.000.000đ/vụ)

❌ DỊCH VỤ KHÔNG BAO GỒM:
• Vé máy bay khứ hồi
• Chi phí cá nhân (mua sắm, ăn uống ngoài chương trình)
• Tiền tip cho hướng dẫn viên, lái xe
• Phí phát sinh do thay đổi kế hoạch`,
      chinh_sach_huy: `📋 CHÍNH SÁCH HỦY TOUR:
• Hủy trước 15 ngày: Hoàn 100% tiền tour
• Hủy trước 10 ngày: Hoàn 75% tiền tour
• Hủy trước 7 ngày: Hoàn 50% tiền tour
• Hủy trước 3 ngày: Hoàn 30% tiền tour
• Hủy dưới 3 ngày: Không hoàn tiền

📌 LƯU Ý:
• Phí chuyển tour: 200.000đ/lần
• Thay đổi ngày khởi hành: 300.000đ/lần
• Trường hợp bất khả kháng: Xử lý theo thỏa thuận`,
      hinh_anh: 'https://res.cloudinary.com/demo/image/upload/v1/tours/da-nang-hoi-an-ba-na.jpg',
      hinh_anh_phu: JSON.stringify([
        'https://res.cloudinary.com/demo/image/upload/v1/tours/da-nang-beach.jpg',
        'https://res.cloudinary.com/demo/image/upload/v1/tours/hoi-an-old-town.jpg',
        'https://res.cloudinary.com/demo/image/upload/v1/tours/golden-bridge.jpg',
        'https://res.cloudinary.com/demo/image/upload/v1/tours/ba-na-hills.jpg'
      ]),
      trang_thai: 'Đang hoạt động'
    },
    {
      ten_tour: 'Tour Phú Quốc - Thiên đường biển đảo 5N4Đ',
      diem_den: 'Phú Quốc',
      khu_vuc: 'Miền Nam',
      so_ngay: 5,
      mo_ta_ngan: 'Trải nghiệm kỳ nghỉ tuyệt vời tại đảo ngọc Phú Quốc',
      mo_ta_chi_tiet: `Tour 5 ngày 4 đêm tại Phú Quốc - Hòn đảo ngọc của Việt Nam.

📍 ĐIỂM NỔI BẬT:
• Khám phá vườn quốc gia Phú Quốc
• Tham quan nhà tù Phú Quốc lịch sử
• Tắm biển tại bãi Sao - bãi biển đẹp nhất Phú Quốc
• Trải nghiệm cáp treo vượt biển dài nhất thế giới
• Tham quan làng chài truyền thống

🏨 DỊCH VỤ BAO GỒM:
• Khách sạn 5 sao ven biển
• Xe đưa đón sân bay
• 3 bữa chính/ngày
• Vé tham quan các điểm
• Hướng dẫn viên tiếng Việt

📅 LỊCH TRÌNH:
Ngày 1: Đón tại sân bay - Khám phá thành phố
Ngày 2: Vườn quốc gia - Bãi Sao
Ngày 3: Cáp treo - Đảo Hòn Thơm
Ngày 4: Nhà tù - Làng chài
Ngày 5: Tự do - Về`,
      lich_trinh: `📅 NGÀY 1: TP.HCM - PHÚ QUỐC
✈️ 07:30: Bay từ TP.HCM đi Phú Quốc
🚌 09:00: Xe đón tại sân bay
🏨 10:00: Nhận phòng khách sạn
🌴 14:00: Tham quan Dinh Cậu, chùa Hộ Quốc
🌅 17:30: Ngắm hoàng hôn tại bãi Trường
🍽️ 19:00: Ăn tối đặc sản hải sản Phú Quốc

📅 NGÀY 2: VƯỜN QUỐC GIA - BÃI SAO
🍳 08:00: Ăn sáng tại khách sạn
🌿 09:30: Khám phá vườn quốc gia Phú Quốc
🦋 11:00: Tham quan vườn bướm
🍽️ 12:30: Ăn trưa
🏖️ 14:00: Bãi Sao - bơi lội, tắm biển
🎣 17:00: Câu cá đêm
🍽️ 19:00: Ăn tối

📅 NGÀY 3: CÁP TREO - ĐẢO HÒN THƠM
🍳 08:00: Ăn sáng
🚡 09:30: Cáp treo vượt biển ra đảo Hòn Thơm
🏊 11:00: Vui chơi tại công viên nước
🍽️ 12:30: Ăn trưa trên đảo
🏖️ 14:00: Tắm biển tại bãi tắm Hòn Thơm
🚡 17:00: Về Phú Quốc
🍽️ 19:00: Ăn tối

📅 NGÀY 4: NHÀ TÙ - LÀNG CHÀI
🍳 08:00: Ăn sáng
🏛️ 09:30: Tham quan nhà tù Phú Quốc
⛵ 11:30: Làng chài Hàm Ninh
🍽️ 12:30: Ăn trưa hải sản
🛍️ 14:00: Mua sắm tại chợ đêm Phú Quốc
🌅 17:30: Ngắm hoàng hôn
🍽️ 19:00: Ăn tối với đặc sản nước mắm

📅 NGÀY 5: PHÚ QUỐC - TP.HCM
🍳 08:00: Ăn sáng, tự do
🛍️ 10:00: Mua sắm đặc sản
✈️ 12:00: Đến sân bay bay về
🛬 14:00: Về TP.HCM, kết thúc tour`,
      dich_vu_bao_gom: `✅ DỊCH VỤ BAO GỒM:
• Khách sạn 5 sao ven biển (4 đêm)
• Xe đưa đón sân bay
• Bữa sáng buffet tại khách sạn (4 bữa)
• Bữa trưa theo chương trình (4 bữa)
• Bữa tối theo chương trình (4 bữa)
• Vé cáp treo vượt biển
• Vé tham quan các điểm
• Hướng dẫn viên tiếng Việt
• Bảo hiểm du lịch (20.000.000đ/vụ)

❌ DỊCH VỤ KHÔNG BAO GỒM:
• Vé máy bay khứ hồi
• Chi phí cá nhân
• Tiền tip`,
      chinh_sach_huy: `📋 CHÍNH SÁCH HỦY TOUR:
• Hủy trước 14 ngày: Hoàn 100% tiền tour
• Hủy trước 10 ngày: Hoàn 70% tiền tour
• Hủy trước 7 ngày: Hoàn 50% tiền tour
• Hủy trước 3 ngày: Hoàn 30% tiền tour
• Hủy dưới 3 ngày: Không hoàn tiền`,
      hinh_anh: 'https://res.cloudinary.com/demo/image/upload/v1/tours/phu-quoc-island.jpg',
      hinh_anh_phu: JSON.stringify([
        'https://res.cloudinary.com/demo/image/upload/v1/tours/phu-quoc-beach.jpg',
        'https://res.cloudinary.com/demo/image/upload/v1/tours/phu-quoc-sunset.jpg',
        'https://res.cloudinary.com/demo/image/upload/v1/tours/phu-quoc-night-market.jpg',
        'https://res.cloudinary.com/demo/image/upload/v1/tours/phu-quoc-cable-car.jpg'
      ]),
      trang_thai: 'Đang hoạt động'
    },
    {
      ten_tour: 'Tour Hà Nội - Hạ Long - Ninh Bình 5N4Đ',
      diem_den: 'Hà Nội, Hạ Long, Ninh Bình',
      khu_vuc: 'Miền Bắc',
      so_ngay: 5,
      mo_ta_ngan: 'Khám phá thủ đô Hà Nội, vịnh Hạ Long và Ninh Bình',
      mo_ta_chi_tiet: `Tour 5 ngày 4 đêm khám phá Hà Nội - Hạ Long - Ninh Bình.

📍 ĐIỂM NỔI BẬT:
• Tham quan vịnh Hạ Long - Kỳ quan thiên nhiên thế giới
• Khám phá phố cổ Hà Nội - Hồ Hoàn Kiếm
• Tham quan Tràng An - Vịnh Hạ Long trên cạn
• Khám phá cố đô Hoa Lư
• Trải nghiệm văn hóa ẩm thực Hà Nội

🏨 DỊCH VỤ BAO GỒM:
• Khách sạn 4 sao (Hà Nội, Hạ Long)
• Cruiser 5 sao trên vịnh Hạ Long (1 đêm)
• Xe đưa đón suốt tour
• 3 bữa chính/ngày
• Vé tham quan các điểm

📅 LỊCH TRÌNH:
Ngày 1: Hà Nội - Tham quan phố cổ
Ngày 2: Hà Nội - Hạ Long
Ngày 3: Hạ Long - Hà Nội
Ngày 4: Hà Nội - Ninh Bình
Ngày 5: Ninh Bình - Hà Nội`,
      lich_trinh: `📅 NGÀY 1: TP.HCM - HÀ NỘI
✈️ 07:00: Bay từ TP.HCM ra Hà Nội
🚌 09:00: Đón tại sân bay
🏛️ 10:30: Tham quan Văn Miếu - Quốc Tử Giám
🏯 11:30: Tham quan Hoàng thành Thăng Long
🍽️ 12:30: Ăn trưa - Ẩm thực Hà Nội
🛵 14:00: Khám phá phố cổ Hà Nội (36 phố phường)
🏠 16:00: Tham quan chùa Trấn Quốc
🌅 17:30: Ngắm hoàng hôn tại Hồ Tây
🍽️ 19:00: Ăn tối - Đặc sản phở Hà Nội

📅 NGÀY 2: HÀ NỘI - HẠ LONG
🍳 07:30: Ăn sáng tại khách sạn
🚌 09:00: Di chuyển từ Hà Nội ra Hạ Long (3.5h)
🍽️ 12:30: Ăn trưa tại Hạ Long
🚢 14:00: Lên tàu cruise tham quan vịnh Hạ Long
🛶 15:30: Tham quan hang Sửng Sốt
🏊 17:00: Bơi lội tại bãi tắm Ti Tốp
🌅 18:30: Ngắm hoàng hôn trên vịnh
🍽️ 19:30: Ăn tối trên tàu

📅 NGÀY 3: HẠ LONG - HÀ NỘI
🧘 06:00: Tập thể dục buổi sáng trên tàu
🍳 07:00: Ăn sáng
🛶 08:30: Tham quan làng chài nổi
🚢 10:00: Quay trở lại bến tàu
🚌 11:30: Di chuyển về Hà Nội
🍽️ 13:00: Ăn trưa
🛍️ 15:00: Tự do khám phá Hà Nội
🍽️ 19:00: Ăn tối

📅 NGÀY 4: HÀ NỘI - NINH BÌNH
🍳 07:30: Ăn sáng
🚌 09:00: Di chuyển đến Ninh Bình (2h)
🛶 11:00: Tham quan Tràng An - Vịnh Hạ Long trên cạn
🍽️ 12:30: Ăn trưa tại Ninh Bình
🏛️ 14:00: Tham quan cố đô Hoa Lư
🚲 16:00: Đạp xe khám phá làng quê
🌅 17:30: Ngắm hoàng hôn tại Tam Cốc
🍽️ 19:00: Ăn tối

📅 NGÀY 5: NINH BÌNH - HÀ NỘI - TP.HCM
🍳 08:00: Ăn sáng
🚌 09:30: Tham quan chùa Bái Đính
🍽️ 11:30: Ăn trưa
🚌 13:00: Về Hà Nội
🛍️ 15:00: Mua sắm đặc sản Hà Nội
✈️ 17:00: Đến sân bay bay về
🛬 19:00: Về TP.HCM, kết thúc tour`,
      dich_vu_bao_gom: `✅ DỊCH VỤ BAO GỒM:
• Khách sạn 4 sao tại Hà Nội (2 đêm)
• Cruise 5 sao trên vịnh Hạ Long (1 đêm)
• Khách sạn tại Ninh Bình (1 đêm)
• Xe đưa đón suốt tour
• Bữa sáng buffet (4 bữa)
• Bữa trưa theo chương trình (5 bữa)
• Bữa tối theo chương trình (4 bữa)
• Vé tham quan các điểm
• Hướng dẫn viên tiếng Việt
• Bảo hiểm du lịch (20.000.000đ/vụ)

❌ DỊCH VỤ KHÔNG BAO GỒM:
• Vé máy bay khứ hồi
• Chi phí cá nhân
• Tiền tip`,
      chinh_sach_huy: `📋 CHÍNH SÁCH HỦY TOUR:
• Hủy trước 15 ngày: Hoàn 100% tiền tour
• Hủy trước 10 ngày: Hoàn 70% tiền tour
• Hủy trước 7 ngày: Hoàn 50% tiền tour
• Hủy trước 3 ngày: Hoàn 30% tiền tour
• Hủy dưới 3 ngày: Không hoàn tiền`,
      hinh_anh: 'https://res.cloudinary.com/demo/image/upload/v1/tours/ha-noi-ha-long.jpg',
      hinh_anh_phu: JSON.stringify([
        'https://res.cloudinary.com/demo/image/upload/v1/tours/halong-bay.jpg',
        'https://res.cloudinary.com/demo/image/upload/v1/tours/hanoi-old-quarter.jpg',
        'https://res.cloudinary.com/demo/image/upload/v1/tours/trang-an.jpg',
        'https://res.cloudinary.com/demo/image/upload/v1/tours/hoa-lu.jpg'
      ]),
      trang_thai: 'Đang hoạt động'
    },
    {
      ten_tour: 'Tour Đà Lạt - Thành phố ngàn hoa 3N2Đ',
      diem_den: 'Đà Lạt',
      khu_vuc: 'Miền Nam',
      so_ngay: 3,
      mo_ta_ngan: 'Trải nghiệm thành phố ngàn hoa với không khí mát mẻ',
      mo_ta_chi_tiet: `Tour 3 ngày 2 đêm tại Đà Lạt - Thành phố tình yêu.

📍 ĐIỂM NỔI BẬT:
• Tham quan hồ Xuân Hương - Trái tim của Đà Lạt
• Khám phá thung lũng tình yêu
• Tham quan nhà thờ Con Gà
• Ghé thăm làng hoa Vạn Thành
• Trải nghiệm cà phê sạch tại Cầu Đất

🏨 DỊCH VỤ BAO GỒM:
• Khách sạn 4 sao trung tâm
• Xe đưa đón suốt tour
• 3 bữa chính/ngày
• Vé tham quan các điểm

📅 LỊCH TRÌNH:
Ngày 1: TP.HCM - Đà Lạt - Thăm thành phố
Ngày 2: Đà Lạt - Tham quan các điểm nổi tiếng
Ngày 3: Đà Lạt - TP.HCM`,
      lich_trinh: `📅 NGÀY 1: TP.HCM - ĐÀ LẠT
🚌 07:00: Xe đón tại TP.HCM di chuyển lên Đà Lạt
🍽️ 12:00: Ăn trưa
🏨 14:00: Nhận phòng khách sạn
🏛️ 15:00: Tham quan nhà thờ Con Gà
🌳 16:30: Tham quan thung lũng tình yêu
🌅 17:30: Ngắm hoàng hôn tại Hồ Xuân Hương
🍽️ 19:00: Ăn tối

📅 NGÀY 2: ĐÀ LẠT - KHÁM PHÁ THÀNH PHỐ
🍳 07:30: Ăn sáng tại khách sạn
🌸 08:30: Tham quan làng hoa Vạn Thành
🏯 10:00: Tham quan Dinh Bảo Đại
🍽️ 12:00: Ăn trưa
☕ 13:30: Tham quan nhà máy cà phê Cầu Đất
🌲 15:30: Khám phá rừng thông Đà Lạt
🏖️ 17:00: Tham quan hồ Tuyền Lâm
🍽️ 19:00: Ăn tối

📅 NGÀY 3: ĐÀ LẠT - TP.HCM
🍳 08:00: Ăn sáng
🛍️ 09:30: Mua sắm đặc sản Đà Lạt
🚌 11:00: Check-out khách sạn, di chuyển về
🍽️ 12:30: Ăn trưa trên đường
🛬 17:00: Về TP.HCM, kết thúc tour`,
      dich_vu_bao_gom: `✅ DỊCH VỤ BAO GỒM:
• Khách sạn 4 sao (2 đêm)
• Xe đưa đón suốt tour
• Bữa sáng buffet (2 bữa)
• Bữa trưa (3 bữa)
• Bữa tối (2 bữa)
• Vé tham quan các điểm
• Hướng dẫn viên
• Bảo hiểm du lịch

❌ DỊCH VỤ KHÔNG BAO GỒM:
• Chi phí cá nhân
• Tiền tip`,
      chinh_sach_huy: `📋 CHÍNH SÁCH HỦY TOUR:
• Hủy trước 7 ngày: Hoàn 100%
• Hủy trước 5 ngày: Hoàn 70%
• Hủy trước 3 ngày: Hoàn 50%
• Hủy trước 1 ngày: Hoàn 30%
• Hủy ngày khởi hành: Không hoàn tiền`,
      hinh_anh: 'https://res.cloudinary.com/demo/image/upload/v1/tours/dalat.jpg',
      hinh_anh_phu: JSON.stringify([
        'https://res.cloudinary.com/demo/image/upload/v1/tours/dalat-xuan-huong.jpg',
        'https://res.cloudinary.com/demo/image/upload/v1/tours/dalat-flowers.jpg',
        'https://res.cloudinary.com/demo/image/upload/v1/tours/dalat-church.jpg'
      ]),
      trang_thai: 'Đang hoạt động'
    },
    {
      ten_tour: 'Tour Nha Trang - Biển xanh 4N3Đ',
      diem_den: 'Nha Trang',
      khu_vuc: 'Miền Trung',
      so_ngay: 4,
      mo_ta_ngan: 'Kỳ nghỉ tuyệt vời tại thành phố biển Nha Trang',
      mo_ta_chi_tiet: `Tour 4 ngày 3 đêm tại Nha Trang - Thành phố biển xinh đẹp.

📍 ĐIỂM NỔI BẬT:
• Tham quan Viện Hải dương học
• Tắm biển tại bãi biển Nha Trang
• Tham quan Tháp Bà Ponagar
• Trải nghiệm lặn biển ngắm san hô
• Tham quan chùa Long Sơn

🏨 DỊCH VỤ BAO GỒM:
• Khách sạn 4 sao ven biển
• Xe đưa đón
• 3 bữa chính/ngày
• Vé tham quan các điểm`,
      lich_trinh: `📅 NGÀY 1: TP.HCM - NHA TRANG
✈️ 08:00: Bay từ TP.HCM đi Nha Trang
🚌 09:30: Đón tại sân bay
🏨 10:30: Nhận phòng khách sạn
🏛️ 14:00: Tham quan Viện Hải dương học
🏖️ 16:30: Tắm biển Nha Trang
🍽️ 19:00: Ăn tối

📅 NGÀY 2: NHA TRANG - ĐẢO
🍳 08:00: Ăn sáng
⛵ 09:30: Xuất phát tham quan các đảo
🏊 11:00: Lặn biển ngắm san hô
🍽️ 12:30: Ăn trưa trên tàu
🏖️ 14:00: Tắm biển đảo
🎣 17:00: Câu cá
🍽️ 19:00: Ăn tối

📅 NGÀY 3: NHA TRANG - KHÁM PHÁ
🍳 08:00: Ăn sáng
🏛️ 09:30: Tham quan Tháp Bà Ponagar
🏯 11:00: Tham quan chùa Long Sơn
🍽️ 12:30: Ăn trưa
🛍️ 14:00: Mua sắm tại chợ Nha Trang
🍽️ 19:00: Ăn tối

📅 NGÀY 4: NHA TRANG - TP.HCM
🍳 08:00: Ăn sáng
🛍️ 09:30: Mua sắm đặc sản
✈️ 11:30: Đến sân bay
🛬 13:00: Về TP.HCM, kết thúc tour`,
      dich_vu_bao_gom: `✅ DỊCH VỤ BAO GỒM:
• Khách sạn 4 sao (3 đêm)
• Xe đưa đón
• Bữa sáng (3 bữa)
• Bữa trưa (4 bữa)
• Bữa tối (3 bữa)
• Vé tham quan
• Hướng dẫn viên
• Bảo hiểm du lịch`,
      chinh_sach_huy: `📋 CHÍNH SÁCH HỦY TOUR:
• Hủy trước 7 ngày: Hoàn 100%
• Hủy trước 5 ngày: Hoàn 70%
• Hủy trước 3 ngày: Hoàn 50%
• Hủy trước 1 ngày: Hoàn 30%
• Hủy ngày khởi hành: Không hoàn tiền`,
      hinh_anh: 'https://res.cloudinary.com/demo/image/upload/v1/tours/nha-trang.jpg',
      hinh_anh_phu: JSON.stringify([
        'https://res.cloudinary.com/demo/image/upload/v1/tours/nha-trang-beach.jpg',
        'https://res.cloudinary.com/demo/image/upload/v1/tours/nha-trang-island.jpg',
        'https://res.cloudinary.com/demo/image/upload/v1/tours/ponagar-tower.jpg'
      ]),
      trang_thai: 'Đang hoạt động'
    },
    {
      ten_tour: 'Tour Sapa - Thung lũng mây 4N3Đ',
      diem_den: 'Sapa',
      khu_vuc: 'Miền Bắc',
      so_ngay: 4,
      mo_ta_ngan: 'Khám phá Sapa - Thung lũng mây mù với văn hóa dân tộc',
      mo_ta_chi_tiet: `Tour 4 ngày 3 đêm khám phá Sapa - Thung lũng mây mù.

📍 ĐIỂM NỔI BẬT:
• Trekking qua các bản làng dân tộc
• Chinh phục đỉnh Fansipan
• Tham quan thị trấn Sapa mờ sương
• Khám phá văn hóa dân tộc H'Mông, Dao Đỏ
• Thưởng thức ẩm thực vùng cao

🏨 DỊCH VỤ BAO GỒM:
• Khách sạn 3 sao tại Sapa
• Xe đưa đón
• 3 bữa chính/ngày
• Hướng dẫn viên bản địa

📅 LỊCH TRÌNH:
Ngày 1: Hà Nội - Sapa
Ngày 2: Sapa - Trekking
Ngày 3: Sapa - Fansipan
Ngày 4: Sapa - Hà Nội`,
      lich_trinh: `📅 NGÀY 1: HÀ NỘI - SAPA
🚌 07:00: Xe đón tại Hà Nội đi Sapa
🍽️ 12:00: Ăn trưa
🏨 14:00: Nhận phòng khách sạn
🚶 15:00: Dạo phố Sapa
🍽️ 19:00: Ăn tối

📅 NGÀY 2: SAPA - TREKKING
🍳 07:30: Ăn sáng
🚶 08:30: Trekking qua bản Cát Cát
🌾 11:00: Tham quan ruộng bậc thang
🍽️ 12:30: Ăn trưa
🚶 14:00: Tham quan bản Tả Văn
🌅 17:00: Ngắm hoàng hôn
🍽️ 19:00: Ăn tối

📅 NGÀY 3: SAPA - FANSIPAN
🍳 07:00: Ăn sáng
🚠 08:30: Đến ga cáp treo
🌄 10:00: Chinh phục đỉnh Fansipan
🍽️ 12:30: Ăn trưa
🚠 14:00: Xuống núi
🛍️ 16:00: Mua sắm đặc sản
🍽️ 19:00: Ăn tối

📅 NGÀY 4: SAPA - HÀ NỘI
🍳 08:00: Ăn sáng
🛍️ 09:30: Mua sắm
🚌 11:00: Về Hà Nội
🍽️ 12:30: Ăn trưa trên đường
🛬 17:00: Về Hà Nội, kết thúc tour`,
      dich_vu_bao_gom: `✅ DỊCH VỤ BAO GỒM:
• Khách sạn 3 sao (3 đêm)
• Xe đưa đón
• Bữa sáng (3 bữa)
• Bữa trưa (4 bữa)
• Bữa tối (3 bữa)
• Vé cáp treo Fansipan
• Hướng dẫn viên bản địa
• Bảo hiểm du lịch`,
      chinh_sach_huy: `📋 CHÍNH SÁCH HỦY TOUR:
• Hủy trước 10 ngày: Hoàn 100%
• Hủy trước 7 ngày: Hoàn 70%
• Hủy trước 5 ngày: Hoàn 50%
• Hủy trước 3 ngày: Hoàn 30%
• Hủy dưới 3 ngày: Không hoàn tiền`,
      hinh_anh: 'https://res.cloudinary.com/demo/image/upload/v1/tours/sapa.jpg',
      hinh_anh_phu: JSON.stringify([
        'https://res.cloudinary.com/demo/image/upload/v1/tours/sapa-terrace.jpg',
        'https://res.cloudinary.com/demo/image/upload/v1/tours/fansipan.jpg',
        'https://res.cloudinary.com/demo/image/upload/v1/tours/sapa-village.jpg'
      ]),
      trang_thai: 'Đang hoạt động'
    }
  ];

  const createdTours = [];
  for (const tourDataItem of tourData) {
    const [tour] = await Tour.findOrCreate({
      where: { ten_tour: tourDataItem.ten_tour },
      defaults: tourDataItem
    });
    createdTours.push(tour);
    console.log(`✅ Tour: ${tour.ten_tour}`);
  }

  // ============================================
  // 4. SEED SCHEDULES
  // ============================================
  const now = new Date();
  const scheduleData = [
    // Đà Nẵng - Hội An
    { tourIndex: 0, ngay_khoi_hanh: new Date(now.getFullYear(), now.getMonth() + 1, 5), so_chot_toi_da: 30, gia_nguoi_lon: 3500000, gia_tre_em: 2500000 },
    { tourIndex: 0, ngay_khoi_hanh: new Date(now.getFullYear(), now.getMonth() + 1, 15), so_chot_toi_da: 25, gia_nguoi_lon: 3500000, gia_tre_em: 2500000 },
    { tourIndex: 0, ngay_khoi_hanh: new Date(now.getFullYear(), now.getMonth() + 1, 25), so_chot_toi_da: 30, gia_nguoi_lon: 3800000, gia_tre_em: 2700000 },
    { tourIndex: 0, ngay_khoi_hanh: new Date(now.getFullYear(), now.getMonth() + 2, 5), so_chot_toi_da: 28, gia_nguoi_lon: 3800000, gia_tre_em: 2700000 },
    
    // Phú Quốc
    { tourIndex: 1, ngay_khoi_hanh: new Date(now.getFullYear(), now.getMonth() + 1, 8), so_chot_toi_da: 20, gia_nguoi_lon: 4500000, gia_tre_em: 3200000 },
    { tourIndex: 1, ngay_khoi_hanh: new Date(now.getFullYear(), now.getMonth() + 1, 18), so_chot_toi_da: 25, gia_nguoi_lon: 4500000, gia_tre_em: 3200000 },
    { tourIndex: 1, ngay_khoi_hanh: new Date(now.getFullYear(), now.getMonth() + 2, 8), so_chot_toi_da: 22, gia_nguoi_lon: 4800000, gia_tre_em: 3400000 },
    
    // Hà Nội - Hạ Long
    { tourIndex: 2, ngay_khoi_hanh: new Date(now.getFullYear(), now.getMonth() + 1, 10), so_chot_toi_da: 25, gia_nguoi_lon: 3200000, gia_tre_em: 2200000 },
    { tourIndex: 2, ngay_khoi_hanh: new Date(now.getFullYear(), now.getMonth() + 1, 20), so_chot_toi_da: 30, gia_nguoi_lon: 3500000, gia_tre_em: 2500000 },
    { tourIndex: 2, ngay_khoi_hanh: new Date(now.getFullYear(), now.getMonth() + 2, 10), so_chot_toi_da: 25, gia_nguoi_lon: 3500000, gia_tre_em: 2500000 },
    
    // Đà Lạt
    { tourIndex: 3, ngay_khoi_hanh: new Date(now.getFullYear(), now.getMonth() + 1, 12), so_chot_toi_da: 20, gia_nguoi_lon: 2800000, gia_tre_em: 1800000 },
    { tourIndex: 3, ngay_khoi_hanh: new Date(now.getFullYear(), now.getMonth() + 1, 22), so_chot_toi_da: 25, gia_nguoi_lon: 3000000, gia_tre_em: 2000000 },
    { tourIndex: 3, ngay_khoi_hanh: new Date(now.getFullYear(), now.getMonth() + 2, 12), so_chot_toi_da: 20, gia_nguoi_lon: 3000000, gia_tre_em: 2000000 },
    
    // Nha Trang
    { tourIndex: 4, ngay_khoi_hanh: new Date(now.getFullYear(), now.getMonth() + 1, 6), so_chot_toi_da: 30, gia_nguoi_lon: 3800000, gia_tre_em: 2800000 },
    { tourIndex: 4, ngay_khoi_hanh: new Date(now.getFullYear(), now.getMonth() + 1, 16), so_chot_toi_da: 25, gia_nguoi_lon: 4000000, gia_tre_em: 3000000 },
    { tourIndex: 4, ngay_khoi_hanh: new Date(now.getFullYear(), now.getMonth() + 2, 6), so_chot_toi_da: 28, gia_nguoi_lon: 4000000, gia_tre_em: 3000000 },
    
    // Sapa
    { tourIndex: 5, ngay_khoi_hanh: new Date(now.getFullYear(), now.getMonth() + 1, 14), so_chot_toi_da: 20, gia_nguoi_lon: 4200000, gia_tre_em: 3000000 },
    { tourIndex: 5, ngay_khoi_hanh: new Date(now.getFullYear(), now.getMonth() + 1, 24), so_chot_toi_da: 25, gia_nguoi_lon: 4200000, gia_tre_em: 3000000 },
    { tourIndex: 5, ngay_khoi_hanh: new Date(now.getFullYear(), now.getMonth() + 2, 14), so_chot_toi_da: 20, gia_nguoi_lon: 4500000, gia_tre_em: 3200000 },
  ];

  for (const schedule of scheduleData) {
    const tour = createdTours[schedule.tourIndex];
    if (tour) {
      await LichKhoiHanh.findOrCreate({
        where: {
          ma_tour: tour.ma_tour,
          ngay_khoi_hanh: schedule.ngay_khoi_hanh
        },
        defaults: {
          ma_tour: tour.ma_tour,
          ngay_khoi_hanh: schedule.ngay_khoi_hanh,
          so_chot_toi_da: schedule.so_chot_toi_da,
          so_chot_da_dat: Math.floor(Math.random() * (schedule.so_chot_toi_da * 0.5)), // Random booked
          gia_nguoi_lon: schedule.gia_nguoi_lon,
          gia_tre_em: schedule.gia_tre_em,
          trang_thai: 'Còn chỗ'
        }
      });
      console.log(`✅ Schedule: ${schedule.ngay_khoi_hanh.toISOString().split('T')[0]} - ${tour.ten_tour}`);
    }
  }

  // ============================================
  // 5. SEED DISCOUNT CODES
  // ============================================
  const discountData = [
    {
      ma_code: 'SUMMER2024',
      ten_chuong_trinh: 'Khuyến mãi mùa hè 2024',
      loai_giam: 'Phần trăm',
      muc_giam: 10,
      giam_toi_da: 500000,
      so_luong: 100,
      ngay_bat_dau: new Date(now.getFullYear(), now.getMonth(), 1),
      ngay_ket_thuc: new Date(now.getFullYear(), now.getMonth() + 3, 30),
      yeu_cau_toi_thieu: 2,
      trang_thai: 'Đang hoạt động'
    },
    {
      ma_code: 'WELCOME2024',
      ten_chuong_trinh: 'Chào mừng khách hàng mới',
      loai_giam: 'Phần trăm',
      muc_giam: 15,
      giam_toi_da: 300000,
      so_luong: 50,
      ngay_bat_dau: new Date(now.getFullYear(), now.getMonth(), 1),
      ngay_ket_thuc: new Date(now.getFullYear(), now.getMonth() + 6, 30),
      yeu_cau_toi_thieu: 1,
      trang_thai: 'Đang hoạt động'
    },
    {
      ma_code: 'FAMILY2024',
      ten_chuong_trinh: 'Gia đình sum vầy',
      loai_giam: 'Số tiền',
      muc_giam: 200000,
      giam_toi_da: null,
      so_luong: 30,
      ngay_bat_dau: new Date(now.getFullYear(), now.getMonth(), 1),
      ngay_ket_thuc: new Date(now.getFullYear(), now.getMonth() + 2, 28),
      yeu_cau_toi_thieu: 4,
      trang_thai: 'Đang hoạt động'
    },
    {
      ma_code: 'EARLYBIRD',
      ten_chuong_trinh: 'Đặt sớm - Giảm ngay',
      loai_giam: 'Phần trăm',
      muc_giam: 5,
      giam_toi_da: 200000,
      so_luong: 200,
      ngay_bat_dau: new Date(now.getFullYear(), now.getMonth(), 1),
      ngay_ket_thuc: new Date(now.getFullYear(), now.getMonth() + 1, 15),
      yeu_cau_toi_thieu: 1,
      trang_thai: 'Đang hoạt động'
    }
  ];

  for (const discount of discountData) {
    await MaGiamGia.findOrCreate({
      where: { ma_code: discount.ma_code },
      defaults: discount
    });
    console.log(`✅ Discount: ${discount.ma_code}`);
  }

  // ============================================
  // 6. SEED BOOKINGS & PAYMENTS & REVIEWS
  // ============================================
  // Get all schedules
  const allSchedules = await LichKhoiHanh.findAll();
  const allCustomers = await NguoiDung.findAll({
    where: { ma_vai_tro: 3 }
  });
  const allDiscounts = await MaGiamGia.findAll();

  const statuses = ['Chờ xác nhận', 'Đã xác nhận', 'Đang diễn ra', 'Đã hoàn thành'];
  const paymentStatuses = ['Chưa thanh toán', 'Đã đặt cọc', 'Đã thanh toán'];

  // Create 20 sample bookings
  for (let i = 0; i < 20; i++) {
    const schedule = allSchedules[Math.floor(Math.random() * allSchedules.length)];
    const customer = allCustomers[Math.floor(Math.random() * allCustomers.length)];
    const discount = Math.random() > 0.7 ? allDiscounts[Math.floor(Math.random() * allDiscounts.length)] : null;
    const adultCount = Math.floor(Math.random() * 3) + 1;
    const childCount = Math.floor(Math.random() * 2);
    
    const tour = await Tour.findByPk(schedule.ma_tour);
    const adultPrice = parseFloat(schedule.gia_nguoi_lon) * adultCount;
    const childPrice = parseFloat(schedule.gia_tre_em) * childCount;
    let total = adultPrice + childPrice;
    
    let discountAmount = 0;
    if (discount) {
      if (discount.loai_giam === 'Phần trăm') {
        discountAmount = (total * parseFloat(discount.muc_giam)) / 100;
        if (discount.giam_toi_da) {
          discountAmount = Math.min(discountAmount, parseFloat(discount.giam_toi_da));
        }
      } else {
        discountAmount = parseFloat(discount.muc_giam);
      }
      total = Math.max(0, total - discountAmount);
    }

    const statusIndex = Math.floor(Math.random() * statuses.length);
    const paymentIndex = Math.floor(Math.random() * paymentStatuses.length);

    const booking = await DonDatTour.create({
      ma_nguoi_dung: customer.ma_nguoi_dung,
      ma_lich_khoi_hanh: schedule.ma_lich_khoi_hanh,
      ma_giam_gia: discount ? discount.ma_giam_gia : null,
      so_luong_nguoi_lon: adultCount,
      so_luong_tre_em: childCount,
      thong_tin_khach: JSON.stringify([
        { ho_ten: customer.ho_ten, ngay_sinh: customer.ngay_sinh || '1990-01-01', gioi_tinh: customer.gioi_tinh || 'Nam', loai_khach: 'nguoi_lon' }
      ]),
      tong_tien: total,
      tien_coc: total * 0.3,
      tien_con_lai: total * 0.7,
      trang_thai_thanh_toan: paymentStatuses[paymentIndex],
      trang_thai_don_hang: statuses[statusIndex],
      ngay_dat: new Date(now.getFullYear(), now.getMonth() - 1, Math.floor(Math.random() * 28) + 1)
    });

    // Create payment for some bookings
    if (paymentIndex > 0) {
      await ThanhToan.create({
        ma_don_hang: booking.ma_don_hang,
        so_tien: paymentIndex === 2 ? total : total * 0.3,
        phuong_thuc: ['VNPay', 'Chuyển khoản', 'Tiền mặt'][Math.floor(Math.random() * 3)],
        trang_thai: 'Đã thanh toán',
        ngay_thanh_toan: new Date(now.getFullYear(), now.getMonth() - 1, Math.floor(Math.random() * 28) + 1)
      });
    }

    // Create review for completed bookings
    if (statuses[statusIndex] === 'Đã hoàn thành' && Math.random() > 0.3) {
      await DanhGia.create({
        ma_don_hang: booking.ma_don_hang,
        ma_nguoi_dung: customer.ma_nguoi_dung,
        so_sao: Math.floor(Math.random() * 4) + 2, // 2-5 sao
        noi_dung: [
          'Tour rất tuyệt vời, hướng dẫn viên nhiệt tình!',
          'Dịch vụ tốt, hài lòng với chuyến đi.',
          'Khách sạn đẹp, ăn uống ngon.',
          'Trải nghiệm đáng nhớ, sẽ quay lại.',
          'Giá cả hợp lý, chất lượng tốt.'
        ][Math.floor(Math.random() * 5)],
        ngay_danh_gia: new Date(now.getFullYear(), now.getMonth() - 1, Math.floor(Math.random() * 28) + 1)
      });
    }

    console.log(`✅ Booking #${booking.ma_don_hang} - ${customer.ho_ten} - ${tour.ten_tour}`);
  }

  console.log('\n✅ Database seeding completed!');
  console.log('📝 Default accounts:');
  console.log('  Admin: admin@dulichviet.com / admin123');
  console.log('  Employee: nhanvien1@dulichviet.com / employee123');
  console.log('  Employee: nhanvien2@dulichviet.com / employee123');
  console.log('  Customer: customer1@gmail.com / customer123');
  console.log('  Customer: customer2@gmail.com / customer123');
  console.log('  Customer: customer3@gmail.com / customer123');
  console.log(`📊 Created ${createdTours.length} tours with schedules`);
  console.log(`📊 Created ${discountData.length} discount codes`);
  console.log(`📊 Created 20 sample bookings with payments and reviews`);
};