import express from 'express';
import { webhookController } from '../controllers/webhook.js';

const router = express.Router();

router.post('/stripe', express.raw({ type: 'application/json' }), webhookController.handleStripe);

export default router;
