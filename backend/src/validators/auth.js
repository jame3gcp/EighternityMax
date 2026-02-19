import { body } from 'express-validator';

/** POST /auth/token/refresh body validation */
export const refreshTokenValidators = [
  body('refresh_token').notEmpty().withMessage('refresh_token is required'),
];
