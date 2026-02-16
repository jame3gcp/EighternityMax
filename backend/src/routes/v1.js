import express from 'express';
import authRoutes from './auth.js';
import userRoutes from './user.js';
import jobRoutes from './job.js';
import { userController } from '../controllers/user.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.use('/auth', authRoutes);

// /users/me, /users/me/profile 등은 하위 라우터보다 먼저 등록 (404 방지)
router.get('/users/me', authenticate, userController.getMe);
router.get('/users/me/profile', authenticate, userController.getProfile);
router.get('/users/me/saju-analysis', authenticate, userController.getSajuAnalysis);
router.post('/users/me/saju-analysis/generate', authenticate, userController.generateSajuAnalysis);
router.post('/users/me/consent', authenticate, userController.saveConsent);
router.post('/users/me/profile', authenticate, userController.saveProfile);
router.delete('/users/me', authenticate, userController.deleteAccount);

router.use('/users', userRoutes);
router.use('/jobs', jobRoutes);

export default router;
