import { Router } from 'express';
import {
  getMeController,
  loginController,
  logoutController,
  registerAdminController,
  registerCustomerController,
  registerVendorController,
} from '../controllers/auth.controller.ts';
import { authenticateJWT } from '../middleware/auth.middleware.ts';

const router = Router();

router.post('/register/customer', registerCustomerController);
router.post('/register/vendor', registerVendorController);
router.post('/register/admin', registerAdminController);
router.post('/login', loginController);
router.post('/logout', logoutController);
router.get('/me', authenticateJWT, getMeController);

export default router;
