// backend/src/routes/discountRoutes.js
import express from 'express';
import {
  createDiscount,
  getDiscounts,
  getDiscountDetail,
  updateDiscount,
  deleteDiscount,
  validateDiscount,
  getPublicDiscounts,
  getPublicDiscountDetail,
  getMyDiscounts,
  sendDiscountToCustomers
} from '../controllers/discountController.js';
import { protect } from '../middleware/auth.js';
import { checkRole, ROLES } from '../middleware/role.js';
import { validate, commonValidations } from '../utils/validation.js';

const router = express.Router();

// ⭐ PUBLIC ROUTES - CHỈ HIỂN THỊ MÃ PUBLIC
router.get('/public', getPublicDiscounts);
router.get('/public/:id', getPublicDiscountDetail);

// Public - validate discount (khi đặt tour)
router.post('/validate', validateDiscount);

// ⭐ ROUTE LẤY MÃ GIẢM GIÁ CỦA KHÁCH HÀNG (CẦN ĐĂNG NHẬP)
router.get('/my-discounts', protect, getMyDiscounts);

// Protected routes (Admin & Staff)
router.use(protect);
router.use(checkRole(ROLES.ADMIN, ROLES.NHAN_VIEN));

// Discount CRUD
router.post('/', validate(commonValidations.createDiscount), createDiscount);
router.get('/', getDiscounts);
router.get('/:id', validate(commonValidations.idParam), getDiscountDetail);
router.put('/:id', validate(commonValidations.createDiscount), updateDiscount);
router.delete('/:id', validate(commonValidations.idParam), deleteDiscount);

// ⭐ ADMIN: GỬI MÃ GIẢM GIÁ CHO KHÁCH HÀNG
router.post('/send-to-customers', sendDiscountToCustomers);

export default router;