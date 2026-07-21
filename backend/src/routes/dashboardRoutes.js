import express from 'express';
import {
  getDashboardStats,
  getRevenueStats,
  getTopTours,
  getCancellationStats,
  exportReport
} from '../controllers/dashboardController.js';
import { protect } from '../middleware/auth.js';
import { checkRole, ROLES } from '../middleware/role.js';

const router = express.Router();

router.use(protect);
router.use(checkRole(ROLES.ADMIN, ROLES.NHAN_VIEN));

router.get('/stats', getDashboardStats);
router.get('/revenue', getRevenueStats);
router.get('/top-tours', getTopTours);
router.get('/cancellations', getCancellationStats);
router.get('/export', exportReport);

export default router;