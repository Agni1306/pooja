import { Router } from 'express';
import { UserRole } from '@prisma/client';
import {
  deleteMyProfileController,
  getMyProfileController,
  getVendorByIdController,
  listVendorsController,
  registerVendorProfileController,
  updateMyProfileController,
} from '../controllers/vendor.controller.ts';
import { listVendorProductsController } from '../controllers/product.controller.ts';
import { getVendorDashboardController } from '../controllers/dashboard.controller.ts';
import {
  authenticateJWT,
  authorizeRoles,
  optionalAuthenticateJWT,
} from '../middleware/auth.middleware.ts';

const router = Router();

// Public & authenticated vendor registration
router.post('/register', optionalAuthenticateJWT, registerVendorProfileController);

// Public directory listing
router.get('/', listVendorsController);

// Logged-in vendor own profile routes (declared before /:id)
router.get(
  '/my-profile',
  authenticateJWT,
  authorizeRoles(UserRole.VENDOR),
  getMyProfileController
);
router.put(
  '/my-profile',
  authenticateJWT,
  authorizeRoles(UserRole.VENDOR),
  updateMyProfileController
);
router.delete(
  '/my-profile',
  authenticateJWT,
  authorizeRoles(UserRole.VENDOR),
  deleteMyProfileController
);

// Authenticated vendor dashboard statistics (declared before /:id)
router.get(
  '/dashboard',
  authenticateJWT,
  authorizeRoles(UserRole.VENDOR),
  getVendorDashboardController
);

// Vendor-wise public product listing (declared before /:id)
router.get('/:vendorId/products', listVendorProductsController);

// Public vendor detail page
router.get('/:id', getVendorByIdController);

export default router;
