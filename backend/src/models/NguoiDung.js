import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import bcrypt from 'bcryptjs';

const NguoiDung = sequelize.define('NguoiDung', {
  ma_nguoi_dung: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  ma_vai_tro: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'vai_tro',
      key: 'ma_vai_tro'
    }
  },
  ho_ten: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  so_dien_thoai: {
    type: DataTypes.STRING(15),
    allowNull: false,
    unique: true
  },
  mat_khau: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  anh_dai_dien: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  ngay_sinh: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  gioi_tinh: {
    type: DataTypes.ENUM('Nam', 'Nữ', 'Khác'),
    allowNull: true
  },
  dia_chi: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  so_cccd: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  trang_thai: {
    type: DataTypes.ENUM('Đang hoạt động', 'Đã khóa'),
    defaultValue: 'Đang hoạt động'
  },
  ngay_tao: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  ngay_cap_nhat: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'nguoi_dung',
  timestamps: true,
  createdAt: 'ngay_tao',
  updatedAt: 'ngay_cap_nhat',
  paranoid: true,
  deletedAt: 'deleted_at',
  hooks: {
    beforeCreate: async (user) => {
      if (user.mat_khau) {
        const salt = await bcrypt.genSalt(10);
        user.mat_khau = await bcrypt.hash(user.mat_khau, salt);
      }
    },
    beforeUpdate: async (user) => {
      if (user.changed('mat_khau')) {
        const salt = await bcrypt.genSalt(10);
        user.mat_khau = await bcrypt.hash(user.mat_khau, salt);
      }
      user.ngay_cap_nhat = new Date();
    }
  }
});

NguoiDung.prototype.kiemTraMatKhau = async function(matKhauNhap) {
  try {
    console.log('🔐 Comparing password for:', this.email);
    console.log('🔑 Stored hash:', this.mat_khau);
    
    // Kiểm tra hash hợp lệ
    if (!this.mat_khau || this.mat_khau.length < 10) {
      console.log('❌ Invalid hash format');
      return false;
    }

    const result = await bcrypt.compare(matKhauNhap, this.mat_khau);
    console.log('🔐 Compare result:', result);
    return result;
  } catch (error) {
    console.error('❌ Password check error:', error);
    return false;
  }
};
export default NguoiDung;