// backend/src/models/LichKhoiHanhPhuongTien.js
import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const LichKhoiHanhPhuongTien = sequelize.define('LichKhoiHanhPhuongTien', {
  ma: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  ma_lich_khoi_hanh: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'lich_khoi_hanh',
      key: 'ma_lich_khoi_hanh'
    }
  },
  ma_phuong_tien: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'phuong_tien',
      key: 'ma_phuong_tien'
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
  so_chot_duoc_them: {
    type: DataTypes.VIRTUAL,
    get() {
      // Tính số chỗ được thêm từ loại xe này
      // Cần lấy thông tin từ bảng phuong_tien
      return 0; // Sẽ được tính ở controller
    }
  }
}, {
  tableName: 'lich_khoi_hanh_phuong_tien',
  timestamps: true,
  createdAt: 'ngay_tao',
  updatedAt: 'ngay_cap_nhat'
});

export default LichKhoiHanhPhuongTien;