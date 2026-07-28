// backend/src/models/KhachHangMaGiamGia.js
import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const KhachHangMaGiamGia = sequelize.define('KhachHangMaGiamGia', {
  ma: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  ma_nguoi_dung: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'nguoi_dung',
      key: 'ma_nguoi_dung'
    }
  },
  ma_giam_gia: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'ma_giam_gia',
      key: 'ma_giam_gia'
    }
  },
  da_su_dung: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  ngay_nhan: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  ngay_su_dung: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'khach_hang_ma_giam_gia',
  timestamps: true,
  createdAt: 'ngay_nhan',
  updatedAt: false,
  paranoid: true,
  deletedAt: 'deleted_at'
});

export default KhachHangMaGiamGia;