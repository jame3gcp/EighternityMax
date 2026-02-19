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
             role: 'user',
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
            display_name: localUser.displayName ?? null,
            email: localUser.email ?? null,
          },
          tokens: {
            access_token: devAccessToken,
            refresh_token: devRefreshToken,
          },
          next_step: nextStep,
          consent_required: !localUser.privacyConsentAt,
        });
        return;
      }

      // 일반 provider는 Supabase 사용
      if (!access_token) throw new ApiError(400, 'access_token is required from Supabase Auth');

      // Supabase 환경 변수 확인
      if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
        console.error('[auth] SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set');
        throw new ApiError(503, 'Server auth config missing. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.');
      }

      const { data: { user }, error: supabaseError } = await supabase.auth.getUser(access_token);
      if (supabaseError) {
        console.error('[auth] Supabase getUser error:', supabaseError.message, supabaseError.status);
        throw new ApiError(401, supabaseError.message || 'Invalid Supabase token');
      }
      if (!user) throw new ApiError(401, 'Invalid Supabase token');

      let localUser;
      try {
        localUser = await db.query.users.findFirst({
          where: (u, { and, eq }) => and(eq(u.provider, provider), eq(u.providerUserId, user.id))
        });
      } catch (dbErr) {
        console.error('[auth] DB findFirst users error:', dbErr.message);
        throw new ApiError(503, 'Database error. Check DATABASE_URL and tables.');
      }

      const isNewUser = !localUser;
      if (isNewUser) {
        try {
           const [newUser] = await db.insert(users).values({
             id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
             provider,
             providerUserId: user.id,
             email: user.email ?? null,
             displayName: user.user_metadata?.full_name || `${provider} 사용자`,
             role: 'user',
             createdAt: new Date(),
             lastLoginAt: new Date(),
           }).returning();
          localUser = newUser;
        } catch (insertErr) {
          console.error('[auth] DB insert users error:', insertErr.message);
          throw new ApiError(503, 'Database error creating user. Check DATABASE_URL and users table.');
        }
      } else {
        try {
          await db.update(users)
            .set({ lastLoginAt: new Date() })
            .where(eq(users.id, localUser.id));
        } catch (updateErr) {
          console.error('[auth] DB update users error:', updateErr.message);
          throw new ApiError(503, 'Database error updating user.');
        }
      }

      let profile, lifeProfile;
      try {
        profile = await db.query.profiles.findFirst({ where: eq(profiles.userId, localUser.id) });
        lifeProfile = await db.query.lifeProfiles.findFirst({ where: eq(lifeProfiles.userId, localUser.id) });
      } catch (dbErr) {
        console.error('[auth] DB query profiles/lifeProfiles error:', dbErr.message);
      }

      let nextStep = 'ready';
      if (!profile) nextStep = 'profile_required';
      else if (!lifeProfile) nextStep = 'life_profile_required';

      res.json({
        user: {
          user_id: localUser.id,
          supabase_id: user.id,
          is_new_user: isNewUser,
          provider,
          display_name: localUser.displayName ?? null,
          email: localUser.email ?? null,
        },
        tokens: {
          access_token,
          refresh_token: refresh_token || '',
        },
        next_step: nextStep,
        consent_required: !localUser.privacyConsentAt,
      });
    } catch (error) {
      if (error instanceof ApiError) {
        next(error);
        return;
      }
      console.error('[auth] oauthCallback unexpected error:', error?.message || error);
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
