import { db } from '../models/db.js';
import { lifeProfiles, profiles, jobs } from '../models/schema.js';
import { eq } from 'drizzle-orm';
import { ApiError } from '../middleware/error.js';
import { userController } from './user.js';
import { generateFromProfile } from '../services/lifeProfileGenerator.js';

export const lifeProfileController = {
  async generate(req, res, next) {
    try {
      const { profile_id, options = {} } = req.body;
      const internalId = await userController.getInternalUserId(req.supabaseId);
      if (!internalId) throw new ApiError(404, 'User not found');

      const profile = await db.query.profiles.findFirst({
        where: (p, { and, eq }) => and(eq(p.id, profile_id), eq(p.userId, internalId))
      });
      if (!profile) throw new ApiError(404, 'Profile not found');

      const jobId = `job-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      await db.insert(jobs).values({
        id: jobId,
        userId: internalId,
        profileId: profile_id,
        status: 'queued',
        progress: 0,
        options,
        createdAt: new Date(),
      });

      setTimeout(async () => {
        const lpData = generateFromProfile(profile);

        await db.transaction(async (tx) => {
          const existing = await tx.query.lifeProfiles.findFirst({ where: eq(lifeProfiles.userId, internalId) });
          if (existing) {
            await tx.update(lifeProfiles)
              .set({ ...lpData, createdAt: undefined })
              .where(eq(lifeProfiles.userId, internalId));
          } else {
            await tx.insert(lifeProfiles).values(lpData);
          }
          await tx.update(jobs).set({ status: 'done', progress: 100, resultRef: `life-profile-${internalId}`, completedAt: new Date() }).where(eq(jobs.id, jobId));
        });
      }, 3000);

      res.json({ job_id: jobId, status: 'queued' });
    } catch (error) {
      next(error);
    }
  },

  async getStatus(req, res, next) {
    try {
      const { jobId } = req.params;
      const internalId = await userController.getInternalUserId(req.supabaseId);
      const job = await db.query.jobs.findFirst({
        where: (j, { and, eq }) => and(eq(j.id, jobId), eq(j.userId, internalId))
      });
      if (!job) throw new ApiError(404, 'Job not found');

      if (job.status === 'queued' || job.status === 'running') {
        const elapsed = Date.now() - new Date(job.createdAt).getTime();
        if (elapsed < 3000) {
          const progress = Math.min(90, Math.floor((elapsed / 3000) * 90));
          await db.update(jobs).set({ status: 'running', progress }).where(eq(jobs.id, jobId));
          job.status = 'running';
          job.progress = progress;
        }
      }

      res.json({
        status: job.status,
        progress: job.progress,
        result_ref: job.resultRef || null,
      });
    } catch (error) {
      next(error);
    }
  },

  async getMe(req, res, next) {
    try {
      const internalId = await userController.getInternalUserId(req.supabaseId);
      const lp = await db.query.lifeProfiles.findFirst({ where: eq(lifeProfiles.userId, internalId) });
      if (!lp) throw new ApiError(404, 'Life profile not found');

      res.json({
        life_profile: {
          userId: lp.userId,
          profileId: lp.profileId,
          energyType: lp.energyType,
          energyTypeEmoji: lp.energyTypeEmoji,
          strengths: lp.strengths,
          patterns: lp.patterns,
          cycleDescription: lp.cycleDescription,
          recommendations: lp.recommendations,
          version: lp.version,
          createdAt: lp.createdAt,
          updatedAt: lp.updatedAt,
        },
        updated_at: lp.updatedAt,
        version: lp.version,
      });
    } catch (error) {
      next(error);
    }
  }
};
