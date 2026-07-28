import express from 'express';

import {
  sendSignupRequestOTP,
  verifySignupRequestOTP,
  submitSignupRequest,
  getSignupRequests,
  getSignupRequestById,
  approveSignupRequest,
  rejectSignupRequest,
  getSignupRequestHistory,
} from '../controllers/signupRequest.controller';

import { protect } from '../middleware/auth';
import { authorize } from '../middleware/authorize';

const router = express.Router();

/**
 * Public Routes
 */

// Send Email OTP
router.post(
  '/send-otp',
  sendSignupRequestOTP
);

// Verify Email OTP
router.post(
  '/verify-otp',
  verifySignupRequestOTP
);

// Submit Signup Request
router.post(
  '/',
  submitSignupRequest
);

/**
 * Super Admin Routes
 */

router.get(
  '/',
  protect,
  authorize('super_admin'),
  getSignupRequests
);

router.get(
  '/history',
  protect,
  authorize('super_admin'),
  getSignupRequestHistory
);

router.get(
  '/:id',
  protect,
  authorize('super_admin'),
  getSignupRequestById
);

router.patch(
  '/:id/approve',
  protect,
  authorize('super_admin'),
  approveSignupRequest
);

router.patch(
  '/:id/reject',
  protect,
  authorize('super_admin'),
  rejectSignupRequest
);

export default router;