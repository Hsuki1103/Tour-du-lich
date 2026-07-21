import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const NhanVien = sequelize.define('NhanVien', {
  ma_nhan_vien: {
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
  chuc_vu: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  phong_ban: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  ngay_vao_lam: {
    type: DataTypes.DATEONLY,
    allowNull: true
  }
}, {
  tableName: 'nhan_vien',
  timestamps: true,
  createdAt: 'ngay_tao',
  updatedAt: 'ngay_cap_nhat'
});

export default NhanVien;