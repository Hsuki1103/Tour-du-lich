import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Admin = sequelize.define('Admin', {
  ma_admin: {
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
  }
}, {
  tableName: 'admin',
  timestamps: true,
  createdAt: 'ngay_tao',
  updatedAt: 'ngay_cap_nhat'
});

export default Admin;