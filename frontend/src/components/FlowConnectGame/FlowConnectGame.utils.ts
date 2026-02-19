// 에너지 흐름 연결 게임 유틸리티

export const GAME_DURATION = 60 // 초

export type DifficultyLevel = 'easy' | 'normal' | 'hard'

export interface DifficultyConfig {
  level: DifficultyLevel
  name: string
  korean: string
  description: string
  icon: string
  color: string
  /** 라운드별 점 개수: [라운드0, 라운드1, ...] 또는 (round) => base + round */
  minPoints: number
  maxPoints: number
  /** 터치 인정 반경 (화면 비율 0~100 기준, 예: 8 = 8%) */
  tapRadiusPercent: number
  /** 올바른 연결당 기본 점수 */
  pointsPerCorrect: number
  /** 잘못된 터치당 감점 */
  wrongTapPenalty: number
  /** 콤보당 추가 배율 (1 + combo * comboBonusMultiplier), 최대 cap */
  comboBonusMultiplier: number
  comboBonusCap: number
  /** 라운드 완료 보너스 */
  roundCompleteBonus: number
}

export interface Point {
  x: number // 0–100 (화면 너비 기준)
  y: number // 0–100 (화면 높이 기준)
  number: number // 1-based 표시 번호
}

export interface FlowConnectGameStats {
  score: number
  correctConnections: number
  wrongTaps: number
  roundsCompleted: number
  maxCombo: number
  totalTime: number // 플레이 시간(초)
}

/** 라운드 번호(0-based)와 난이도에 따른 이번 라운드 점 개수 */
export function getPointsCountForRound(round: number, config: DifficultyConfig): number {
  const range = config.maxPoints - config.minPoints + 1
  const step = Math.min(round, 4) // 5라운드 이상은 maxPoints 유지
  const count = config.minPoints + (step % range)
  return Math.min(Math.max(count, config.minPoints), config.maxPoints)
}

/** 원형 배치: 중심 (50, 50), 반지름 약 35%, 균등 각도 (폴백용) */
function placePointsOnCircle(count: number): Point[] {
  const points: Point[] = []
  const centerX = 50
  const centerY = 50
  const radius = 36
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2 - Math.PI / 2
    const x = centerX + radius * Math.cos(angle)
    const y = centerY + radius * Math.sin(angle)
    points.push({ x, y, number: i + 1 })
  }
  return points
}

const RANDOM_MARGIN = 14
const RANDOM_MIN_DIST = 18
const RANDOM_MAX_ATTEMPTS = 80

/** 두 점 사이 거리 (0–100 좌표) */
function dist(a: Point, b: Point): number {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2)
}

/** 랜덤 배치: 점들을 서로 겹치지 않게 랜덤 위치에 배치 */
function placePointsRandom(count: number): Point[] {
  const points: Point[] = []
  const minX = RANDOM_MARGIN
  const maxX = 100 - RANDOM_MARGIN
  const minY = RANDOM_MARGIN
  const maxY = 100 - RANDOM_MARGIN

  for (let i = 0; i < count; i++) {
    let best: { x: number; y: number } | null = null
    let bestMinDist = 0

    for (let attempt = 0; attempt < RANDOM_MAX_ATTEMPTS; attempt++) {
      const x = minX + Math.random() * (maxX - minX)
      const y = minY + Math.random() * (maxY - minY)
      const candidate = { x, y, number: i + 1 }
      const minDistToExisting =
        points.length === 0
          ? Infinity
          : Math.min(...points.map((p) => dist(p, candidate)))
      if (points.length === 0 || minDistToExisting >= RANDOM_MIN_DIST) {
        best = { x, y }
        break
      }
      if (minDistToExisting > bestMinDist) {
        bestMinDist = minDistToExisting
        best = { x, y }
      }
    }
    const { x, y } = best ?? {
      x: minX + Math.random() * (maxX - minX),
      y: minY + Math.random() * (maxY - minY),
    }
    points.push({ x, y, number: i + 1 })
  }
  return points
}

