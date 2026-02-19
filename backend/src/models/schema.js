import { pgTable, text, integer, boolean, timestamp, uniqueIndex, index, jsonb } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const users = pgTable('users', {
  id: text('id').primaryKey(),
  provider: text('provider').notNull(),
  providerUserId: text('provider_user_id').notNull(),
  email: text('email'),
  displayName: text('display_name'),
  role: text('role').notNull().default('user'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  lastLoginAt: timestamp('last_login_at').defaultNow().notNull(),
  /** 개인정보 수집·이용 동의 시각. null이면 미동의 → 서비스 메뉴 접근 불가 */
  privacyConsentAt: timestamp('privacy_consent_at'),
}, (table) => ({
  providerIdx: uniqueIndex('provider_idx').on(table.provider, table.providerUserId),
}));

export const usersRelations = relations(users, ({ many }) => ({
  payments: many(payments),
  subscriptions: many(subscriptions),
  aiUsageLogs: many(aiUsageLogs),
  profiles: many(profiles),
  lifeProfiles: many(lifeProfiles),
  records: many(records),
  sajuAnalyses: many(sajuAnalyses),
  luckyNumberDraws: many(luckyNumberDraws),
  guides: many(guides),
  adminAuditLogs: many(adminAuditLogs),
  gameScores: many(gameScores),
}));

export const plans = pgTable('plans', {
  id: text('id').primaryKey(),
  code: text('code').notNull(),
  name: text('name').notNull(),
  description: text('description'),
  priceCents: integer('price_cents').notNull().default(0),
  currency: text('currency').notNull().default('KRW'),
  interval: text('interval').notNull().default('month'),
  isActive: boolean('is_active').notNull().default(true),
  features: jsonb('features'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  codeUnique: uniqueIndex('plans_code_idx').on(table.code),
  activeIdx: index('plans_active_idx').on(table.isActive),
}));

export const subscriptions = pgTable('subscriptions', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  planId: text('plan_id').notNull().references(() => plans.id),
  status: text('status').notNull(),
  provider: text('provider').notNull().default('manual'),
  providerSubscriptionId: text('provider_subscription_id'),
  currentPeriodStart: timestamp('current_period_start'),
  currentPeriodEnd: timestamp('current_period_end'),
  cancelAtPeriodEnd: boolean('cancel_at_period_end').notNull().default(false),
  canceledAt: timestamp('canceled_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  userIdx: index('subscriptions_user_idx').on(table.userId),
  statusIdx: index('subscriptions_status_idx').on(table.status),
  providerSubIdUnique: uniqueIndex('subscriptions_provider_sub_id_idx').on(table.provider, table.providerSubscriptionId),
}));

export const subscriptionsRelations = relations(subscriptions, ({ one }) => ({
  user: one(users, { fields: [subscriptions.userId], references: [users.id] }),
  plan: one(plans, { fields: [subscriptions.planId], references: [plans.id] }),
}));

export const payments = pgTable('payments', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  subscriptionId: text('subscription_id').references(() => subscriptions.id, { onDelete: 'set null' }),
  provider: text('provider').notNull().default('manual'),
  providerPaymentId: text('provider_payment_id'),
  amountCents: integer('amount_cents').notNull(),
  currency: text('currency').notNull().default('KRW'),
  status: text('status').notNull(),
  paidAt: timestamp('paid_at'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  userCreatedIdx: index('payments_user_created_idx').on(table.userId, table.createdAt),
  providerPayIdUnique: uniqueIndex('payments_provider_pay_id_idx').on(table.provider, table.providerPaymentId),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  user: one(users, { fields: [payments.userId], references: [users.id] }),
  subscription: one(subscriptions, { fields: [payments.subscriptionId], references: [subscriptions.id] }),
}));

