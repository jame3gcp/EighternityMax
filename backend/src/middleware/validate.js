import { validationResult } from 'express-validator';
import { ApiError } from './error.js';

/**
 * Express-validator 결과를 검사하고 실패 시 400 반환.
 * 라우트에서 여러 validator 뒤에 이 미들웨어를 두면 됨.
 */
export function handleValidationErrors(req, res, next) {
  const result = validationResult(req);
  if (result.isEmpty()) {
    return next();
  }
  const first = result.array({ onlyFirstError: true })[0];
  const message = first?.msg || 'Validation failed';
  return next(new ApiError(400, message));
}
