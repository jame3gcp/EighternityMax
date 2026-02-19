import { ApiError } from '../middleware/error.js';
import { db } from '../models/db.js';
import { payments } from '../models/schema.js';
import { subscriptionService } from '../services/subscription.js';

const PROVIDER = 'stripe';

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

const loadStripeSdk = async () => {
  try {
    const mod = await import('stripe');
    const Stripe = mod.default;
    return Stripe;
  } catch {
    return null;
  }
};

const constructStripeEvent = async (req) => {
  const rawBody = req.body;
  if (!rawBody || !(rawBody instanceof Buffer)) {
    throw new ApiError(400, 'Webhook expects raw request body (Buffer)');
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    try {
      return JSON.parse(rawBody.toString('utf8'));
    } catch {
      throw new ApiError(400, 'Invalid JSON body');
    }
  }

  const sig = req.headers['stripe-signature'];
  if (!sig) throw new ApiError(400, 'Missing Stripe-Signature header');

  const Stripe = await loadStripeSdk();
  if (!Stripe) {
    throw new ApiError(500, 'Stripe SDK is required for signature verification. Install "stripe" dependency.');
  }
  const apiKey = process.env.STRIPE_SECRET_KEY || process.env.STRIPE_API_KEY;
  if (!apiKey) {
    throw new ApiError(500, 'Missing STRIPE_SECRET_KEY (required to initialize Stripe SDK)');
  }

  const stripe = new Stripe(apiKey, { apiVersion: '2023-10-16' });
  try {
    return stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (err) {
    throw new ApiError(400, `Invalid Stripe signature: ${err?.message || 'unknown error'}`);
  }
};

const upsertPayment = async ({
  providerPaymentId,
  userId,
  subscriptionId,
  amountCents,
  currency,
  status,
  paidAt,
  metadata,
}) => {
  if (!providerPaymentId) return null;
  if (!userId) {
    console.warn('[webhook] Unmapped payment (missing userId). providerPaymentId=', providerPaymentId);
    return null;
  }

  const now = new Date();
  const set = {
    userId,
    amountCents,
    currency,
    status,
    paidAt,
    metadata,
  };
  if (subscriptionId != null) set.subscriptionId = subscriptionId;

  const inserted = await db.insert(payments)
    .values({
      id: randomId('pay'),
      userId,
      subscriptionId: subscriptionId ?? null,
      provider: PROVIDER,
      providerPaymentId,
      amountCents,
      currency,
      status,
      paidAt,
      metadata,
      createdAt: now,
    })
    .onConflictDoUpdate({
      target: [payments.provider, payments.providerPaymentId],
      set,
    })
    .returning({ id: payments.id });
  return inserted?.[0]?.id || null;
};

const handleInvoicePaid = async (invoice, event) => {
  const providerSubscriptionId = invoice?.subscription ? String(invoice.subscription) : null;
  const internalSub = providerSubscriptionId
    ? await subscriptionService.resolveByProviderSubscriptionId(PROVIDER, providerSubscriptionId)
    : null;

  const metadata = invoice?.metadata || {};
  const userId = pickMetadataValue(metadata, ['user_id', 'userId']) || internalSub?.userId || null;

  const providerPaymentId = invoice?.payment_intent
    ? String(invoice.payment_intent)
    : (invoice?.id ? String(invoice.id) : null);

  const amountCents = Number(invoice?.amount_paid ?? invoice?.amount_due ?? 0);
  const currency = (invoice?.currency || 'krw').toUpperCase();
  const paidAt = toDateFromUnixSeconds(invoice?.status_transitions?.paid_at) || toDateFromUnixSeconds(event?.created) || new Date();

  return upsertPayment({
    providerPaymentId,
    userId,
    subscriptionId: internalSub?.id ?? null,
    amountCents,
    currency,
    status: 'paid',
    paidAt,
    metadata: {
      stripeEventId: event?.id,
      stripeEventType: event?.type,
      stripeInvoiceId: invoice?.id,
      stripeSubscriptionId: providerSubscriptionId,
      stripeCustomerId: invoice?.customer ? String(invoice.customer) : null,
    },
  });
};

const handlePaymentIntentSucceeded = async (paymentIntent, event) => {
  const metadata = paymentIntent?.metadata || {};
  const userId = pickMetadataValue(metadata, ['user_id', 'userId']);

  const providerPaymentId = paymentIntent?.id ? String(paymentIntent.id) : null;
  const amountCents = Number(paymentIntent?.amount_received ?? paymentIntent?.amount ?? 0);
  const currency = (paymentIntent?.currency || 'krw').toUpperCase();
  const paidAt = toDateFromUnixSeconds(paymentIntent?.created) || toDateFromUnixSeconds(event?.created) || new Date();

  const providerSubscriptionId = pickMetadataValue(metadata, [
    'subscription_id',
    'provider_subscription_id',
    'stripe_subscription_id',
  ]);
  const internalSub = providerSubscriptionId
    ? await subscriptionService.resolveByProviderSubscriptionId(PROVIDER, providerSubscriptionId)
    : null;

  return upsertPayment({
    providerPaymentId,
    userId: userId || internalSub?.userId || null,
    subscriptionId: internalSub?.id ?? null,
    amountCents,
    currency,
    status: 'paid',
    paidAt,
    metadata: {
      stripeEventId: event?.id,
      stripeEventType: event?.type,
      stripePaymentIntentId: paymentIntent?.id,
      stripeInvoiceId: paymentIntent?.invoice?.id ? String(paymentIntent.invoice.id) : null,
      stripeCustomerId: paymentIntent?.customer ? String(paymentIntent.customer) : null,
    },
  });
};

export const webhookController = {
  async handleStripe(req, res, next) {
    try {
      const event = await constructStripeEvent(req);
      const type = event?.type;
      const obj = event?.data?.object;

      if (!type) throw new ApiError(400, 'Missing event type');

      if (type === 'customer.subscription.created' || type === 'customer.subscription.updated' || type === 'customer.subscription.deleted') {
        await subscriptionService.upsertFromStripe(obj, { eventId: event?.id });
      } else if (type === 'invoice.paid') {
        await handleInvoicePaid(obj, event);
      } else if (type === 'payment_intent.succeeded') {
        await handlePaymentIntentSucceeded(obj, event);
      } else {
        if (process.env.NODE_ENV !== 'production') {
          console.log('[webhook] Ignored Stripe event type:', type);
        }
      }

      return res.status(200).json({ received: true });
    } catch (err) {
      next(err);
    }
  },
};
