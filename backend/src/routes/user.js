import express from 'express';
import { userController } from '../controllers/user.js';
import { authenticate } from '../middleware/auth.js';
import lifeProfileRoutes from './lifeProfile.js';
import cycleRoutes from './cycle.js';
import guideRoutes from './guide.js';
import logRoutes from './log.js';
import directionRoutes from './direction.js';
import spotRoutes from './spot.js';
import luckyRoutes from './lucky.js';
import reportRoutes from './report.js';

const router = express.Router();

router.use('/me/life-profile', lifeProfileRoutes);
router.use('/me/cycles', cycleRoutes);
router.use('/me', guideRoutes);
router.use('/me', logRoutes);
router.use('/me/directions', directionRoutes);
router.use('/me/spots', spotRoutes);
router.use('/me', luckyRoutes);
router.use('/me/reports', reportRoutes);

router.get('/me', authenticate, userController.getMe);
router.post('/me/profile', authenticate, userController.saveProfile);
router.delete('/me', authenticate, userController.deleteAccount);

export default router;
