import { body } from 'express-validator';

const NICKNAME_MAX = 100;

/** POST /users/me/profile body validation */
export const saveProfileValidators = [
  body('birth_date').notEmpty().trim().withMessage('birth_date is required'),
  body('gender').notEmpty().trim().isIn(['male', 'female']).withMessage('gender must be male or female'),
  body('birth_time').optional().trim().isString(),
  body('region').optional().trim().isString().isLength({ max: 200 }).withMessage('region max 200 characters'),
  body('calendar_type').optional().trim().isIn(['solar', 'lunar']).withMessage('calendar_type must be solar or lunar'),
  body('is_intercalation').optional().isBoolean(),
  body('nickname').optional().trim().isString().isLength({ max: NICKNAME_MAX }).withMessage(`nickname max ${NICKNAME_MAX} characters`),
];
