import express from 'express';
import { adminController } from '../controllers/admin.js';
import { authenticate } from '../middleware/auth.js';
import { verifyAdmin } from '../middleware/admin.js';
import { db } from '../models/db.js';
import { users } from '../models/schema.js';
import { eq } from 'drizzle-orm';

const router = express.Router();

const attachUserRole = async (req, res, next) => {
  try {
    void res;
    if (!req.userId) return next();
    const user = await db.query.users.findFirst({ where: eq(users.id, req.userId) });
    if (user) {
      req.user = user;
      req.userRole = user.role;
    }
    return next();
  } catch (error) {
    return next(error);
  }
};

router.use(authenticate, attachUserRole, verifyAdmin);

router.get('/stats', adminController.getStats);
router.get('/users', adminController.getUsers);
router.get('/users/:id', adminController.getUserById);
router.patch('/users/:id/role', adminController.updateUserRole);

router.get('/guides', adminController.getGuides);
router.post('/guides', adminController.createGuide);
router.patch('/guides/:id', adminController.updateGuide);

router.get('/spots', adminController.getSpots);
router.post('/spots', adminController.createSpot);
router.patch('/spots/:id', adminController.updateSpot);

router.get('/ai-costs', adminController.getAiCosts);
router.get('/audit-logs', adminController.getAuditLogs);

router.get('/coupons', adminController.getCoupons);
router.post('/coupons', adminController.createCoupon);
router.patch('/coupons/:id', adminController.updateCoupon);

router.get('/payments', adminController.getPayments);
router.post('/payments/:id/refund', adminController.refundPayment);

router.post('/users/:id/override-subscription', adminController.overrideSubscription);
router.get('/analytics/retention', adminController.getRetentionStats);
router.get('/analytics/behavior', adminController.getBehaviorStats);

router.get('/rankings', adminController.getRankings);
router.get('/rankings/settings', adminController.getRankingSettings);
router.patch('/rankings/settings', adminController.updateRankingSettings);

export default router;
