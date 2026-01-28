import { db } from '../models/db.js';
import { ApiError } from '../middleware/error.js';

export const reportController = {
  async getMonthlyReport(req, res, next) {
    try {
      const { month, year } = req.query;
      const now = new Date();
      const targetMonth = month || (now.getMonth() + 1).toString().padStart(2, '0');
      const targetYear = year || now.getFullYear().toString();
      const monthStr = `${targetYear}-${targetMonth}`;

      const logs = db.prepare(`
        SELECT * FROM records 
        WHERE user_id = ? AND date LIKE ? 
        ORDER BY date ASC
      `).all(req.userId, `${monthStr}%`);

      if (logs.length === 0) {
        return res.json({
          month: monthStr,
          message: '데이터가 충분하지 않습니다. 매일 기분과 에너지를 기록해 보세요!',
          summary: null,
        });
      }

      const avgEnergy = logs.reduce((acc, log) => acc + log.energy, 0) / logs.length;
      const avgEmotion = logs.reduce((acc, log) => acc + log.emotion, 0) / logs.length;
      const avgFocus = logs.reduce((acc, log) => acc + log.focus, 0) / logs.length;

      const summary = {
        month: monthStr,
        total_logs: logs.length,
        averages: {
          energy: Math.round(avgEnergy),
          emotion: Math.round(avgEmotion),
          focus: Math.round(avgFocus),
        },
        insight: `이번 달 당신은 전반적으로 ${avgEnergy > 60 ? '안정적인' : '변동이 있는'} 에너지 흐름을 보였습니다.`,
        top_activities: ['명상', '가벼운 산책', '독서'],
      };

      res.json(summary);
    } catch (error) {
      next(error);
    }
  }
};
