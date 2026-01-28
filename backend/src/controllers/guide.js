import { db } from '../models/db.js';
import { lifeProfiles, records } from '../models/schema.js';
import { eq, desc } from 'drizzle-orm';
import { ApiError } from '../middleware/error.js';
import { userController } from './user.js';

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

      let energyIndex = 75;
      const recentLogs = await db.query.records.findMany({
        where: eq(records.userId, internalId),
        orderBy: [desc(records.timestamp)],
        limit: 3
      });
      
      if (recentLogs.length > 0) {
        const avgRecentEnergy = recentLogs.reduce((acc, log) => acc + log.energy, 0) / recentLogs.length;
        if (avgRecentEnergy < 40) energyIndex -= 10;
        else if (avgRecentEnergy > 80) energyIndex += 5;
      }

      res.json({
        date: targetDate,
        phase_tag: phaseTag,
        energy_index: energyIndex,
        summary: '오늘은 활동적인 하루가 될 것입니다. 오전에 집중력이 높으니 중요한 일을 계획하세요.',
        do: ['창의적인 작업에 집중하기', '중요한 결정은 오전에 하기', '가벼운 운동으로 에너지 회복'],
        avoid: ['과도한 업무 스케줄', '중요한 약속을 오후 늦게 잡기'],
        relationships: '오늘은 협력적인 대화가 잘 통할 시기입니다. 팀 프로젝트나 협업에 집중하세요.',
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
