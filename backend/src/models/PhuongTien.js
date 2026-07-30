// backend/src/models/PhuongTien.js
import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const PhuongTien = sequelize.define('PhuongTien', {
  ma_phuong_tien: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  bien_so_xe: {
    type: DataTypes.STRING(20),
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: { msg: 'Biển số xe không được để trống' }
    }
  },
  ten_xe: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Tên xe không được để trống' }
    }
  },
  hang_xe: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  so_cho_ngoi: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 4,
      max: 60
    }
  },
  so_luong_xe: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
    validate: {
      min: 1,
      max: 10
    }
  },
  loai_xe: {
    type: DataTypes.ENUM('Xe khách', 'Xe limousine', 'Xe van', 'Xe giường nằm', 'Xe buýt'),
    allowNull: false,
    defaultValue: 'Xe khách'
  },
  trang_thai: {
    type: DataTypes.ENUM('Đang hoạt động', 'Đang bảo trì', 'Ngừng hoạt động'),
    defaultValue: 'Đang hoạt động'
  },
  ngay_tao: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  ngay_cap_nhat: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  deleted_at: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'phuong_tien',
  timestamps: true,
  createdAt: 'ngay_tao',
  updatedAt: 'ngay_cap_nhat',
  paranoid: true,
  deletedAt: 'deleted_at'
});

// Virtual field: số chỗ tối đa sau khi trừ tài xế
PhuongTien.prototype.getMaxSeats = function() {
  return (this.so_cho_ngoi - 1) * this.so_luong_xe;
};

export default PhuongTien;