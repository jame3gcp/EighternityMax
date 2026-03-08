import { eq, desc } from 'drizzle-orm';
import { db } from '../models/db.js';
import { lifeProfiles, records } from '../models/schema.js';
import { ApiError } from '../middleware/error.js';
import { userController } from './user.js';
import { PHASE_NAMES, PHASE_INTERPRETATIONS } from '../data/interpretationPhases.js';
import { computeCyclePhases, computeTrendsFromRecords } from '../services/energyScoreFromProfile.js';

export const cycleController = {
  async getCycle(req, res, next) {
    try {
      const { period = 'day' } = req.query;
      const internalId = await userController.getInternalUserId(req.supabaseId);

      const now = new Date();
      const [lifeProfile, recentRecords] = await Promise.all([
        db.query.lifeProfiles.findFirst({ where: eq(lifeProfiles.userId, internalId) }),
        db.query.records.findMany({
          where: eq(records.userId, internalId),
          orderBy: [desc(records.timestamp)],
          limit: 6,
        }),
      ]);

      const trends = computeTrendsFromRecords(recentRecords);

      const { currentPhase, phases } = lifeProfile
        ? computeCyclePhases(lifeProfile, now)
        : (() => {
            const phaseNames = ['새벽', '상승', '정점', '유지', '하강', '저점', '회복', '준비'];
            const phaseColors = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#f97316', '#ef4444', '#10b981', '#06b6d4'];
            const currentPhase = Math.floor((now.getHours() / 24) * 8) % 8;
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
            return { currentPhase, phases };
          })();

      res.json({
        userId: internalId,
        period,
        currentPhase,
        phases,
        trends,
        timestamp: Date.now(),
      });
    } catch (error) {
      next(error);
    }
  },

  /** GET /users/me/cycles/interpretation/:phaseId - Life Profile 연동 개인화 해석 */
  async getInterpretation(req, res, next) {
    try {
      const phaseId = Math.max(0, Math.min(7, parseInt(req.params.phaseId, 10) || 0));
      const internalId = await userController.getInternalUserId(req.supabaseId);
      const phase = PHASE_NAMES[phaseId];
      const nextPhaseId = (phaseId + 1) % PHASE_NAMES.length;
      const nextPhaseName = PHASE_NAMES[nextPhaseId];
      const content = PHASE_INTERPRETATIONS[phaseId] ?? PHASE_INTERPRETATIONS[0];

      const base = {
        phaseId,
        title: `${phase} 단계 해석`,
        description: content.description,
        energyTraitSummary: content.energyTraitSummary,
        periodSummary: content.periodSummary,
        recommendations: content.recommendations,
        warnings: content.warnings,
        nextPhase: nextPhaseId,
        nextPhaseName,
        nextPhaseDescription: content.nextPhaseDescription,
        nextPhaseTransitionHint: content.nextPhaseTransitionHint,
      };
      if (content.recommendationItems) base.recommendationItems = content.recommendationItems;
      if (content.warningItems) base.warningItems = content.warningItems;

      const lp = await db.query.lifeProfiles.findFirst({ where: eq(lifeProfiles.userId, internalId) });
      if (lp?.cycleDescription || lp?.energyType || (lp?.strengths && Array.isArray(lp.strengths) && lp.strengths.length > 0)) {
        const parts = [];
        if (lp.energyType) {
          parts.push(`당신의 에너지 유형(${lp.energyType}${lp.energyTypeEmoji ? ` ${lp.energyTypeEmoji}` : ''})에서는 이 단계에서 특히 유의해 보시면 좋습니다.`);
        }
        if (lp.cycleDescription && typeof lp.cycleDescription === 'string' && lp.cycleDescription.trim()) {
          parts.push(lp.cycleDescription.trim());
        }
        if (lp.strengths && Array.isArray(lp.strengths) && lp.strengths.length > 0) {
          const strengthText = lp.strengths.slice(0, 2).join(', ');
          parts.push(`강점 영역(${strengthText})을 활용하면 이 구간에서 할 일을 더 잘 수행할 수 있습니다.`);
        }
        base.personalization = parts.filter(Boolean).join(' ');
      }

      res.json(base);
    } catch (error) {
      next(error);
    }
  },
};
