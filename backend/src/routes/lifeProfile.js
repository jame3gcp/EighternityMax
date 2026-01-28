import express from 'express';
import { lifeProfileController } from '../controllers/lifeProfile.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.post('/generate', authenticate, lifeProfileController.generate);
router.get('/', authenticate, lifeProfileController.getMe);

export default router;
