/**
 * Life Profile 생성 서비스
 * profile.saju + (선택) sajuAnalysis 기반으로 에너지 타입·5 Elements·청사진·에너지 특성·종합분석 생성
 */

const OHANG_KO = ['목', '화', '토', '금', '수'];

/** 오행 인덱스(0~4) → 5 Energy Elements 메타 */
const ELEMENT_META = [
  { id: 'growth', name: 'Growth', korean: '성장', icon: '🌱', color: '#22c55e', description: '확장, 창의성, 새로운 시작을 추구하는 에너지', traits: ['창의적 사고', '성장 지향', '도전 정신'] },
  { id: 'vitality', name: 'Vitality', korean: '활력', icon: '🔥', color: '#ef4444', description: '열정, 표현력, 활동적인 에너지', traits: ['열정적', '표현력', '리더십'] },
  { id: 'stability', name: 'Stability', korean: '안정', icon: '⛰️', color: '#f59e0b', description: '균형, 중심, 신뢰를 형성하는 에너지', traits: ['신뢰감', '일관성', '중재력'] },
  { id: 'clarity', name: 'Clarity', korean: '명확', icon: '💎', color: '#6366f1', description: '결단력, 집중력, 완성을 이끄는 에너지', traits: ['결단력', '분석력', '완결성'] },
  { id: 'flow', name: 'Flow', korean: '유연', icon: '💧', color: '#0ea5e9', description: '적응력, 지혜, 회복을 담당하는 에너지', traits: ['적응력', '통찰력', '회복력'] },
];

/** 에너지 특성 6가지 메타 (십성·AI 보조) */
const TRAIT_META = [
  { id: 'self-expression', name: 'Self Expression', korean: '자기표현', icon: '🎯' },
  { id: 'resource-management', name: 'Resource Management', korean: '자원관리', icon: '💰' },
  { id: 'achievement-drive', name: 'Achievement Drive', korean: '성취동력', icon: '🏆' },
  { id: 'relationship-harmony', name: 'Relationship Harmony', korean: '관계조화', icon: '🤝' },
  { id: 'creative-insight', name: 'Creative Insight', korean: '창의통찰', icon: '💡' },
  { id: 'adaptive-resilience', name: 'Adaptive Resilience', korean: '적응회복', icon: '🔄' },
];

const ENERGY_TYPES = [
  { type: '활동형 리듬', emoji: '🌊', desc: '오전 집중력이 높고 오후 회복 패턴을 보입니다.', strengths: ['집중력', '창의성', '리더십'], recs: ['오전에 중요한 작업을 계획하세요', '오후에는 휴식과 회복에 집중하세요', '규칙적인 수면 패턴을 유지하세요'], patterns: { morning: { energy: 85, focus: 90, emotion: 75 }, afternoon: { energy: 70, focus: 65, emotion: 80 }, evening: { energy: 60, focus: 55, emotion: 70 } } },
  { type: '안정형 리듬', emoji: '🌲', desc: '낮은 시간대에 에너지가 고르게 유지되는 패턴입니다.', strengths: ['꾸준함', '인내심', '협업'], recs: ['일정한 리듬으로 하루를 구성하세요', '충분한 휴식을 취하세요', '무리하지 않는 범위에서 목표를 세우세요'], patterns: { morning: { energy: 70, focus: 72, emotion: 75 }, afternoon: { energy: 72, focus: 70, emotion: 78 }, evening: { energy: 65, focus: 60, emotion: 70 } } },
  { type: '창의형 리듬', emoji: '✨', desc: '오후·저녁에 창의성과 영감이 높아지는 패턴입니다.', strengths: ['상상력', '직관', '예술성'], recs: ['창의 작업은 오후에 배치하세요', '새벽에 무리하지 마세요', '영감을 기록하는 습관을 들이세요'], patterns: { morning: { energy: 55, focus: 60, emotion: 65 }, afternoon: { energy: 78, focus: 82, emotion: 80 }, evening: { energy: 85, focus: 88, emotion: 82 } } },
  { type: '균형형 리듬', emoji: '⚖️', desc: '아침·낮·저녁이 고르게 분포된 균형 잡힌 패턴입니다.', strengths: ['적응력', '균형감', '조화'], recs: ['유연하게 일정을 조정하세요', '스트레스를 분산시키세요', '건강한 식습관을 유지하세요'], patterns: { morning: { energy: 72, focus: 70, emotion: 72 }, afternoon: { energy: 74, focus: 74, emotion: 75 }, evening: { energy: 70, focus: 68, emotion: 72 } } },
  { type: '야행형 리듬', emoji: '🦉', desc: '저녁 이후 집중력과 에너지가 올라가는 패턴입니다.', strengths: ['논리적 사고', '독립성', '심층 집중'], recs: ['중요한 사고 작업은 저녁에 하세요', '아침에는 가벼운 루틴만 권장합니다', '수면 시간을 일정하게 유지하세요'], patterns: { morning: { energy: 50, focus: 52, emotion: 58 }, afternoon: { energy: 65, focus: 68, emotion: 72 }, evening: { energy: 88, focus: 90, emotion: 85 } } },
];

