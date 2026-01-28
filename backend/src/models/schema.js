import { pgTable, text, integer, timestamp, uniqueIndex, foreignKey, jsonb } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: text('id').primaryKey(),
  provider: text('provider').notNull(),
  providerUserId: text('provider_user_id').notNull(),
  email: text('email'),
  displayName: text('display_name'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  lastLoginAt: timestamp('last_login_at').defaultNow().notNull(),
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
