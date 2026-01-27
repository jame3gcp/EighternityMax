// 파형 게임 유틸리티 함수

// 난이도 레벨 타입
export type DifficultyLevel = 'easy' | 'normal' | 'hard'

// 난이도별 설정 인터페이스
export interface DifficultyConfig {
  level: DifficultyLevel
  name: string
  korean: string
  description: string
  icon: string
  color: string
  // 게임 설정
  baseSpeed: number // 기본 파형 속도
  spawnInterval: number // 파형 생성 간격 (ms)
  speedIncreaseRate: number // 시간에 따른 속도 증가율 (60초 후 배수)
  maxLanes: number // 사용할 라인 개수 (쉬움: 1, 보통: 3, 어려움: 5)
  // 타이밍 윈도우
  excellentWindow: number
  perfectWindow: number
  goodWindow: number
  missWindow: number
}

export interface Wave {
  id: string
  x: number // 0-100 (화면 너비 기준)
  y: number // 0-100 (화면 높이 기준) - 파형이 지나갈 Y 위치
  speed: number // 이동 속도
  amplitude: number // 파형 진폭
  frequency: number // 파형 주파수
  phase: number // 초기 위상
  targetX: number // 목표 위치 (중앙 = 50)
  createdAt: number // 생성 시간
  lane: number // 라인 번호 (0, 1, 2)
}

export interface GameStats {
  score: number
  hits: number
  misses: number
  combo: number
  maxCombo: number
  accuracy: number
}

export interface TapResult {
  hit: boolean
  score: number
  timing: 'excellent' | 'perfect' | 'good' | 'miss'
  distance: number
}

// 파형 생성 함수
export const createWave = (
  index: number,
  difficultyConfig: DifficultyConfig,
  elapsedTime: number = 0
): Wave => {
  // 난이도 설정에서 기본 속도 가져오기
  const baseSpeed = difficultyConfig.baseSpeed
  // 시간에 따라 속도 증가 적용
  const timeAdjustedSpeed = getWaveSpeed(elapsedTime, baseSpeed, difficultyConfig.speedIncreaseRate)
  
  // 각 파형마다 속도에 랜덤 변동 추가 (±30% 범위)
  // 여러 줄이 있을 때 각 줄마다 다른 속도로 오도록
  const speedVariation = 0.7 + Math.random() * 0.6 // 0.7 ~ 1.3 배 (70% ~ 130%)
  const speed = timeAdjustedSpeed * speedVariation
  
  const amplitude = 20 + Math.random() * 15 // 진폭 (파형의 높이)
  const frequency = 0.05 + Math.random() * 0.05 // 주파수 (파형의 빠르기)
  
  // 항상 좌측에서 시작하여 우측으로 흐르도록 (명확한 방향성)
  // 화면 왼쪽 끝에서 시작하도록 0으로 설정 (처음부터 보이도록)
  const startX = 0 // 화면 왼쪽 끝에서 시작
  
  // 난이도에 따라 사용할 라인 개수 결정
  const maxLanes = difficultyConfig.maxLanes
  // 사용 가능한 라인 중 하나를 랜덤 선택
  const lane = Math.floor(Math.random() * maxLanes)
  
  // 5개 라인 위치 (0-100 기준): 10%, 30%, 50%, 70%, 90%
  const allLaneYPositions = [10, 30, 50, 70, 90]
  // 난이도에 따라 사용할 라인 위치 선택
  let laneYPositions: number[]
  if (maxLanes === 1) {
    // 쉬움: 중앙만 (50%)
    laneYPositions = [50]
  } else if (maxLanes === 3) {
    // 보통: 상단, 중앙, 하단 (30%, 50%, 70%)
    laneYPositions = [30, 50, 70]
  } else {
    // 어려움: 5개 모두 (10%, 30%, 50%, 70%, 90%)
    laneYPositions = allLaneYPositions
  }
  
  const y = laneYPositions[lane]
  
  return {
    id: `wave-${Date.now()}-${index}`,
    x: startX,
    y: y,
    speed: speed,
    amplitude: amplitude,
    frequency: frequency,
    phase: Math.random() * Math.PI * 2,
    targetX: 50, // 중앙 지점 (목표 타이밍)
    createdAt: Date.now(),
    lane: lane,
  }
}

