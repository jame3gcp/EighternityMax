import { db } from '../models/db.js';
import { userActivities } from '../models/schema.js';

export const analyticsController = {
  async logActivity(req, res, next) {
    try {
      const { type, path, durationMs, metadata } = req.body;
      const userId = req.userId || null;

      await db.insert(userActivities).values({
        id: `act_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        userId,
        type: type || 'page_view',
        path: path || '/',
        durationMs: durationMs || 0,
        metadata: metadata || {},
        createdAt: new Date(),
      });

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
};
