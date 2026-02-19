import { and, desc, eq } from 'drizzle-orm';
import { db } from '../models/db.js';
import { subscriptions } from '../models/schema.js';

const STRIPE_PROVIDER = 'stripe';

const randomId = (prefix) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

const toDateFromUnixSeconds = (seconds) => {
  if (seconds == null) return null;
  const n = Number(seconds);
  if (!Number.isFinite(n) || n <= 0) return null;
  return new Date(n * 1000);
};

const pickMetadataValue = (metadata, keys) => {
  if (!metadata) return null;
  for (const k of keys) {
    const v = metadata[k];
    if (v != null && String(v).trim() !== '') return String(v);
  }
  return null;
};

export const subscriptionService = {
  async resolveByProviderSubscriptionId(provider, providerSubscriptionId) {
    if (!provider || !providerSubscriptionId) return null;
    return db.query.subscriptions.findFirst({
      where: and(
        eq(subscriptions.provider, provider),
        eq(subscriptions.providerSubscriptionId, String(providerSubscriptionId))
      ),
    });
  },

  async upsertFromStripe(stripeSub, { eventId } = {}) {
    const providerSubscriptionId = stripeSub?.id;
    if (!providerSubscriptionId) return null;

    const existing = await subscriptionService.resolveByProviderSubscriptionId(STRIPE_PROVIDER, providerSubscriptionId);
    const metadata = stripeSub?.metadata || {};

    const userId = pickMetadataValue(metadata, ['user_id', 'userId']) || existing?.userId || null;
    const planId = pickMetadataValue(metadata, ['plan_id', 'planId']) || existing?.planId || null;
    if (!userId || !planId) {
      console.warn('[subscription] Unmapped Stripe subscription (missing metadata user_id/plan_id). sub=', providerSubscriptionId, 'event=', eventId);
      return null;
    }

    const now = new Date();
    const status = stripeSub?.status || 'unknown';
    const currentPeriodStart = toDateFromUnixSeconds(stripeSub?.current_period_start);
    const currentPeriodEnd = toDateFromUnixSeconds(stripeSub?.current_period_end);
    const cancelAtPeriodEnd = !!stripeSub?.cancel_at_period_end;
    const canceledAt = toDateFromUnixSeconds(stripeSub?.canceled_at) || (status === 'canceled' ? now : null);

    const inserted = await db.insert(subscriptions)
      .values({
        id: randomId('sub'),
        userId,
        planId,
        status,
        provider: STRIPE_PROVIDER,
        providerSubscriptionId,
        currentPeriodStart,
        currentPeriodEnd,
        cancelAtPeriodEnd,
        canceledAt,
        createdAt: now,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: [subscriptions.provider, subscriptions.providerSubscriptionId],
        set: {
          userId,
          planId,
          status,
          currentPeriodStart,
          currentPeriodEnd,
          cancelAtPeriodEnd,
          canceledAt,
          updatedAt: now,
        },
      })
      .returning({ id: subscriptions.id });

    return inserted?.[0]?.id || null;
  },

  async getLatestForUser(userId) {
    if (!userId) return null;
    const rows = await db.select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, userId))
      .orderBy(desc(subscriptions.updatedAt))
      .limit(1);
    return rows?.[0] || null;
  },

  async isUserPro(userId, { now = new Date() } = {}) {
    const sub = await subscriptionService.getLatestForUser(userId);
    if (!sub) return false;

    const activeStatuses = new Set(['active', 'trialing']);
    if (!activeStatuses.has(sub.status)) return false;

    if (sub.currentPeriodEnd && sub.currentPeriodEnd.getTime() <= now.getTime()) return false;
    return true;
  },
};
