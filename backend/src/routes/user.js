import express from 'express';
import lifeProfileRoutes from './lifeProfile.js';
import cycleRoutes from './cycle.js';
import guideRoutes from './guide.js';
import logRoutes from './log.js';
import directionRoutes from './direction.js';
import spotRoutes from './spot.js';
import luckyRoutes from './lucky.js';
import reportRoutes from './report.js';

const router = express.Router();

// /me, /me/profile 등은 v1.js에서 /users/me, /users/me/profile 로 직접 등록됨 (404 방지)
// 하위 라우트만 여기서 등록
router.use('/me/life-profile', lifeProfileRoutes);
router.use('/me/cycles', cycleRoutes);
router.use('/me', guideRoutes);
router.use('/me', logRoutes);
router.use('/me/directions', directionRoutes);
router.use('/me/spots', spotRoutes);
router.use('/me', luckyRoutes);
router.use('/me/reports', reportRoutes);

export default router;
