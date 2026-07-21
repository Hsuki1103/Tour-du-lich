import { NguoiDung, VaiTro, RefreshToken } from '../models/index.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { Op } from 'sequelize';

dotenv.config();

// ============================================
// TẠO TOKEN
// ============================================
const generateTokens = (user) => {
  const secret = process.env.JWT_SECRET || 'my_secret_key_123456789';
  const refreshSecret = process.env.JWT_REFRESH_SECRET || 'my_refresh_secret_key_987654321';

  const accessToken = jwt.sign(
    { id: user.ma_nguoi_dung, email: user.email },
    secret,
    { expiresIn: '7d' }
  );

  const refreshToken = jwt.sign(
    { id: user.ma_nguoi_dung },
    refreshSecret,
    { expiresIn: '30d' }
  );

  return { accessToken, refreshToken };
};

// ============================================
// LƯU REFRESH TOKEN
// ============================================
const saveRefreshToken = async (userId, token) => {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30);

  await RefreshToken.create({
    ma_nguoi_dung: userId,
    token: token,
    thoi_gian_het_han: expiresAt,
    revoked: false
  });
};

// ============================================
// ĐĂNG KÝ
// ============================================
export const register = async (req, res) => {
  try {
    const { ho_ten, email, so_dien_thoai, mat_khau } = req.body;

    console.log('📝 REGISTER:', { ho_ten, email, so_dien_thoai });

    // Kiểm tra email tồn tại
    const existingUser = await NguoiDung.findOne({
      where: {
        [Op.or]: [
          { email: email },
          { so_dien_thoai: so_dien_thoai }
        ]
      }
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email hoặc số điện thoại đã được sử dụng'
      });
    }

    // Lấy vai trò khách hàng
    const khachHangRole = await VaiTro.findOne({
      where: { ten_vai_tro: 'Khách hàng' }
    });

    if (!khachHangRole) {
      return res.status(500).json({
        success: false,
        message: 'Không tìm thấy vai trò Khách hàng'
      });
    }

    // Tạo user
    const user = await NguoiDung.create({
      ma_vai_tro: khachHangRole.ma_vai_tro,
      ho_ten: ho_ten,
      email: email,
      so_dien_thoai: so_dien_thoai,
      mat_khau: mat_khau,
      trang_thai: 'Đang hoạt động'
    });

    console.log('✅ User created:', user.email);

    // Tạo token
    const { accessToken, refreshToken } = generateTokens(user);
    await saveRefreshToken(user.ma_nguoi_dung, refreshToken);

    const userData = user.toJSON();
    delete userData.mat_khau;

    res.status(201).json({
      success: true,
      message: 'Đăng ký thành công!',
      data: {
        user: userData,
        accessToken,
        refreshToken
      }
    });
  } catch (error) {
    console.error('❌ Register error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi đăng ký: ' + error.message
    });
  }
};

// ============================================
// ĐĂNG NHẬP
// ============================================
export const login = async (req, res) => {
  try {
    const { email, mat_khau } = req.body;

    console.log('========================================');
    console.log('📝 LOGIN ATTEMPT');
    console.log('📧 Email:', email);
    console.log('========================================');

    if (!email || !mat_khau) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập email và mật khẩu'
      });
    }

    // Tìm user
    const user = await NguoiDung.findOne({
      where: { email: email.trim() },
      include: [
        {
          model: VaiTro,
          as: 'vaiTro',
          attributes: ['ten_vai_tro']
        }
      ]
    });

    if (!user) {
      console.log('❌ User NOT FOUND');
      return res.status(401).json({
        success: false,
        message: 'Email hoặc mật khẩu không đúng'
      });
    }

    console.log('✅ User found:', user.email);

    // Kiểm tra mật khẩu
    const isPasswordValid = await bcrypt.compare(mat_khau, user.mat_khau);
    console.log('🔐 Password valid:', isPasswordValid);

    if (!isPasswordValid) {
      console.log('❌ Password INVALID');
      return res.status(401).json({
        success: false,
        message: 'Email hoặc mật khẩu không đúng'
      });
    }

    // Kiểm tra trạng thái
    if (user.trang_thai === 'Đã khóa') {
      return res.status(403).json({
        success: false,
        message: 'Tài khoản đã bị khóa'
      });
    }

    // Tạo token
    const { accessToken, refreshToken } = generateTokens(user);
    await saveRefreshToken(user.ma_nguoi_dung, refreshToken);

    console.log('✅ LOGIN SUCCESS');
    console.log('========================================');

    const userData = user.toJSON();
    delete userData.mat_khau;

    res.json({
      success: true,
      message: 'Đăng nhập thành công',
      data: {
        user: userData,
        accessToken,
        refreshToken
      }
    });
  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi đăng nhập: ' + error.message
    });
  }
};

// ============================================
// LẤY THÔNG TIN USER
// ============================================
export const getProfile = async (req, res) => {
  try {
    const user = await NguoiDung.findByPk(req.user.ma_nguoi_dung, {
      attributes: { exclude: ['mat_khau'] },
      include: [
        {
          model: VaiTro,
          as: 'vaiTro',
          attributes: ['ten_vai_tro']
        }
      ]
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng'
      });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi lấy thông tin: ' + error.message
    });
  }
};

// ============================================
// REFRESH TOKEN
// ============================================
export const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token không được cung cấp'
      });
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || 'my_refresh_secret_key_987654321');

    const storedToken = await RefreshToken.findOne({
      where: {
        token: refreshToken,
        ma_nguoi_dung: decoded.id,
        revoked: false
      }
    });

    if (!storedToken) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token không hợp lệ'
      });
    }

    if (new Date() > storedToken.thoi_gian_het_han) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token đã hết hạn'
      });
    }

    const user = await NguoiDung.findByPk(decoded.id);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Người dùng không tồn tại'
      });
    }

    const { accessToken, refreshToken: newRefreshToken } = generateTokens(user);

    storedToken.revoked = true;
    await storedToken.save();

    await saveRefreshToken(user.ma_nguoi_dung, newRefreshToken);

    res.json({
      success: true,
      message: 'Refresh token thành công',
      data: {
        accessToken,
        refreshToken: newRefreshToken
      }
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(401).json({
      success: false,
      message: 'Refresh token không hợp lệ: ' + error.message
    });
  }
};

// ============================================
// LOGOUT
// ============================================
export const logout = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (refreshToken) {
      await RefreshToken.update(
        { revoked: true },
        { where: { token: refreshToken } }
      );
    }

    res.clearCookie('access_token');

    res.json({
      success: true,
      message: 'Đăng xuất thành công'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi đăng xuất: ' + error.message
    });
  }
};

// ============================================
// CÁC HÀM KHÁC (ĐỂ TRỐNG)
// ============================================
export const verifyOTPController = async (req, res) => {
  res.json({ success: true, message: 'OTP verified' });
};

export const resendOTP = async (req, res) => {
  res.json({ success: true, message: 'OTP resent' });
};

export const forgotPassword = async (req, res) => {
  res.json({ success: true, message: 'Password reset email sent' });
};

export const resetPassword = async (req, res) => {
  res.json({ success: true, message: 'Password reset successfully' });
};

export const changePassword = async (req, res) => {
  res.json({ success: true, message: 'Password changed successfully' });
};