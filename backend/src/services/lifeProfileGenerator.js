/**
 * Life Profile 생성 서비스
 * profile(및 profile.saju) 기반으로 에너지 타입·강점·패턴·추천을 규칙 기반 생성
 */

const ENERGY_TYPES = [
  { type: '활동형 리듬', emoji: '🌊', desc: '오전 집중력이 높고 오후 회복 패턴을 보입니다.', strengths: ['집중력', '창의성', '리더십'], recs: ['오전에 중요한 작업을 계획하세요', '오후에는 휴식과 회복에 집중하세요', '규칙적인 수면 패턴을 유지하세요'], patterns: { morning: { energy: 85, focus: 90, emotion: 75 }, afternoon: { energy: 70, focus: 65, emotion: 80 }, evening: { energy: 60, focus: 55, emotion: 70 } } },
  { type: '안정형 리듬', emoji: '🌲', desc: '낮은 시간대에 에너지가 고르게 유지되는 패턴입니다.', strengths: ['꾸준함', '인내심', '협업'], recs: ['일정한 리듬으로 하루를 구성하세요', '충분한 휴식을 취하세요', '무리하지 않는 범위에서 목표를 세우세요'], patterns: { morning: { energy: 70, focus: 72, emotion: 75 }, afternoon: { energy: 72, focus: 70, emotion: 78 }, evening: { energy: 65, focus: 60, emotion: 70 } } },
  { type: '창의형 리듬', emoji: '✨', desc: '오후·저녁에 창의성과 영감이 높아지는 패턴입니다.', strengths: ['상상력', '직관', '예술성'], recs: ['창의 작업은 오후에 배치하세요', '새벽에 무리하지 마세요', '영감을 기록하는 습관을 들이세요'], patterns: { morning: { energy: 55, focus: 60, emotion: 65 }, afternoon: { energy: 78, focus: 82, emotion: 80 }, evening: { energy: 85, focus: 88, emotion: 82 } } },
  { type: '균형형 리듬', emoji: '⚖️', desc: '아침·낮·저녁이 고르게 분포된 균형 잡힌 패턴입니다.', strengths: ['적응력', '균형감', '조화'], recs: ['유연하게 일정을 조정하세요', '스트레스를 분산시키세요', '건강한 식습관을 유지하세요'], patterns: { morning: { energy: 72, focus: 70, emotion: 72 }, afternoon: { energy: 74, focus: 74, emotion: 75 }, evening: { energy: 70, focus: 68, emotion: 72 } } },
  { type: '야행형 리듬', emoji: '🦉', desc: '저녁 이후 집중력과 에너지가 올라가는 패턴입니다.', strengths: ['논리적 사고', '독립성', '심층 집중'], recs: ['중요한 사고 작업은 저녁에 하세요', '아침에는 가벼운 루틴만 권장합니다', '수면 시간을 일정하게 유지하세요'], patterns: { morning: { energy: 50, focus: 52, emotion: 58 }, afternoon: { energy: 65, focus: 68, emotion: 72 }, evening: { energy: 88, focus: 90, emotion: 85 } } },
];

/**
 * 간지 문자열(예: "경오년")에서 숫자 시드 추출 (일관된 선택용)
 */
function seedFromGapja(saju) {
  if (!saju || !saju.gapjaKorean) return 0;
  const g = saju.gapjaKorean;
  const str = [g.year, g.month, g.day].filter(Boolean).join('');
  let h = 0;
  for (let i = 0; i < str.length; i++) h = ((h << 5) - h) + str.charCodeAt(i) | 0;
  return Math.abs(h);
}

/**
 * profile(및 profile.saju)을 사용해 Life Profile 데이터 생성
 * @param {object} profile - profiles 테이블 행 (id, userId, birthDate, birthTime, gender, saju 등)
 * @returns {object} life_profiles에 저장할 lpData
 */
export function generateFromProfile(profile) {
  const seed = seedFromGapja(profile.saju || null);
  const idx = seed % ENERGY_TYPES.length;
  const t = ENERGY_TYPES[idx];

  return {
    userId: profile.userId,
    profileId: profile.id || profile.profileId,
    energyType: t.type,
    energyTypeEmoji: t.emoji,
    strengths: t.strengths,
    patterns: t.patterns,
    cycleDescription: t.desc,
    recommendations: t.recs,
    version: '1.0',
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}
