import { db } from '../models/db.js';
import { eq, and, desc, sql, inArray } from 'drizzle-orm';
import { ApiError } from '../middleware/error.js';
import {
  gameScores,
  users,
  profiles,
  rankingSettings,
} from '../models/schema.js';

const VALID_GAME_IDS = ['wave', 'snake', 'balance', 'flow-connect'];
const DEFAULT_WEEK_START_DAY = 1; // 1 = Monday (ISO)

/** ISO 8601 주차 문자열 반환 (월요일 시작). e.g. 2025-W08 */
export function getISOWeekKey(date = new Date()) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d.setDate(diff));
  const year = monday.getFullYear();
  const startOfYear = new Date(year, 0, 1);
  const weekNum = Math.ceil((((monday.getTime() - startOfYear.getTime()) / 86400000) + startOfYear.getDay() + 1) / 7);
  return `${year}-W${String(weekNum).padStart(2, '0')}`;
}

/** 설정에서 주차 시작 요일 가져오기 (0=일~6=토). 기본 1(월) = ISO */
async function getWeekStartDay() {
  const row = await db.query.rankingSettings.findFirst({
    where: eq(rankingSettings.key, 'week_start_day'),
  });
  if (!row || row.value == null) return DEFAULT_WEEK_START_DAY;
  const v = Number(row.value);
  return Number.isFinite(v) && v >= 0 && v <= 6 ? v : DEFAULT_WEEK_START_DAY;
}

/** 현재 사용할 week_key (설정에 따라 커스텀 또는 ISO). 현재는 ISO만 사용 */
export async function getWeekKey(date = new Date()) {
  const startDay = await getWeekStartDay();
  if (startDay === 1) return getISOWeekKey(date);
  // 커스텀 요일: 해당 요일을 포함한 주의 시작일 기준 주차 계산
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  const diff = day - startDay + (day < startDay ? 7 : 0);
  const weekStart = new Date(d);
  weekStart.setDate(d.getDate() - diff);
  return getISOWeekKey(weekStart);
}

/** 게임별 랭킹 활성화 여부. 설정 없으면 모두 true */
export async function getGamesEnabled() {
  const row = await db.query.rankingSettings.findFirst({
    where: eq(rankingSettings.key, 'games_enabled'),
  });
  if (!row || !row.value || typeof row.value !== 'object') {
    return Object.fromEntries(VALID_GAME_IDS.map((id) => [id, true]));
  }
  return { ...Object.fromEntries(VALID_GAME_IDS.map((id) => [id, true])), ...row.value };
}

/** userId 목록에 대해 표시 이름 맵 반환 (프로필 닉네임 우선, 없으면 displayName) */
async function getDisplayNamesMap(userIds) {
  if (userIds.length === 0) return {};
  const uniq = [...new Set(userIds)];
  const usersList = await db.select({ id: users.id, displayName: users.displayName }).from(users).where(inArray(users.id, uniq));
  const profilesList = await db
    .select({ userId: profiles.userId, nickname: profiles.nickname })
    .from(profiles)
    .where(inArray(profiles.userId, uniq));
  const nickByUser = Object.fromEntries(profilesList.map((p) => [p.userId, p.nickname]).filter(([, n]) => n != null && n !== ''));
  const map = {};
  usersList.forEach((u) => {
    map[u.id] = nickByUser[u.id] || u.displayName || '플레이어';
  });
  return map;
}

