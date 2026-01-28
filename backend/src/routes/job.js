import express from 'express';
import { lifeProfileController } from '../controllers/lifeProfile.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.get('/:jobId', authenticate, lifeProfileController.getStatus);

export default router;
