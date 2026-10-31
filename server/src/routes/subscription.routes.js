import { Router } from 'express';
import { auth } from '../middleware/auth.js';
import { requireRole, enforceCustomerScope } from '../middleware/rbac.js';
import * as ctrl from '../controllers/subscription.controller.js';

const router = Router();

// Templates: staff/admin manage, customers can read (for self-serve quoting)
router.get('/templates', auth, enforceCustomerScope, ctrl.listTemplates);
router.post('/templates', auth, requireRole('admin', 'staff'), ctrl.createTemplate);
router.delete('/templates/:id', auth, requireRole('admin', 'staff'), ctrl.deleteTemplate);

// 1-click quote creation from a template
router.post('/from-template/:templateId', auth, enforceCustomerScope, ctrl.fromTemplate);

// Subscriptions: strict customer isolation via enforceCustomerScope
router.get('/', auth, enforceCustomerScope, ctrl.list);
router.post('/', auth, enforceCustomerScope, ctrl.create);
router.get('/:id', auth, enforceCustomerScope, ctrl.get);
router.patch('/:id/status', auth, enforceCustomerScope, ctrl.updateStatus);
router.post('/:id/renew', auth, enforceCustomerScope, ctrl.renew);

export default router;
