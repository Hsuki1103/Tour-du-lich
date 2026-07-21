import express from 'express';
import {
  register,
  login,
  refreshToken,
  logout,
  getProfile,
  verifyOTPController,
  resendOTP,
  forgotPassword,
  resetPassword,
  changePassword
} from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/refresh-token', refreshToken);
router.post('/logout', logout);
router.post('/verify-otp', verifyOTPController);
router.post('/resend-otp', resendOTP);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

// Protected routes
router.get('/profile', protect, getProfile);
router.put('/change-password', protect, changePassword);

export default router;