// 파형 업데이트 (애니메이션)
export const updateWave = (wave: Wave, deltaTime: number): Wave => {
  // 파형이 좌측에서 우측으로 일직선으로 이동
  // deltaTime을 초 단위로 변환 (밀리초 -> 초)
  const deltaSeconds = deltaTime / 1000
  
  // 우측으로 일정한 속도로 이동 (화면 너비 100 기준)
  const moveX = wave.speed * deltaSeconds * 10 // 속도 조정 (화면을 가로지르는 시간)
  const newX = wave.x + moveX
  
  return {
    ...wave,
    x: newX, // 화면 밖으로 나가면 자동으로 제거됨
  }
}

// 탭/클릭 타이밍 체크
export const checkTapTiming = (
  wave: Wave,
  tapX: number, // 0-100 (화면 너비 기준)
  tapY: number, // 0-100 (화면 높이 기준)
  difficultyConfig: DifficultyConfig
): TapResult => {
  const centerX = 50 // 목표 중앙 X 위치
  const waveCenterY = wave.y // 파형이 지나가는 Y 위치
  
  // 파형의 중앙까지의 거리 (X축)
  const waveDistanceFromCenter = Math.abs(wave.x - centerX)
  
  // 탭한 위치의 파형 Y 위치까지의 거리 (X축, Y축)
  const tapDistanceX = Math.abs(tapX - centerX)
  const tapDistanceY = Math.abs(tapY - waveCenterY)
  const tapDistanceFromCenter = Math.sqrt(tapDistanceX ** 2 + tapDistanceY ** 2)
  
  // 난이도별 타이밍 윈도우 사용
  const excellentWindow = difficultyConfig.excellentWindow
  const perfectWindow = difficultyConfig.perfectWindow
  const goodWindow = difficultyConfig.goodWindow
  const missWindow = difficultyConfig.missWindow
  
  // Excellent 조건: 파형이 중앙에 매우 가깝고, 탭도 중앙에 매우 가까움
  if (waveDistanceFromCenter <= excellentWindow && tapDistanceFromCenter <= excellentWindow) {
    return {
      hit: true,
      score: 30, // 점수 체계 조정: 150 -> 30
      timing: 'excellent',
      distance: tapDistanceFromCenter,
    }
  }
  // Perfect 조건: 파형이 중앙 근처, 탭도 중앙 근처
  else if (waveDistanceFromCenter <= perfectWindow && tapDistanceFromCenter <= perfectWindow) {
    return {
      hit: true,
      score: 20, // 점수 체계 조정: 100 -> 20
      timing: 'perfect',
      distance: tapDistanceFromCenter,
    }
  }
  // Good 조건: 파형이 중앙 근처, 탭도 어느 정도 근처
  else if (waveDistanceFromCenter <= goodWindow && tapDistanceFromCenter <= goodWindow) {
    return {
      hit: true,
      score: 10, // 점수 체계 조정: 50 -> 10
      timing: 'good',
      distance: tapDistanceFromCenter,
    }
  }
  // Miss 조건: 파형이 중앙 근처지만 탭이 너무 멀거나, 파형 자체가 멀리 있음
  else if (waveDistanceFromCenter <= missWindow) {
    return {
      hit: false,
      score: -5, // 미스 시 점수 감점 조정: -20 -> -5
      timing: 'miss',
      distance: tapDistanceFromCenter,
    }
  }
  // 완전히 놓침
  else {
    return {
      hit: false,
      score: -5, // 미스 시 점수 감점 조정: -20 -> -5
      timing: 'miss',
      distance: tapDistanceFromCenter,
    }
  }
}

