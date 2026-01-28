import { db, supabase } from '../models/db.js';
import { users, profiles, lifeProfiles } from '../models/schema.js';
import { eq } from 'drizzle-orm';
import { ApiError } from '../middleware/error.js';
import { tokenService } from '../services/token.js';

export const authController = {
  async oauthCallback(req, res, next) {
    try {
      const { provider } = req.params;
      const { access_token, refresh_token, code } = req.body;

      // 개발 테스트용: 'dev' provider는 Supabase 없이 처리
      if (provider === 'dev') {
        const providerUserId = 'dev-test-user';
        
        // 기존 사용자 확인
        let localUser = await db.query.users.findFirst({
          where: (u, { and, eq }) => and(eq(u.provider, 'dev'), eq(u.providerUserId, providerUserId))
        });

        const isNewUser = !localUser;
        if (isNewUser) {
          const [newUser] = await db.insert(users).values({
            id: `user-dev-${Date.now()}`,
            provider: 'dev',
            providerUserId: providerUserId,
            email: 'test@example.com',
            displayName: '테스트 사용자',
            createdAt: new Date(),
            lastLoginAt: new Date(),
          }).returning();
          localUser = newUser;
        } else {
          await db.update(users)
            .set({ lastLoginAt: new Date() })
            .where(eq(users.id, localUser.id));
        }

        const profile = await db.query.profiles.findFirst({ where: eq(profiles.userId, localUser.id) });
        const lifeProfile = await db.query.lifeProfiles.findFirst({ where: eq(lifeProfiles.userId, localUser.id) });

        let nextStep = 'ready';
        if (!profile) nextStep = 'profile_required';
        else if (!lifeProfile) nextStep = 'life_profile_required';

        // 개발용 토큰 생성 (간단한 JWT 또는 고정 토큰)
        const devAccessToken = `dev-test-token-${localUser.id}`;
        const devRefreshToken = `dev-refresh-token-${localUser.id}`;

        // Refresh token 저장 (간단한 메모리 저장 또는 DB 저장)
        // 실제로는 tokenService를 사용해야 하지만, 개발용이므로 생략

        res.json({
          user: {
            user_id: localUser.id,
            is_new_user: isNewUser,
            provider: 'dev',
          },
          tokens: {
            access_token: devAccessToken,
            refresh_token: devRefreshToken,
          },
          next_step: nextStep,
        });
        return;
      }

      // 일반 provider는 Supabase 사용
      if (!access_token) throw new ApiError(400, 'access_token is required from Supabase Auth');

      const { data: { user }, error } = await supabase.auth.getUser(access_token);
      if (error || !user) throw new ApiError(401, 'Invalid Supabase token');

      let localUser = await db.query.users.findFirst({
        where: (u, { and, eq }) => and(eq(u.provider, provider), eq(u.providerUserId, user.id))
      });

      const isNewUser = !localUser;
      if (isNewUser) {
        const [newUser] = await db.insert(users).values({
          id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          provider,
          providerUserId: user.id,
          email: user.email,
          displayName: user.user_metadata?.full_name || `${provider} 사용자`,
          createdAt: new Date(),
          lastLoginAt: new Date(),
        }).returning();
        localUser = newUser;
      } else {
        await db.update(users)
          .set({ lastLoginAt: new Date() })
          .where(eq(users.id, localUser.id));
      }

      const profile = await db.query.profiles.findFirst({ where: eq(profiles.userId, localUser.id) });
      const lifeProfile = await db.query.lifeProfiles.findFirst({ where: eq(lifeProfiles.userId, localUser.id) });

      let nextStep = 'ready';
      if (!profile) nextStep = 'profile_required';
      else if (!lifeProfile) nextStep = 'life_profile_required';

      res.json({
        user: {
          user_id: localUser.id,
          supabase_id: user.id,
          is_new_user: isNewUser,
          provider,
        },
        tokens: {
          access_token,
          refresh_token,
        },
        next_step: nextStep,
      });
    } catch (error) {
      next(error);
    }
  },

  async refreshToken(req, res, next) {
    try {
      const { refresh_token } = req.body;

      if (!refresh_token) {
        throw new ApiError(400, 'refresh_token is required');
      }

      // Supabase refresh token을 사용하여 새 세션 가져오기
      const { data, error } = await supabase.auth.refreshSession({
        refresh_token,
      });

      if (error || !data.session) {
        throw new ApiError(401, 'Invalid or expired refresh token');
      }

      const { access_token, refresh_token: new_refresh_token } = data.session;

      res.json({
        access_token,
        refresh_token: new_refresh_token || refresh_token,
      });
    } catch (error) {
      next(error);
    }
  },

  async logout(req, res, next) {
    try {
      await supabase.auth.signOut();
      res.json({ message: 'Logged out successfully' });
    } catch (error) {
      next(error);
    }
  }
};
