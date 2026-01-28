import React, { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Button from '@/components/Button/Button'
import {
  GAME_DURATION,
  TICK_MS,
  GAUGE_MIN,
  GAUGE_MAX,
  applyDrift,
  applyPush,
  isInCenterZone,
  getCenterZoneRadius,
  gaugeToPercent,
  createInitialBalanceStats,
  POINTS_PER_TICK,
  CENTER_ZONE_RADIUS_INITIAL,
  type BalanceGameStats,
} from './BalanceGame.utils'

interface BalanceGameProps {
  onGameEnd: (stats: BalanceGameStats) => void
  onClose: () => void
  energyElement?: { color?: string; korean?: string; id?: string }
}

type GameState = 'ready' | 'playing' | 'ended'

const BalanceGame: React.FC<BalanceGameProps> = ({ onGameEnd, onClose, energyElement }) => {
  const [gameState, setGameState] = useState<GameState>('ready')
  const [gauge, setGauge] = useState(0)
  const [stats, setStats] = useState<BalanceGameStats>(createInitialBalanceStats())
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION)
  const [streak, setStreak] = useState(0)
  const [elapsedSeconds, setElapsedSeconds] = useState(0) // 동적 초록 영역용

  const startTimeRef = useRef<number>(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const lastTickRef = useRef<number>(0)

  const accentColor = energyElement?.color || '#10b981'

  const handleStart = useCallback(() => {
    setGameState('playing')
    setGauge(0)
    setStats(createInitialBalanceStats())
    setTimeLeft(GAME_DURATION)
    setStreak(0)
    setElapsedSeconds(0)
    startTimeRef.current = Date.now()
    lastTickRef.current = Date.now()

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current)
          if (tickRef.current) clearInterval(tickRef.current)
          setGameState('ended')
          return 0
        }
        return prev - 1
      })
    }, 1000)

    tickRef.current = setInterval(() => {
      const now = Date.now()
      const elapsed = (now - lastTickRef.current) / 1000
      lastTickRef.current = now
      const totalElapsed = (now - startTimeRef.current) / 1000
      setElapsedSeconds(totalElapsed)

      const currentRadius = getCenterZoneRadius(totalElapsed)

      setGauge((g) => {
        const next = applyDrift(g)
        const inZone = isInCenterZone(next, currentRadius)
        setStats((s) => {
          const timeInZone = s.timeInZone + (inZone ? elapsed : 0)
          const score = s.score + (inZone ? POINTS_PER_TICK : 0)
          return {
            ...s,
            score,
            timeInZone,
            percentInZone: 0,
            maxStreak: Math.max(s.maxStreak, inZone ? streak + 1 : 0),
          }
        })
        setStreak((st) => (inZone ? st + 1 : 0))
        return next
      })
    }, TICK_MS)
  }, [streak])

  const onGameEndRef = useRef(onGameEnd)
  onGameEndRef.current = onGameEnd

  useEffect(() => {
    if (gameState === 'ended') {
      if (timerRef.current) clearInterval(timerRef.current)
      if (tickRef.current) clearInterval(tickRef.current)
      setStats((s) => {
        const final: BalanceGameStats = {
          ...s,
          percentInZone: GAME_DURATION > 0 ? (s.timeInZone / GAME_DURATION) * 100 : 0,
        }
        onGameEndRef.current(final)
        return final
      })
    }
  }, [gameState])

  const pushIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const handlePushLeft = useCallback(() => {
    if (gameState !== 'playing') return
    setGauge((g) => applyPush(g, 'left'))
  }, [gameState])

  const handlePushRight = useCallback(() => {
    if (gameState !== 'playing') return
    setGauge((g) => applyPush(g, 'right'))
  }, [gameState])

  const startPushLeft = useCallback(() => {
    if (gameState !== 'playing') return
    handlePushLeft()
    pushIntervalRef.current = setInterval(handlePushLeft, 120)
  }, [gameState, handlePushLeft])

  const startPushRight = useCallback(() => {
    if (gameState !== 'playing') return
    handlePushRight()
    pushIntervalRef.current = setInterval(handlePushRight, 120)
  }, [gameState, handlePushRight])

  const stopPush = useCallback(() => {
    if (pushIntervalRef.current) {
      clearInterval(pushIntervalRef.current)
      pushIntervalRef.current = null
    }
  }, [])

  useEffect(() => {
    return () => stopPush()
  }, [stopPush])

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      if (tickRef.current) clearInterval(tickRef.current)
    }
  }, [])

  const percent = gaugeToPercent(gauge)
  const currentRadius = gameState === 'playing' ? getCenterZoneRadius(elapsedSeconds) : CENTER_ZONE_RADIUS_INITIAL
  const inZone = isInCenterZone(gauge, currentRadius)
  const zoneWidthPercent = (currentRadius * 2 / (GAUGE_MAX - GAUGE_MIN)) * 100
  const zoneLeftPercent = 50 - zoneWidthPercent / 2

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col"
        style={{ maxHeight: '90vh', height: '90vh', minHeight: '500px' }}
      >
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">밸런스 컨트롤</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            ✕
          </Button>
        </div>

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
                <div className="text-6xl mb-4">⚖️</div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">게임 준비</h3>
                <p className="text-gray-600 dark:text-gray-400 max-w-md">
                  왼쪽/오른쪽 버튼을 눌러 에너지 게이지를 중앙(초록 구간)에 유지하세요. 60초 동안
                  중앙에 가까울수록 점수가 올라갑니다.
                </p>
                <Button onClick={handleStart} size="lg" className="mt-6">
                  게임 시작
                </Button>
              </motion.div>
            )}

            {gameState === 'playing' && (
              <motion.div
                key="playing"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 flex flex-col min-h-0"
              >
                <div className="flex justify-between items-center mb-4 flex-shrink-0">
                  <div className="flex gap-4 text-sm flex-wrap">
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">점수: </span>
                      <span className="font-bold text-primary">{stats.score.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">중앙 유지: </span>
                      <span className="font-bold text-green-500">
                        {stats.timeInZone.toFixed(1)}초
                      </span>
                    </div>
                    {inZone && (
                      <div className="font-bold text-green-500">✓ 균형 유지 중</div>
                    )}
                  </div>
                  <div
                    className={`text-lg font-bold ${timeLeft <= 10 ? 'text-red-500' : 'text-primary'}`}
                  >
                    {timeLeft}초
                  </div>
                </div>

                {/* 게이지 바 */}
                <div className="flex-1 flex flex-col justify-center px-4">
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-2 text-center">
                    게이지를 중앙(초록)에 맞추세요
                  </p>
                  <div className="relative h-16 rounded-full bg-gray-200 dark:bg-gray-700 overflow-visible">
                    {/* 중앙 구간 (시간에 따라 줄어듦, 최소 절반에서 멈춤) */}
                    <div
                      className="absolute top-0 bottom-0 rounded-full opacity-30 transition-all duration-150"
                      style={{
                        left: `${zoneLeftPercent}%`,
                        width: `${zoneWidthPercent}%`,
                        backgroundColor: accentColor,
                      }}
                    />
                    {/* 게이지 니들 */}
                    <motion.div
                      className="absolute top-1/2 w-8 h-8 rounded-full border-4 border-white shadow-lg -translate-y-1/2 -translate-x-1/2"
                      style={{
                        left: `${percent}%`,
                        backgroundColor: inZone ? accentColor : '#6b7280',
                      }}
                      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    />
                  </div>

                  {/* 조작 버튼 */}
                  <div className="flex gap-4 mt-8 justify-center">
                    <Button
                      variant="outline"
                      size="lg"
                      onMouseDown={startPushLeft}
                      onMouseUp={stopPush}
                      onMouseLeave={stopPush}
                      onTouchStart={(e) => {
                        e.preventDefault()
                        startPushLeft()
                      }}
                      onTouchEnd={stopPush}
                      onTouchCancel={stopPush}
                      className="flex-1 max-w-[140px] touch-manipulation select-none"
                    >
                      ← 왼쪽
                    </Button>
                    <Button
                      variant="outline"
                      size="lg"
                      onMouseDown={startPushRight}
                      onMouseUp={stopPush}
                      onMouseLeave={stopPush}
                      onTouchStart={(e) => {
                        e.preventDefault()
                        startPushRight()
                      }}
                      onTouchEnd={stopPush}
                      onTouchCancel={stopPush}
                      className="flex-1 max-w-[140px] touch-manipulation select-none"
                    >
                      오른쪽 →
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
                    버튼을 누르고 있거나 반복해서 눌러 게이지를 조절하세요
                  </p>
                </div>
              </motion.div>
            )}

            {gameState === 'ended' && (
              <motion.div
                key="ended"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex-1 flex flex-col items-center justify-center text-center"
              >
                <div className="text-6xl mb-4">⚖️</div>
                <h3 className="text-2xl font-bold mb-2">게임 종료</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  최종 점수: {stats.score.toLocaleString()}점
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  )
}

export default BalanceGame
