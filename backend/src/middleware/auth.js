import { supabase } from '../models/db.js';
import { ApiError } from './error.js';

const isDev = process.env.NODE_ENV !== 'production';

export const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;

  if (!token) {
    return next(new ApiError(401, 'Unauthorized'));
  }

  // 개발 테스트 토큰 처리
  if (isDev && token && token.startsWith('dev-test-token-')) {
    const userId = token.replace('dev-test-token-', '');
    req.supabaseId = 'dev-test-user'; // providerUserId
    req.userId = userId; // 실제 사용자 ID
    req.userEmail = 'test@example.com';
    return next();
  }

  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) {
      return next(new ApiError(401, 'Invalid token'));
    }
    
    req.supabaseId = user.id;
    req.userEmail = user.email;
    next();
  } catch (error) {
    console.error('Auth error:', error.message);
    return next(new ApiError(401, 'Session expired or invalid'));
  }
};
