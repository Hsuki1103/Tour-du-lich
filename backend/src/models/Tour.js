import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Tour = sequelize.define('Tour', {
  ma_tour: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  ten_tour: {
    type: DataTypes.STRING(200),
    allowNull: false
  },
  diem_den: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  khu_vuc: {
    type: DataTypes.ENUM('Miền Bắc', 'Miền Trung', 'Miền Nam'),
    allowNull: true
  },
  so_ngay: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1,
      max: 30
    }
  },
  mo_ta_ngan: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  mo_ta_chi_tiet: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  lich_trinh: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  dich_vu_bao_gom: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  chinh_sach_huy: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  hinh_anh: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  hinh_anh_phu: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  trang_thai: {
    type: DataTypes.ENUM('Đang hoạt động', 'Ngừng bán', 'Hết chỗ'),
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
  tableName: 'tour',
  timestamps: true,
  createdAt: 'ngay_tao',
  updatedAt: 'ngay_cap_nhat',
  paranoid: true,
  deletedAt: 'deleted_at'
});

export default Tour;