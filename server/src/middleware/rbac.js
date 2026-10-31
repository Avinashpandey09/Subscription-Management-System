// Role-based access control. Use after `auth`:
//
//   requireRole('admin')            — admins only
//   requireRole('admin', 'staff')   — internal users
export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: 'Not authenticated' });
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden: insufficient role' });
    }
    next();
  };
}

// Strict customer isolation: a customer can only ever query their own data.
// Controllers spread `req.customerFilter` into their Mongo queries, so even a
// crafted `?customerId=<someone-else>` is ignored for customers.
export function enforceCustomerScope(req, res, next) {
  if (!req.user) return res.status(401).json({ message: 'Not authenticated' });
  req.customerFilter = req.user.role === 'customer' ? { customerId: req.user.id } : {};
  if (req.user.role === 'customer') req.forcedCustomerId = req.user.id;
  next();
}
