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
    confirmOfflinePayment,
    requestRefund,
    getRefundRequests,
    getRefundDetail,
    approveRefund,
    rejectRefund,
    getRefundStats
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
router.put('/my/:id/offline-payment', validate(commonValidations.idParam), confirmOfflinePayment);

// ⭐ Yêu cầu hoàn tiền
router.post('/refund-request', requestRefund);

// ⭐ Admin routes for refund management
router.get('/refunds', checkRole(ROLES.ADMIN, ROLES.NHAN_VIEN), getRefundRequests);
router.get('/refunds/:id', checkRole(ROLES.ADMIN, ROLES.NHAN_VIEN), getRefundDetail);
router.put('/refunds/:id/approve', checkRole(ROLES.ADMIN, ROLES.NHAN_VIEN), approveRefund);
router.put('/refunds/:id/reject', checkRole(ROLES.ADMIN, ROLES.NHAN_VIEN), rejectRefund);
router.get('/refunds/stats', checkRole(ROLES.ADMIN, ROLES.NHAN_VIEN), getRefundStats);

// Admin & Employee routes
router.use(checkRole(ROLES.ADMIN, ROLES.NHAN_VIEN));
router.get('/', getAllBookings);
router.put('/:id/confirm', validate(commonValidations.idParam), confirmBooking);
router.put('/:id', validate(commonValidations.idParam), updateBooking);

export default router;