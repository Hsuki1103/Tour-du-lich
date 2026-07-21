import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const DanhGia = sequelize.define('DanhGia', {
  ma_danh_gia: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  ma_don_hang: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'don_dat_tour',
      key: 'ma_don_hang'
    },
    unique: true
  },
  ma_nguoi_dung: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'nguoi_dung',
      key: 'ma_nguoi_dung'
    }
  },
  ma_tour: {  // ← THÊM TRƯỜNG NÀY
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'tour',
      key: 'ma_tour'
    }
  },
  so_sao: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1,
      max: 5
    }
  },
  noi_dung: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  hinh_anh: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  ngay_danh_gia: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  ngay_tao: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'danh_gia',
  timestamps: true,
  createdAt: 'ngay_tao',
  updatedAt: false
});

export default DanhGia;