export const aiUsageLogs = pgTable('ai_usage_logs', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  feature: text('feature').notNull(),
  model: text('model'),
  promptTokens: integer('prompt_tokens').notNull().default(0),
  completionTokens: integer('completion_tokens').notNull().default(0),
  totalTokens: integer('total_tokens').notNull().default(0),
  costCents: integer('cost_cents').notNull().default(0),
  requestId: text('request_id'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  userCreatedIdx: index('ai_usage_logs_user_created_idx').on(table.userId, table.createdAt),
  featureIdx: index('ai_usage_logs_feature_idx').on(table.feature),
}));

export const aiUsageLogsRelations = relations(aiUsageLogs, ({ one }) => ({
  user: one(users, { fields: [aiUsageLogs.userId], references: [users.id] }),
}));


export const refreshTokens = pgTable('refresh_tokens', {
  id: integer('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  token: text('token').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
});

export const profiles = pgTable('profiles', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  birthDate: text('birth_date').notNull(),
  birthTime: text('birth_time'),
  gender: text('gender').notNull(),
  region: text('region'),
  /** 랭킹 등 표시용 닉네임 */
  nickname: text('nickname'),
  /** 만세력/명리학 변환 결과 (음력, 간지 등). 다른 기능의 기본정보로 활용 */
  saju: jsonb('saju'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const lifeProfiles = pgTable('life_profiles', {
  userId: text('user_id').primaryKey().references(() => users.id, { onDelete: 'cascade' }),
  profileId: text('profile_id').notNull().references(() => profiles.id),
  energyType: text('energy_type'),
  energyTypeEmoji: text('energy_type_emoji'),
  strengths: jsonb('strengths'),
  patterns: jsonb('patterns'),
  cycleDescription: text('cycle_description'),
  recommendations: jsonb('recommendations'),
  version: text('version'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const jobs = pgTable('jobs', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  profileId: text('profile_id').notNull(),
  status: text('status').notNull(),
  progress: integer('progress').default(0),
  options: jsonb('options'),
  resultRef: text('result_ref'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  completedAt: timestamp('completed_at'),
});

export const records = pgTable('records', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  date: text('date').notNull(),
  energy: integer('energy'),
  emotion: integer('emotion'),
  focus: integer('focus'),
  memo: text('memo'),
  timestamp: timestamp('timestamp').defaultNow().notNull(),
});

/** ChatGPT 사주 상세 분석 결과 (프로필 저장 시 자동 생성, 동일 사주는 재사용) */
export const sajuAnalyses = pgTable('saju_analyses', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  profileId: text('profile_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  sajuSignature: text('saju_signature').notNull(),
  inputSaju: jsonb('input_saju'),
  analysis: jsonb('analysis'),
  model: text('model'),
  promptVersion: text('prompt_version'),
  status: text('status').notNull(), // 'queued' | 'done' | 'failed'
  errorMessage: text('error_message'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  profileSignatureUnique: uniqueIndex('saju_analyses_profile_signature_idx').on(table.profileId, table.sajuSignature),
  userUpdatedIdx: index('saju_analyses_user_updated_idx').on(table.userId, table.updatedAt),
}));

/** 행운 번호 추천: 사용자·날짜당 1회만 저장 (1일 1회 제한) */
export const luckyNumberDraws = pgTable('lucky_number_draws', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  date: text('date').notNull(),
  type: text('type').notNull(),
  numbers: jsonb('numbers').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  userDateUnique: uniqueIndex('lucky_number_draws_user_date_idx').on(table.userId, table.date),
}));

export const guides = pgTable('guides', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  content: text('content').notNull(),
  category: text('category').notNull(),
  tags: jsonb('tags'),
  isPublished: boolean('is_published').notNull().default(false),
  authorId: text('author_id').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  categoryIdx: index('guides_category_idx').on(table.category),
  publishedIdx: index('guides_published_idx').on(table.isPublished),
}));

export const energySpots = pgTable('energy_spots', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  lat: text('lat').notNull(),
  lng: text('lng').notNull(),
  purpose: text('purpose').notNull(),
  address: text('address'),
  metadata: jsonb('metadata'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  purposeIdx: index('energy_spots_purpose_idx').on(table.purpose),
  activeIdx: index('energy_spots_active_idx').on(table.isActive),
}));

