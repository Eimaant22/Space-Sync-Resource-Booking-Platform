import express from 'express';

import {
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


// Submit a signup request
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

// Get signup request history
router.get(
  '/history',
  protect,
  authorize('super_admin'),
  getSignupRequestHistory
);

// Get signup request by ID
router.get(
  '/:id',
  protect,
  authorize('super_admin'),
  getSignupRequestById
);

// Approve signup request
router.patch(
  '/:id/approve',
  protect,
  authorize('super_admin'),
  approveSignupRequest
);

// Reject signup request
router.patch(
  '/:id/reject',
  protect,
  authorize('super_admin'),
  rejectSignupRequest
);

export default router;