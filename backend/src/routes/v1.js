import express from 'express';
import authRoutes from './auth.js';
import userRoutes from './user.js';
import jobRoutes from './job.js';

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/jobs', jobRoutes);

export default router;
