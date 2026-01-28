import express from 'express';
import { directionController } from '../controllers/direction.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticate, directionController.getDirections);

export default router;
