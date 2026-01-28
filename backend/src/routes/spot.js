import express from 'express';
import { spotController } from '../controllers/spot.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticate, spotController.getSpots);

export default router;
