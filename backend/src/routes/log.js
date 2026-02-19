import express from 'express';
import { body, query } from 'express-validator';
import { logController } from '../controllers/log.js';
import { authenticate } from '../middleware/auth.js';
import { handleValidationErrors } from '../middleware/validate.js';

const router = express.Router();

const LOG_MEMO_MAX = 2000;
const LOGS_LIMIT_MAX = 500;

router.post(
  '/daily-log',
  authenticate,
  body('energy').isInt({ min: 0, max: 100 }).withMessage('energy must be 0-100'),
  body('emotion').isInt({ min: 0, max: 100 }).withMessage('emotion must be 0-100'),
  body('focus').optional().isInt({ min: 0, max: 100 }).withMessage('focus must be 0-100'),
  body('memo').optional().isString().isLength({ max: LOG_MEMO_MAX }).withMessage(`memo must be at most ${LOG_MEMO_MAX} characters`),
  body('date').optional().isISO8601().withMessage('date must be ISO 8601 format'),
  handleValidationErrors,
  logController.saveDailyLog
);
router.get(
  '/logs',
  authenticate,
  query('limit').optional().isInt({ min: 1, max: LOGS_LIMIT_MAX }).withMessage(`limit must be 1-${LOGS_LIMIT_MAX}`),
  handleValidationErrors,
  logController.getLogs
);

export default router;
