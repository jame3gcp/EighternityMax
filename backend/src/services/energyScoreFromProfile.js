/**
 * 사주 기반 Life Profile 데이터로만 수치(에너지 지수, 에너지/감정/집중도)를 계산합니다.
 * 반환값은 숫자와 사용자용 문구만 포함하며, 사주 용어·분석 원문은 절대 노출하지 않습니다.
 * 데일리 가이드 문구는 energy_index 구간(0-40 / 41-60 / 61-80 / 81-100)별로 선택됩니다.
 */

/** 8 phase 인덱스 → 시간대 슬롯 (morning/afternoon/evening). patterns와 매핑용 */
const PHASE_TO_SLOT = ['evening', 'evening', 'morning', 'morning', 'afternoon', 'afternoon', 'evening', 'evening'];

/** energy_index 구간별 문장 풀 (키: low / midLow / midHigh / high). 사주·명리 용어 없음. */
const DAILY_GUIDE_COPY = {
  low: {
    summary: '에너지를 아껴 쓰는 하루가 좋습니다. 무리한 일정은 미루고 휴식과 가벼운 루틴을 권장합니다.',
    do: ['가벼운 산책이나 스트레칭', '단기로 끝낼 수 있는 일만 하기', '저녁 일찍 휴식하기'],
    avoid: ['과도한 업무 스케줄', '새로운 큰 결단 내리기', '늦은 밤까지 일하기'],
    relationships: '에너지를 아껴야 하는 날입니다. 필수 대화만 짧게 하고, 중요한 결정이나 갈등이 예상되는 대화는 미루는 편이 좋습니다.',
  },
  midLow: {
    summary: '에너지가 보통 수준입니다. 중요한 일은 한두 가지로 묶고, 나머지는 유연하게 조정하세요.',
    do: ['우선순위가 높은 일 한두 가지 처리하기', '중간에 짧은 휴식 넣기', '내일을 위한 준비만 가볍게'],
    avoid: ['한꺼번에 많은 일 맡기', '중요한 약속을 오후 늦게 잡기', '연속 회의 잡기'],
    relationships: '오늘은 협력적인 대화가 잘 통할 시기입니다. 무리한 요청보다는 조율과 소통에 집중하세요.',
  },
  midHigh: {
    summary: '활동하기 좋은 날입니다. 오전에 중요한 일을 처리하고 오후에는 회복할 여유를 두세요.',
    do: ['창의적인 작업에 집중하기', '중요한 결정은 오전에 하기', '가벼운 운동으로 에너지 유지하기'],
    avoid: ['과도한 업무 스케줄', '충분한 휴식 없이 연속 일정 잡기', '저녁 늦게 큰 약속 잡기'],
    relationships: '오늘은 협력적인 대화가 잘 통할 시기입니다. 팀 프로젝트나 협업을 진행하기 좋습니다.',
  },
  high: {
    summary: '에너지가 높은 날입니다. 결정이나 창의적 작업, 협업을 앞당기기 좋습니다.',
    do: ['미뤄둔 중요한 결정 하기', '미뤄둔 일 처리하기', '팀 미팅이나 협업 일정 배치하기'],
    avoid: ['에너지를 과하게 쓰는 밤늦은 약속', '충분한 휴식 건너뛰기', '무리한 연속 스케줄'],
    relationships: '협업과 대화가 잘 통하는 날입니다. 팀 프로젝트나 중요한 대화를 배치하기 좋습니다.',
  },
};

/**
 * @param {number} energyIndex - 0..100
 * @returns {'low'|'midLow'|'midHigh'|'high'}
 */
function getBand(energyIndex) {
  const n = Math.max(0, Math.min(100, Math.round(energyIndex)));
  if (n <= 40) return 'low';
  if (n <= 60) return 'midLow';
  if (n <= 80) return 'midHigh';
  return 'high';
}

/**
 * 오늘 에너지 지수 및 데일리 가이드 문구 계산 (사주/Life Profile 기반, 노출용 무해 문구만 반환)
 * summary/do/avoid/relationships는 energy_index 구간별 문장 + Life Profile 보강으로 매일 달라집니다.
 * @param {object} lifeProfile - life_profiles 행 (energyBlueprint.balance.overall, recommendations, cycleDescription, strengths 등)
 * @param {{ energy?: number }[]} recentLogs - 최근 기록 3건 (선택)
 * @param {string} [targetDate] - 'YYYY-MM-DD' (선택, 추후 phase 기반 문구용)
 * @returns {{ energy_index: number, summary: string, do: string[], avoid: string[], relationships: string }}
 */
