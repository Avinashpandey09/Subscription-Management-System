import jwt from 'jsonwebtoken';

// Verifies the JWT stored in the httpOnly `token` cookie
// (also accepts `Authorization: Bearer <jwt>` for API clients).
// Attaches { id, role, email, name } as req.user.
export function auth(req, res, next) {
  const token = req.cookies?.token || req.headers.authorization?.replace(/^Bearer\s+/i, '');
  if (!token) return res.status(401).json({ message: 'Not authenticated' });
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: payload.id, role: payload.role, email: payload.email, name: payload.name };
    next();
  } catch {
    return res.status(401).json({ message: 'Invalid or expired session' });
  }
}
