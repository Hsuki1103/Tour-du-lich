import express from 'express';
import {
  getAllUsers,
  getUserDetail,
  createUser,
  updateUser,
  deleteUser,
  toggleUserStatus,
  assignRole,
  getSystemConfig,
  updateSystemConfig
} from '../controllers/adminController.js';
import { protect } from '../middleware/auth.js';
import { checkRole, ROLES } from '../middleware/role.js';
import { validate, commonValidations } from '../utils/validation.js';

const router = express.Router();

router.use(protect);
router.use(checkRole(ROLES.ADMIN));

// User management
router.get('/users', getAllUsers);
router.get('/users/:id', validate(commonValidations.idParam), getUserDetail);
router.post('/users', createUser);
router.put('/users/:id', validate(commonValidations.idParam), updateUser);
router.delete('/users/:id', validate(commonValidations.idParam), deleteUser);
router.patch('/users/:id/toggle-status', validate(commonValidations.idParam), toggleUserStatus);
router.patch('/users/:id/role', validate(commonValidations.idParam), assignRole);

// System config
router.get('/config', getSystemConfig);
router.put('/config', updateSystemConfig);

export default router;