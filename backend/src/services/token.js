import { db, supabase } from '../models/db.js';
import { refreshTokens } from '../models/schema.js';
import { eq } from 'drizzle-orm';

export const tokenService = {
  async saveRefreshToken(userId, token) {
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await db.insert(refreshTokens).values({
      userId,
      token,
      expiresAt,
    });
  },

  async findRefreshToken(token) {
    const result = await db.select().from(refreshTokens).where(eq(refreshTokens.token, token));
    return result[0] || null;
  },

  async deleteRefreshToken(token) {
    await db.delete(refreshTokens).where(eq(refreshTokens.token, token));
  },

  async verifySupabaseToken(token) {
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data.user) return null;
    return data.user;
  }
};
