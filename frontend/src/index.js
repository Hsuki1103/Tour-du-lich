import sequelize from '../config/database.js';
import VaiTro from './VaiTro.js';
import NguoiDung from './NguoiDung.js';
import NhanVien from './NhanVien.js';
import Admin from './Admin.js';
import Tour from './Tour.js';
import LichKhoiHanh from './LichKhoiHanh.js';
import DonDatTour from './DonDatTour.js';
import ThanhToan from './ThanhToan.js';
import DanhGia from './DanhGia.js';
import MaGiamGia from './MaGiamGia.js';
import OTP from './OTP.js';
import RefreshToken from './RefreshToken.js';

// Định nghĩa quan hệ
// VaiTro - NguoiDung
VaiTro.hasMany(NguoiDung, { foreignKey: 'ma_vai_tro', as: 'nguoiDungs' });
NguoiDung.belongsTo(VaiTro, { foreignKey: 'ma_vai_tro', as: 'vaiTro' });

// NguoiDung - NhanVien
NguoiDung.hasOne(NhanVien, { foreignKey: 'ma_nguoi_dung', as: 'nhanVien' });
NhanVien.belongsTo(NguoiDung, { foreignKey: 'ma_nguoi_dung', as: 'nguoiDung' });

// NguoiDung - Admin
NguoiDung.hasOne(Admin, { foreignKey: 'ma_nguoi_dung', as: 'admin' });
Admin.belongsTo(NguoiDung, { foreignKey: 'ma_nguoi_dung', as: 'nguoiDung' });

// Tour - LichKhoiHanh
Tour.hasMany(LichKhoiHanh, { foreignKey: 'ma_tour', as: 'lichKhoiHanhs' });
LichKhoiHanh.belongsTo(Tour, { foreignKey: 'ma_tour', as: 'tour' });

// LichKhoiHanh - DonDatTour
LichKhoiHanh.hasMany(DonDatTour, { foreignKey: 'ma_lich_khoi_hanh', as: 'donDatTours' });
DonDatTour.belongsTo(LichKhoiHanh, { foreignKey: 'ma_lich_khoi_hanh', as: 'lichKhoiHanh' });

// NguoiDung - DonDatTour
NguoiDung.hasMany(DonDatTour, { foreignKey: 'ma_nguoi_dung', as: 'donDatTours' });
DonDatTour.belongsTo(NguoiDung, { foreignKey: 'ma_nguoi_dung', as: 'nguoiDung' });

// MaGiamGia - DonDatTour
MaGiamGia.hasMany(DonDatTour, { foreignKey: 'ma_giam_gia', as: 'donDatTours' });
DonDatTour.belongsTo(MaGiamGia, { foreignKey: 'ma_giam_gia', as: 'maGiamGia' });

// DonDatTour - ThanhToan
DonDatTour.hasOne(ThanhToan, { foreignKey: 'ma_don_hang', as: 'thanhToan' });
ThanhToan.belongsTo(DonDatTour, { foreignKey: 'ma_don_hang', as: 'donDatTour' });

// DonDatTour - DanhGia
DonDatTour.hasOne(DanhGia, { foreignKey: 'ma_don_hang', as: 'danhGia' });
DanhGia.belongsTo(DonDatTour, { foreignKey: 'ma_don_hang', as: 'donDatTour' });

// NguoiDung - DanhGia
NguoiDung.hasMany(DanhGia, { foreignKey: 'ma_nguoi_dung', as: 'danhGias' });
DanhGia.belongsTo(NguoiDung, { foreignKey: 'ma_nguoi_dung', as: 'nguoiDung' });

export {
  sequelize,
  VaiTro,
  NguoiDung,
  NhanVien,
  Admin,
  Tour,
  LichKhoiHanh,
  DonDatTour,
  ThanhToan,
  DanhGia,
  MaGiamGia,
  OTP,
  RefreshToken
};