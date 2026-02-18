import express from 'express';
import { eq } from 'drizzle-orm';
import { db } from '../models/db.js';
import { users } from '../models/schema.js';
import { authenticate } from '../middleware/auth.js';
import { userController } from '../controllers/user.js';

const router = express.Router();

/** 현재 로그인 사용자의 내부 ID (개발: req.userId, 프로덕션: DB 조회) */
async function getCurrentInternalId(req) {
  if (req.userId) return req.userId;
  return await userController.getInternalUserId(req.supabaseId);
}

router.get('/users/me', authenticate, async (req, res, next) => {
  try {
    const internalId = await getCurrentInternalId(req);
    if (!internalId) return res.status(404).json({ error: 'User not found' });
    const [user] = await db.select().from(users).where(eq(users.id, internalId));
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({
      id: user.id,
      name: user.displayName ?? user.email,
      display_name: user.displayName,
      email: user.email,
      created_at: user.createdAt,
      provider: user.provider,
    });
  } catch (e) {
    next(e);
  }
});

/** 개인정보(이름·이메일) 수정 — 마이페이지 "정보 업데이트"에서 사용 */
router.put('/users/:id', authenticate, async (req, res, next) => {
  try {
    const internalId = await getCurrentInternalId(req);
    if (!internalId) return res.status(404).json({ error: 'User not found' });
    if (internalId !== req.params.id) {
      return res.status(403).json({ error: 'Forbidden', message: '본인만 수정할 수 있습니다.' });
    }
    const { name } = req.body;
    const updates = {};
    if (name !== undefined) updates.displayName = name;
    // 이메일은 OAuth 제공처 기준 읽기 전용 — 수정 불가
    if (Object.keys(updates).length === 0) {
      const [user] = await db.select().from(users).where(eq(users.id, req.params.id));
      if (!user) return res.status(404).json({ error: 'User not found' });
      return res.json({
        id: user.id,
        name: user.displayName ?? user.email,
        display_name: user.displayName,
        email: user.email,
        created_at: user.createdAt,
        provider: user.provider,
      });
    }
    await db.update(users).set(updates).where(eq(users.id, req.params.id));
    const [updated] = await db.select().from(users).where(eq(users.id, req.params.id));
    if (!updated) return res.status(404).json({ error: 'User not found' });
    res.json({
      id: updated.id,
      name: updated.displayName ?? updated.email,
      display_name: updated.displayName,
      email: updated.email,
      created_at: updated.createdAt,
      provider: updated.provider,
    });
  } catch (error) {
    next(error);
  }
});

router.get('/cycles', (req, res) => {
  const { period = 'day' } = req.query;
  const userId = req.query.userId || 'user-1';

  const now = new Date();
  const hours = now.getHours();
  const currentPhase = Math.floor((hours / 24) * 8) % 8;

  const phaseNames = [
    '새벽 (Dawn)', '상승 (Rising)', '정점 (Peak)', '유지 (Sustained)',
    '하강 (Declining)', '저점 (Low)', '회복 (Recovery)', '준비 (Preparation)',
  ];

  const phaseColors = [
    '#6366f1', '#8b5cf6', '#ec4899', '#f59e0b',
    '#f97316', '#ef4444', '#10b981', '#06b6d4',
  ];

  const phases = phaseNames.map((name, index) => {
    const baseEnergy = 50 + Math.sin((index / phaseNames.length) * Math.PI * 2) * 30;
    const baseEmotion = 50 + Math.cos((index / phaseNames.length) * Math.PI * 2) * 30;
    const baseFocus = 50 + Math.sin((index / phaseNames.length) * Math.PI * 2 + Math.PI / 4) * 30;

    return {
      id: index,
      name,
      energy: Math.max(0, Math.min(100, baseEnergy + (index === currentPhase ? 10 : 0))),
      emotion: Math.max(0, Math.min(100, baseEmotion + (index === currentPhase ? 10 : 0))),
      focus: Math.max(0, Math.min(100, baseFocus + (index === currentPhase ? 10 : 0))),
      description: `${name} 단계입니다.`,
      recommendations: [
        `${name} 단계에 맞는 활동을 추천합니다.`,
        '충분한 휴식을 취하세요.',
        '규칙적인 생활 패턴을 유지하세요.',
      ],
      warnings: ['과도한 활동은 피하세요.', '스트레스를 관리하세요.'],
      color: phaseColors[index],
    };
  });

  res.json({
    userId,
    period,
    currentPhase,
    phases,
    timestamp: Date.now(),
  });
});

router.get('/records', (req, res) => {
  const { userId, limit } = req.query;
  const records = db.prepare('SELECT * FROM records WHERE user_id = ? ORDER BY timestamp DESC').all(userId);
  
  const result = limit ? records.slice(0, parseInt(limit, 10)) : records;
  res.json(result);
});

router.post('/records', (req, res) => {
  const newRecord = {
    id: `record-${Date.now()}`,
    ...req.body,
    timestamp: Date.now(),
  };
  db.prepare(`
    INSERT INTO records (id, user_id, date, energy, emotion, focus, memo, timestamp)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(newRecord.id, newRecord.userId, newRecord.date, newRecord.energy, newRecord.emotion, newRecord.focus, newRecord.memo, newRecord.timestamp);
  res.status(201).json(newRecord);
});

router.put('/records/:id', (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
  const values = Object.values(updates);
  
  db.prepare(`UPDATE records SET ${fields} WHERE id = ?`).run(...values, id);
  res.json({ id, ...updates });
});

router.delete('/records/:id', (req, res) => {
  db.prepare('DELETE FROM records WHERE id = ?').run(req.params.id);
  res.status(204).send();
});

router.get('/interpretations/:phaseId', (req, res) => {
  const phaseId = parseInt(req.params.phaseId, 10);
  const phaseNames = [
    '새벽 (Dawn)', '상승 (Rising)', '정점 (Peak)', '유지 (Sustained)',
    '하강 (Declining)', '저점 (Low)', '회복 (Recovery)', '준비 (Preparation)',
  ];

  const phase = phaseNames[phaseId] || phaseNames[0];
  const nextPhaseId = (phaseId + 1) % phaseNames.length;
  const nextPhase = phaseNames[nextPhaseId];

  res.json({
    phaseId,
    title: `${phase} 단계 해석`,
    description: `현재 ${phase} 단계에 있습니다. 이 단계는 사이클의 중요한 전환점입니다.`,
    recommendations: [
      '규칙적인 수면 패턴 유지',
      '적절한 운동과 휴식의 균형',
      '명상이나 호흡 운동 실천',
    ],
    warnings: ['과도한 스트레스 피하기', '충분한 수분 섭취'],
    nextPhase,
    nextPhaseId,
  });
});

export default router;
