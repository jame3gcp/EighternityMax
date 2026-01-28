import { db } from '../models/db.js';
import { ApiError } from '../middleware/error.js';
import { userController } from './user.js';

export const cycleController = {
  async getCycle(req, res, next) {
    try {
      const { period = 'day' } = req.query;
      const internalId = await userController.getInternalUserId(req.supabaseId);

      const now = new Date();
      const currentPhase = Math.floor((now.getHours() / 24) * 8) % 8;

      const phaseNames = ['새벽', '상승', '정점', '유지', '하강', '저점', '회복', '준비'];
      const phaseColors = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#f97316', '#ef4444', '#10b981', '#06b6d4'];

      const phases = phaseNames.map((name, index) => {
        const base = 50 + Math.sin((index / 8) * Math.PI * 2) * 30;
        return {
          id: index,
          name,
          energy: Math.round(Math.max(0, Math.min(100, base + (index === currentPhase ? 10 : 0)))),
          emotion: Math.round(Math.max(0, Math.min(100, 50 + Math.cos((index / 8) * Math.PI * 2) * 30))),
          focus: Math.round(Math.max(0, Math.min(100, 50 + Math.sin((index / 8) * Math.PI * 2 + 0.5) * 30))),
          description: `${name} 단계입니다.`,
          recommendations: [`${name} 단계 활동 추천`, '충분한 휴식'],
          warnings: ['과도한 활동 주의'],
          color: phaseColors[index],
        };
      });

      res.json({
        userId: internalId,
        period,
        currentPhase,
        phases,
        timestamp: Date.now(),
      });
    } catch (error) {
      next(error);
    }
  }
};
