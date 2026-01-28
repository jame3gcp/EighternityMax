import express from 'express';
import { logController } from '../controllers/log.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.post('/daily-log', authenticate, logController.saveDailyLog);
router.get('/logs', authenticate, logController.getLogs);

export default router;