export function computeDailyGuide(lifeProfile, recentLogs = [], targetDate) {
  const balance = lifeProfile?.energyBlueprint?.balance?.overall;
  let energyIndex = typeof balance === 'number' ? Math.round(Math.max(0, Math.min(100, balance))) : 75;

  if (Array.isArray(recentLogs) && recentLogs.length > 0) {
    const avg = recentLogs.reduce((acc, log) => acc + (log?.energy ?? 0), 0) / recentLogs.length;
    if (avg < 40) energyIndex = Math.max(0, energyIndex - 10);
    else if (avg > 80) energyIndex = Math.min(100, energyIndex + 5);
  }

  const band = getBand(energyIndex);
  const copy = DAILY_GUIDE_COPY[band];

  const cycleDesc = typeof lifeProfile?.cycleDescription === 'string' ? lifeProfile.cycleDescription.trim().slice(0, 200) : '';
  const summary = cycleDesc
    ? `${copy.summary} ${cycleDesc}`
    : copy.summary;

  const recs = lifeProfile?.recommendations;
  const fromProfile = Array.isArray(recs) && recs.length > 0
    ? recs.slice(0, 3).map((r) => (typeof r === 'string' ? r : (r?.text || String(r))).slice(0, 120))
    : [];
  const fromBand = copy.do.slice(0, 5 - fromProfile.length);
  const doList = [...fromProfile, ...fromBand].slice(0, 5);

  const avoid = [...copy.avoid];

  const strengths = lifeProfile?.strengths;
  const strengthLine = Array.isArray(strengths) && strengths.length > 0 && typeof strengths[0] === 'string'
    ? ` 당신의 강점인 ${strengths[0].slice(0, 30)}을(를) 활용해 대화해 보세요.`
    : '';
  const relationships = copy.relationships + strengthLine;

  return {
    energy_index: energyIndex,
    summary,
    do: doList,
    avoid,
    relationships,
  };
}

/**
 * 현재 시각 기준 8 phase별 energy/emotion/focus 수치 계산 (Life Profile patterns 사용, 사주 용어 없음)
 * @param {object} lifeProfile - life_profiles 행 (patterns: { morning, afternoon, evening })
 * @param {Date} now - 기준 시각
 * @returns {{ currentPhase: number, phases: { id: number, name: string, energy: number, emotion: number, focus: number, description: string, recommendations: string[], warnings: string[], color: string }[] }}
 */
export function computeCyclePhases(lifeProfile, now = new Date()) {
  const phaseNames = ['새벽', '상승', '정점', '유지', '하강', '저점', '회복', '준비'];
  const phaseColors = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#f97316', '#ef4444', '#10b981', '#06b6d4'];

  const patterns = lifeProfile?.patterns;
  const morning = patterns?.morning ?? { energy: 72, focus: 70, emotion: 72 };
  const afternoon = patterns?.afternoon ?? { energy: 74, focus: 74, emotion: 75 };
  const evening = patterns?.evening ?? { energy: 70, focus: 68, emotion: 72 };

  const currentPhase = Math.floor((now.getHours() / 24) * 8) % 8;

  const phases = phaseNames.map((name, index) => {
    const slot = PHASE_TO_SLOT[index];
    const p = slot === 'morning' ? morning : slot === 'afternoon' ? afternoon : evening;
    const energy = Math.round(Math.max(0, Math.min(100, p.energy ?? 70)));
    const emotion = Math.round(Math.max(0, Math.min(100, p.emotion ?? 72)));
    const focus = Math.round(Math.max(0, Math.min(100, p.focus ?? 70)));

    return {
      id: index,
      name,
      energy,
      emotion,
      focus,
      description: `${name} 단계입니다.`,
      recommendations: [`${name} 단계에 맞는 활동을 하세요.`, '충분한 휴식'],
      warnings: ['과도한 활동 주의'],
      color: phaseColors[index],
    };
  });

  return { currentPhase, phases };
}

const TREND_THRESHOLD = 5;

/**
 * 최근 기록 비교로 에너지/감정/집중도 트렌드 계산 (문서 §4 C)
 * @param {{ energy?: number, emotion?: number, focus?: number }[]} records - timestamp 내림차순 정렬된 기록 (최소 2개 이상 권장)
 * @returns {{ energy: 'up'|'down'|'stable', emotion: 'up'|'down'|'stable', focus: 'up'|'down'|'stable' }}
 */
export function computeTrendsFromRecords(records = []) {
  const stable = { energy: 'stable', emotion: 'stable', focus: 'stable' };
  if (!Array.isArray(records) || records.length < 2) return stable;

  const recent = records.slice(0, 3);
  const previous = records.slice(3, 6);
  if (previous.length === 0) return stable;

  const avg = (arr, key) => {
    const vals = arr.map((r) => r[key]).filter((v) => typeof v === 'number');
    return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
  };
  const trend = (key) => {
    const r = avg(recent, key);
    const p = avg(previous, key);
    if (r == null || p == null) return 'stable';
    const diff = r - p;
    if (diff >= TREND_THRESHOLD) return 'up';
    if (diff <= -TREND_THRESHOLD) return 'down';
    return 'stable';
  };

  return {
    energy: trend('energy'),
    emotion: trend('emotion'),
    focus: trend('focus'),
  };
}
