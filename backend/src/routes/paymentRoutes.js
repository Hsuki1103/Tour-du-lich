import express from 'express';
import {
  createVNPayPayment,
  handleVNPayReturn,
  getPaymentStatus
} from '../controllers/paymentController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// ⭐ VNPay return URL (public - KHÔNG CẦN AUTH)
router.get('/vnpay-return', handleVNPayReturn);

// ⭐ Protected routes
router.use(protect);

// Tạo thanh toán VNPay
router.post('/vnpay', createVNPayPayment);

// ⭐ Lấy trạng thái thanh toán - SỬA LẠI ROUTE
router.get('/status/:ma_don_hang', getPaymentStatus);

export default router;