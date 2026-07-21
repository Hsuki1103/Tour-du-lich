import express from 'express';
import {
  createDiscount,
  getDiscounts,
  getDiscountDetail,
  updateDiscount,
  deleteDiscount,
  validateDiscount
} from '../controllers/discountController.js';
import { protect } from '../middleware/auth.js';
import { checkRole, ROLES } from '../middleware/role.js';
import { validate, commonValidations } from '../utils/validation.js';

const router = express.Router();

// Public - validate discount
router.post('/validate', validateDiscount);

// Protected routes
router.use(protect);
router.use(checkRole(ROLES.ADMIN, ROLES.NHAN_VIEN));

router.post('/', validate(commonValidations.createDiscount), createDiscount);
router.get('/', getDiscounts);
router.get('/:id', validate(commonValidations.idParam), getDiscountDetail);
router.put('/:id', validate(commonValidations.createDiscount), updateDiscount);
router.delete('/:id', validate(commonValidations.idParam), deleteDiscount);

export default router;