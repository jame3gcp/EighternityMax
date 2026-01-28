import { db } from '../models/db.js';
import { users, profiles, lifeProfiles, jobs, records, refreshTokens } from '../models/schema.js';
import { eq } from 'drizzle-orm';
import { ApiError } from '../middleware/error.js';

export const userController = {
  async getInternalUserId(supabaseId) {
    const user = await db.query.users.findFirst({
      where: (u, { eq }) => eq(u.providerUserId, supabaseId)
    });
    return user ? user.id : null;
  },

  async getMe(req, res, next) {
    try {
      const internalId = await userController.getInternalUserId(req.supabaseId);
      if (!internalId) throw new ApiError(404, 'User not found');
      
      const user = await db.query.users.findFirst({ where: eq(users.id, internalId) });
      res.json(user);
    } catch (error) {
      next(error);
    }
  },

  async saveProfile(req, res, next) {
    try {
      const { birth_date, birth_time, gender, region } = req.body;
      const internalId = await userController.getInternalUserId(req.supabaseId);
      if (!internalId) throw new ApiError(404, 'User not found');

      if (!birth_date || !gender) {
        throw new ApiError(400, 'birth_date and gender are required');
      }

      let profile = await db.query.profiles.findFirst({ where: eq(profiles.userId, internalId) });

      if (profile) {
        await db.update(profiles)
          .set({ birthDate: birth_date, birthTime: birth_time || null, gender, region: region || null, updatedAt: new Date() })
          .where(eq(profiles.userId, internalId));
      } else {
        const profileId = `profile-${Date.now()}`;
        await db.insert(profiles).values({
          id: profileId,
          userId: internalId,
          birthDate: birth_date,
          birthTime: birth_time || null,
          gender,
          region: region || null,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        profile = { id: profileId };
      }

      res.json({
        profile_id: profile.id,
        status: 'saved',
        next_step: 'generate_life_profile',
      });
    } catch (error) {
      next(error);
    }
  },

  async deleteAccount(req, res, next) {
    try {
      const internalId = await userController.getInternalUserId(req.supabaseId);
      if (!internalId) throw new ApiError(404, 'User not found');

      // 트랜잭션으로 모든 관련 데이터 삭제
      await db.transaction(async (tx) => {
        // 1. Refresh tokens 삭제
        await tx.delete(refreshTokens).where(eq(refreshTokens.userId, internalId));

        // 2. Records 삭제
        await tx.delete(records).where(eq(records.userId, internalId));

        // 3. Jobs 삭제
        await tx.delete(jobs).where(eq(jobs.userId, internalId));

        // 4. Life Profile 삭제 (CASCADE로 자동 삭제되지만 명시적으로)
        await tx.delete(lifeProfiles).where(eq(lifeProfiles.userId, internalId));

        // 5. Profile 삭제 (CASCADE로 자동 삭제되지만 명시적으로)
        await tx.delete(profiles).where(eq(profiles.userId, internalId));

        // 6. User 삭제 (마지막에 삭제 - CASCADE로 나머지도 정리)
        await tx.delete(users).where(eq(users.id, internalId));
      });

      res.json({
        success: true,
        message: '계정이 삭제되었습니다',
      });
    } catch (error) {
      next(error);
    }
  }
};
