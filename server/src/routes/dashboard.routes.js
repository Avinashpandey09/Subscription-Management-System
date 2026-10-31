import { Router } from 'express';
import { auth } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import { getDashboard } from '../services/dashboard.service.js';

const router = Router();

// Finance lead dashboard — internal users only
router.get('/', auth, requireRole('admin', 'staff'), async (req, res, next) => {
  try {
    res.json(await getDashboard());
  } catch (e) {
    next(e);
  }
});

export default router;
