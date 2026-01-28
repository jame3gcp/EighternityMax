import express from 'express';
import { cycleController } from '../controllers/cycle.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticate, cycleController.getCycle);

export default router;
