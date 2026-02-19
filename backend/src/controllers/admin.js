import { db } from '../models/db.js';
import { users, subscriptions, payments, profiles, sajuAnalyses, aiUsageLogs, guides, energySpots, coupons, adminAuditLogs, userActivities, gameScores, rankingSettings } from '../models/schema.js';
import { and, desc, eq, gte, inArray, isNotNull, lt, sql, count, sum } from 'drizzle-orm';
import { ApiError } from '../middleware/error.js';
import { adminService } from '../services/admin.js';

const clampInt = (value, { fallback, min, max }) => {
  const n = Number.parseInt(String(value ?? ''), 10);
  const resolved = Number.isFinite(n) ? n : fallback;
  return Math.min(max, Math.max(min, resolved));
};

const toIsoMonth = (date) => {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
};

const startOfUtcMonth = (date) => new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));

const addUtcMonths = (date, months) => new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + months, 1));

const growth = (current, previous) => {
  const cur = Number(current) || 0;
  const prev = Number(previous) || 0;
  const delta = cur - prev;
  const percent = prev > 0 ? (delta / prev) * 100 : null;
  return { current: cur, previous: prev, delta, percent };
};

const parseDateParam = (raw) => {
  if (!raw) return null;
  const d = new Date(String(raw));
  return Number.isNaN(d.getTime()) ? null : d;
};

const coerceNumber = (raw) => {
  const n = Number(raw);
  return Number.isFinite(n) ? n : 0;
};

