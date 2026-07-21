import jwt from 'jsonwebtoken';
import { NguoiDung } from '../models/index.js';

export const protect = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Bạn chưa đăng nhập'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'my_secret_key_123456789');

    const user = await NguoiDung.findByPk(decoded.id, {
      attributes: { exclude: ['mat_khau'] }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Người dùng không tồn tại'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Auth error:', error);
    res.status(401).json({
      success: false,
      message: 'Token không hợp lệ'
    });
  }
};

// ✅ THÊM HÀM optionalAuth
export const optionalAuth = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'my_secret_key_123456789');
        const user = await NguoiDung.findByPk(decoded.id, {
          attributes: { exclude: ['mat_khau'] }
        });
        if (user) {
          req.user = user;
        }
      } catch (error) {
        // Token invalid, continue as guest
      }
    }
    next();
  } catch (error) {
    next();
  }
};