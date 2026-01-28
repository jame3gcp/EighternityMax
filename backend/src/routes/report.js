import express from 'express';
import { reportController } from '../controllers/report.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.get('/monthly', authenticate, reportController.getMonthlyReport);

export default router;
