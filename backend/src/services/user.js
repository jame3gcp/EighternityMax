import { db } from '../models/db.js';
import { users } from '../models/schema.js';
import { eq, and } from 'drizzle-orm';

export const userService = {
  async findById(id) {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0] || null;
  },

  async findByProvider(provider, providerUserId) {
    const result = await db.select()
      .from(users)
      .where(and(eq(users.provider, provider), eq(users.providerUserId, providerUserId)));
    return result[0] || null;
  },

  async create(userData) {
    const result = await db.insert(users).values({
      role: 'user',
      ...userData,
      createdAt: new Date(userData.created_at || Date.now()),
      lastLoginAt: new Date(userData.last_login_at || Date.now()),
    }).returning();
    return result[0];
  },

  async updateLastLogin(id) {
    await db.update(users)
      .set({ lastLoginAt: new Date() })
      .where(eq(users.id, id));
  }
};
