import { db } from '../models/db.js';
import { adminAuditLogs } from '../models/schema.js';

export const adminService = {
  async logAction({ adminId, action, targetType, targetId, before, after, reason, ipAddress }) {
    try {
      await db.insert(adminAuditLogs).values({
        id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        adminId,
        action,
        targetType,
        targetId,
        before,
        after,
        reason: reason || null,
        ipAddress: ipAddress || null,
        createdAt: new Date(),
      });
    } catch (error) {
      console.warn('⚠️ Failed to log admin action:', error.message);
    }
  }
};
