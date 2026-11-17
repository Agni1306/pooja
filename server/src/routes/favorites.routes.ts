import { Router } from 'express';
import {
  addVendorFavoriteByBodyController,
  addVendorFavoriteController,
  getVendorFavoriteStatusController,
  listMyFavoritesController,
  removeVendorFavoriteController,
  toggleVendorFavoriteController,
} from '../controllers/favorites.controller.ts';
import { authenticateJWT } from '../middleware/auth.middleware.ts';

const router = Router();

// All favorite vendor endpoints require authentication
router.use(authenticateJWT);

router.get('/', listMyFavoritesController);
router.post('/', addVendorFavoriteByBodyController);
router.get('/:vendorId/status', getVendorFavoriteStatusController);
router.post('/:vendorId/toggle', toggleVendorFavoriteController);
router.post('/:vendorId', addVendorFavoriteController);
router.delete('/:vendorId', removeVendorFavoriteController);

export default router;
