import { VaiTro } from '../models/index.js';

export const checkRole = (...roles) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Bạn chưa đăng nhập'
        });
      }

      const vaiTro = await VaiTro.findByPk(req.user.ma_vai_tro);
      
      if (!vaiTro) {
        return res.status(403).json({
          success: false,
          message: 'Không tìm thấy vai trò của bạn'
        });
      }

      // Check if user's role name matches any of the allowed roles
      const hasRole = roles.some(role => 
        vaiTro.ten_vai_tro.toLowerCase() === role.toLowerCase()
      );

      if (!hasRole) {
        return res.status(403).json({
          success: false,
          message: 'Bạn không có quyền truy cập chức năng này'
        });
      }

      next();
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Lỗi kiểm tra quyền: ' + error.message
      });
    }
  };
};

// Role constants
export const ROLES = {
  ADMIN: 'Admin',
  NHAN_VIEN: 'Nhân viên',
  KHACH_HANG: 'Khách hàng'
};