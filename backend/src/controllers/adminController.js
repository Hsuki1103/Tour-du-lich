// backend/src/controllers/adminController.js
import { NguoiDung, VaiTro, NhanVien, Admin, DonDatTour, MaGiamGia } from '../models/index.js';
import { Op } from 'sequelize';
import bcrypt from 'bcryptjs';
import { sendDiscountEmail } from '../utils/emailService.js';

// ============================================
// LẤY DANH SÁCH NGƯỜI DÙNG
// ============================================
export const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, search, role } = req.query;
    const offset = (page - 1) * limit;

    const where = {};
    if (search) {
      where[Op.or] = [
        { ho_ten: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
        { so_dien_thoai: { [Op.like]: `%${search}%` } }
      ];
    }

    if (role) {
      const roleRecord = await VaiTro.findOne({
        where: { ten_vai_tro: role }
      });
      if (roleRecord) {
        where.ma_vai_tro = roleRecord.ma_vai_tro;
      }
    }

    const users = await NguoiDung.findAndCountAll({
      where,
      include: [
        {
          model: VaiTro,
          as: 'vaiTro',
          attributes: ['ten_vai_tro']
        }
      ],
      attributes: { exclude: ['mat_khau'] },
      order: [['ngay_tao', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      data: {
        items: users.rows,
        total: users.count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(users.count / limit)
      }
    });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi lấy danh sách người dùng: ' + error.message
    });
  }
};

// ============================================
// LẤY CHI TIẾT NGƯỜI DÙNG
// ============================================
export const getUserDetail = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await NguoiDung.findByPk(id, {
      include: [
        {
          model: VaiTro,
          as: 'vaiTro',
          attributes: ['ten_vai_tro']
        },
        {
          model: NhanVien,
          as: 'nhanVien'
        },
        {
          model: Admin,
          as: 'admin'
        }
      ],
      attributes: { exclude: ['mat_khau'] }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng'
      });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Get user detail error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi lấy chi tiết người dùng: ' + error.message
    });
  }
};

// ============================================
// TẠO NGƯỜI DÙNG (ADMIN)
// ============================================
export const createUser = async (req, res) => {
  try {
    const { ho_ten, email, so_dien_thoai, mat_khau, vai_tro } = req.body;

    // Kiểm tra email tồn tại
    const existingUser = await NguoiDung.findOne({
      where: {
        [Op.or]: [{ email }, { so_dien_thoai }]
      }
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email hoặc số điện thoại đã được sử dụng'
      });
    }

    // Lấy vai trò
    const roleRecord = await VaiTro.findOne({
      where: { ten_vai_tro: vai_tro || 'Khách hàng' }
    });

    if (!roleRecord) {
      return res.status(400).json({
        success: false,
        message: 'Vai trò không hợp lệ'
      });
    }

    // Mã hóa mật khẩu
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(mat_khau || '123456', salt);

    // Tạo user
    const user = await NguoiDung.create({
      ma_vai_tro: roleRecord.ma_vai_tro,
      ho_ten,
      email,
      so_dien_thoai,
      mat_khau: hashedPassword,
      trang_thai: 'Đang hoạt động'
    });

    // Tạo record tương ứng
    if (vai_tro === 'Nhân viên') {
      await NhanVien.create({
        ma_nguoi_dung: user.ma_nguoi_dung,
        chuc_vu: 'Nhân viên',
        phong_ban: 'Kinh doanh',
        ngay_vao_lam: new Date()
      });
    } else if (vai_tro === 'Admin') {
      await Admin.create({
        ma_nguoi_dung: user.ma_nguoi_dung
      });
    }

    // Lấy user với vai trò
    const newUser = await NguoiDung.findByPk(user.ma_nguoi_dung, {
      include: [
        {
          model: VaiTro,
          as: 'vaiTro',
          attributes: ['ten_vai_tro']
        }
      ],
      attributes: { exclude: ['mat_khau'] }
    });

    res.status(201).json({
      success: true,
      message: 'Tạo người dùng thành công',
      data: newUser
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi tạo người dùng: ' + error.message
    });
  }
};

