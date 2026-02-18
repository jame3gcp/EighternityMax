import express from 'express';
import { luckyController } from '../controllers/lucky.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.get('/lucky-numbers/history', authenticate, luckyController.getLuckyNumbersHistory);
router.get('/lucky-numbers', authenticate, luckyController.getLuckyNumbers);
router.post('/lucky-numbers', authenticate, luckyController.postLuckyNumbers);

export default router;
