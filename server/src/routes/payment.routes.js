import { Router } from 'express';
import { auth } from '../middleware/auth.js';
import { requireRole, enforceCustomerScope } from '../middleware/rbac.js';
import * as ctrl from '../controllers/payment.controller.js';

const router = Router();

router.get('/', auth, enforceCustomerScope, ctrl.list);
router.post('/', auth, requireRole('admin', 'staff'), ctrl.create);
router.get('/invoice/:invoiceId', auth, enforceCustomerScope, ctrl.historyForInvoice);

export default router;
