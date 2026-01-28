import { db } from '../models/db.js';
import { eq } from 'drizzle-orm';
import { ApiError } from '../middleware/error.js';
import { userController } from './user.js';

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

export const luckyController = {
  async getLuckyNumbers(req, res, next) {
    try {
      const { date, type = 'lotto' } = req.query;
      const targetDate = date || new Date().toISOString().split('T')[0];
      const internalId = await userController.getInternalUserId(req.supabaseId);

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

      res.json({
        date: targetDate,
        type,
        numbers: numbers.sort((a, b) => a - b),
        message: '오늘의 행운 번호입니다.',
        disclaimer: '재미로만 참고하세요.'
      });
    } catch (error) {
      next(error);
    }
  }
};
