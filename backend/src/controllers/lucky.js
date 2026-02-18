import { db } from '../models/db.js';
import { eq, and, desc } from 'drizzle-orm';
import { ApiError } from '../middleware/error.js';
import { userController } from './user.js';
import { luckyNumberDraws } from '../models/schema.js';

export const spotController = {
  async getSpots(req, res, next) {
    try {
      const { lat, lng, purpose = 'rest' } = req.query;
      if (!lat || !lng) throw new ApiError(400, 'lat and lng are required');

      const mockSpots = [
        { id: 'spot-1', name: '고요한 숲 카페', type: 'cafe', lat: parseFloat(lat) + 0.002, lng: parseFloat(lng) + 0.001, purpose: 'rest', score: 95, description: '회복하기 좋은 장소입니다.', address: '산책로 12', tags: ['조용한', '회복'] },
        { id: 'spot-2', name: '집중 스터디룸', type: 'study', lat: parseFloat(lat) - 0.001, lng: parseFloat(lng) + 0.003, purpose: 'focus', score: 92, description: '집중에 최적화된 공간입니다.', address: '비즈니스 타워', tags: ['집중', '업무'] },
        { id: 'spot-3', name: '활력 소셜 클럽', type: 'pub', lat: parseFloat(lat) + 0.004, lng: parseFloat(lng) - 0.002, purpose: 'meet', score: 88, description: '소통하기 좋은 장소입니다.', address: '핫플레이스 7', tags: ['소통', '활기'] }
      ];

      res.json({
        center: { lat: parseFloat(lat), lng: parseFloat(lng) },
        spots: mockSpots.filter(s => s.purpose === purpose || purpose === 'all'),
      });
    } catch (error) {
      next(error);
    }
  }
};

async function getCurrentInternalId(req) {
  if (req.userId) return req.userId;
  return await userController.getInternalUserId(req.supabaseId);
}

function generateNumbers(internalId, targetDate, type = 'lotto') {
  const seed = internalId + targetDate;
  const seededRandom = (s) => {
    let hash = 0;
    for (let i = 0; i < s.length; i++) hash = (hash << 5) - hash + s.charCodeAt(i);
    return () => {
      hash = (hash * 16807) % 2147483647;
      return (hash - 1) / 2147483646;
    };
  };
  const random = seededRandom(seed);
  const numbers = [];
  const count = type === 'lotto' ? 6 : 5;
  const max = type === 'lotto' ? 45 : 99;
  while (numbers.length < count) {
    const num = Math.floor(random() * max) + 1;
    if (!numbers.includes(num)) numbers.push(num);
  }
  return numbers.sort((a, b) => a - b);
}

const todayDate = () => new Date().toISOString().split('T')[0];

export const luckyController = {
  /** GET /lucky-numbers?date=YYYY-MM-DD — 해당 날짜 저장 건 조회(생성 안 함). 없으면 404. */
  async getLuckyNumbers(req, res, next) {
    try {
      const { date } = req.query;
      const targetDate = date || todayDate();
      const internalId = await getCurrentInternalId(req);
      if (!internalId) throw new ApiError(404, 'User not found');

      const [draw] = await db
        .select()
        .from(luckyNumberDraws)
        .where(and(eq(luckyNumberDraws.userId, internalId), eq(luckyNumberDraws.date, targetDate)));

      if (!draw) {
        return res.status(404).json({ error: 'Not Found', message: '해당 날짜에 생성된 행운 번호가 없습니다.' });
      }

      const today = todayDate();
      res.json({
        date: draw.date,
        type: draw.type,
        numbers: draw.numbers,
        message: '오늘의 행운 번호입니다.',
        disclaimer: '재미로만 참고하세요.',
        alreadyGeneratedToday: draw.date === today,
      });
    } catch (error) {
      next(error);
    }
  },

  /** POST /lucky-numbers — 오늘 1회만 생성·저장. 이미 있으면 409. */
  async postLuckyNumbers(req, res, next) {
    try {
      const internalId = await getCurrentInternalId(req);
      if (!internalId) throw new ApiError(404, 'User not found');

      const type = (req.body?.type === 'normal' ? 'normal' : 'lotto');
      const today = todayDate();

      const [existing] = await db
        .select()
        .from(luckyNumberDraws)
        .where(and(eq(luckyNumberDraws.userId, internalId), eq(luckyNumberDraws.date, today)));

      if (existing) {
        return res.status(409).json({
          error: 'Already generated today',
          message: '오늘 이미 행운 번호를 생성했습니다. 내일 다시 시도해 주세요.',
          date: existing.date,
          type: existing.type,
          numbers: existing.numbers,
        });
      }

      const numbers = generateNumbers(internalId, today, type);
      const id = `draw-${internalId}-${today}`;
      await db.insert(luckyNumberDraws).values({
        id,
        userId: internalId,
        date: today,
        type,
        numbers,
      });

      res.status(201).json({
        date: today,
        type,
        numbers,
        message: '오늘의 행운 번호입니다.',
        disclaimer: '재미로만 참고하세요.',
      });
    } catch (error) {
      next(error);
    }
  },

  /** GET /lucky-numbers/history?limit=30 — 과거 draw 목록 (날짜 내림차순). */
  async getLuckyNumbersHistory(req, res, next) {
    try {
      const internalId = await getCurrentInternalId(req);
      if (!internalId) throw new ApiError(404, 'User not found');

      const limit = Math.min(parseInt(req.query.limit, 10) || 30, 100);
      const rows = await db
        .select({ date: luckyNumberDraws.date, type: luckyNumberDraws.type, numbers: luckyNumberDraws.numbers })
        .from(luckyNumberDraws)
        .where(eq(luckyNumberDraws.userId, internalId))
        .orderBy(desc(luckyNumberDraws.date))
        .limit(limit);

      res.json(rows);
    } catch (error) {
      next(error);
    }
  },
};
