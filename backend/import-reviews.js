import sequelize from './src/config/database.js';
import { DonDatTour, LichKhoiHanh, NguoiDung, Tour, DanhGia } from './src/models/index.js';

const reviewData = [
  { email: 'customer1@gmail.com', so_sao: 5, noi_dung: 'Tour tuyệt vời! Hướng dẫn viên nhiệt tình.' },
  { email: 'customer2@gmail.com', so_sao: 4, noi_dung: 'Dịch vụ tốt, hài lòng với chuyến đi.' },
  { email: 'customer3@gmail.com', so_sao: 5, noi_dung: 'Trải nghiệm đáng nhớ, sẽ quay lại.' },
  { email: 'customer4@gmail.com', so_sao: 4, noi_dung: 'Khách sạn đẹp, ăn uống ngon.' },
  { email: 'customer5@gmail.com', so_sao: 5, noi_dung: 'Tour được tổ chức chu đáo.' },
  { email: 'customer6@gmail.com', so_sao: 3, noi_dung: 'Ổn, nhưng chưa thực sự xuất sắc.' },
  { email: 'customer7@gmail.com', so_sao: 5, noi_dung: 'Rất thích, sẽ giới thiệu cho bạn bè.' },
  { email: 'customer8@gmail.com', so_sao: 4, noi_dung: 'Điểm đến đẹp, dịch vụ tốt.' },
  { email: 'customer9@gmail.com', so_sao: 5, noi_dung: 'Hoàn hảo! Cảm ơn công ty du lịch.' },
  { email: 'customer10@gmail.com', so_sao: 4, noi_dung: 'Đồ ăn ngon, hướng dẫn viên vui tính.' }
];

const createBookingsWithReviews = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected');

    // Lấy danh sách khách hàng
    const customers = await NguoiDung.findAll({
      where: { ma_vai_tro: 3 }
    });

    // Lấy danh sách lịch khởi hành
    const schedules = await LichKhoiHanh.findAll({
      include: [{ model: Tour, as: 'tour' }]
    });

    if (customers.length === 0 || schedules.length === 0) {
      console.log('❌ Không có khách hàng hoặc lịch khởi hành');
      process.exit(1);
    }

    console.log(`📋 Found ${customers.length} customers and ${schedules.length} schedules`);

    let createdCount = 0;
    let reviewCount = 0;

    // Tạo đơn hàng và đánh giá cho mỗi khách hàng
    for (let i = 0; i < customers.length; i++) {
      const customer = customers[i];
      const schedule = schedules[i % schedules.length];
      const tour = schedule.tour;

      // Tạo đơn hàng
      const booking = await DonDatTour.create({
        ma_nguoi_dung: customer.ma_nguoi_dung,
        ma_lich_khoi_hanh: schedule.ma_lich_khoi_hanh,
        ma_giam_gia: null,
        so_luong_nguoi_lon: Math.floor(Math.random() * 3) + 1,
        so_luong_tre_em: Math.floor(Math.random() * 2),
        thong_tin_khach: JSON.stringify([
          { 
            ho_ten: customer.ho_ten, 
            loai_khach: 'nguoi_lon',
            ngay_sinh: customer.ngay_sinh || '1990-01-01',
            gioi_tinh: customer.gioi_tinh || 'Nam'
          }
        ]),
        tong_tien: parseFloat(schedule.gia_nguoi_lon) * 2,
        tien_coc: parseFloat(schedule.gia_nguoi_lon) * 2 * 0.3,
        tien_con_lai: parseFloat(schedule.gia_nguoi_lon) * 2 * 0.7,
        trang_thai_thanh_toan: 'Đã thanh toán',
        trang_thai_don_hang: 'Đã hoàn thành',
        ngay_dat: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      });

      console.log(`✅ Booking #${booking.ma_don_hang}: ${customer.ho_ten} - ${tour?.ten_tour || 'Unknown'}`);
      createdCount++;

      // Tạo đánh giá
      const review = reviewData[i % reviewData.length];
      await DanhGia.create({
        ma_don_hang: booking.ma_don_hang,
        ma_nguoi_dung: customer.ma_nguoi_dung,
        ma_tour: schedule.ma_tour,
        so_sao: review.so_sao,
        noi_dung: review.noi_dung,
        ngay_danh_gia: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
      });

      console.log(`⭐ Review: ${customer.email} - ${review.so_sao}⭐`);
      reviewCount++;
    }

    console.log(`\n✅ Created ${createdCount} bookings with ${reviewCount} reviews!`);

    // Thống kê
    const stats = await DanhGia.findAll({
      attributes: [
        'ma_tour',
        [sequelize.fn('COUNT', sequelize.col('ma_danh_gia')), 'count'],
        [sequelize.fn('AVG', sequelize.col('so_sao')), 'avg']
      ],
      group: ['ma_tour'],
      raw: true
    });

    console.log('\n📊 Review Statistics:');
    for (const stat of stats) {
      const tour = await Tour.findByPk(stat.ma_tour);
      console.log(`  ${tour?.ten_tour || 'Unknown'}: ${stat.count} reviews - ${parseFloat(stat.avg).toFixed(1)}⭐`);
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

createBookingsWithReviews();