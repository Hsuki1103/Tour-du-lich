import express from 'express';
import {
    createVNPayPayment,
    handleVNPayReturn,
    handleVNPayIPN,
    getPaymentStatus
} from '../controllers/paymentController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// ⭐ LOG TẤT CẢ REQUEST
router.use((req, res, next) => {
    console.log('🔗 Payment Route:', req.method, req.path);
    next();
});

// ⭐ IPN - PUBLIC (KHÔNG CẦN AUTH) - PHẢI ĐẶT TRƯỚC /:id
router.get('/vnpay-ipn', handleVNPayIPN);

// ⭐ RETURN URL - PUBLIC
router.get('/vnpay-return', handleVNPayReturn);

// ⭐ PROTECTED ROUTES
router.use(protect);

router.post('/vnpay', createVNPayPayment);
router.get('/status/:ma_don_hang', getPaymentStatus);

export default router;