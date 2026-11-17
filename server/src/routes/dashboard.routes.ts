import { Router } from 'express';
import { UserRole } from '@prisma/client';
import { getVendorDashboardController } from '../controllers/dashboard.controller.ts';
import {
  authenticateJWT,
  authorizeRoles,
} from '../middleware/auth.middleware.ts';

const router = Router();

router.get(
  '/vendor',
  authenticateJWT,
  authorizeRoles(UserRole.VENDOR),
  getVendorDashboardController
);

export default router;
