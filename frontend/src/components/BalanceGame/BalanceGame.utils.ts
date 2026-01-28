// 밸런스 컨트롤 게임 유틸리티

export const GAUGE_MIN = -100
export const GAUGE_MAX = 100
export const GAUGE_CENTER = 0
export const GAME_DURATION = 60 // 초
/** 초록 영역 반경: 시작 시 2배(30), 시간 지남에 따라 줄어듦, 최소는 절반(15)에서 멈춤 */
export const CENTER_ZONE_RADIUS_INITIAL = 30
export const CENTER_ZONE_RADIUS_MIN = 15
export const POINTS_PER_SECOND_IN_ZONE = 10 // 중앙 유지 시 초당 점수
export const TICK_MS = 50 // 게임 업데이트 주기 (ms)
/** 매 틱마다 정수 1점씩 추가 (중앙 유지 시) → 초당 20점, 표시는 10점/초 기준으로 유지 */
export const POINTS_PER_TICK = 1
export const DRIFT_STRENGTH = 6 // 매 프레임 랜덤 드리프트 강도 (불안하게 크게 흔들림)
export const PUSH_STRENGTH = 22.5 // 한 번 누를 때 이동량 (기존 45의 1/2)

export interface BalanceGameStats {
  score: number
  timeInZone: number // 중앙 구간에 있던 시간 (초)
  percentInZone: number // 0~100
  maxStreak: number // 최대 연속 중앙 유지 시간 (초 단위 스텝)
}

export const createInitialBalanceStats = (): BalanceGameStats => ({
  score: 0,
  timeInZone: 0,
  percentInZone: 0,
  maxStreak: 0,
})

/** 게이지에 랜덤 드리프트 적용 */
export const applyDrift = (current: number): number => {
  const drift = (Math.random() - 0.5) * 2 * DRIFT_STRENGTH
  return clamp(current + drift, GAUGE_MIN, GAUGE_MAX)
}

/** 한쪽으로 밀기 */
export const applyPush = (current: number, direction: 'left' | 'right'): number => {
  const delta = direction === 'left' ? -PUSH_STRENGTH : PUSH_STRENGTH
  return clamp(current + delta, GAUGE_MIN, GAUGE_MAX)
}

export const clamp = (value: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, value))

/** 초록 구간이 줄어드는 시간(초). 이 시간 안에 30 → 15까지 줄어듦. 짧을수록 더 빨리 줄어듦 */
export const ZONE_SHRINK_DURATION = 25
/** 경과 시간(초)에 따른 현재 중앙 구간 반경. 초반 30 → ZONE_SHRINK_DURATION초에 15까지 줄어들고 그 이하로는 안 줄어듦 */
export const getCenterZoneRadius = (elapsedSeconds: number): number => {
  const progress = Math.min(1, elapsedSeconds / ZONE_SHRINK_DURATION)
  const radius = CENTER_ZONE_RADIUS_INITIAL - (CENTER_ZONE_RADIUS_INITIAL - CENTER_ZONE_RADIUS_MIN) * progress
  return Math.max(CENTER_ZONE_RADIUS_MIN, radius)
}

/** 중앙 구간인지 (스코어 인정 구간), 반경 인자 사용 */
export const isInCenterZone = (value: number, radius: number): boolean =>
  Math.abs(value - GAUGE_CENTER) <= radius

/** 0~100 퍼센트로 게이지 위치 반환 (UI용) */
export const gaugeToPercent = (value: number): number =>
  ((value - GAUGE_MIN) / (GAUGE_MAX - GAUGE_MIN)) * 100
