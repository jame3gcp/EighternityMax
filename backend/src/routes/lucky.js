import express from 'express';
import { luckyController } from '../controllers/lucky.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.get('/lucky-numbers', authenticate, luckyController.getLuckyNumbers);

export default router;
