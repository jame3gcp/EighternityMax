import { db } from '../models/db.js';
import { ApiError } from '../middleware/error.js';

export const spotController = {
  async getSpots(req, res, next) {
    try {
      const { lat, lng, purpose = 'rest', radius_km = 3 } = req.query;

      if (!lat || !lng) {
        throw new ApiError(400, 'lat and lng are required');
      }

      const mockSpots = [
        {
          id: 'spot-1',
          name: '고요한 숲 카페',
          type: 'cafe',
          lat: parseFloat(lat) + 0.002,
          lng: parseFloat(lng) + 0.001,
          purpose: 'rest',
          score: 95,
          description: '조용한 분위기에서 에너지를 회복하기 좋은 장소입니다.',
          address: '서울시 어딘가 산책로 12',
          tags: ['조용한', '자연', '회복'],
        },
        {
          id: 'spot-2',
          name: '집중 팩토리 스터디룸',
          type: 'study',
          lat: parseFloat(lat) - 0.001,
          lng: parseFloat(lng) + 0.003,
          purpose: 'focus',
          score: 92,
          description: '고도의 집중력이 필요한 작업을 하기에 최적화된 공간입니다.',
          address: '서울시 비즈니스 타워 5층',
          tags: ['집중', '업무', '고성능'],
        },
        {
          id: 'spot-3',
          name: '활력 소셜 클럽',
          type: 'pub/lounge',
          lat: parseFloat(lat) + 0.004,
          lng: parseFloat(lng) - 0.002,
          purpose: 'meet',
          score: 88,
          description: '긍정적인 에너지를 주고받으며 소통하기 좋은 활기찬 장소입니다.',
          address: '서울시 핫플레이스 거리 7',
          tags: ['소통', '활기', '네트워킹'],
        }
      ];

      const filteredSpots = mockSpots.filter(spot => spot.purpose === purpose);

      res.json({
        center: { lat: parseFloat(lat), lng: parseFloat(lng) },
        radius_km: parseFloat(radius_km),
        spots: filteredSpots.length > 0 ? filteredSpots : mockSpots,
      });
    } catch (error) {
      next(error);
    }
  }
};
