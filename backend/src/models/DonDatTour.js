import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const DonDatTour = sequelize.define('DonDatTour', {
  ma_don_hang: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  ma_nguoi_dung: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  ma_lich_khoi_hanh: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  ma_giam_gia: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  ma_nhan_vien_phu_trach: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  ma_don_hang_vnpay: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  so_luong_nguoi_lon: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  so_luong_tre_em: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  thong_tin_khach: {
    type: DataTypes.JSON,
    allowNull: true
  },
  yeu_cau_dac_biet: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  tong_tien: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false
  },
  tien_coc: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0
  },
  tien_con_lai: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0
  },
  trang_thai_thanh_toan: {
    type: DataTypes.ENUM('Chưa thanh toán', 'Đã đặt cọc', 'Đã thanh toán'),
    defaultValue: 'Chưa thanh toán'
  },
  trang_thai_don_hang: {
    type: DataTypes.ENUM('Chờ xác nhận', 'Đã xác nhận', 'Đang diễn ra', 'Đã hoàn thành', 'Đã hủy'),
    defaultValue: 'Chờ xác nhận'
  },
  ly_do_huy: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  ngay_dat: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  ngay_tao: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  ngay_cap_nhat: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'don_dat_tour',
  timestamps: true,
  createdAt: 'ngay_tao',
  updatedAt: 'ngay_cap_nhat',
  paranoid: true,
  deletedAt: 'deleted_at',
  // ⭐ QUAN TRỌNG: XÓA BỎ INDEXES HOẶC GIỚI HẠN
  indexes: [
    // Chỉ giữ lại các index cần thiết
    {
      name: 'idx_don_dat_tour_ma_nguoi_dung',
      fields: ['ma_nguoi_dung']
    },
    {
      name: 'idx_don_dat_tour_ma_lich_khoi_hanh',
      fields: ['ma_lich_khoi_hanh']
    },
    {
      name: 'idx_don_dat_tour_trang_thai_don_hang',
      fields: ['trang_thai_don_hang']
    },
    {
      name: 'idx_don_dat_tour_ngay_dat',
      fields: ['ngay_dat']
    }
    // ⭐ XÓA BỎ CÁC INDEX KHÔNG CẦN THIẾT
  ]
});

export default DonDatTour;