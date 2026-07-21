import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const MaGiamGia = sequelize.define('MaGiamGia', {
  ma_giam_gia: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  ma_code: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true
  },
  ten_chuong_trinh: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  loai_giam: {
    type: DataTypes.ENUM('Phần trăm', 'Số tiền'),
    defaultValue: 'Phần trăm'
  },
  muc_giam: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 0
    }
  },
  giam_toi_da: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: true,
    validate: {
      min: 0
    }
  },
  so_luong: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1
    }
  },
  so_luong_da_dung: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  so_luong_con_lai: {
    type: DataTypes.VIRTUAL,
    get() {
      return this.so_luong - this.so_luong_da_dung;
    }
  },
  ngay_bat_dau: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  ngay_ket_thuc: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  ap_dung_cho_tour: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'JSON array of tour IDs, null means all tours'
  },
  yeu_cau_toi_thieu: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
    comment: 'Minimum number of guests required'
  },
  trang_thai: {
    type: DataTypes.ENUM('Đang hoạt động', 'Đã hết', 'Hết hạn'),
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
  tableName: 'ma_giam_gia',
  timestamps: true,
  createdAt: 'ngay_tao',
  updatedAt: 'ngay_cap_nhat'
});

// Kiểm tra mã giảm giá có hiệu lực không
MaGiamGia.prototype.kiemTraHieuLuc = function(ngayHienTai = new Date()) {
  const today = new Date(ngayHienTai);
  const start = new Date(this.ngay_bat_dau);
  const end = new Date(this.ngay_ket_thuc);
  
  if (this.trang_thai !== 'Đang hoạt động') return false;
  if (this.so_luong_da_dung >= this.so_luong) return false;
  if (today < start || today > end) return false;
  if (this.so_luong_con_lai <= 0) return false;
  
  return true;
};

// Tính giá sau khi giảm
MaGiamGia.prototype.tinhGiaSauGiam = function(giaGoc) {
  if (!this.kiemTraHieuLuc()) return giaGoc;
  
  let giaSauGiam = giaGoc;
  if (this.loai_giam === 'Phần trăm') {
    const soTienGiam = (giaGoc * this.muc_giam) / 100;
    if (this.giam_toi_da) {
      giaSauGiam = giaGoc - Math.min(soTienGiam, parseFloat(this.giam_toi_da));
    } else {
      giaSauGiam = giaGoc - soTienGiam;
    }
  } else {
    giaSauGiam = giaGoc - parseFloat(this.muc_giam);
  }
  
  return Math.max(0, giaSauGiam);
};

export default MaGiamGia;