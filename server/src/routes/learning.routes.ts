import { Router } from 'express';
import { UserRole } from '@prisma/client';
import {
  completeLearningMaterialController,
  createLearningMaterialController,
  getLearningMaterialByIdOrSlugController,
  getMyLearningProgressController,
  listLearningMaterialsController,
  uncompleteLearningMaterialController,
  updateLearningProgressController,
} from '../controllers/learning.controller.ts';
import {
  authenticateJWT,
  authorizeRoles,
  optionalAuthenticateJWT,
} from '../middleware/auth.middleware.ts';

const router = Router();

// Authenticated user's overall learning progress (declared before /:idOrSlug)
router.get('/progress', authenticateJWT, getMyLearningProgressController);

// Public Digital Learning Centre listing & detail (enriches completion state when JWT is present)
router.get('/', optionalAuthenticateJWT, listLearningMaterialsController);
router.post(
  '/',
  authenticateJWT,
  authorizeRoles(UserRole.ADMIN),
  createLearningMaterialController
);
router.get('/:idOrSlug', optionalAuthenticateJWT, getLearningMaterialByIdOrSlugController);

// Authenticated completion tracking routes
router.post('/:idOrSlug/complete', authenticateJWT, completeLearningMaterialController);
router.delete('/:idOrSlug/complete', authenticateJWT, uncompleteLearningMaterialController);
router.patch('/:idOrSlug/progress', authenticateJWT, updateLearningProgressController);

export default router;
