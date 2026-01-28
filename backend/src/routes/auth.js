import express from 'express';
import { authController } from '../controllers/auth.js';

const router = express.Router();

router.post('/oauth/:provider/callback', authController.oauthCallback);
router.post('/token/refresh', authController.refreshToken);
router.post('/logout', authController.logout);

export default router;
