import express from 'express';
import authRoutes from './auth.js';
import userRoutes from './user.js';
import jobRoutes from './job.js';
import { userController } from '../controllers/user.js';
import { luckyController } from '../controllers/lucky.js';
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
// 행운 번호: Vercel 서버리스에서 하위 라우터 체인 미매칭 방지를 위해 v1에 명시 등록
router.get('/users/me/lucky-numbers/history', authenticate, luckyController.getLuckyNumbersHistory);
router.get('/users/me/lucky-numbers', authenticate, luckyController.getLuckyNumbers);
router.post('/users/me/lucky-numbers', authenticate, luckyController.postLuckyNumbers);

router.use('/users', userRoutes);
router.use('/jobs', jobRoutes);

export default router;