// 점수 계산 (콤보 보너스 포함)
export const calculateScore = (
  baseScore: number,
  combo: number
): number => {
  const comboMultiplier = Math.min(1 + (combo * 0.1), 3) // 최대 3배
  return Math.floor(baseScore * comboMultiplier)
}

// 게임 통계 업데이트
export const updateStats = (
  stats: GameStats,
  result: TapResult
): GameStats => {
  const newCombo = result.hit ? stats.combo + 1 : 0
  const newHits = result.hit ? stats.hits + 1 : stats.hits
  const newMisses = !result.hit ? stats.misses + 1 : stats.misses
  const totalAttempts = newHits + newMisses
  const newAccuracy = totalAttempts > 0 ? (newHits / totalAttempts) * 100 : 0
  
  // 점수 계산: 히트 시 콤보 보너스 적용, 미스 시 감점
  let scoreChange = 0
  if (result.hit) {
    scoreChange = calculateScore(result.score, stats.combo)
  } else {
    // 미스 시 점수 감점 (콤보 보너스 없음)
    scoreChange = result.score // 음수 값 (-20)
  }
  
  // 점수는 0 이하로 내려가지 않도록
  const newScore = Math.max(0, stats.score + scoreChange)
  
  return {
    score: newScore,
    hits: newHits,
    misses: newMisses,
    combo: newCombo,
    maxCombo: Math.max(stats.maxCombo, newCombo),
    accuracy: newAccuracy,
  }
}

// 파형 속도 조절 함수 (시간에 따라 점진적으로 증가)
export const getWaveSpeed = (
  elapsedTime: number,
  baseSpeed: number,
  speedIncreaseRate: number
): number => {
  // 시간이 지날수록 속도 증가 (난이도별 증가율 적용)
  // 0초: 100%, 60초: speedIncreaseRate 배
  const speedMultiplier = 1 + (elapsedTime / 60) * (speedIncreaseRate - 1)
  return baseSpeed * speedMultiplier
}

// 초기 게임 통계
export const createInitialStats = (): GameStats => ({
  score: 0,
  hits: 0,
  misses: 0,
  combo: 0,
  maxCombo: 0,
  accuracy: 0,
})

// 난이도별 설정 상수
export const DIFFICULTY_CONFIGS: Record<DifficultyLevel, DifficultyConfig> = {
  easy: {
    level: 'easy',
    name: 'Easy',
    korean: '쉬움',
    description: '초보자도 즐길 수 있는 난이도',
    icon: '🌱',
    color: 'green',
    baseSpeed: 1.2,
    spawnInterval: 2000,
    speedIncreaseRate: 1.5,
    maxLanes: 1, // 1개 라인만 사용
    excellentWindow: 3,
    perfectWindow: 7,
    goodWindow: 15,
    missWindow: 30,
  },
  normal: {
    level: 'normal',
    name: 'Normal',
    korean: '보통',
    description: '일반적인 난이도',
    icon: '⭐',
    color: 'blue',
    baseSpeed: 1.8,
    spawnInterval: 1500,
    speedIncreaseRate: 2.0,
    maxLanes: 3, // 3개 라인 사용
    excellentWindow: 2,
    perfectWindow: 5,
    goodWindow: 12,
    missWindow: 25,
  },
  hard: {
    level: 'hard',
    name: 'Hard',
    korean: '어려움',
    description: '도전적인 난이도',
    icon: '🔥',
    color: 'red',
    baseSpeed: 2.5,
    spawnInterval: 1000,
    speedIncreaseRate: 2.5,
    maxLanes: 5, // 5개 라인 사용
    excellentWindow: 1,
    perfectWindow: 3,
    goodWindow: 8,
    missWindow: 20,
  },
}

// 기본 난이도 (Normal)
export const DEFAULT_DIFFICULTY: DifficultyLevel = 'normal'