function seedFromGapja(saju) {
  if (!saju || !saju.gapjaKorean) return 0;
  const g = saju.gapjaKorean;
  const str = [g.year, g.month, g.day].filter(Boolean).join('');
  let h = 0;
  for (let i = 0; i < str.length; i++) h = ((h << 5) - h) + str.charCodeAt(i) | 0;
  return Math.abs(h);
}

/** 오행 한글(목/화/토/금/수) → 오행 인덱스 0~4 */
function ohangKoToIndex(ko) {
  if (!ko || typeof ko !== 'string') return null;
  const i = OHANG_KO.indexOf(ko.trim());
  return i >= 0 ? i : null;
}

/**
 * profile.saju.ohang.distribution → 5 Energy Elements (비율 0~100)
 */
function buildEnergyElements(saju) {
  const dist = saju?.ohang?.distribution;
  if (!dist) {
    return ELEMENT_META.map((m) => ({
      ...m,
      value: 20,
      bgColor: 'bg-gray-500/10',
      textColor: 'text-gray-600',
    }));
  }
  const counts = [
    dist.목 ?? dist.wood ?? 0,
    dist.화 ?? dist.fire ?? 0,
    dist.토 ?? dist.earth ?? 0,
    dist.금 ?? dist.metal ?? 0,
    dist.수 ?? dist.water ?? 0,
  ];
  const total = counts.reduce((a, b) => a + b, 0) || 1;
  const values = counts.map((c) => Math.round((c / total) * 100));
  return ELEMENT_META.map((m, i) => ({
    ...m,
    value: Math.min(100, Math.max(0, values[i] ?? 0)),
    bgColor: ['bg-green-500/10', 'bg-red-500/10', 'bg-amber-500/10', 'bg-indigo-500/10', 'bg-sky-500/10'][i],
    textColor: ['text-green-600', 'text-red-600', 'text-amber-600', 'text-indigo-600', 'text-sky-600'][i],
  }));
}

/**
 * 가장 높은 오행 인덱스 → Core Energy Type
 */
function getDominantOhangIndex(saju) {
  const dist = saju?.ohang?.distribution;
  if (!dist) return 0;
  const counts = [
    dist.목 ?? dist.wood ?? 0,
    dist.화 ?? dist.fire ?? 0,
    dist.토 ?? dist.earth ?? 0,
    dist.금 ?? dist.metal ?? 0,
    dist.수 ?? dist.water ?? 0,
  ];
  let maxIdx = 0;
  let maxVal = counts[0];
  for (let i = 1; i < 5; i++) {
    if (counts[i] > maxVal) {
      maxVal = counts[i];
      maxIdx = i;
    }
  }
  return maxIdx;
}

/**
 * 오행 분포 균형도 → 0~100 (높을수록 균형)
 */
function computeBalanceScore(saju) {
  const dist = saju?.ohang?.distribution;
  if (!dist) return 75;
  const counts = [
    dist.목 ?? dist.wood ?? 0,
    dist.화 ?? dist.fire ?? 0,
    dist.토 ?? dist.earth ?? 0,
    dist.금 ?? dist.metal ?? 0,
    dist.수 ?? dist.water ?? 0,
  ];
  const total = counts.reduce((a, b) => a + b, 0) || 1;
  const mean = total / 5;
  const variance = counts.reduce((acc, c) => acc + (c - mean) ** 2, 0) / 5;
  const std = Math.sqrt(variance);
  const idealStd = 0;
  const score = Math.max(0, Math.min(100, Math.round(100 - std * 12)));
  return score;
}

/**
 * 연월일시 pillar 오행 → timeAxis (각 주의 대표 오행 = stem 우선)
 */
function buildTimeAxis(saju) {
  const pillars = saju?.ohang?.pillars;
  const periodKeys = [
    { key: 'year', period: 'Year Energy', korean: '연간 에너지' },
    { key: 'month', period: 'Month Energy', korean: '월간 에너지' },
    { key: 'day', period: 'Day Energy', korean: '일간 에너지' },
    { key: 'hour', period: 'Hour Energy', korean: '시간 에너지' },
  ];
  const defaultAxis = periodKeys.map(({ period, korean }, i) => {
    const meta = ELEMENT_META[i % ELEMENT_META.length];
    return { period, korean, type: meta.name, icon: meta.icon };
  });
  if (!pillars) return defaultAxis;
  return periodKeys.map(({ key, period, korean }) => {
    const p = pillars[key];
    const ko = p?.stem?.ko || p?.branch?.ko;
    const idx = ohangKoToIndex(ko);
    const meta = idx != null ? ELEMENT_META[idx] : ELEMENT_META[0];
    return { period, korean, type: meta.name, icon: meta.icon };
  });
}

/**
 * 십성·12운성 기반 에너지 특성 6가지 점수 (규칙 기반) + AI 문장 보강
 */
