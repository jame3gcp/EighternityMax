import { db } from '../models/db.js';
import { records } from '../models/schema.js';
import { eq, desc, like } from 'drizzle-orm';
import { ApiError } from '../middleware/error.js';
import { userController } from './user.js';

export const logController = {
  async saveDailyLog(req, res, next) {
    try {
      const { energy, emotion, focus, memo, date } = req.body;
      const targetDate = date || new Date().toISOString().split('T')[0];
      const internalId = await userController.getInternalUserId(req.supabaseId);

      if (energy === undefined || emotion === undefined) {
        throw new ApiError(400, 'energy and emotion are required');
      }

      const LOG_MEMO_MAX = 2000;
      const memoVal = typeof memo === 'string' && memo.length > LOG_MEMO_MAX
        ? memo.slice(0, LOG_MEMO_MAX)
        : (memo || null);

      const id = `log-${Date.now()}`;
      await db.insert(records).values({
        id,
        userId: internalId,
        date: targetDate,
        energy,
        emotion,
        focus: focus || null,
        memo: memoVal,
        timestamp: new Date(),
      });

      res.status(201).json({ id, status: 'saved' });
    } catch (error) {
      next(error);
    }
  },

  async getLogs(req, res, next) {
    try {
      const LOGS_LIMIT_MAX = 500;
      const { limit } = req.query;
      const internalId = await userController.getInternalUserId(req.supabaseId);
      const limitNum = limit != null
        ? Math.min(Math.max(parseInt(limit, 10) || 100, 1), LOGS_LIMIT_MAX)
        : 100;

      const logs = await db.query.records.findMany({
        where: eq(records.userId, internalId),
        orderBy: [desc(records.timestamp)],
        limit: limitNum,
      });

      res.json(logs);
    } catch (error) {
      next(error);
    }
  }
};

export const reportController = {
  async getMonthlyReport(req, res, next) {
    try {
      const { month, year } = req.query;
      const now = new Date();
      const targetMonth = month || (now.getMonth() + 1).toString().padStart(2, '0');
      const targetYear = year || now.getFullYear().toString();
      const monthStr = `${targetYear}-${targetMonth}`;
      const internalId = await userController.getInternalUserId(req.supabaseId);

      const logs = await db.query.records.findMany({
        where: (r, { and, eq, like }) => and(eq(r.userId, internalId), like(r.date, `${monthStr}%`)),
        orderBy: (r, { asc }) => [asc(r.date)]
      });

      if (logs.length === 0) {
        return res.json({
          month: monthStr,
          total_logs: 0,
          message: '데이터가 충분하지 않습니다.',
          summary: null,
        });
      }

      const avgEnergy = logs.reduce((acc, log) => acc + log.energy, 0) / logs.length;
      const avgEmotion = logs.reduce((acc, log) => acc + log.emotion, 0) / logs.length;
      const avgFocus = logs.reduce((acc, log) => acc + (log.focus || 0), 0) / logs.length;

      res.json({
        month: monthStr,
        total_logs: logs.length,
        averages: {
          energy: Math.round(avgEnergy),
          emotion: Math.round(avgEmotion),
          focus: Math.round(avgFocus),
        },
        insight: `이번 달 당신은 전반적으로 ${avgEnergy > 60 ? '안정적인' : '변동이 있는'} 에너지 흐름을 보였습니다.`,
        top_activities: ['명상', '가벼운 산책', '독서'],
      });
    } catch (error) {
      next(error);
    }
  }
};
