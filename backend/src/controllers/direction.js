import { db } from '../models/db.js';
import { lifeProfiles } from '../models/schema.js';
import { eq } from 'drizzle-orm';
import { ApiError } from '../middleware/error.js';
import { userController } from './user.js';

export const directionController = {
  async getDirections(req, res, next) {
    try {
      const { date } = req.query;
      const targetDate = date || new Date().toISOString().split('T')[0];
      const internalId = await userController.getInternalUserId(req.supabaseId);

      const lifeProfile = await db.query.lifeProfiles.findFirst({ where: eq(lifeProfiles.userId, internalId) });
      if (!lifeProfile) throw new ApiError(404, 'Life profile not found.');

      const today = new Date(targetDate);
      const dayOfYear = Math.floor((today - new Date(today.getFullYear(), 0, 0)) / 1000 / 60 / 60 / 24);
      const phase = dayOfYear % 8;

      res.json({
        date: targetDate,
        categories: [
          { id: 'love', name: '애정 (Love)', score: 70 + (phase % 3) * 10, guide: '소통이 원활한 시기입니다.', recommendation: '가벼운 산책이나 대화' },
          { id: 'money', name: '재물 (Money)', score: 60 + (phase % 4) * 10, guide: '계획적인 소비가 필요한 시점입니다.', recommendation: '지출 가계부 점검' },
          { id: 'career', name: '사업/커리어 (Career)', score: 80 - (phase % 3) * 10, guide: '주도적으로 업무를 추진하기 좋은 날입니다.', recommendation: '중요 회의 및 기획안 작성' },
          { id: 'health', name: '건강 (Health)', score: 75 + (Math.sin(phase) * 10), guide: '규칙적인 스트레칭이 도움이 됩니다.', recommendation: '가벼운 유산소 운동' },
          { id: 'move', name: '이동/변화 (Move)', score: 50 + (phase % 5) * 10, guide: '새로운 장소에서 영감을 얻기 좋습니다.', recommendation: '새로운 카페 방문' },
          { id: 'connect', name: '대인관계 (Connect)', score: 85 - (phase % 4) * 5, guide: '먼저 안부를 물어보세요.', recommendation: '지인에게 메시지 보내기' }
        ],
        explanation: '현재 에너지가 상승 곡선에 있어 전반적으로 좋은 흐름입니다.'
      });
    } catch (error) {
      next(error);
    }
  }
};