export const adminController = {
  async getStats(req, res, next) {
    try {
      void req;
      const now = new Date();
      const startCur = startOfUtcMonth(now);
      const startNext = addUtcMonths(startCur, 1);
      const startPrev = addUtcMonths(startCur, -1);

      const paidRevenueWhere = and(
        isNotNull(payments.paidAt),
        sql`${payments.status} not in ('failed', 'canceled', 'cancelled', 'refunded')`
      );

      const [totalUsersRow, totalSubscribersRow, totalRevenueRow] = await Promise.all([
        db.select({ value: count() }).from(users),
        db.select({ value: count() }).from(subscriptions).where(eq(subscriptions.status, 'active')),
        db.select({ value: sum(payments.amountCents) }).from(payments).where(eq(payments.status, 'succeeded')),
      ]);

      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const [aiUsageTodayRes] = await db.select({ value: count() }).from(aiUsageLogs).where(gte(aiUsageLogs.createdAt, todayStart));

      res.json({
        totalUsers: Number(totalUsersRow?.[0]?.value ?? 0),
        totalSubscribers: Number(totalSubscribersRow?.[0]?.value ?? 0),
        totalRevenue: parseInt(totalRevenueRow?.[0]?.value || 0, 10),
        aiUsageToday: Number(aiUsageTodayRes?.[0]?.value ?? 0),
        monthlyGrowth: {
          users: 10,
          subscribers: 5,
          revenue: 12
        }
      });
    } catch (error) {
      next(error);
    }
  },

  async getUsers(req, res, next) {
    try {
      const page = clampInt(req.query.page, { fallback: 1, min: 1, max: 1000000 });
      const limit = clampInt(req.query.limit, { fallback: 20, min: 1, max: 100 });
      const offset = (page - 1) * limit;

      const [totalRow, userRows] = await Promise.all([
        db.select({ value: sql`count(*)` }).from(users),
        db.select().from(users).orderBy(desc(users.createdAt)).limit(limit).offset(offset),
      ]);

      const total = Number(totalRow?.[0]?.value ?? 0);
      const userIds = userRows.map((u) => u.id);

      const subsRows = userIds.length
        ? await db
            .select()
            .from(subscriptions)
            .where(inArray(subscriptions.userId, userIds))
            .orderBy(desc(subscriptions.updatedAt))
        : [];

      const latestSubscriptionByUser = new Map();
      for (const sub of subsRows) {
        if (!latestSubscriptionByUser.has(sub.userId)) {
          latestSubscriptionByUser.set(sub.userId, sub);
        }
      }

      const out = userRows.map((u) => {
        const sub = latestSubscriptionByUser.get(u.id) || null;
        return {
          id: u.id,
          email: u.email ?? null,
          display_name: u.displayName ?? null,
          provider: u.provider,
          role: u.role,
          created_at: u.createdAt?.toISOString?.() ?? u.createdAt,
          last_login_at: u.lastLoginAt?.toISOString?.() ?? u.lastLoginAt,
          privacy_consent_given: !!u.privacyConsentAt,
          subscription: sub
            ? {
                id: sub.id,
                status: sub.status,
                plan_id: sub.planId,
                current_period_start: sub.currentPeriodStart?.toISOString?.() ?? sub.currentPeriodStart,
                current_period_end: sub.currentPeriodEnd?.toISOString?.() ?? sub.currentPeriodEnd,
                cancel_at_period_end: !!sub.cancelAtPeriodEnd,
                canceled_at: sub.canceledAt?.toISOString?.() ?? sub.canceledAt,
                updated_at: sub.updatedAt?.toISOString?.() ?? sub.updatedAt,
              }
            : null,
        };
      });

      res.json({
        page,
        limit,
        total,
        users: out,
      });
    } catch (error) {
      next(error);
    }
  },

  async getUserById(req, res, next) {
    try {
      const { id } = req.params;
      if (!id) throw new ApiError(400, 'User id is required');

      const paymentsLimit = clampInt(req.query.payments_limit, { fallback: 50, min: 1, max: 200 });
      const analysesLimit = clampInt(req.query.analyses_limit, { fallback: 50, min: 1, max: 200 });

      const user = await db.query.users.findFirst({ where: eq(users.id, id) });
      if (!user) throw new ApiError(404, 'User not found');

      const [profile, latestSubRows, paymentRows, analysisRows] = await Promise.all([
        db.query.profiles.findFirst({ where: eq(profiles.userId, id) }),
        db.query.subscriptions.findMany({
          where: eq(subscriptions.userId, id),
          orderBy: [desc(subscriptions.updatedAt)],
          limit: 1,
        }),
        db.select().from(payments).where(eq(payments.userId, id)).orderBy(desc(payments.createdAt)).limit(paymentsLimit),
        db.select().from(sajuAnalyses).where(eq(sajuAnalyses.userId, id)).orderBy(desc(sajuAnalyses.updatedAt)).limit(analysesLimit),
      ]);

      const latestSub = latestSubRows?.[0] || null;

      res.json({
        user: {
          id: user.id,
          email: user.email ?? null,
          display_name: user.displayName ?? null,
          provider: user.provider,
          provider_user_id: user.providerUserId,
          role: user.role,
          created_at: user.createdAt?.toISOString?.() ?? user.createdAt,
          last_login_at: user.lastLoginAt?.toISOString?.() ?? user.lastLoginAt,
          privacy_consent_at: user.privacyConsentAt?.toISOString?.() ?? user.privacyConsentAt,
        },
        profile: profile
          ? {
              id: profile.id,
              birth_date: profile.birthDate,
              birth_time: profile.birthTime ?? null,
              gender: profile.gender,
              region: profile.region ?? null,
              saju: profile.saju ?? null,
              created_at: profile.createdAt?.toISOString?.() ?? profile.createdAt,
              updated_at: profile.updatedAt?.toISOString?.() ?? profile.updatedAt,
            }
          : null,
        subscription: latestSub
          ? {
              id: latestSub.id,
              status: latestSub.status,
              plan_id: latestSub.planId,
              provider: latestSub.provider,
              provider_subscription_id: latestSub.providerSubscriptionId ?? null,
              current_period_start: latestSub.currentPeriodStart?.toISOString?.() ?? latestSub.currentPeriodStart,
              current_period_end: latestSub.currentPeriodEnd?.toISOString?.() ?? latestSub.currentPeriodEnd,
              cancel_at_period_end: !!latestSub.cancelAtPeriodEnd,
              canceled_at: latestSub.canceledAt?.toISOString?.() ?? latestSub.canceledAt,
              created_at: latestSub.createdAt?.toISOString?.() ?? latestSub.createdAt,
              updated_at: latestSub.updatedAt?.toISOString?.() ?? latestSub.updatedAt,
            }
          : null,
        payment_history: paymentRows.map((p) => ({
          id: p.id,
          subscription_id: p.subscriptionId ?? null,
          provider: p.provider,
          provider_payment_id: p.providerPaymentId ?? null,
          amount_cents: p.amountCents,
          currency: p.currency,
          status: p.status,
          paid_at: p.paidAt?.toISOString?.() ?? p.paidAt,
          created_at: p.createdAt?.toISOString?.() ?? p.createdAt,
          metadata: p.metadata ?? null,
        })),
        saju_analysis_log: analysisRows.map((a) => ({
          id: a.id,
          profile_id: a.profileId,
          saju_signature: a.sajuSignature,
          status: a.status,
          model: a.model ?? null,
          prompt_version: a.promptVersion ?? null,
          error_message: a.errorMessage ?? null,
          created_at: a.createdAt?.toISOString?.() ?? a.createdAt,
          updated_at: a.updatedAt?.toISOString?.() ?? a.updatedAt,
        })),
      });
    } catch (error) {
      next(error);
    }
  },

  async getAiCosts(req, res, next) {
    try {
      const from = parseDateParam(req.query.from);
      const to = parseDateParam(req.query.to);

      if (req.query.from && !from) throw new ApiError(400, 'Invalid from date');
      if (req.query.to && !to) throw new ApiError(400, 'Invalid to date');

      const whereParts = [];
      if (from) whereParts.push(gte(aiUsageLogs.createdAt, from));
      if (to) whereParts.push(lt(aiUsageLogs.createdAt, to));
      const whereClause = whereParts.length ? and(...whereParts) : sql`true`;

      const [totalCostRes] = await db.select({ value: sum(aiUsageLogs.costCents) }).from(aiUsageLogs).where(whereClause);
      
      const usageByModel = await db.select({
        model: aiUsageLogs.model,
        count: count()
      }).from(aiUsageLogs).where(whereClause).groupBy(aiUsageLogs.model);

      const recentLogs = await db.query.aiUsageLogs.findMany({
        where: whereClause,
        limit: 50,
        orderBy: [desc(aiUsageLogs.createdAt)]
      });

      res.json({
        totalCost: parseInt(totalCostRes.value || 0, 10),
        usageByModel: Object.fromEntries(usageByModel.map(r => [r.model, r.count])),
        recentLogs
      });
    } catch (error) {
      next(error);
    }
  },

  async updateUserRole(req, res, next) {
    try {
      const { id } = req.params;
      if (!id) throw new ApiError(400, 'User id is required');

      const rawRole = req.body?.role;
      if (typeof rawRole !== 'string') {
        throw new ApiError(400, 'role must be a string');
      }

      const normalizedRole = rawRole.trim().toLowerCase();
      if (!['user', 'admin'].includes(normalizedRole)) {
        throw new ApiError(400, 'Invalid role. Allowed roles: user, admin');
      }

      const existing = await db.query.users.findFirst({ where: eq(users.id, id) });
      if (!existing) throw new ApiError(404, 'User not found');

      if (req.userId === id && normalizedRole !== 'admin') {
        throw new ApiError(400, 'Cannot demote your own admin account');
      }

      await db
        .update(users)
        .set({ role: normalizedRole })
        .where(eq(users.id, id));

      await adminService.logAction({
        adminId: req.userId,
        action: 'UPDATE_ROLE',
        targetType: 'USER',
        targetId: id,
        before: { role: existing.role },
        after: { role: normalizedRole },
        ipAddress: req.ip,
      });

      const updated = await db.query.users.findFirst({ where: eq(users.id, id) });

      return res.json({
        user: {
          id: updated.id,
          email: updated.email ?? null,
          display_name: updated.displayName ?? null,
          role: updated.role,
          updated_at: new Date().toISOString(),
        },
      });
    } catch (error) {
      next(error);
    }
  },

  async getGuides(req, res, next) {
    try {
      const list = await db.query.guides.findMany({
        orderBy: [desc(guides.updatedAt)]
      });
      res.json(list);
    } catch (error) {
      next(error);
    }
  },

  async createGuide(req, res, next) {
    try {
      const data = req.body;
      const id = `guide_${Date.now()}`;
      await db.insert(guides).values({
        id,
        ...data,
        authorId: req.userId,
      });
      
      await adminService.logAction({
        adminId: req.userId,
        action: 'CREATE_GUIDE',
        targetType: 'GUIDE',
        targetId: id,
        after: data,
        ipAddress: req.ip,
      });

      res.status(201).json({ id });
    } catch (error) {
      next(error);
    }
  },

  async updateGuide(req, res, next) {
    try {
      const { id } = req.params;
      const data = req.body;
      const existing = await db.query.guides.findFirst({ where: eq(guides.id, id) });
      if (!existing) throw new ApiError(404, 'Guide not found');

      await db.update(guides).set({ ...data, updatedAt: new Date() }).where(eq(guides.id, id));

      await adminService.logAction({
        adminId: req.userId,
        action: 'UPDATE_GUIDE',
        targetType: 'GUIDE',
        targetId: id,
        before: existing,
        after: data,
        ipAddress: req.ip,
      });

      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  },

  async getSpots(req, res, next) {
    try {
      const list = await db.query.energySpots.findMany({
        orderBy: [desc(energySpots.updatedAt)]
      });
      res.json(list);
    } catch (error) {
      next(error);
    }
  },

  async createSpot(req, res, next) {
    try {
      const data = req.body;
      const id = `spot_${Date.now()}`;
      await db.insert(energySpots).values({
        id,
        ...data,
      });

      await adminService.logAction({
        adminId: req.userId,
        action: 'CREATE_SPOT',
        targetType: 'ENERGY_SPOT',
        targetId: id,
        after: data,
        ipAddress: req.ip,
      });

      res.status(201).json({ id });
    } catch (error) {
      next(error);
    }
  },

  async updateSpot(req, res, next) {
    try {
      const { id } = req.params;
      const data = req.body;
      const existing = await db.query.energySpots.findFirst({ where: eq(energySpots.id, id) });
      if (!existing) throw new ApiError(404, 'Spot not found');

      await db.update(energySpots).set({ ...data, updatedAt: new Date() }).where(eq(energySpots.id, id));

      await adminService.logAction({
        adminId: req.userId,
        action: 'UPDATE_SPOT',
        targetType: 'ENERGY_SPOT',
        targetId: id,
        before: existing,
        after: data,
        ipAddress: req.ip,
      });

      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  },

  async getAuditLogs(req, res, next) {
    try {
      const page = clampInt(req.query.page, { fallback: 1, min: 1, max: 1000000 });
      const limit = clampInt(req.query.limit, { fallback: 50, min: 1, max: 100 });
      const offset = (page - 1) * limit;

      const [totalRow, logs] = await Promise.all([
        db.select({ value: count() }).from(adminAuditLogs),
        db.select().from(adminAuditLogs).orderBy(desc(adminAuditLogs.createdAt)).limit(limit).offset(offset)
      ]);

      res.json({
        total: Number(totalRow[0].value),
        logs,
        page,
        pages: Math.ceil(Number(totalRow[0].value) / limit)
      });
    } catch (error) {
      next(error);
    }
  },

  async getCoupons(req, res, next) {
    try {
      const list = await db.query.coupons.findMany({
        orderBy: [desc(coupons.createdAt)]
      });
      res.json(list);
    } catch (error) {
      next(error);
    }
  },

  async createCoupon(req, res, next) {
    try {
      const data = req.body;
      const id = `cpn_${Date.now()}`;
      await db.insert(coupons).values({
        id,
        ...data,
      });

      await adminService.logAction({
        adminId: req.userId,
        action: 'CREATE_COUPON',
        targetType: 'COUPON',
        targetId: id,
        after: data,
        ipAddress: req.ip,
      });

      res.status(201).json({ id });
    } catch (error) {
      next(error);
    }
  },

  async overrideSubscription(req, res, next) {
    try {
      const { id } = req.params;
      const { planId, status, currentPeriodEnd, reason } = req.body;

      const existing = await db.query.subscriptions.findFirst({ where: eq(subscriptions.userId, id) });
      
      const newSubData = {
        userId: id,
        planId,
        status,
        currentPeriodEnd: currentPeriodEnd ? new Date(currentPeriodEnd) : undefined,
        updatedAt: new Date(),
        provider: 'manual',
      };

      if (existing) {
        await db.update(subscriptions).set(newSubData).where(eq(subscriptions.userId, id));
      } else {
        await db.insert(subscriptions).values({
          id: `sub_man_${Date.now()}`,
          ...newSubData,
        });
      }

      await adminService.logAction({
        adminId: req.userId,
        action: 'OVERRIDE_SUBSCRIPTION',
        targetType: 'SUBSCRIPTION',
        targetId: id,
        before: existing || null,
        after: newSubData,
        reason,
        ipAddress: req.ip,
      });

      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  },

  async getRetentionStats(req, res, next) {
    try {
      const cohortData = await db.execute(sql`
        WITH user_cohorts AS (
          SELECT id, date_trunc('month', created_at) AS cohort_month
          FROM users
        ),
        activity AS (
          SELECT DISTINCT user_id, date_trunc('month', created_at) AS activity_month
          FROM ai_usage_logs
          UNION
          SELECT DISTINCT user_id, date_trunc('month', timestamp) AS activity_month
          FROM records
        )
        SELECT 
          to_char(c.cohort_month, 'YYYY-MM') as cohort,
          to_char(a.activity_month, 'YYYY-MM') as activity_period,
          count(DISTINCT c.id) as user_count
        FROM user_cohorts c
        LEFT JOIN activity a ON c.id = a.user_id AND a.activity_month >= c.cohort_month
        GROUP BY 1, 2
        ORDER BY 1, 2
      `);

      res.json(cohortData);
    } catch (error) {
      next(error);
    }
  },

  async getBehaviorStats(req, res, next) {
    try {
      const now = new Date();
      const parseDate = (str) => {
        if (!str || typeof str !== 'string') return null;
        const match = str.trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
        if (!match) return null;
        const [, y, m, d] = match.map(Number);
        if (m < 1 || m > 12 || d < 1 || d > 31) return null;
        return { y, m: m - 1, d };
      };
      const seoulDateToUtcStart = (y, m, d) => new Date(Date.UTC(y, m, d, 0, 0, 0, 0) - 9 * 60 * 60 * 1000);
      const seoulDateToUtcEndExclusive = (y, m, d) => new Date(Date.UTC(y, m, d + 1, 0, 0, 0, 0) - 9 * 60 * 60 * 1000);

      let startDate;
      let endDate;
      const fromParam = parseDate(req.query.from);
      const toParam = parseDate(req.query.to);

      if (fromParam && toParam) {
        startDate = seoulDateToUtcStart(fromParam.y, fromParam.m, fromParam.d);
        endDate = seoulDateToUtcEndExclusive(toParam.y, toParam.m, toParam.d);
        if (startDate.getTime() > endDate.getTime()) {
          startDate = seoulDateToUtcStart(toParam.y, toParam.m, toParam.d);
          endDate = seoulDateToUtcEndExclusive(fromParam.y, fromParam.m, fromParam.d);
        }
      } else {
        endDate = new Date(now.getTime());
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      }

      const dateFilter = and(gte(userActivities.createdAt, startDate), lt(userActivities.createdAt, endDate));
      const pageViewFilter = and(eq(userActivities.type, 'page_view'), dateFilter);

      const topMenus = await db.select({
        path: userActivities.path,
        views: count()
      })
      .from(userActivities)
      .where(pageViewFilter)
      .groupBy(userActivities.path)
      .orderBy(desc(count()))
      .limit(10);

      const avgDuration = await db.select({
        path: userActivities.path,
        avg_ms: sql`avg(${userActivities.durationMs})`
      })
      .from(userActivities)
      .where(dateFilter)
      .groupBy(userActivities.path)
      .orderBy(desc(sql`avg(${userActivities.durationMs})`))
      .limit(10);

      const hourlyActive = await db.execute(sql`
        SELECT 
          extract(hour from ((created_at AT TIME ZONE 'UTC') AT TIME ZONE 'Asia/Seoul'))::integer as hour,
          count(*) as activity_count
        FROM user_activities
        WHERE (created_at AT TIME ZONE 'UTC') >= ${startDate} AND (created_at AT TIME ZONE 'UTC') < ${endDate}
        GROUP BY 1
        ORDER BY 1
      `);

      res.json({
        from: fromParam ? `${fromParam.y}-${String(fromParam.m + 1).padStart(2, '0')}-${String(fromParam.d).padStart(2, '0')}` : null,
        to: toParam ? `${toParam.y}-${String(toParam.m + 1).padStart(2, '0')}-${String(toParam.d).padStart(2, '0')}` : null,
        topMenus,
        avgDuration: avgDuration.map(d => ({ ...d, avg_ms: parseInt(d.avg_ms, 10) })),
        hourlyActive
      });
    } catch (error) {
      next(error);
    }
  },

  async getPayments(req, res, next) {
    try {
      const page = clampInt(req.query.page, { fallback: 1, min: 1, max: 1000000 });
      const limit = clampInt(req.query.limit, { fallback: 20, min: 1, max: 100 });
      const offset = (page - 1) * limit;

      const [totalRow, paymentRows] = await Promise.all([
        db.select({ value: count() }).from(payments),
        db.query.payments.findMany({
          limit,
          offset,
          orderBy: [desc(payments.createdAt)],
          with: {
            user: true
          }
        })
      ]);

      const total = Number(totalRow[0].value);
      res.json({
        payments: paymentRows,
        total,
        pages: Math.ceil(total / limit)
      });
    } catch (error) {
      next(error);
    }
  },

  async refundPayment(req, res, next) {
    try {
      const { id } = req.params;
      const { reason } = req.body;

      const existing = await db.query.payments.findFirst({ where: eq(payments.id, id) });
      if (!existing) throw new ApiError(404, 'Payment not found');

      await db.update(payments).set({ status: 'refunded' }).where(eq(payments.id, id));

      await adminService.logAction({
        adminId: req.userId,
        action: 'REFUND_PAYMENT',
        targetType: 'PAYMENT',
        targetId: id,
        before: { status: existing.status },
        after: { status: 'refunded' },
        reason,
        ipAddress: req.ip,
      });

      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  },

  async updateCoupon(req, res, next) {
    try {
      const { id } = req.params;
      const data = req.body;
      const existing = await db.query.coupons.findFirst({ where: eq(coupons.id, id) });
      if (!existing) throw new ApiError(404, 'Coupon not found');

      await db.update(coupons).set({ ...data }).where(eq(coupons.id, id));

      await adminService.logAction({
        adminId: req.userId,
        action: 'UPDATE_COUPON',
        targetType: 'COUPON',
        targetId: id,
        before: existing,
        after: data,
        ipAddress: req.ip,
      });

      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  },

  async getRankings(req, res, next) {
    try {
      const { weekKey: queryWeekKey, gameId, limit: limitStr } = req.query;
      const { getWeekKey } = await import('./gameScores.js');
      const weekKey = queryWeekKey && String(queryWeekKey).match(/^\d{4}-W\d{2}$/) ? queryWeekKey : await getWeekKey();
      const limit = Math.min(Math.max(parseInt(limitStr, 10) || 50, 1), 200);

      if (gameId) {
        const rows = await db
          .select({
            userId: gameScores.userId,
            score: gameScores.score,
            email: users.email,
            displayName: users.displayName,
          })
          .from(gameScores)
          .innerJoin(users, eq(gameScores.userId, users.id))
          .where(and(eq(gameScores.gameId, gameId), eq(gameScores.weekKey, weekKey)))
          .orderBy(desc(gameScores.score))
          .limit(limit);

        const userIds = rows.map((r) => r.userId);
        const profilesList = await db.select({ userId: profiles.userId, nickname: profiles.nickname }).from(profiles).where(inArray(profiles.userId, userIds));
        const nickByUser = {};
        profilesList.forEach((p) => { if (p.nickname) nickByUser[p.userId] = p.nickname; });

        const list = rows.map((r, i) => ({
          rank: i + 1,
          userId: r.userId,
          displayName: nickByUser[r.userId] || r.displayName || r.email || '—',
          email: r.email,
          score: r.score,
        }));

        return res.json({ weekKey, gameId, list });
      }

      const allGames = ['wave', 'snake', 'balance', 'flow-connect'];
      const result = {};
      for (const gid of allGames) {
        const rows = await db
          .select({ userId: gameScores.userId, score: gameScores.score })
          .from(gameScores)
          .where(and(eq(gameScores.gameId, gid), eq(gameScores.weekKey, weekKey)))
          .orderBy(desc(gameScores.score))
          .limit(limit);
        result[gid] = rows.map((r, i) => ({ rank: i + 1, userId: r.userId, score: r.score }));
      }
      res.json({ weekKey, byGame: result });
    } catch (error) {
      next(error);
    }
  },

  async getRankingSettings(req, res, next) {
    try {
      const rows = await db.select().from(rankingSettings).where(inArray(rankingSettings.key, ['week_start_day', 'games_enabled']));
      const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));
      const week_start_day = map.week_start_day != null ? Number(map.week_start_day) : 1;
      const games_enabled = map.games_enabled && typeof map.games_enabled === 'object' ? map.games_enabled : { wave: true, snake: true, balance: true, 'flow-connect': true };
      res.json({ week_start_day, games_enabled });
    } catch (error) {
      next(error);
    }
  },

  async updateRankingSettings(req, res, next) {
    try {
      const { week_start_day, games_enabled } = req.body || {};
      const now = new Date();
      if (week_start_day !== undefined) {
        const v = Number(week_start_day);
        if (!Number.isFinite(v) || v < 0 || v > 6) throw new ApiError(400, 'week_start_day must be 0-6');
        await db.insert(rankingSettings).values({ key: 'week_start_day', value: v, updatedAt: now }).onConflictDoUpdate({
          target: [rankingSettings.key],
          set: { value: v, updatedAt: now },
        });
      }
      if (games_enabled !== undefined && typeof games_enabled === 'object') {
        await db.insert(rankingSettings).values({ key: 'games_enabled', value: games_enabled, updatedAt: now }).onConflictDoUpdate({
          target: [rankingSettings.key],
          set: { value: games_enabled, updatedAt: now },
        });
      }
      const rows = await db.select().from(rankingSettings).where(inArray(rankingSettings.key, ['week_start_day', 'games_enabled']));
      const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));
      res.json({
        week_start_day: map.week_start_day != null ? Number(map.week_start_day) : 1,
        games_enabled: map.games_enabled && typeof map.games_enabled === 'object' ? map.games_enabled : { wave: true, snake: true, balance: true, 'flow-connect': true },
      });
    } catch (error) {
      next(error);
    }
  },
};

