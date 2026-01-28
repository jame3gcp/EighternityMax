import express from 'express';
import { guideController } from '../controllers/guide.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.get('/daily-guide', authenticate, guideController.getDailyGuide);
router.get('/energy-forecast', authenticate, guideController.getEnergyForecast);

export default router;
