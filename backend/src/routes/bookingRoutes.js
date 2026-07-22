import express from 'express';
import {
    createBooking,
    getMyBookings,
    getBookingDetail,
    cancelBooking,
    downloadVoucher,
    getAllBookings,
    confirmBooking,
    updateBooking,
    updateBookingByCustomer,
} from '../controllers/bookingController.js';
import { protect } from '../middleware/auth.js';
import { checkRole, ROLES } from '../middleware/role.js';
import { validate, commonValidations } from '../utils/validation.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Customer routes
router.post('/', validate(commonValidations.createBooking), createBooking);
router.get('/my', getMyBookings);
router.get('/my/:id', validate(commonValidations.idParam), getBookingDetail);
router.put('/my/:id/cancel', validate(commonValidations.idParam), cancelBooking);
router.get('/my/:id/voucher', validate(commonValidations.idParam), downloadVoucher);
router.put('/my/:id/update', validate(commonValidations.idParam), updateBookingByCustomer);

// Admin & Employee routes
router.use(checkRole(ROLES.ADMIN, ROLES.NHAN_VIEN));
router.get('/', getAllBookings);
router.put('/:id/confirm', validate(commonValidations.idParam), confirmBooking);
router.put('/:id', validate(commonValidations.idParam), updateBooking);

export default router;