// ============================================
// CẬP NHẬT NGƯỜI DÙNG (ADMIN)
// ============================================
export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { ho_ten, so_dien_thoai, vai_tro, trang_thai } = req.body;

    const user = await NguoiDung.findByPk(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng'
      });
    }

    // Kiểm tra số điện thoại trùng
    if (so_dien_thoai && so_dien_thoai !== user.so_dien_thoai) {
      const existingUser = await NguoiDung.findOne({
        where: {
          so_dien_thoai: so_dien_thoai,
          ma_nguoi_dung: { [Op.ne]: id }
        }
      });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Số điện thoại đã được sử dụng'
        });
      }
    }

    // Cập nhật thông tin
    await user.update({
      ho_ten: ho_ten || user.ho_ten,
      so_dien_thoai: so_dien_thoai || user.so_dien_thoai,
      trang_thai: trang_thai || user.trang_thai
    });

    // Cập nhật vai trò
    if (vai_tro) {
      const roleRecord = await VaiTro.findOne({
        where: { ten_vai_tro: vai_tro }
      });

      if (!roleRecord) {
        return res.status(400).json({
          success: false,
          message: 'Vai trò không hợp lệ'
        });
      }

      await user.update({ ma_vai_tro: roleRecord.ma_vai_tro });

      // Xóa các record cũ
      await NhanVien.destroy({ where: { ma_nguoi_dung: id } });
      await Admin.destroy({ where: { ma_nguoi_dung: id } });

      // Tạo record mới
      if (vai_tro === 'Nhân viên') {
        await NhanVien.create({
          ma_nguoi_dung: id,
          chuc_vu: 'Nhân viên',
          phong_ban: 'Kinh doanh',
          ngay_vao_lam: new Date()
        });
      } else if (vai_tro === 'Admin') {
        await Admin.create({
          ma_nguoi_dung: id
        });
      }
    }

    const updatedUser = await NguoiDung.findByPk(id, {
      include: [
        {
          model: VaiTro,
          as: 'vaiTro',
          attributes: ['ten_vai_tro']
        }
      ],
      attributes: { exclude: ['mat_khau'] }
    });

    res.json({
      success: true,
      message: 'Cập nhật người dùng thành công',
      data: updatedUser
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi cập nhật người dùng: ' + error.message
    });
  }
};

// ============================================
// XÓA NGƯỜI DÙNG (ADMIN)
// ============================================
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await NguoiDung.findByPk(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng'
      });
    }

    // Không cho xóa Admin cuối cùng
    const adminCount = await NguoiDung.count({
      include: [
        {
          model: VaiTro,
          as: 'vaiTro',
          where: { ten_vai_tro: 'Admin' }
        }
      ]
    });

    if (adminCount <= 1) {
      const userRole = await VaiTro.findByPk(user.ma_vai_tro);
      if (userRole?.ten_vai_tro === 'Admin') {
        return res.status(400).json({
          success: false,
          message: 'Không thể xóa Admin cuối cùng của hệ thống'
        });
      }
    }

    // Kiểm tra đơn hàng đang hoạt động
    const activeBookings = await DonDatTour.count({
      where: {
        ma_nguoi_dung: id,
        trang_thai_don_hang: {
          [Op.notIn]: ['Đã hủy', 'Đã hoàn thành']
        }
      }
    });

    if (activeBookings > 0) {
      return res.status(400).json({
        success: false,
        message: 'Người dùng đang có đơn hàng chưa hoàn thành. Không thể xóa.'
      });
    }

    // Xóa user (sẽ cascade xóa các record liên quan)
    await user.destroy();

    res.json({
      success: true,
      message: 'Xóa người dùng thành công'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi xóa người dùng: ' + error.message
    });
  }
};

// ============================================
// KHÓA/MỞ KHÓA TÀI KHOẢN
// ============================================
export const toggleUserStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await NguoiDung.findByPk(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng'
      });
    }

    const newStatus = user.trang_thai === 'Đang hoạt động' ? 'Đã khóa' : 'Đang hoạt động';
    
    await user.update({ trang_thai: newStatus });

    res.json({
      success: true,
      message: `Tài khoản đã được ${newStatus === 'Đang hoạt động' ? 'mở khóa' : 'khóa'}`,
      data: {
        ma_nguoi_dung: user.ma_nguoi_dung,
        trang_thai: newStatus
      }
    });
  } catch (error) {
    console.error('Toggle user status error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi cập nhật trạng thái: ' + error.message
    });
  }
};

