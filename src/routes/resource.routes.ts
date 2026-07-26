import { Router } from 'express';

import {
  createResource,
  getResources,
  getAvailableResources,   // <-- NEW
  getResourceById,
  updateResource,
  updateResourceStatus,
  deleteResource,
} from '../controllers/resource.controller';

import { protect } from '../middleware/auth';
import { authorize } from '../middleware/authorize';

const router = Router();

/**
 * Space Admin
 */
router.post(
  '/',
  protect,
  authorize('space_admin'),
  createResource
);

router.patch(
  '/:id',
  protect,
  authorize('space_admin'),
  updateResource
);

router.patch(
  '/:id/status',
  protect,
  authorize('space_admin'),
  updateResourceStatus
);

router.delete(
  '/:id',
  protect,
  authorize('space_admin'),
  deleteResource
);

/**
 * All authenticated users
 */
router.get(
  '/',
  protect,
  getResources
);

// NEW API
router.get(
  '/available',
  protect,
  getAvailableResources
);

router.get(
  '/:id',
  protect,
  getResourceById
);

export default router;