function buildEnergyTraits(saju, sajuAnalysis) {
  const sipseong = saju?.sipseong;
  const dayKo = [sipseong?.year?.ko, sipseong?.month?.ko, sipseong?.day?.ko, sipseong?.hour?.ko].filter(Boolean).join(' ');
  const strengths = Array.isArray(sajuAnalysis?.strengths) ? sajuAnalysis.strengths : [];
  const weaknesses = Array.isArray(sajuAnalysis?.weaknesses) ? sajuAnalysis.weaknesses : [];
  const strengthText = strengths.slice(0, 3).join(' ');
  const weaknessText = weaknesses.slice(0, 2).join(' ');

  return TRAIT_META.map((t, i) => {
    const baseScore = 60 + (seedFromGapja(saju) % 31) + (i % 3) * 5;
    const score = Math.min(95, Math.max(45, baseScore));
    let description = '당신의 에너지가 발현되는 특성입니다.';
    let strength = `강점: 에너지 균형을 활용한 성장`;
    if (t.id === 'self-expression') {
      description = '자신의 생각과 감정을 표현하는 능력';
      strength = strengthText ? `강점: ${strengthText.slice(0, 80)}${strengthText.length > 80 ? '…' : ''}` : '강점: 명확한 의사소통, 자기 주장';
    } else if (t.id === 'creative-insight') {
      description = '새로운 아이디어와 통찰을 얻는 능력';
      strength = '강점: 혁신적 사고, 직관력';
    } else if (t.id === 'adaptive-resilience') {
      description = '변화에 적응하고 회복하는 능력';
      strength = weaknessText ? `발전 영역: ${weaknessText.slice(0, 60)}…` : '강점: 유연성, 스트레스 관리';
    }
    return {
      ...t,
      score,
      description,
      strength,
    };
  });
}

/**
 * 종합 인사이트 요약 (AI summary + recommendations 요약 또는 오행 기반 기본 문장)
 */
function buildInsightsSummary(saju, sajuAnalysis, energyElements, coreTypeName) {
  const parts = [];
  if (sajuAnalysis?.summary && typeof sajuAnalysis.summary === 'string') {
    const s = sajuAnalysis.summary.trim().slice(0, 500);
    parts.push(s + (sajuAnalysis.summary.length > 500 ? '…' : ''));
  }
  if (sajuAnalysis?.recommendations?.length) {
    parts.push('추천: ' + sajuAnalysis.recommendations.slice(0, 3).map((r) => (typeof r === 'string' ? r : r?.text || '').slice(0, 80)).join(' / '));
  }
  if (parts.length) return parts.join('\n\n');
  const top = energyElements && energyElements.length ? energyElements.sort((a, b) => (b.value || 0) - (a.value || 0))[0] : null;
  const name = top?.korean || coreTypeName || '에너지';
  return `당신의 에너지 프로필은 ${name}을(를) 핵심으로 합니다. 생년월일시와 성별을 바탕으로 계산된 사주 결과를 반영한 개인 에너지 해석입니다. 일상의 리듬과 강점을 활용해 에너지를 최적화해 보세요.`;
}

/**
 * profile(및 profile.saju) + options.sajuAnalysis 로 Life Profile 데이터 생성
 * @param {object} profile - profiles 테이블 행 (id, userId, birthDate, birthTime, gender, saju 등)
 * @param {{ sajuAnalysis?: object }} options - sajuAnalysis: SajuAnalysisResult (analysis 객체, status done일 때만 전달)
 * @returns {object} life_profiles에 저장할 lpData
 */
export function generateFromProfile(profile, options = {}) {
  const saju = profile?.saju || null;
  const sajuAnalysis = options.sajuAnalysis || null;

  const energyElements = buildEnergyElements(saju);
  const dominantIdx = getDominantOhangIndex(saju);
  const coreMeta = ELEMENT_META[dominantIdx];
  const balanceScore = computeBalanceScore(saju);
  const timeAxis = buildTimeAxis(saju);
  const energyTraits = buildEnergyTraits(saju, sajuAnalysis);
  const insightsSummary = buildInsightsSummary(saju, sajuAnalysis, energyElements, coreMeta?.korean);

  const coreTypeDescription = sajuAnalysis?.personality && typeof sajuAnalysis.personality === 'string'
    ? sajuAnalysis.personality.slice(0, 200) + (sajuAnalysis.personality.length > 200 ? '…' : '')
    : `당신의 핵심 에너지는 "${coreMeta.korean}"입니다. ${coreMeta.description}`;

  const energyBlueprint = {
    coreType: {
      name: coreMeta.name + ' Core',
      korean: coreMeta.korean + ' 코어',
      icon: coreMeta.icon,
      description: coreTypeDescription,
    },
    timeAxis,
    balance: {
      overall: balanceScore,
      message: balanceScore >= 70
        ? '전반적으로 균형 잡힌 에너지 구조를 가지고 있습니다.'
        : balanceScore >= 50
          ? '한두 가지 에너지가 두드러질 수 있으며, 나머지 요소를 보완하면 더욱 균형이 좋아집니다.'
          : '특정 에너지가 강하게 나타납니다. 강점을 살리면서 부족한 에너지를 의식적으로 채우면 좋습니다.',
    },
  };

  const seed = seedFromGapja(saju);
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
    version: '2.0',
    energyElements,
    energyTraits,
    energyBlueprint,
    insightsSummary,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}