// ============================================
// PHÂN QUYỀN NGƯỜI DÙNG
// ============================================
export const assignRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { vai_tro } = req.body;

    if (!vai_tro) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng chọn vai trò'
      });
    }

    const user = await NguoiDung.findByPk(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng'
      });
    }

    const roleRecord = await VaiTro.findOne({
      where: { ten_vai_tro: vai_tro }
    });

    if (!roleRecord) {
      return res.status(400).json({
        success: false,
        message: 'Vai trò không hợp lệ'
      });
    }

    await user.update({ ma_vai_tro: roleRecord.ma_vai_tro });

    // Xóa các record cũ
    await NhanVien.destroy({ where: { ma_nguoi_dung: id } });
    await Admin.destroy({ where: { ma_nguoi_dung: id } });

    // Tạo record mới
    if (vai_tro === 'Nhân viên') {
      await NhanVien.create({
        ma_nguoi_dung: id,
        chuc_vu: 'Nhân viên',
        phong_ban: 'Kinh doanh',
        ngay_vao_lam: new Date()
      });
    } else if (vai_tro === 'Admin') {
      await Admin.create({
        ma_nguoi_dung: id
      });
    }

    res.json({
      success: true,
      message: `Đã phân quyền ${vai_tro} thành công`,
      data: {
        ma_nguoi_dung: user.ma_nguoi_dung,
        vai_tro: vai_tro
      }
    });
  } catch (error) {
    console.error('Assign role error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi phân quyền: ' + error.message
    });
  }
};

// ============================================
// LẤY CẤU HÌNH HỆ THỐNG
// ============================================
export const getSystemConfig = async (req, res) => {
  try {
    const config = {
      payment_gateway: 'VNPay',
      currency: 'VND',
      cancellation_policy: {
        before_7_days: 100,
        before_3_days: 50,
        after_3_days: 0
      },
      deposit_percentage: 30,
      max_guests_per_booking: 20,
      min_guests_per_booking: 1
    };

    res.json({
      success: true,
      data: config
    });
  } catch (error) {
    console.error('Get system config error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi lấy cấu hình: ' + error.message
    });
  }
};

// ============================================
// CẬP NHẬT CẤU HÌNH HỆ THỐNG
// ============================================
export const updateSystemConfig = async (req, res) => {
  try {
    const { payment_gateway, cancellation_policy, deposit_percentage } = req.body;

    res.json({
      success: true,
      message: 'Cập nhật cấu hình thành công',
      data: {
        payment_gateway: payment_gateway || 'VNPay',
        cancellation_policy: cancellation_policy || {
          before_7_days: 100,
          before_3_days: 50,
          after_3_days: 0
        },
        deposit_percentage: deposit_percentage || 30
      }
    });
  } catch (error) {
    console.error('Update system config error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi cập nhật cấu hình: ' + error.message
    });
  }
};

// ============================================
// ⭐ LẤY DANH SÁCH KHÁCH HÀNG THEO CHI TIÊU
// ============================================
export const getCustomersBySpending = async (req, res) => {
  try {
    const { min_spent = 0, max_spent = null, limit = 100 } = req.query;

    // Lấy tất cả khách hàng
    const customerRole = await VaiTro.findOne({
      where: { ten_vai_tro: 'Khách hàng' }
    });

    if (!customerRole) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy vai trò khách hàng'
      });
    }

    const users = await NguoiDung.findAll({
      where: {
        ma_vai_tro: customerRole.ma_vai_tro,
        trang_thai: 'Đang hoạt động'
      },
      attributes: ['ma_nguoi_dung', 'ho_ten', 'email', 'so_dien_thoai']
    });

    // Tính tổng chi tiêu cho từng khách hàng
    const customersWithSpending = [];
    for (const user of users) {
      const totalSpent = await DonDatTour.sum('tong_tien', {
        where: {
          ma_nguoi_dung: user.ma_nguoi_dung,
          trang_thai_don_hang: {
            [Op.notIn]: ['Đã hủy']
          }
        }
      });

      const spent = totalSpent || 0;
      
      // Lọc theo khoảng chi tiêu
      let pass = true;
      if (min_spent && spent < parseFloat(min_spent)) pass = false;
      if (max_spent && spent > parseFloat(max_spent)) pass = false;
      
      if (pass) {
        customersWithSpending.push({
          ma_nguoi_dung: user.ma_nguoi_dung,
          ho_ten: user.ho_ten,
          email: user.email,
          so_dien_thoai: user.so_dien_thoai,
          tong_chi_tieu: spent
        });
      }
    }

    // Sắp xếp theo chi tiêu giảm dần
    customersWithSpending.sort((a, b) => b.tong_chi_tieu - a.tong_chi_tieu);

    // Giới hạn số lượng
    const result = customersWithSpending.slice(0, parseInt(limit));

    res.json({
      success: true,
      data: {
        customers: result,
        total: result.length,
        min_spent: min_spent || 0,
        max_spent: max_spent || 'Không giới hạn'
      }
    });
  } catch (error) {
    console.error('Get customers by spending error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi lấy danh sách khách hàng: ' + error.message
    });
  }
};

