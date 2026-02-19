import React, { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Button from '@/components/Button/Button'
import {
  GRID_SIZE,
  BASE_GAME_SPEED,
  createInitialSnake,
  generateEnergy,
  moveSnake,
  growSnake,
  checkCollision,
  checkEnergyCollection,
  updateSnakeStats,
  updateMaxLength,
  createInitialSnakeStats,
  isValidDirection,
  type Direction,
  type Snake,
  type Energy,
  type SnakeGameStats,
} from './SnakeGame.utils'

interface SnakeGameProps {
  onGameEnd: (stats: SnakeGameStats) => void
  onClose: () => void
  energyElement?: any
}

type GameState = 'ready' | 'playing' | 'paused' | 'ended'

const SnakeGame: React.FC<SnakeGameProps> = ({ onGameEnd, onClose, energyElement }) => {
  // 에러 상태 관리
  const [error, setError] = useState<string | null>(null)
  const [gameState, setGameState] = useState<GameState>('ready')
  const [snake, setSnake] = useState<Snake>([])
  const [energy, setEnergy] = useState<Energy | null>(null)
  const [direction, setDirection] = useState<Direction>('right')
  const [nextDirection, setNextDirection] = useState<Direction>('right')
  const [stats, setStats] = useState<SnakeGameStats>(createInitialSnakeStats())
  const [gameSpeed, setGameSpeed] = useState(BASE_GAME_SPEED)
  
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const gameLoopRef = useRef<number>()
  const gameTimerRef = useRef<number>()
  const lastUpdateTimeRef = useRef<number>(Date.now())
  const touchStartRef = useRef<{ x: number; y: number } | null>(null)
  
  // 게임 상태를 ref로 추적 (렌더링 최적화)
  const snakeRef = useRef<Snake>(snake)
  const directionRef = useRef<Direction>(direction)
  const energyRef = useRef<Energy | null>(energy)
  
  // ref와 state 동기화
  useEffect(() => {
    snakeRef.current = snake
  }, [snake])
  
  useEffect(() => {
    directionRef.current = direction
  }, [direction])
  
  useEffect(() => {
    energyRef.current = energy
  }, [energy])

  // 색상 변환 유틸리티
  const hexToRgba = useCallback((hex: string, alpha: number) => {
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    return `rgba(${r}, ${g}, ${b}, ${alpha})`
  }, [])

  // Canvas 그리기
  const drawCanvas = useCallback(() => {
    try {
      const canvas = canvasRef.current
      if (!canvas) return
      
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      
      const container = canvas.parentElement
      if (!container) return
      
      const rect = container.getBoundingClientRect()
      const width = rect.width || container.clientWidth
      const height = rect.height || container.clientHeight
      
      // 크기가 0이면 그리지 않음
      if (width <= 0 || height <= 0) return
      
      // Canvas 크기 설정
      const dpr = window.devicePixelRatio || 1
      const actualWidth = width * dpr
      const actualHeight = height * dpr
      
      if (canvas.width !== actualWidth || canvas.height !== actualHeight) {
        canvas.width = actualWidth
        canvas.height = actualHeight
        canvas.style.width = `${width}px`
        canvas.style.height = `${height}px`
        ctx.setTransform(1, 0, 0, 1, 0, 0)
        ctx.scale(dpr, dpr)
      }
      
      // 배경 지우기
      ctx.clearRect(0, 0, width, height)
      
      // 격자 그리기
      const cellSize = Math.min(width, height) / GRID_SIZE
      const offsetX = (width - cellSize * GRID_SIZE) / 2
      const offsetY = (height - cellSize * GRID_SIZE) / 2
      
      // 배경
      ctx.fillStyle = '#f9fafb'
      ctx.fillRect(offsetX, offsetY, cellSize * GRID_SIZE, cellSize * GRID_SIZE)
      
      // 격자선
      ctx.strokeStyle = '#e5e7eb'
      ctx.lineWidth = 1
      for (let i = 0; i <= GRID_SIZE; i++) {
        // 세로선
        ctx.beginPath()
        ctx.moveTo(offsetX + i * cellSize, offsetY)
        ctx.lineTo(offsetX + i * cellSize, offsetY + cellSize * GRID_SIZE)
        ctx.stroke()
        
        // 가로선
        ctx.beginPath()
        ctx.moveTo(offsetX, offsetY + i * cellSize)
        ctx.lineTo(offsetX + cellSize * GRID_SIZE, offsetY + i * cellSize)
        ctx.stroke()
      }
      
      // 에너지 아이템 그리기
      if (energy) {
        const energyX = offsetX + energy.position.x * cellSize
        const energyY = offsetY + energy.position.y * cellSize
        const energyColor = energyElement?.color || '#10b981'
        
        // 에너지 원 (펄스 효과)
        const pulseTime = Date.now() / 300
        const pulseSize = cellSize * 0.3 + Math.sin(pulseTime) * cellSize * 0.1
        
        ctx.beginPath()
        ctx.arc(
          energyX + cellSize / 2,
          energyY + cellSize / 2,
          pulseSize,
          0,
          Math.PI * 2
        )
        ctx.fillStyle = hexToRgba(energyColor, 0.8)
        ctx.fill()
        
        // 에너지 외곽선
        ctx.beginPath()
        ctx.arc(
          energyX + cellSize / 2,
          energyY + cellSize / 2,
          cellSize * 0.4,
          0,
          Math.PI * 2
        )
        ctx.strokeStyle = energyColor
        ctx.lineWidth = 3
        ctx.stroke()
      }
      
      // 지렁이 그리기 (빈 배열이어도 안전하게 처리)
      if (snake && snake.length > 0) {
        const snakeColor = energyElement?.color || '#3b82f6'
        snake.forEach((segment, index) => {
          const x = offsetX + segment.x * cellSize
          const y = offsetY + segment.y * cellSize
          
          // 머리는 더 밝게, 몸통은 점점 어둡게
          const isHead = index === 0
          const opacity = isHead ? 1 : 0.7 - (index / snake.length) * 0.3
          
          ctx.fillStyle = hexToRgba(snakeColor, opacity)
          ctx.fillRect(x + 2, y + 2, cellSize - 4, cellSize - 4)
          
          // 머리에 눈 그리기
          if (isHead) {
            ctx.fillStyle = '#ffffff'
            const eyeSize = cellSize * 0.15
            const eyeOffset = cellSize * 0.25
            
            // 방향에 따라 눈 위치 조정
            if (direction === 'right') {
              ctx.fillRect(x + cellSize - eyeOffset - eyeSize, y + eyeOffset, eyeSize, eyeSize)
              ctx.fillRect(x + cellSize - eyeOffset - eyeSize, y + cellSize - eyeOffset - eyeSize, eyeSize, eyeSize)
            } else if (direction === 'left') {
              ctx.fillRect(x + eyeOffset, y + eyeOffset, eyeSize, eyeSize)
              ctx.fillRect(x + eyeOffset, y + cellSize - eyeOffset - eyeSize, eyeSize, eyeSize)
            } else if (direction === 'up') {
              ctx.fillRect(x + eyeOffset, y + eyeOffset, eyeSize, eyeSize)
              ctx.fillRect(x + cellSize - eyeOffset - eyeSize, y + eyeOffset, eyeSize, eyeSize)
            } else if (direction === 'down') {
              ctx.fillRect(x + eyeOffset, y + cellSize - eyeOffset - eyeSize, eyeSize, eyeSize)
              ctx.fillRect(x + cellSize - eyeOffset - eyeSize, y + cellSize - eyeOffset - eyeSize, eyeSize, eyeSize)
            }
          }
          
          // 테두리
          ctx.strokeStyle = hexToRgba(snakeColor, opacity * 0.5)
          ctx.lineWidth = 2
          ctx.strokeRect(x + 2, y + 2, cellSize - 4, cellSize - 4)
        })
      }
    } catch (error: any) {
      console.error('Error drawing canvas:', error)
      setError('게임 화면을 그리는 중 오류가 발생했습니다.')
    }
  }, [snake, energy, direction, energyElement, hexToRgba])

  // 게임 업데이트
  const updateGame = useCallback(() => {
    try {
      if (gameState !== 'playing') return
      
      const now = Date.now()
      const deltaTime = now - lastUpdateTimeRef.current
      
      // 게임 속도에 따라 업데이트
      if (deltaTime < gameSpeed) return
      
      lastUpdateTimeRef.current = now
      
      // ref에서 현재 상태 가져오기
      const currentSnake = snakeRef.current
      const currentDirection = directionRef.current
      const currentEnergy = energyRef.current
      
      // 지렁이가 비어있으면 업데이트하지 않음
      if (!currentSnake || currentSnake.length === 0) return
      
      // 다음 방향이 유효하면 적용
      const newDirection = isValidDirection(currentDirection, nextDirection) ? nextDirection : currentDirection
      let newSnake: Snake
      
      // 에너지 수집 체크
      if (currentEnergy && checkEnergyCollection(currentSnake, currentEnergy)) {
        // 에너지를 먹으면 길어짐
        newSnake = growSnake(currentSnake, newDirection, GRID_SIZE)
        setStats(prevStats => {
          const updated = updateSnakeStats(prevStats, true, deltaTime)
          return updateMaxLength(updated, newSnake.length)
        })
        
        // 새 에너지 생성
        const newEnergy = generateEnergy(newSnake, GRID_SIZE)
        setEnergy(newEnergy)
        energyRef.current = newEnergy
      } else {
        // 일반 이동
        newSnake = moveSnake(currentSnake, newDirection, GRID_SIZE)
        
        // 충돌 체크
        if (checkCollision(newSnake, GRID_SIZE, true)) {
          // 게임 오버
          setGameState('ended')
          setStats(prevStats => {
            const finalStats = updateSnakeStats(prevStats, false, deltaTime)
            return updateMaxLength(finalStats, newSnake.length)
          })
          return
        }
        
        // 통계 업데이트
        setStats(prevStats => updateSnakeStats(prevStats, false, deltaTime))
      }
      
      // 상태 업데이트
      setSnake(newSnake)
      setDirection(newDirection)
      snakeRef.current = newSnake
      directionRef.current = newDirection
    } catch (error: any) {
      console.error('Error updating game:', error)
      // 에러 발생 시 게임 일시정지
      setGameState('paused')
      setError('게임 업데이트 중 오류가 발생했습니다.')
    }
  }, [gameState, nextDirection, gameSpeed])

  // Canvas 그리기 (게임 상태와 무관하게 항상 그리기)
  useEffect(() => {
    drawCanvas()
  }, [drawCanvas])

  // 게임 시작
  const handleStart = useCallback(() => {
    const initialSnake = createInitialSnake(GRID_SIZE)
    const initialEnergy = generateEnergy(initialSnake, GRID_SIZE)
    
    setSnake(initialSnake)
    setEnergy(initialEnergy)
    setDirection('right')
    setNextDirection('right')
    setStats(createInitialSnakeStats())
    setGameState('playing')
    lastUpdateTimeRef.current = Date.now()
    
    // ref 동기화
    snakeRef.current = initialSnake
    directionRef.current = 'right'
    energyRef.current = initialEnergy
    
    // 초기 렌더링
    setTimeout(() => {
      drawCanvas()
    }, 100)
  }, [drawCanvas])

  // 게임 루프
  useEffect(() => {
    if (gameState !== 'playing') return
    
    const animate = () => {
      updateGame()
      drawCanvas()
      gameLoopRef.current = requestAnimationFrame(animate)
    }
    
    gameLoopRef.current = requestAnimationFrame(animate)
    
    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current)
      }
    }
  }, [gameState, updateGame, drawCanvas])

  // 키보드 입력 처리
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (gameState !== 'playing' && gameState !== 'ready' && gameState !== 'paused') return
      
      let newDirection: Direction | null = null
      
      switch (e.key) {
        case 'ArrowUp':
          newDirection = 'up'
          break
        case 'ArrowDown':
          newDirection = 'down'
          break
        case 'ArrowLeft':
          newDirection = 'left'
          break
        case 'ArrowRight':
          newDirection = 'right'
          break
        case ' ':
          if (gameState === 'playing') {
            setGameState('paused')
          } else if (gameState === 'paused') {
            setGameState('playing')
          }
          e.preventDefault()
          return
      }
      
      if (newDirection) {
        e.preventDefault()
        setNextDirection(newDirection)
        if (gameState === 'ready') {
          handleStart()
        }
      }
    }
    
    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [gameState, handleStart])

  // 터치 제스처 처리 (스와이프 시 배경 스크롤 방지를 위해 preventDefault)
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (gameState !== 'playing' && gameState !== 'ready') return
    const touch = e.touches[0]
    touchStartRef.current = { x: touch.clientX, y: touch.clientY }
    e.preventDefault()
  }, [gameState])

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!touchStartRef.current) return
    const touch = e.changedTouches[0]
    const deltaX = touch.clientX - touchStartRef.current.x
    const deltaY = touch.clientY - touchStartRef.current.y
    const minSwipeDistance = 30
    if (Math.abs(deltaX) < minSwipeDistance && Math.abs(deltaY) < minSwipeDistance) {
      touchStartRef.current = null
      return
    }
    let newDirection: Direction | null = null
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      newDirection = deltaX > 0 ? 'right' : 'left'
    } else {
      newDirection = deltaY > 0 ? 'down' : 'up'
    }
    if (newDirection) {
      e.preventDefault()
      setNextDirection(newDirection)
      if (gameState === 'ready') {
        handleStart()
      }
    }
    touchStartRef.current = null
  }, [gameState, handleStart])

  // 게임 종료 처리
  useEffect(() => {
    if (gameState === 'ended') {
      onGameEnd(stats)
    }
  }, [gameState, stats, onGameEnd])

  // Canvas 리사이즈
  useEffect(() => {
    const resizeCanvas = () => {
      try {
        drawCanvas()
      } catch (error) {
        console.error('Error resizing canvas:', error)
      }
    }
    
    const initialTimeout = setTimeout(resizeCanvas, 50)
    window.addEventListener('resize', resizeCanvas)
    
    const container = canvasRef.current?.parentElement
    let resizeObserver: ResizeObserver | null = null
    if (container && typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => {
        resizeCanvas()
      })
      resizeObserver.observe(container)
    }
    
    return () => {
      clearTimeout(initialTimeout)
      window.removeEventListener('resize', resizeCanvas)
      if (resizeObserver) {
        resizeObserver.disconnect()
      }
    }
  }, [drawCanvas])

  // 에러 발생 시 에러 화면 표시
  if (error) {
    return (
      <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md p-6"
        >
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">오류 발생</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
          <Button onClick={onClose} className="w-full">
            닫기
          </Button>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="min-h-full flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[min(90vh,calc(100dvh-2rem))] min-h-[280px]"
        >
        {/* 헤더: 항상 보이도록 sticky + 배경 */}
        <div className="sticky top-0 z-10 shrink-0 p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between bg-white dark:bg-gray-800">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            에너지 모으기 지렁이
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="창 닫기"
            className="flex items-center gap-1.5 shrink-0 px-3 min-h-[44px] justify-center rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-600 hover:border-gray-400 dark:hover:border-gray-500 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 font-medium"
          >
            <span className="text-lg font-bold leading-none" aria-hidden>✕</span>
            <span className="text-sm">닫기</span>
          </button>
        </div>

        {/* 게임 영역 */}
        <div className="flex-1 p-4 flex flex-col min-h-0 overflow-y-auto">
          <AnimatePresence mode="wait">
            {gameState === 'ready' && (
              <motion.div
                key="ready"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="flex-1 flex flex-col items-center justify-center text-center space-y-4"
              >
                <motion.div
                  animate={{ 
                    rotate: [0, 10, -10, 0],
                    scale: [1, 1.1, 1],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    repeatType: 'reverse',
                  }}
                  className="text-6xl mb-4"
                >
                  🐍
                </motion.div>
                <motion.h3
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="text-2xl font-bold text-gray-900 dark:text-white"
                >
                  게임 준비
                </motion.h3>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="text-gray-600 dark:text-gray-400 max-w-md"
                >
                  화살표 키 또는 스와이프로 지렁이를 조작하여 에너지를 모으세요!
                  벽이나 자신의 몸과 부딪히면 게임이 끝납니다.
                </motion.p>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="mt-6"
                >
                  <Button onClick={handleStart} size="lg">
                    게임 시작
                  </Button>
                </motion.div>
              </motion.div>
            )}

            {(gameState === 'playing' || gameState === 'paused') && (
              <motion.div
                key="playing"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 flex flex-col min-h-0"
              >
                {/* 게임 정보 */}
                <div className="flex justify-between items-center mb-4 flex-shrink-0">
                  <div className="flex gap-4 text-sm flex-wrap">
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">점수: </span>
                      <span className="font-bold text-primary">{stats.score.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">에너지: </span>
                      <span className="font-bold text-green-500">{stats.energyCollected}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">길이: </span>
                      <span className="font-bold">{snake.length}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">생존: </span>
                      <span className="font-bold">{Math.floor(stats.survivalTime)}초</span>
                    </div>
                  </div>
                </div>

                {/* Canvas 영역: touch-none으로 스와이프 시 배경 스크롤 방지(모바일) */}
                <div
                  className="flex-1 bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 rounded-lg overflow-hidden relative shadow-inner touch-none select-none"
                  style={{ 
                    minHeight: '300px',
                    flex: '1 1 0%',
                    display: 'flex',
                    flexDirection: 'column',
                    position: 'relative',
                  }}
                  onTouchStart={handleTouchStart}
                  onTouchEnd={handleTouchEnd}
                >
                  <canvas
                    ref={canvasRef}
                    className="absolute inset-0"
                    style={{ 
                      display: 'block', 
                      width: '100%', 
                      height: '100%'
                    }}
                  />
                  
                  {/* 일시정지 오버레이 */}
                  {gameState === 'paused' && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
                      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 text-center">
                        <h3 className="text-xl font-bold mb-4">일시정지</h3>
                        <Button onClick={() => setGameState('playing')}>
                          계속하기
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center flex-shrink-0"
                >
                  💡 화살표 키 또는 스와이프로 조작하세요! 스페이스바로 일시정지
                </motion.p>
              </motion.div>
            )}

            {gameState === 'ended' && (
              <motion.div
                key="ended"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex-1 flex flex-col items-center justify-center text-center"
              >
                <div className="text-6xl mb-4">💥</div>
                <h3 className="text-2xl font-bold mb-2">게임 오버</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  최종 점수: {stats.score.toLocaleString()}점
                </p>
          </motion.div>
        )}
      </AnimatePresence>
        </div>
        </motion.div>
      </div>
    </div>
  )
}

export default SnakeGame
