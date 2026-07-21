import express from 'express';
import {
  getProfile,
  updateProfile,
  uploadAvatar,
  getBookingHistory
} from '../controllers/userController.js';
import { protect } from '../middleware/auth.js';
import { uploadSingle } from '../middleware/upload.js';
import { validate, commonValidations } from '../utils/validation.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

router.get('/profile', getProfile);
router.put('/profile', validate(commonValidations.updateProfile), updateProfile);
router.post('/avatar', uploadSingle, uploadAvatar);
router.get('/bookings', getBookingHistory);

export default router;