/** 라운드와 난이도에 따라 점 배치 생성 (매번 랜덤 배치) */
export function generatePointsForRound(round: number, config: DifficultyConfig): Point[] {
  const count = getPointsCountForRound(round, config)
  return placePointsRandom(count)
}

/** (tapX, tapY)가 point를 터치했는지 (0–100 좌표, config.tapRadiusPercent 사용) */
export function isPointTapped(
  point: Point,
  tapX: number,
  tapY: number,
  config: DifficultyConfig
): boolean {
  const dist = Math.sqrt((tapX - point.x) ** 2 + (tapY - point.y) ** 2)
  return dist <= config.tapRadiusPercent
}

/** 터치 위치에서 맞은 점 인덱스(0-based) 반환, 없으면 -1. nextExpected는 1-based */
export function getTappedPointIndex(
  points: Point[],
  tapX: number,
  tapY: number,
  nextExpected: number,
  config: DifficultyConfig
): number {
  const expectedIndex = nextExpected - 1
  if (expectedIndex < 0 || expectedIndex >= points.length) return -1
  const point = points[expectedIndex]
  if (isPointTapped(point, tapX, tapY, config)) return expectedIndex
  for (let i = 0; i < points.length; i++) {
    if (i === expectedIndex) continue
    if (isPointTapped(points[i], tapX, tapY, config)) return i
  }
  return -1
}

/** 올바른 터치: expectedIndex(0-based)와 tappedIndex가 같으면 true */
export function isCorrectTap(tappedIndex: number, nextExpected: number): boolean {
  return tappedIndex === nextExpected - 1
}

/** 단일 올바른 연결 점수 (콤보 보너스 포함) */
export function scoreForCorrect(
  combo: number,
  config: DifficultyConfig
): number {
  const mult = Math.min(1 + combo * config.comboBonusMultiplier, config.comboBonusCap)
  return Math.floor(config.pointsPerCorrect * mult)
}

export function createInitialFlowConnectStats(): FlowConnectGameStats {
  return {
    score: 0,
    correctConnections: 0,
    wrongTaps: 0,
    roundsCompleted: 0,
    maxCombo: 0,
    totalTime: 0,
  }
}

export const DIFFICULTY_CONFIGS: Record<DifficultyLevel, DifficultyConfig> = {
  easy: {
    level: 'easy',
    name: 'Easy',
    korean: '쉬움',
    description: '점 개수 적고 넓은 터치 영역',
    icon: '🌱',
    color: 'green',
    minPoints: 5,
    maxPoints: 6,
    tapRadiusPercent: 10,
    pointsPerCorrect: 15,
    wrongTapPenalty: 3,
    comboBonusMultiplier: 0.15,
    comboBonusCap: 2.5,
    roundCompleteBonus: 25,
  },
  normal: {
    level: 'normal',
    name: 'Normal',
    korean: '보통',
    description: '적당한 점 개수와 터치 영역',
    icon: '⭐',
    color: 'blue',
    minPoints: 6,
    maxPoints: 8,
    tapRadiusPercent: 8,
    pointsPerCorrect: 12,
    wrongTapPenalty: 5,
    comboBonusMultiplier: 0.12,
    comboBonusCap: 2.2,
    roundCompleteBonus: 30,
  },
  hard: {
    level: 'hard',
    name: 'Hard',
    korean: '어려움',
    description: '많은 점, 좁은 터치 영역',
    icon: '🔥',
    color: 'red',
    minPoints: 7,
    maxPoints: 10,
    tapRadiusPercent: 6,
    pointsPerCorrect: 10,
    wrongTapPenalty: 8,
    comboBonusMultiplier: 0.1,
    comboBonusCap: 2,
    roundCompleteBonus: 40,
  },
}

export const DEFAULT_DIFFICULTY: DifficultyLevel = 'normal'
