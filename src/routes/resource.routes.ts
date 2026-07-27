import { Router } from 'express';

import {
  createResource,
  searchAvailableResources,
  getAvailableResources,
  getResourceById,
  updateResource,
  updateResourceStatus,
  deleteResource,
} from '../controllers/resource.controller';

import { protect } from '../middleware/auth';
import { authorize } from '../middleware/authorize';

const router = Router();


//public routes 


router.get(
  '/search',
  protect,
  searchAvailableResources
);

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


// space admin                                 


router.post(
  '/',
  protect,
  authorize('space_admin'),
  createResource
);

router.patch(
  '/:id/status',
  protect,
  authorize('space_admin'),
  updateResourceStatus
);

router.patch(
  '/:id',
  protect,
  authorize('space_admin'),
  updateResource
);

router.delete(
  '/:id',
  protect,
  authorize('space_admin'),
  deleteResource
);

export default router;