// ============================================
// ⭐ GỬI MÃ GIẢM GIÁ CHO KHÁCH HÀNG (CÓ LƯU VÀO BẢNG TRUNG GIAN)
// ============================================
export const sendDiscountToCustomers = async (req, res) => {
  try {
    const { 
      ma_giam_gia, 
      customer_ids, 
      send_to_all = false,
      min_spent = 0,
      max_spent = null
    } = req.body;

    console.log('📤 Sending discount to customers:', { ma_giam_gia, customer_ids, send_to_all, min_spent, max_spent });

    // Kiểm tra mã giảm giá tồn tại
    const discount = await MaGiamGia.findByPk(ma_giam_gia);
    if (!discount) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy mã giảm giá'
      });
    }

    let customers = [];

    if (send_to_all) {
      // Gửi cho tất cả khách hàng đáp ứng điều kiện chi tiêu
      const customerRole = await VaiTro.findOne({
        where: { ten_vai_tro: 'Khách hàng' }
      });

      if (!customerRole) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy vai trò khách hàng'
        });
      }

      const allCustomers = await NguoiDung.findAll({
        where: {
          ma_vai_tro: customerRole.ma_vai_tro,
          trang_thai: 'Đang hoạt động'
        },
        attributes: ['ma_nguoi_dung', 'ho_ten', 'email', 'so_dien_thoai']
      });

      // Lọc theo chi tiêu
      for (const user of allCustomers) {
        const totalSpent = await DonDatTour.sum('tong_tien', {
          where: {
            ma_nguoi_dung: user.ma_nguoi_dung,
            trang_thai_don_hang: {
              [Op.notIn]: ['Đã hủy']
            }
          }
        });

        const spent = totalSpent || 0;
        let pass = true;
        if (min_spent && spent < parseFloat(min_spent)) pass = false;
        if (max_spent && spent > parseFloat(max_spent)) pass = false;
        
        if (pass) {
          customers.push(user);
        }
      }
    } else if (customer_ids && customer_ids.length > 0) {
      // Gửi cho danh sách khách hàng cụ thể
      customers = await NguoiDung.findAll({
        where: {
          ma_nguoi_dung: customer_ids,
          trang_thai: 'Đang hoạt động'
        },
        attributes: ['ma_nguoi_dung', 'ho_ten', 'email', 'so_dien_thoai']
      });
    } else {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng chọn khách hàng hoặc chọn gửi cho tất cả'
      });
    }

    if (customers.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy khách hàng nào đáp ứng điều kiện'
      });
    }

    // ⭐ LƯU MÃ GIẢM GIÁ VÀO BẢNG TRUNG GIAN CHO TỪNG KHÁCH HÀNG
    const KhachHangMaGiamGia = sequelize.models.KhachHangMaGiamGia;
    let savedCount = 0;

    for (const customer of customers) {
      // ⭐ KIỂM TRA XEM ĐÃ TỒN TẠI CHƯA (TRÁNH TRÙNG)
      const existing = await KhachHangMaGiamGia.findOne({
        where: {
          ma_nguoi_dung: customer.ma_nguoi_dung,
          ma_giam_gia: ma_giam_gia,
          da_su_dung: false
        }
      });

      if (!existing) {
        await KhachHangMaGiamGia.create({
          ma_nguoi_dung: customer.ma_nguoi_dung,
          ma_giam_gia: ma_giam_gia,
          da_su_dung: false,
          ngay_nhan: new Date()
        });
        savedCount++;
      }

      // Gửi email
      try {
        await sendDiscountEmail(customer.email, {
          ho_ten: customer.ho_ten,
          ma_code: discount.ma_code,
          ten_chuong_trinh: discount.ten_chuong_trinh,
          loai_giam: discount.loai_giam,
          muc_giam: discount.muc_giam,
          giam_toi_da: discount.giam_toi_da,
          ngay_ket_thuc: discount.ngay_ket_thuc,
          yeu_cau_toi_thieu: discount.yeu_cau_toi_thieu
        });
      } catch (error) {
        console.error(`❌ Failed to send to ${customer.email}:`, error.message);
      }
    }

    res.json({
      success: true,
      message: `Đã gửi mã giảm giá cho ${customers.length} khách hàng (lưu thành công ${savedCount} bản ghi)`,
      data: {
        total_customers: customers.length,
        saved_count: savedCount,
        discount_code: discount.ma_code
      }
    });
  } catch (error) {
    console.error('Send discount to customers error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi gửi mã giảm giá: ' + error.message
    });
  }
};