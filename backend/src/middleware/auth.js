import { supabase } from '../models/db.js';
import { ApiError } from './error.js';
import { userController } from '../controllers/user.js';

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
    // OAuth 콜백을 거치지 않은 요청도 동작하도록, DB에 사용자 없으면 생성 후 userId 설정
    let internalId = await userController.getInternalUserId(user.id);
    if (!internalId) {
      try {
        internalId = await userController.ensureUserFromSupabase(user);
      } catch (ensureErr) {
        console.error('Auth ensureUser error:', ensureErr?.message);
      }
    }
    if (internalId) req.userId = internalId;
    next();
  } catch (error) {
    console.error('Auth error:', error.message);
    return next(new ApiError(401, 'Session expired or invalid'));
  }
};
