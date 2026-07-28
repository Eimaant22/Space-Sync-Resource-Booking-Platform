import { Router } from 'express';

import {
  createOrganization,
  getOrganizations,
  getOrganizationById,
  updateOrganization,
  removeUserFromOrganization,
  deleteOrganization,
  assignSpaceAdmin,
} from '../controllers/organization.controller';

import { protect } from '../middleware/auth';
import { authorize } from '../middleware/authorize';

const router = Router();

/**
 * Create Organization
 */
router.post(
  '/',
  protect,
  authorize('super_admin'),
  createOrganization
);

/**
 * Get All Organizations
 */
router.get(
  '/',
  protect,
  authorize('super_admin'),
  getOrganizations
);

/**
 * Get Organization By Id
 */
router.get(
  '/:id',
  protect,
  authorize('super_admin', 'space_admin'),
  getOrganizationById
);

/**
 * Update Organization
 */
router.patch(
  '/:id',
  protect,
  authorize('super_admin'),
  updateOrganization
);

//Remove user from Organization
router.patch(
  '/remove-user-from-organization/:userId',
  protect,
  authorize('space_admin'),
  removeUserFromOrganization
);

/**
 * Delete Organization
 */
router.delete(
  '/:id',
  protect,
  authorize('super_admin'),
  deleteOrganization
);

/**
 * Assign Space Admin
 */
router.post(
  '/:id/space-admin',
  protect,
  authorize('super_admin'),
  assignSpaceAdmin
);

export default router;