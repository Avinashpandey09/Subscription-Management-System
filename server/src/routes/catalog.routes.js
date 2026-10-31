import { Router } from 'express';
import { auth } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import { products, plans, taxes, discounts } from '../controllers/catalog.controller.js';

const router = Router();

// GET: any authenticated user (staff/customers browse the catalog)
// POST/PUT/DELETE: admin only
function resource(path, ctrl) {
  router.get(`/${path}`, auth, ctrl.list);
  router.get(`/${path}/:id`, auth, ctrl.get);
  router.post(`/${path}`, auth, requireRole('admin'), ctrl.create);
  router.put(`/${path}/:id`, auth, requireRole('admin'), ctrl.update);
  router.delete(`/${path}/:id`, auth, requireRole('admin'), ctrl.remove);
}

resource('products', products);
resource('plans', plans);
resource('taxes', taxes);
resource('discounts', discounts);

export default router;
