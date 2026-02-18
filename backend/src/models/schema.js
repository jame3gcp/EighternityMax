import { pgTable, text, integer, timestamp, uniqueIndex, index, jsonb } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: text('id').primaryKey(),
  provider: text('provider').notNull(),
  providerUserId: text('provider_user_id').notNull(),
  email: text('email'),
  displayName: text('display_name'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  lastLoginAt: timestamp('last_login_at').defaultNow().notNull(),
  /** 개인정보 수집·이용 동의 시각. null이면 미동의 → 서비스 메뉴 접근 불가 */
  privacyConsentAt: timestamp('privacy_consent_at'),
}, (table) => ({
  providerIdx: uniqueIndex('provider_idx').on(table.provider, table.providerUserId),
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
