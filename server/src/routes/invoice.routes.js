import { Router } from 'express';
import { auth } from '../middleware/auth.js';
import { requireRole, enforceCustomerScope } from '../middleware/rbac.js';
import * as ctrl from '../controllers/invoice.controller.js';

const router = Router();

// Manual billing trigger (live demo) — internal users only
router.post('/run-billing', auth, requireRole('admin', 'staff'), ctrl.runBillingNow);

// List/detail: customers strictly scoped to their own invoices
router.get('/', auth, enforceCustomerScope, ctrl.list);
router.get('/:id', auth, enforceCustomerScope, ctrl.get);

// Confirm / Cancel — internal users only
router.patch('/:id/status', auth, requireRole('admin', 'staff'), ctrl.updateStatus);

// PDF download (customers: own invoices) + email dispatch (internal)
router.get('/:id/pdf', auth, enforceCustomerScope, ctrl.downloadPdf);
router.post('/:id/send', auth, requireRole('admin', 'staff'), ctrl.sendEmail);

export default router;
