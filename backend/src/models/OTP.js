import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const OTP = sequelize.define('OTP', {
  ma_otp: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true  // ← Chỉ có 1 cột autoIncrement
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  otp_code: {  // ← Đổi tên từ ma_otp thành otp_code để tránh trùng
    type: DataTypes.STRING(6),
    allowNull: false
  },
  loai: {
    type: DataTypes.ENUM('dang_ky', 'quen_mat_khau', 'thay_doi_email', 'xac_thuc'),
    allowNull: false,
    defaultValue: 'xac_thuc'
  },
  da_su_dung: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  thoi_gian_het_han: {
    type: DataTypes.DATE,
    allowNull: false
  },
  ngay_tao: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'otp',
  timestamps: true,
  createdAt: 'ngay_tao',
  updatedAt: false
});

export default OTP;