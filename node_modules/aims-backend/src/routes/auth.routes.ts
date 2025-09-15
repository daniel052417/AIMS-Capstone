import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { validateRequest } from '../utils/validation';
import { authValidation } from '../utils/validation';

const router = Router();

// Public routes
router.post('/register', 
  validateRequest(authValidation.register),
  AuthController.register,
);

router.post('/login', 
  validateRequest(authValidation.login),
  AuthController.login,
);

router.post('/refresh-token', 
  validateRequest(authValidation.refreshToken),
  AuthController.refreshToken,
);

// Protected routes (will add auth middleware later)
router.post('/logout', AuthController.logout);

export default router;