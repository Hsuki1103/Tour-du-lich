import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const ThanhToan = sequelize.define('ThanhToan', {
  ma_thanh_toan: {
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
    }
  },
  so_tien: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    validate: {
      min: 0
    }
  },
  phuong_thuc: {
    type: DataTypes.ENUM('VNPay', 'Chuyển khoản', 'Tiền mặt', 'MoMo'),
    allowNull: false
  },
  ma_giao_dich: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  trang_thai: {
    type: DataTypes.ENUM('Chờ thanh toán', 'Đã thanh toán', 'Thất bại', 'Đã hoàn tiền'),
    defaultValue: 'Chờ thanh toán'
  },
  thong_tin: {
    type: DataTypes.JSON,
    allowNull: true
  },
  ngay_thanh_toan: {
    type: DataTypes.DATE,
    allowNull: true
  },
  ngay_tao: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'thanh_toan',
  timestamps: true,
  createdAt: 'ngay_tao',
  updatedAt: false
});

export default ThanhToan;