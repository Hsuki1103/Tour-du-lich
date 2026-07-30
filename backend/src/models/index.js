// backend/src/models/index.js
import sequelize from '../config/database.js';
import VaiTro from './VaiTro.js';
import NguoiDung from './NguoiDung.js';
import NhanVien from './NhanVien.js';
import Admin from './Admin.js';
import Tour from './Tour.js';
import LichKhoiHanh from './LichKhoiHanh.js';
import LichKhoiHanhPhuongTien from './LichKhoiHanhPhuongTien.js';
import DonDatTour from './DonDatTour.js';
import ThanhToan from './ThanhToan.js';
import DanhGia from './DanhGia.js';
import MaGiamGia from './MaGiamGia.js';
import OTP from './OTP.js';
import RefreshToken from './RefreshToken.js';
import KhachHangMaGiamGia from './KhachHangMaGiamGia.js';
import PhuongTien from './PhuongTien.js';

// ============================================
// ĐỊNH NGHĨA QUAN HỆ
// ============================================

// 1. VaiTro - NguoiDung
VaiTro.hasMany(NguoiDung, { foreignKey: 'ma_vai_tro', as: 'nguoiDungs' });
NguoiDung.belongsTo(VaiTro, { foreignKey: 'ma_vai_tro', as: 'vaiTro' });

// 2. NguoiDung - NhanVien
NguoiDung.hasOne(NhanVien, { foreignKey: 'ma_nguoi_dung', as: 'nhanVien' });
NhanVien.belongsTo(NguoiDung, { foreignKey: 'ma_nguoi_dung', as: 'nguoiDung' });

// 3. NguoiDung - Admin
NguoiDung.hasOne(Admin, { foreignKey: 'ma_nguoi_dung', as: 'admin' });
Admin.belongsTo(NguoiDung, { foreignKey: 'ma_nguoi_dung', as: 'nguoiDung' });

// 4. Tour - LichKhoiHanh
Tour.hasMany(LichKhoiHanh, { foreignKey: 'ma_tour', as: 'lichKhoiHanhs' });
LichKhoiHanh.belongsTo(Tour, { foreignKey: 'ma_tour', as: 'tour' });

// ⭐ 5. LichKhoiHanh - PhuongTien (NHIỀU - NHIỀU QUA BẢNG TRUNG GIAN)
LichKhoiHanh.belongsToMany(PhuongTien, {
    through: LichKhoiHanhPhuongTien,
    foreignKey: 'ma_lich_khoi_hanh',
    otherKey: 'ma_phuong_tien',
    as: 'phuongTiens'
});

PhuongTien.belongsToMany(LichKhoiHanh, {
    through: LichKhoiHanhPhuongTien,
    foreignKey: 'ma_phuong_tien',
    otherKey: 'ma_lich_khoi_hanh',
    as: 'lichKhoiHanhs'
});

// ⭐ 6. LichKhoiHanhPhuongTien - LichKhoiHanh (QUAN HỆ 1-1)
LichKhoiHanhPhuongTien.belongsTo(LichKhoiHanh, { foreignKey: 'ma_lich_khoi_hanh', as: 'lichKhoiHanh' });
LichKhoiHanh.hasMany(LichKhoiHanhPhuongTien, { foreignKey: 'ma_lich_khoi_hanh', as: 'lichKhoiHanhPhuongTiens' });

// ⭐ 7. LichKhoiHanhPhuongTien - PhuongTien (QUAN HỆ 1-1)
LichKhoiHanhPhuongTien.belongsTo(PhuongTien, { foreignKey: 'ma_phuong_tien', as: 'phuongTien' });
PhuongTien.hasMany(LichKhoiHanhPhuongTien, { foreignKey: 'ma_phuong_tien', as: 'lichKhoiHanhPhuongTiens' });

// 8. LichKhoiHanh - DonDatTour
LichKhoiHanh.hasMany(DonDatTour, { foreignKey: 'ma_lich_khoi_hanh', as: 'donDatTours' });
DonDatTour.belongsTo(LichKhoiHanh, { foreignKey: 'ma_lich_khoi_hanh', as: 'lichKhoiHanh' });

// 9. NguoiDung - DonDatTour
NguoiDung.hasMany(DonDatTour, { foreignKey: 'ma_nguoi_dung', as: 'donDatTours' });
DonDatTour.belongsTo(NguoiDung, { foreignKey: 'ma_nguoi_dung', as: 'nguoiDung' });

// 10. MaGiamGia - DonDatTour
MaGiamGia.hasMany(DonDatTour, { foreignKey: 'ma_giam_gia', as: 'donDatTours' });
DonDatTour.belongsTo(MaGiamGia, { foreignKey: 'ma_giam_gia', as: 'maGiamGia' });

// 11. DonDatTour - ThanhToan
DonDatTour.hasOne(ThanhToan, { foreignKey: 'ma_don_hang', as: 'thanhToan' });
ThanhToan.belongsTo(DonDatTour, { foreignKey: 'ma_don_hang', as: 'donDatTour' });

// 12. DonDatTour - DanhGia
DonDatTour.hasOne(DanhGia, { foreignKey: 'ma_don_hang', as: 'danhGia' });
DanhGia.belongsTo(DonDatTour, { foreignKey: 'ma_don_hang', as: 'donDatTour' });

// 13. NguoiDung - DanhGia
NguoiDung.hasMany(DanhGia, { foreignKey: 'ma_nguoi_dung', as: 'danhGias' });
DanhGia.belongsTo(NguoiDung, { foreignKey: 'ma_nguoi_dung', as: 'nguoiDung' });

// 14. DanhGia - Tour
DanhGia.belongsTo(Tour, { foreignKey: 'ma_tour', as: 'tour' });
Tour.hasMany(DanhGia, { foreignKey: 'ma_tour', as: 'danhGias' });

// 15. NhanVien - DonDatTour
NhanVien.hasMany(DonDatTour, { foreignKey: 'ma_nhan_vien_phu_trach', as: 'donDatToursPhuTrach' });
DonDatTour.belongsTo(NhanVien, { foreignKey: 'ma_nhan_vien_phu_trach', as: 'nhanVienPhuTrach' });

// 16. NguoiDung - KhachHangMaGiamGia
NguoiDung.hasMany(KhachHangMaGiamGia, { foreignKey: 'ma_nguoi_dung', as: 'khachHangMaGiamGias' });
KhachHangMaGiamGia.belongsTo(NguoiDung, { foreignKey: 'ma_nguoi_dung', as: 'nguoiDung' });

// 17. MaGiamGia - KhachHangMaGiamGia
MaGiamGia.hasMany(KhachHangMaGiamGia, { foreignKey: 'ma_giam_gia', as: 'khachHangMaGiamGias' });
KhachHangMaGiamGia.belongsTo(MaGiamGia, { foreignKey: 'ma_giam_gia', as: 'maGiamGia' });

// 18. NguoiDung - RefreshToken
NguoiDung.hasMany(RefreshToken, { foreignKey: 'ma_nguoi_dung', as: 'refreshTokens' });
RefreshToken.belongsTo(NguoiDung, { foreignKey: 'ma_nguoi_dung', as: 'nguoiDung' });

// ============================================
// EXPORT TẤT CẢ MODEL
// ============================================
export {
    sequelize,
    VaiTro,
    NguoiDung,
    NhanVien,
    Admin,
    Tour,
    LichKhoiHanh,
    LichKhoiHanhPhuongTien,
    DonDatTour,
    ThanhToan,
    DanhGia,
    MaGiamGia,
    OTP,
    RefreshToken,
    KhachHangMaGiamGia,
    PhuongTien
};