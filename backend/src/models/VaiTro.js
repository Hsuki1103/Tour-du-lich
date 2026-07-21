import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const VaiTro = sequelize.define('VaiTro', {
  ma_vai_tro: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  ten_vai_tro: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true
  },
  mo_ta: {
    type: DataTypes.STRING(255),
    allowNull: true
  }
}, {
  tableName: 'vai_tro',
  timestamps: false
});

export default VaiTro;