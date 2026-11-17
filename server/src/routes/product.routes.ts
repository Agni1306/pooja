import { Router } from 'express';
import { UserRole } from '@prisma/client';
import {
  createProductController,
  deleteProductController,
  getProductByIdController,
  listProductsController,
  updateProductAvailabilityController,
  updateProductController,
} from '../controllers/product.controller.ts';
import {
  authenticateJWT,
  authorizeRoles,
} from '../middleware/auth.middleware.ts';
import { uploadImage } from '../middleware/upload.middleware.ts';

const router = Router();

// Public product discovery & retrieval
router.get('/', listProductsController);
router.get('/:id', getProductByIdController);

// Vendor-only product creation, editing, availability & deletion
router.post(
  '/',
  authenticateJWT,
  authorizeRoles(UserRole.VENDOR),
  uploadImage.single('image'),
  createProductController
);
router.put(
  '/:id',
  authenticateJWT,
  authorizeRoles(UserRole.VENDOR),
  uploadImage.single('image'),
  updateProductController
);
router.patch(
  '/:id/availability',
  authenticateJWT,
  authorizeRoles(UserRole.VENDOR),
  updateProductAvailabilityController
);
router.delete(
  '/:id',
  authenticateJWT,
  authorizeRoles(UserRole.VENDOR),
  deleteProductController
);

export default router;
