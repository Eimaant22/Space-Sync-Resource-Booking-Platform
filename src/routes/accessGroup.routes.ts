import { Router } from 'express';

import {
  createAccessGroup,
  getAccessGroups,
  getAccessGroupById,
  updateAccessGroup,
  addUserToGroup,
  removeUserFromGroup,
  deleteAccessGroup,
} from '../controllers/accessGroup.controller';

import { protect } from '../middleware/auth';
import { authorize } from '../middleware/authorize';

const router = Router();

/**
 * All authenticated users
 */
router.get(
  '/',
  protect,
  getAccessGroups
);

router.get(
  '/:id',
  protect,
  getAccessGroupById
);

/**
 * Space Admin / Super Admin
 */
router.post(
  '/',
  protect,
  authorize('space_admin'),
  createAccessGroup
);

router.patch(
  '/:id',
  protect,
  authorize('space_admin'),
  updateAccessGroup
);

router.patch(
  '/:id/add-user',
  protect,
  authorize('space_admin'),
  addUserToGroup
);

router.patch(
  '/:id/remove-user',
  protect,
  authorize('space_admin'),
  removeUserFromGroup
);

router.delete(
  '/:id',
  protect,
  authorize('space_admin'),
  deleteAccessGroup
);

export default router;