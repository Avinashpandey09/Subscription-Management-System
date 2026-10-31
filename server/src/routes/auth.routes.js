import { Router } from 'express';
import { auth } from '../middleware/auth.js';
import {
  signup,
  loginHandler,
  logout,
  me,
  forgotPassword,
  resetPasswordHandler
} from '../controllers/auth.controller.js';

const router = Router();

router.post('/signup', signup); // customer registration
router.post('/login', loginHandler);
router.post('/logout', logout);
router.get('/me', auth, me);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPasswordHandler);

export default router;
