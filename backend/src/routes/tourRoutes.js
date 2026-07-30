// backend/src/routes/tourRoutes.js
import express from 'express';
import {
    getTours,
    getTourDetail,
    searchTours,
    createTour,
    updateTour,
    deleteTour,
    getScheduleDetail
} from '../controllers/tourController.js';
import {
    getSchedules,
    createSchedule,
    updateSchedule,
    deleteSchedule
} from '../controllers/scheduleController.js';
import { protect } from '../middleware/auth.js';
import { checkRole, ROLES } from '../middleware/role.js';
import { uploadTourImages } from '../middleware/upload.js';
import { validate, commonValidations } from '../utils/validation.js';
import { body } from 'express-validator';

const router = express.Router();

// ============================================
// VALIDATION CHO SCHEDULE
// ============================================
const scheduleValidation = [
    body('ma_tour').isInt({ min: 1 }).withMessage('Mã tour không hợp lệ'),
    body('ngay_khoi_hanh').notEmpty().withMessage('Ngày khởi hành không được để trống'),
    body('so_chot_toi_da').isInt({ min: 1 }).withMessage('Số chỗ tối đa phải lớn hơn 0'),
    body('gia_nguoi_lon').isFloat({ min: 0 }).withMessage('Giá người lớn không hợp lệ'),
    body('gia_tre_em').isFloat({ min: 0 }).withMessage('Giá trẻ em không hợp lệ')
];

// ============================================
// PUBLIC ROUTES
// ============================================
router.get('/', getTours);
router.get('/search', searchTours);
router.get('/schedules', getSchedules);
router.get('/schedules/:id', getScheduleDetail);
router.get('/:id', getTourDetail);

// ============================================
// ADMIN ROUTES - SỬ DỤNG uploadTourImages
// ============================================
router.use(protect);
router.use(checkRole(ROLES.ADMIN, ROLES.NHAN_VIEN));

// Tour CRUD
router.post('/', uploadTourImages, validate(commonValidations.createTour), createTour);
router.put('/:id', uploadTourImages, validate(commonValidations.createTour), updateTour);
router.delete('/:id', validate(commonValidations.idParam), deleteTour);

// Schedule CRUD
router.post('/schedules', validate(scheduleValidation), createSchedule);
router.put('/schedules/:id', validate(commonValidations.idParam), validate(scheduleValidation), updateSchedule);
router.delete('/schedules/:id', validate(commonValidations.idParam), deleteSchedule);

export default router;