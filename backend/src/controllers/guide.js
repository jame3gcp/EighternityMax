import { db } from '../models/db.js';
import { lifeProfiles, records } from '../models/schema.js';
import { eq, desc } from 'drizzle-orm';
import { ApiError } from '../middleware/error.js';
import { userController } from './user.js';
import { computeDailyGuide } from '../services/energyScoreFromProfile.js';

export const guideController = {
  async getDailyGuide(req, res, next) {
    try {
      const { date } = req.query;
      const targetDate = date || new Date().toISOString().split('T')[0];
      const internalId = await userController.getInternalUserId(req.supabaseId);

      const lifeProfile = await db.query.lifeProfiles.findFirst({ where: eq(lifeProfiles.userId, internalId) });
      if (!lifeProfile) {
        throw new ApiError(404, 'Life profile not found. Please generate it first.');
      }

      const today = new Date(targetDate);
      const dayOfYear = Math.floor((today - new Date(today.getFullYear(), 0, 0)) / 1000 / 60 / 60 / 24);
      const phaseTag = `phase-${dayOfYear % 8}`;

      const recentLogs = await db.query.records.findMany({
        where: eq(records.userId, internalId),
        orderBy: [desc(records.timestamp)],
        limit: 3
      });

      const { energy_index, summary, do: doList, avoid, relationships } = computeDailyGuide(lifeProfile, recentLogs, targetDate);

      res.json({
        date: targetDate,
        phase_tag: phaseTag,
        energy_index,
        summary,
        do: doList,
        avoid,
        relationships,
      });
    } catch (error) {
      next(error);
    }
  },

  async getEnergyForecast(req, res, next) {
    try {
      const { from, days = 30 } = req.query;
      const startDate = from ? new Date(from) : new Date();
      
      const forecast = [];
      for (let i = 0; i < parseInt(days, 10); i++) {
        const date = new Date(startDate);
        date.setDate(date.getDate() + i);
        const dayOfYear = Math.floor((date - new Date(date.getFullYear(), 0, 0)) / 1000 / 60 / 60 / 24);
        forecast.push({
          date: date.toISOString().split('T')[0],
          energy_index: 50 + Math.sin(dayOfYear / 5) * 30 + (Math.random() - 0.5) * 10,
          summary: `예상 에너지 흐름: ${i % 3 === 0 ? '상승세' : '안정기'}`,
        });
      }
      res.json(forecast);
    } catch (error) {
      next(error);
    }
  }
};
