import sequelize from './src/config/database.js';
import { NguoiDung, VaiTro, Admin, NhanVien } from './src/models/index.js';

const users = [
  // ============================================
  // 1. ADMIN
  // ============================================
  {
    ho_ten: 'Nguyễn Quản Trị',
    email: 'admin@dulichviet.com',
    so_dien_thoai: '0900000001',
    mat_khau: 'admin123',
    vai_tro: 'Admin',
    anh_dai_dien: 'https://i.pravatar.cc/150?img=1',
    ngay_sinh: '1990-01-15',
    gioi_tinh: 'Nam',
    dia_chi: '123 Đường ABC, Quận 1, TP.HCM'
  },

  // ============================================
  // 2. NHÂN VIÊN
  // ============================================
  {
    ho_ten: 'Trần Văn Nhân',
    email: 'nhanvien1@dulichviet.com',
    so_dien_thoai: '0900000002',
    mat_khau: 'employee123',
    vai_tro: 'Nhân viên',
    anh_dai_dien: 'https://i.pravatar.cc/150?img=2',
    ngay_sinh: '1995-03-20',
    gioi_tinh: 'Nam',
    dia_chi: '456 Đường XYZ, Quận 2, TP.HCM'
  },
  {
    ho_ten: 'Lê Thị Hương',
    email: 'nhanvien2@dulichviet.com',
    so_dien_thoai: '0900000003',
    mat_khau: 'employee123',
    vai_tro: 'Nhân viên',
    anh_dai_dien: 'https://i.pravatar.cc/150?img=3',
    ngay_sinh: '1992-07-10',
    gioi_tinh: 'Nữ',
    dia_chi: '789 Đường DEF, Quận 3, TP.HCM'
  },
  {
    ho_ten: 'Phạm Văn Tài',
    email: 'nhanvien3@dulichviet.com',
    so_dien_thoai: '0900000004',
    mat_khau: 'employee123',
    vai_tro: 'Nhân viên',
    anh_dai_dien: 'https://i.pravatar.cc/150?img=4',
    ngay_sinh: '1988-11-05',
    gioi_tinh: 'Nam',
    dia_chi: '101 Đường GHI, Quận 4, TP.HCM'
  },
  {
    ho_ten: 'Nguyễn Thị Lan',
    email: 'nhanvien4@dulichviet.com',
    so_dien_thoai: '0900000005',
    mat_khau: 'employee123',
    vai_tro: 'Nhân viên',
    anh_dai_dien: 'https://i.pravatar.cc/150?img=5',
    ngay_sinh: '1993-09-12',
    gioi_tinh: 'Nữ',
    dia_chi: '202 Đường JKL, Quận 5, TP.HCM'
  },

  // ============================================
  // 3. KHÁCH HÀNG
  // ============================================
  {
    ho_ten: 'Nguyễn Văn An',
    email: 'customer1@gmail.com',
    so_dien_thoai: '0912345678',
    mat_khau: 'customer123',
    vai_tro: 'Khách hàng',
    anh_dai_dien: 'https://i.pravatar.cc/150?img=6',
    ngay_sinh: '1988-05-12',
    gioi_tinh: 'Nam',
    dia_chi: '12 Nguyễn Huệ, Quận 1, TP.HCM'
  },
  {
    ho_ten: 'Trần Thị Mai',
    email: 'customer2@gmail.com',
    so_dien_thoai: '0987654321',
    mat_khau: 'customer123',
    vai_tro: 'Khách hàng',
    anh_dai_dien: 'https://i.pravatar.cc/150?img=7',
    ngay_sinh: '1995-11-25',
    gioi_tinh: 'Nữ',
    dia_chi: '34 Lê Lợi, Quận 1, TP.HCM'
  },
  {
    ho_ten: 'Phạm Văn Bình',
    email: 'customer3@gmail.com',
    so_dien_thoai: '0934567890',
    mat_khau: 'customer123',
    vai_tro: 'Khách hàng',
    anh_dai_dien: 'https://i.pravatar.cc/150?img=8',
    ngay_sinh: '1990-09-08',
    gioi_tinh: 'Nam',
    dia_chi: '56 Hai Bà Trưng, Quận 3, TP.HCM'
  },
  {
    ho_ten: 'Hoàng Thị Thu',
    email: 'customer4@gmail.com',
    so_dien_thoai: '0945678901',
    mat_khau: 'customer123',
    vai_tro: 'Khách hàng',
    anh_dai_dien: 'https://i.pravatar.cc/150?img=9',
    ngay_sinh: '1991-03-15',
    gioi_tinh: 'Nữ',
    dia_chi: '78 Đường MNO, Quận 2, TP.HCM'
  },
  {
    ho_ten: 'Lê Văn Hùng',
    email: 'customer5@gmail.com',
    so_dien_thoai: '0956789012',
    mat_khau: 'customer123',
    vai_tro: 'Khách hàng',
    anh_dai_dien: 'https://i.pravatar.cc/150?img=10',
    ngay_sinh: '1987-07-22',
    gioi_tinh: 'Nam',
    dia_chi: '90 Đường PQR, Quận 4, TP.HCM'
  },
  {
    ho_ten: 'Ngô Thị Hoa',
    email: 'customer6@gmail.com',
    so_dien_thoai: '0967890123',
    mat_khau: 'customer123',
    vai_tro: 'Khách hàng',
    anh_dai_dien: 'https://i.pravatar.cc/150?img=11',
    ngay_sinh: '1994-12-01',
    gioi_tinh: 'Nữ',
    dia_chi: '123 Đường STU, Quận 5, TP.HCM'
  },
  {
    ho_ten: 'Vũ Văn Thắng',
    email: 'customer7@gmail.com',
    so_dien_thoai: '0978901234',
    mat_khau: 'customer123',
    vai_tro: 'Khách hàng',
    anh_dai_dien: 'https://i.pravatar.cc/150?img=12',
    ngay_sinh: '1989-06-18',
    gioi_tinh: 'Nam',
    dia_chi: '456 Đường VWX, Quận 6, TP.HCM'
  },
  {
    ho_ten: 'Đặng Thị Ngọc',
    email: 'customer8@gmail.com',
    so_dien_thoai: '0989012345',
    mat_khau: 'customer123',
    vai_tro: 'Khách hàng',
    anh_dai_dien: 'https://i.pravatar.cc/150?img=13',
    ngay_sinh: '1996-08-30',
    gioi_tinh: 'Nữ',
    dia_chi: '789 Đường YZ, Quận 7, TP.HCM'
  },
  {
    ho_ten: 'Bùi Văn Khánh',
    email: 'customer9@gmail.com',
    so_dien_thoai: '0990123456',
    mat_khau: 'customer123',
    vai_tro: 'Khách hàng',
    anh_dai_dien: 'https://i.pravatar.cc/150?img=14',
    ngay_sinh: '1992-04-05',
    gioi_tinh: 'Nam',
    dia_chi: '321 Đường ABC, Quận 8, TP.HCM'
  },
  {
    ho_ten: 'Lý Thị Mỹ',
    email: 'customer10@gmail.com',
    so_dien_thoai: '0901234567',
    mat_khau: 'customer123',
    vai_tro: 'Khách hàng',
    anh_dai_dien: 'https://i.pravatar.cc/150?img=15',
    ngay_sinh: '1993-10-20',
    gioi_tinh: 'Nữ',
    dia_chi: '654 Đường DEF, Quận 9, TP.HCM'
  }
];

