import { Router } from 'express';
import { auth } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import { createStaffHandler, listStaff, deleteStaff } from '../controllers/auth.controller.js';

const router = Router();

// Only admins can manage internal staff
router.use(auth, requireRole('admin'));

router.post('/staff', createStaffHandler); // POST /api/admin/staff
router.get('/staff', listStaff);
router.delete('/staff/:id', deleteStaff);

export default router;
