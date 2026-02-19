import express from 'express';
import { authController } from '../controllers/auth.js';
import { handleValidationErrors } from '../middleware/validate.js';
import { refreshTokenValidators } from '../validators/auth.js';

const router = express.Router();

router.post('/oauth/:provider/callback', authController.oauthCallback);
router.post('/token/refresh', refreshTokenValidators, handleValidationErrors, authController.refreshToken);
router.post('/logout', authController.logout);

export default router;
