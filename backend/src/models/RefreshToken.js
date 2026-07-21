import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const RefreshToken = sequelize.define('RefreshToken', {
  ma_refresh_token: {
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
  token: {
    type: DataTypes.STRING(500),
    allowNull: false
  },
  thoi_gian_het_han: {
    type: DataTypes.DATE,
    allowNull: false
  },
  revoked: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  ngay_tao: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'refresh_token',
  timestamps: true,
  createdAt: 'ngay_tao',
  updatedAt: false
});

export default RefreshToken;