export const coupons = pgTable('coupons', {
  id: text('id').primaryKey(),
  code: text('code').notNull(),
  discountPercent: integer('discount_percent'),
  discountAmountCents: integer('discount_amount_cents'),
  currency: text('currency').default('KRW'),
  expiresAt: timestamp('expires_at'),
  maxRedemptions: integer('max_redemptions'),
  timesRedeemed: integer('times_redeemed').default(0),
  isActive: boolean('is_active').default(true),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  codeUnique: uniqueIndex('coupons_code_idx').on(table.code),
}));

export const adminAuditLogs = pgTable('admin_audit_logs', {
  id: text('id').primaryKey(),
  adminId: text('admin_id').notNull().references(() => users.id),
  action: text('action').notNull(),
  targetType: text('target_type').notNull(),
  targetId: text('target_id'),
  before: jsonb('before'),
  after: jsonb('after'),
  reason: text('reason'),
  ipAddress: text('ip_address'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  adminIdx: index('admin_audit_logs_admin_idx').on(table.adminId),
  actionIdx: index('admin_audit_logs_action_idx').on(table.action),
  targetIdx: index('admin_audit_logs_target_idx').on(table.targetType, table.targetId),
}));

export const adminAuditLogsRelations = relations(adminAuditLogs, ({ one }) => ({
  admin: one(users, { fields: [adminAuditLogs.adminId], references: [users.id] }),
}));

export const userActivities = pgTable('user_activities', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id, { onDelete: 'set null' }),
  type: text('type').notNull(),
  path: text('path').notNull(),
  durationMs: integer('duration_ms').default(0),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  userIdx: index('user_activities_user_idx').on(table.userId),
  typeIdx: index('user_activities_type_idx').on(table.type),
  pathIdx: index('user_activities_path_idx').on(table.path),
  createdIdx: index('user_activities_created_idx').on(table.createdAt),
}));

export const userActivitiesRelations = relations(userActivities, ({ one }) => ({
  user: one(users, { fields: [userActivities.userId], references: [users.id] }),
}));

/** 주간 게임 점수 (user_id, game_id, week_key당 최고 점수 1건) */
export const gameScores = pgTable('game_scores', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  gameId: text('game_id').notNull(),
  weekKey: text('week_key').notNull(),
  score: integer('score').notNull(),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  userGameWeekUnique: uniqueIndex('game_scores_user_game_week_idx').on(table.userId, table.gameId, table.weekKey),
  gameWeekScoreIdx: index('game_scores_game_week_score_idx').on(table.gameId, table.weekKey, table.score),
}));

export const gameScoresRelations = relations(gameScores, ({ one }) => ({
  user: one(users, { fields: [gameScores.userId], references: [users.id] }),
}));

/** 랭킹 설정: week_start_day(0=일~6=토), 게임별 enabled */
export const rankingSettings = pgTable('ranking_settings', {
  key: text('key').primaryKey(),
  value: jsonb('value').notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const profilesRelations = relations(profiles, ({ one, many }) => ({
  user: one(users, { fields: [profiles.userId], references: [users.id] }),
  lifeProfile: one(lifeProfiles, { fields: [profiles.id], references: [lifeProfiles.profileId] }),
  sajuAnalyses: many(sajuAnalyses),
}));

export const lifeProfilesRelations = relations(lifeProfiles, ({ one }) => ({
  user: one(users, { fields: [lifeProfiles.userId], references: [users.id] }),
  profile: one(profiles, { fields: [lifeProfiles.profileId], references: [profiles.id] }),
}));

export const recordsRelations = relations(records, ({ one }) => ({
  user: one(users, { fields: [records.userId], references: [users.id] }),
}));

export const sajuAnalysesRelations = relations(sajuAnalyses, ({ one }) => ({
  user: one(users, { fields: [sajuAnalyses.userId], references: [users.id] }),
  profile: one(profiles, { fields: [sajuAnalyses.profileId], references: [profiles.id] }),
}));

export const guidesRelations = relations(guides, ({ one }) => ({
  author: one(users, { fields: [guides.authorId], references: [users.id] }),
}));
