// backend/src/routes/vehicleRoutes.js
import express from 'express';
import {
  getVehicles,
  getVehicleDetail,
  createVehicle,
  updateVehicle,
  deleteVehicle,
  getActiveVehicles,
  calculateMaxSeats
} from '../controllers/vehicleController.js';
import { protect } from '../middleware/auth.js';
import { checkRole, ROLES } from '../middleware/role.js';
import { validate, commonValidations } from '../utils/validation.js';
import { body } from 'express-validator';

const router = express.Router();

// Validation cho vehicle
const vehicleValidation = [
  body('bien_so_xe').notEmpty().withMessage('Biển số xe không được để trống'),
  body('ten_xe').notEmpty().withMessage('Tên xe không được để trống'),
  body('so_cho_ngoi').isInt({ min: 4, max: 60 }).withMessage('Số chỗ ngồi phải từ 4 đến 60'),
  body('so_luong_xe').optional().isInt({ min: 1, max: 10 }).withMessage('Số lượng xe phải từ 1 đến 10'),
  body('loai_xe').optional().isIn(['Xe khách', 'Xe limousine', 'Xe van', 'Xe giường nằm', 'Xe buýt']).withMessage('Loại xe không hợp lệ')
];

router.use(protect);
router.use(checkRole(ROLES.ADMIN, ROLES.NHAN_VIEN));

// Public (cho schedule)
router.get('/active', getActiveVehicles);
router.post('/calculate-max-seats', calculateMaxSeats);

// CRUD
router.get('/', getVehicles);
router.get('/:id', validate(commonValidations.idParam), getVehicleDetail);
router.post('/', validate(vehicleValidation), createVehicle);
router.put('/:id', validate(commonValidations.idParam), validate(vehicleValidation), updateVehicle);
router.delete('/:id', validate(commonValidations.idParam), deleteVehicle);

export default router;