import express from 'express';
import {
  createReview,
  getTourReviews,
  getMyReviews,
  updateReview,
  deleteReview
} from '../controllers/reviewController.js';
import { protect, optionalAuth } from '../middleware/auth.js';
import { checkRole, ROLES } from '../middleware/role.js';
import { validate, commonValidations } from '../utils/validation.js';

const router = express.Router();

// Public - get tour reviews
router.get('/tour/:tourId', getTourReviews);

// Protected
router.use(protect);

router.post('/', validate(commonValidations.createReview), createReview);
router.get('/my', getMyReviews);
router.put('/:id', validate(commonValidations.createReview), updateReview);
router.delete('/:id', validate(commonValidations.idParam), deleteReview);

// Admin can manage all reviews
router.use(checkRole(ROLES.ADMIN));
router.get('/admin/all', getMyReviews);

export default router;