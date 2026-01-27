// 지렁이 게임 유틸리티 함수

// 게임 설정
export const GRID_SIZE = 20 // 격자 크기 (20x20)
export const INITIAL_SNAKE_LENGTH = 3 // 초기 지렁이 길이
export const ENERGY_SCORE = 10 // 에너지 1개당 점수
export const BASE_GAME_SPEED = 150 // 기본 게임 속도 (ms)

// 방향 타입
export type Direction = 'up' | 'down' | 'left' | 'right'

// 위치 타입
export interface Position {
  x: number
  y: number
}

// 지렁이 타입 (위치 배열)
export type Snake = Position[]

// 에너지 아이템 타입
export interface Energy {
  position: Position
  id: string
  createdAt: number
}

// 지렁이 게임 통계 타입
export interface SnakeGameStats {
  score: number
  energyCollected: number
  survivalTime: number // 생존 시간 (초)
  maxLength: number // 최대 길이
}

// 초기 지렁이 생성
export const createInitialSnake = (gridSize: number): Snake => {
  const center = Math.floor(gridSize / 2)
  const snake: Snake = []
  
  // 중앙에서 시작하여 오른쪽으로 초기 길이만큼 생성
  for (let i = 0; i < INITIAL_SNAKE_LENGTH; i++) {
    snake.push({ x: center - i, y: center })
  }
  
  return snake
}

// 에너지 생성 (지렁이와 겹치지 않는 위치)
export const generateEnergy = (snake: Snake, gridSize: number): Energy => {
  let position: Position
  let attempts = 0
  const maxAttempts = 100
  
  do {
    position = {
      x: Math.floor(Math.random() * gridSize),
      y: Math.floor(Math.random() * gridSize),
    }
    attempts++
  } while (
    snake.some(segment => segment.x === position.x && segment.y === position.y) &&
    attempts < maxAttempts
  )
  
  return {
    position,
    id: `energy-${Date.now()}-${Math.random()}`,
    createdAt: Date.now(),
  }
}

// 지렁이 이동
export const moveSnake = (snake: Snake, direction: Direction, gridSize: number): Snake => {
  const head = { ...snake[0] }
  
  // 방향에 따라 머리 위치 업데이트
  switch (direction) {
    case 'up':
      head.y = (head.y - 1 + gridSize) % gridSize // 화면 밖으로 나가면 반대편으로
      break
    case 'down':
      head.y = (head.y + 1) % gridSize
      break
    case 'left':
      head.x = (head.x - 1 + gridSize) % gridSize
      break
    case 'right':
      head.x = (head.x + 1) % gridSize
      break
  }
  
  // 새 머리를 앞에 추가하고 꼬리 제거 (에너지를 먹지 않았을 때)
  return [head, ...snake.slice(0, -1)]
}

// 지렁이 성장 (에너지를 먹었을 때)
export const growSnake = (snake: Snake, direction: Direction, gridSize: number): Snake => {
  const head = { ...snake[0] }
  
  // 방향에 따라 새 머리 위치 계산
  switch (direction) {
    case 'up':
      head.y = (head.y - 1 + gridSize) % gridSize
      break
    case 'down':
      head.y = (head.y + 1) % gridSize
      break
    case 'left':
      head.x = (head.x - 1 + gridSize) % gridSize
      break
    case 'right':
      head.x = (head.x + 1) % gridSize
      break
  }
  
  // 새 머리를 추가하되 꼬리는 유지 (길어짐)
  return [head, ...snake]
}

// 충돌 체크 (벽 또는 자신의 몸과 충돌)
export const checkCollision = (snake: Snake, gridSize: number, allowWallWrap: boolean = true): boolean => {
  const head = snake[0]
  
  // 벽 충돌 체크 (화면 밖으로 나갔는지)
  if (!allowWallWrap) {
    if (head.x < 0 || head.x >= gridSize || head.y < 0 || head.y >= gridSize) {
      return true
    }
  }
  
  // 자신의 몸과 충돌 체크 (머리가 몸통과 겹치는지)
  for (let i = 1; i < snake.length; i++) {
    if (snake[i].x === head.x && snake[i].y === head.y) {
      return true
    }
  }
  
  return false
}

// 에너지 수집 체크
export const checkEnergyCollection = (snake: Snake, energy: Energy): boolean => {
  const head = snake[0]
  return head.x === energy.position.x && head.y === energy.position.y
}

// 통계 업데이트
export const updateSnakeStats = (
  stats: SnakeGameStats,
  energyCollected: boolean,
  deltaTime: number
): SnakeGameStats => {
  const newStats = { ...stats }
  
  if (energyCollected) {
    newStats.score += ENERGY_SCORE
    newStats.energyCollected += 1
  }
  
  // 생존 시간 업데이트 (밀리초를 초로 변환)
  newStats.survivalTime += deltaTime / 1000
  
  return newStats
}

// 최대 길이 업데이트
export const updateMaxLength = (stats: SnakeGameStats, snakeLength: number): SnakeGameStats => {
  return {
    ...stats,
    maxLength: Math.max(stats.maxLength, snakeLength),
  }
}

// 초기 게임 통계
export const createInitialSnakeStats = (): SnakeGameStats => ({
  score: 0,
  energyCollected: 0,
  survivalTime: 0,
  maxLength: INITIAL_SNAKE_LENGTH,
})

// 방향 반대 체크 (180도 회전 방지)
export const isOppositeDirection = (current: Direction, next: Direction): boolean => {
  const opposites: Record<Direction, Direction> = {
    up: 'down',
    down: 'up',
    left: 'right',
    right: 'left',
  }
  return opposites[current] === next
}

// 방향 유효성 체크 (반대 방향으로 갈 수 없음)
export const isValidDirection = (current: Direction, next: Direction): boolean => {
  return !isOppositeDirection(current, next)
}