export const gameScoresController = {
  /** POST /v1/users/me/game-scores — 점수 제출 */
  async submit(req, res, next) {
    try {
      const userId = req.userId;
      if (!userId) throw new ApiError(401, 'Unauthorized');

      const { gameId, score, metadata } = req.body || {};
      if (!gameId || typeof score !== 'number' || Number.isNaN(score) || score < 0) {
        throw new ApiError(400, 'gameId and non-negative score are required');
      }
      if (!VALID_GAME_IDS.includes(gameId)) {
        throw new ApiError(400, `Invalid gameId. Allowed: ${VALID_GAME_IDS.join(', ')}`);
      }

      const gamesEnabled = await getGamesEnabled();
      if (!gamesEnabled[gameId]) throw new ApiError(400, 'Ranking is disabled for this game');

      const userExists = await db.query.users.findFirst({ where: eq(users.id, userId), columns: { id: true } });
      if (!userExists) throw new ApiError(404, 'User not found');

      const weekKey = await getWeekKey();

      const existing = await db.query.gameScores.findFirst({
        where: and(
          eq(gameScores.userId, userId),
          eq(gameScores.gameId, gameId),
          eq(gameScores.weekKey, weekKey)
        ),
      });

      const id = existing ? existing.id : `gs_${userId}_${gameId}_${weekKey}_${Date.now()}`;
      const now = new Date();

      if (existing) {
        if (score <= existing.score) {
          return res.status(200).json({
            weekKey,
            score: existing.score,
            updated: false,
            message: '기존 기록이 더 높습니다.',
          });
        }
        await db
          .update(gameScores)
          .set({ score, metadata: metadata || null, updatedAt: now })
          .where(eq(gameScores.id, existing.id));
      } else {
        await db.insert(gameScores).values({
          id,
          userId,
          gameId,
          weekKey,
          score,
          metadata: metadata || null,
          updatedAt: now,
        });
      }

      res.status(200).json({
        weekKey,
        score,
        updated: true,
      });
    } catch (err) {
      const code = err.code ?? err.cause?.code;
      if (code === '23503') {
        return next(new ApiError(400, 'User not found. 게임 점수를 저장할 수 없습니다.'));
      }
      next(err);
    }
  },

  /** GET /v1/users/me/game-scores/rankings?gameId=wave&weekKey=2025-W08&limit=20 */
  async getRanking(req, res, next) {
    try {
      const userId = req.userId;
      if (!userId) throw new ApiError(401, 'Unauthorized');

      const { gameId, weekKey: queryWeekKey, limit: limitStr } = req.query;
      if (!gameId || !VALID_GAME_IDS.includes(gameId)) {
        throw new ApiError(400, `gameId required. Allowed: ${VALID_GAME_IDS.join(', ')}`);
      }

      const gamesEnabled = await getGamesEnabled();
      if (!gamesEnabled[gameId]) throw new ApiError(400, 'Ranking is disabled for this game');

      const weekKey = queryWeekKey && String(queryWeekKey).match(/^\d{4}-W\d{2}$/) ? queryWeekKey : await getWeekKey();
      const limit = Math.min(Math.max(parseInt(limitStr, 10) || 20, 1), 100);

      const rows = await db
        .select({ userId: gameScores.userId, score: gameScores.score })
        .from(gameScores)
        .where(and(eq(gameScores.gameId, gameId), eq(gameScores.weekKey, weekKey)))
        .orderBy(desc(gameScores.score))
        .limit(limit);

      const userIds = rows.map((r) => r.userId);
      const displayNames = await getDisplayNamesMap(userIds);

      const list = rows.map((r, i) => ({
        rank: i + 1,
        userId: r.userId,
        displayName: displayNames[r.userId] || '플레이어',
        score: r.score,
      }));

      const myIndex = list.findIndex((r) => r.userId === userId);
      const myRank = myIndex >= 0 ? myIndex + 1 : null;
      const myScoreRow = myIndex >= 0 ? list[myIndex] : null;
      const totalCount = await db
        .select({ count: sql`count(*)` })
        .from(gameScores)
        .where(and(eq(gameScores.gameId, gameId), eq(gameScores.weekKey, weekKey)));
      const total = Number(totalCount[0]?.count ?? 0);

      res.json({
        weekKey,
        gameId,
        list,
        myRank: myRank ?? undefined,
        myScore: myScoreRow?.score ?? undefined,
        total,
      });
    } catch (err) {
      next(err);
    }
  },

  /** GET /v1/users/me/game-scores/rankings/all?weekKey=2025-W08&limit=20 — 종합 랭킹 (게임별 순위 점수 합산) */
  async getRankingAll(req, res, next) {
    try {
      const userId = req.userId;
      if (!userId) throw new ApiError(401, 'Unauthorized');

      const { weekKey: queryWeekKey, limit: limitStr } = req.query;
      const weekKey = queryWeekKey && String(queryWeekKey).match(/^\d{4}-W\d{2}$/) ? queryWeekKey : await getWeekKey();
      const limit = Math.min(Math.max(parseInt(limitStr, 10) || 20, 1), 100);

      const gamesEnabled = await getGamesEnabled();
      const enabledGames = VALID_GAME_IDS.filter((id) => gamesEnabled[id]);
      if (enabledGames.length === 0) {
        return res.json({ weekKey, list: [], myRank: undefined, total: 0 });
      }

      const pointsMap = {};
      for (const gameId of enabledGames) {
        const rows = await db
          .select({ userId: gameScores.userId, score: gameScores.score })
          .from(gameScores)
          .where(and(eq(gameScores.gameId, gameId), eq(gameScores.weekKey, weekKey)))
          .orderBy(desc(gameScores.score));

        const maxRank = rows.length;
        rows.forEach((r, i) => {
          const rank = i + 1;
          const point = maxRank - rank + 1;
          pointsMap[r.userId] = (pointsMap[r.userId] || 0) + point;
        });
      }

      const sorted = Object.entries(pointsMap)
        .map(([uid, points]) => ({ userId: uid, points }))
        .sort((a, b) => b.points - a.points)
        .slice(0, limit);

      const userIds = sorted.map((s) => s.userId);
      const displayNames = await getDisplayNamesMap(userIds);

      const list = sorted.map((s, i) => ({
        rank: i + 1,
        userId: s.userId,
        displayName: displayNames[s.userId] || '플레이어',
        points: s.points,
      }));

      const myIndex = list.findIndex((r) => r.userId === userId);
      const myRank = myIndex >= 0 ? myIndex + 1 : undefined;
      const total = Object.keys(pointsMap).length;

      res.json({
        weekKey,
        list,
        myRank,
        total,
      });
    } catch (err) {
      next(err);
    }
  },
};