const importUsers = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected');

    // Lấy danh sách vai trò
    const roles = await VaiTro.findAll();
    const roleMap = {};
    roles.forEach(r => {
      roleMap[r.ten_vai_tro] = r.ma_vai_tro;
    });

    console.log('📋 Roles:', roleMap);

    // Xóa sạch user cũ
    const emails = users.map(u => u.email);
    for (const email of emails) {
      const user = await NguoiDung.findOne({ where: { email } });
      if (user) {
        await Admin.destroy({ where: { ma_nguoi_dung: user.ma_nguoi_dung } });
        await NhanVien.destroy({ where: { ma_nguoi_dung: user.ma_nguoi_dung } });
        await user.destroy();
        console.log(`🗑️ Deleted: ${email}`);
      }
    }

    console.log('🗑️ All old users deleted');

    // Tạo user mới
    let count = 0;
    for (const userData of users) {
      const { vai_tro, ...rest } = userData;
      
      const user = await NguoiDung.create({
        ...rest,
        ma_vai_tro: roleMap[vai_tro],
        trang_thai: 'Đang hoạt động'
      });

      console.log(`✅ Created: ${user.email} (${vai_tro})`);

      if (vai_tro === 'Admin') {
        await Admin.create({ ma_nguoi_dung: user.ma_nguoi_dung });
        console.log(`  👑 Admin record created`);
      } else if (vai_tro === 'Nhân viên') {
        await NhanVien.create({
          ma_nguoi_dung: user.ma_nguoi_dung,
          chuc_vu: 'Nhân viên',
          phong_ban: 'Kinh doanh',
          ngay_vao_lam: new Date()
        });
        console.log(`  👔 Employee record created`);
      }
      count++;
    }

    console.log(`\n✅ Import completed! ${count} users created.`);
    console.log('\n📝 ACCOUNT LIST:');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('  👑 ADMIN:');
    users.filter(u => u.vai_tro === 'Admin').forEach(u => {
      console.log(`     ${u.email} / ${u.mat_khau}`);
    });
    console.log('\n  👔 EMPLOYEES:');
    users.filter(u => u.vai_tro === 'Nhân viên').forEach(u => {
      console.log(`     ${u.email} / ${u.mat_khau}`);
    });
    console.log('\n  👤 CUSTOMERS:');
    users.filter(u => u.vai_tro === 'Khách hàng').forEach(u => {
      console.log(`     ${u.email} / ${u.mat_khau}`);
    });
    console.log('═══════════════════════════════════════════════════════════════');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

importUsers();