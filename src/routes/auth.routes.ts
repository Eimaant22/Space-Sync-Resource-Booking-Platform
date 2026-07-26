import { Router } from 'express';
import {
  login,
  logout,
  forgotPassword,
  verifyResetOTPHandler,
  resetPassword,
} from '../controllers/auth.controller';

import { protect } from '../middleware/auth';
import { authLimiter } from '../middleware/rateLimiter';

const router = Router();

// Authentication
router.post('/login', authLimiter, login);
router.post('/logout', protect, logout);

// Password Recovery
router.post('/forgot-password', authLimiter, forgotPassword);
router.post('/verify-reset-otp', authLimiter, verifyResetOTPHandler);
router.post('/reset-password', authLimiter, resetPassword);

export default router;