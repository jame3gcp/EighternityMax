import { db } from '../models/db.js';
import { siteContents } from '../models/schema.js';
import { and, desc, eq, ne, sql } from 'drizzle-orm';
import { ApiError } from '../middleware/error.js';
import { adminService } from '../services/admin.js';

export const siteContentController = {
  // Public API: Fetch active version
  async getActive(req, res, next) {
    try {
      const { contentKey } = req.params;
      if (!['terms_of_service', 'privacy_policy'].includes(contentKey)) {
        throw new ApiError(400, 'Invalid content key');
      }

      const active = await db.query.siteContents.findFirst({
        where: and(
          eq(siteContents.contentKey, contentKey),
          eq(siteContents.status, 'active')
        )
      });

      if (!active) {
        throw new ApiError(404, 'Active content not found');
      }

      res.json(active);
    } catch (error) {
      next(error);
    }
  },

  // Admin API: List versions
  async listVersions(req, res, next) {
    try {
      const { contentKey } = req.query;
      const whereParts = [];
      if (contentKey) whereParts.push(eq(siteContents.contentKey, contentKey));
      
      const list = await db.query.siteContents.findMany({
        where: whereParts.length ? and(...whereParts) : undefined,
        orderBy: [desc(siteContents.updatedAt)]
      });
      res.json(list);
    } catch (error) {
      next(error);
    }
  },

  // Admin API: Create new draft
  async create(req, res, next) {
    try {
      const data = req.body;
      const id = `sc_${Date.now()}`;
      
      await db.insert(siteContents).values({
        id,
        ...data,
        createdBy: req.userId,
        updatedBy: req.userId,
      });

      await adminService.logAction({
        adminId: req.userId,
        action: 'CREATE_SITE_CONTENT',
        targetType: 'SITE_CONTENT',
        targetId: id,
        after: data,
        ipAddress: req.ip,
      });

      res.status(201).json({ id });
    } catch (error) {
      next(error);
    }
  },

  // Admin API: Update or Publish
  async update(req, res, next) {
    try {
      const { id } = req.params;
      const data = req.body;
      
      const existing = await db.query.siteContents.findFirst({ where: eq(siteContents.id, id) });
      if (!existing) throw new ApiError(404, 'Content not found');

      // If publishing, transactional update to archive old active
      if (data.status === 'active' && existing.status !== 'active') {
        await db.transaction(async (tx) => {
          // Archive old active
          await tx.update(siteContents)
            .set({ status: 'archived', updatedAt: new Date() })
            .where(and(
              eq(siteContents.contentKey, existing.contentKey),
              eq(siteContents.status, 'active'),
              ne(siteContents.id, id)
            ));
          
          // Activate this one
          await tx.update(siteContents)
            .set({ 
              ...data, 
              publishedAt: new Date(), 
              updatedAt: new Date(),
              updatedBy: req.userId 
            })
            .where(eq(siteContents.id, id));
        });
      } else {
        // Normal update
        if (existing.status === 'active' && (data.contentMarkdown || data.version)) {
          throw new ApiError(409, 'Cannot edit body or version of active content. Create a new draft instead.');
        }
        await db.update(siteContents)
          .set({ ...data, updatedAt: new Date(), updatedBy: req.userId })
          .where(eq(siteContents.id, id));
      }

      await adminService.logAction({
        adminId: req.userId,
        action: 'UPDATE_SITE_CONTENT',
        targetType: 'SITE_CONTENT',
        targetId: id,
        before: existing,
        after: data,
        ipAddress: req.ip,
      });

      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  }
};
