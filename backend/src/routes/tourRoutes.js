import express from 'express';
import {
  getTours,
  getTourDetail,
  getScheduleDetail,  // ⭐ THÊM IMPORT
  searchTours,
  createTour,
  updateTour,
  deleteTour,
  createSchedule,
  updateSchedule,
  deleteSchedule
} from '../controllers/tourController.js';
import { protect } from '../middleware/auth.js';
import { checkRole, ROLES } from '../middleware/role.js';
import { uploadTourImage } from '../middleware/upload.js';
import { validate, commonValidations } from '../utils/validation.js';

const router = express.Router();

// Public routes
router.get('/', getTours);
router.get('/search', searchTours);
router.get('/:id', getTourDetail);

// ⭐ ROUTE LẤY CHI TIẾT LỊCH KHỞI HÀNH
router.get('/schedules/:id', getScheduleDetail);

// Admin & Employee routes
router.use(protect);
router.use(checkRole(ROLES.ADMIN, ROLES.NHAN_VIEN));

// Tour management
router.post('/', uploadTourImage, validate(commonValidations.createTour), createTour);
router.put('/:id', uploadTourImage, validate(commonValidations.createTour), updateTour);
router.delete('/:id', validate(commonValidations.idParam), deleteTour);

// Schedule management
router.post('/schedules', validate(commonValidations.createSchedule), createSchedule);
router.put('/schedules/:id', validate(commonValidations.createSchedule), updateSchedule);
router.delete('/schedules/:id', validate(commonValidations.idParam), deleteSchedule);

export default router;