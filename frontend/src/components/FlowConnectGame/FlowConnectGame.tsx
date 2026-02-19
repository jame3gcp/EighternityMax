import React, { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Button from '@/components/Button/Button'
import {
  GAME_DURATION,
  createInitialFlowConnectStats,
  generatePointsForRound,
  getTappedPointIndex,
  isCorrectTap,
  scoreForCorrect,
  DIFFICULTY_CONFIGS,
  DEFAULT_DIFFICULTY,
  type DifficultyLevel,
  type DifficultyConfig,
  type Point,
  type FlowConnectGameStats,
} from './FlowConnectGame.utils'

interface FlowConnectGameProps {
  onGameEnd: (stats: FlowConnectGameStats) => void
  onClose: () => void
  energyElement?: { color?: string; korean?: string; id?: string }
}

type GameState = 'ready' | 'playing' | 'ended'

const FlowConnectGame: React.FC<FlowConnectGameProps> = ({ onGameEnd, onClose, energyElement }) => {
  const [gameState, setGameState] = useState<GameState>('ready')
  const [selectedDifficulty, setSelectedDifficulty] = useState<DifficultyLevel | null>(null)
  const [currentDifficultyConfig, setCurrentDifficultyConfig] = useState<DifficultyConfig | null>(null)
  const [stats, setStats] = useState<FlowConnectGameStats>(createInitialFlowConnectStats())
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION)
  const [currentRound, setCurrentRound] = useState(0)
  const [points, setPoints] = useState<Point[]>([])
  const [nextExpected, setNextExpected] = useState(1)
  const [combo, setCombo] = useState(0)

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const gameTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const startTimeRef = useRef<number>(0)
  const isProcessingTap = useRef(false)
  const lastTapTimeRef = useRef(0)
  const accentColor = energyElement?.color || '#6366f1'

  const hexToRgba = useCallback((hex: string, alpha: number) => {
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    return `rgba(${r}, ${g}, ${b}, ${alpha})`
  }, [])

  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current
    // #region agent log
    if (!canvas || !currentDifficultyConfig) {
      fetch('http://127.0.0.1:7242/ingest/143e5328-082d-42a3-89a0-aa11798b559d',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'0d82ae'},body:JSON.stringify({sessionId:'0d82ae',location:'FlowConnectGame.tsx:drawCanvas',message:'drawCanvas early return',data:{reason:!canvas?'noCanvas':!currentDifficultyConfig?'noConfig':'ok',pointsLen:points.length},timestamp:Date.now(),hypothesisId:'A'})}).catch(()=>{});
      return;
    }
    if (points.length === 0) {
      fetch('http://127.0.0.1:7242/ingest/143e5328-082d-42a3-89a0-aa11798b559d',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'0d82ae'},body:JSON.stringify({sessionId:'0d82ae',location:'FlowConnectGame.tsx:drawCanvas',message:'drawCanvas early return points empty',data:{pointsLen:0},timestamp:Date.now(),hypothesisId:'E'})}).catch(()=>{});
      return;
    }
    // #endregion
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const container = canvas.parentElement
    if (!container) return
    const rect = container.getBoundingClientRect()
    const w = rect.width || container.clientWidth
    const h = rect.height || container.clientHeight
    if (w <= 0 || h <= 0) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/143e5328-082d-42a3-89a0-aa11798b559d',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'0d82ae'},body:JSON.stringify({sessionId:'0d82ae',location:'FlowConnectGame.tsx:drawCanvas',message:'drawCanvas zero size',data:{w,h},timestamp:Date.now(),hypothesisId:'B'})}).catch(()=>{});
      // #endregion
      return;
    }
    const dpr = window.devicePixelRatio || 1
    const cw = w * dpr
    const ch = h * dpr
    if (canvas.width !== cw || canvas.height !== ch) {
      canvas.width = cw
      canvas.height = ch
      canvas.style.width = `${w}px`
      canvas.style.height = `${h}px`
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.scale(dpr, dpr)
    }
    const width = w
    const height = h
    ctx.clearRect(0, 0, width, height)

    const toX = (p: number) => (p / 100) * width
    const toY = (p: number) => (p / 100) * height
    const pointRadius = Math.min(width, height) * 0.04
    // #region agent log
    const first = points[0];
    if (first) {
      fetch('http://127.0.0.1:7242/ingest/143e5328-082d-42a3-89a0-aa11798b559d',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'0d82ae'},body:JSON.stringify({sessionId:'0d82ae',location:'FlowConnectGame.tsx:drawCanvas',message:'drawCanvas first point',data:{pointsLen:points.length,nextExpected,width,height,pointRadius,firstNum:first.number,firstX:first.x,firstY:first.y,px:toX(first.x),py:toY(first.y)},timestamp:Date.now(),hypothesisId:'C'})}).catch(()=>{});
    }
    // #endregion

    const showTargetHighlight = currentDifficultyConfig?.level === 'easy'

    for (let i = 0; i < points.length; i++) {
      const p = points[i]
      const px = toX(p.x)
      const py = toY(p.y)
      const connected = p.number < nextExpected
      const isTarget = p.number === nextExpected

      if (connected && i > 0) {
        const prev = points[i - 1]
        ctx.beginPath()
        ctx.moveTo(toX(prev.x), toY(prev.y))
        ctx.lineTo(px, py)
        ctx.strokeStyle = hexToRgba(accentColor, 0.8)
        ctx.lineWidth = 4
        ctx.lineCap = 'round'
        ctx.stroke()
      }

      ctx.beginPath()
      ctx.arc(px, py, pointRadius, 0, Math.PI * 2)
      if (connected) {
        ctx.fillStyle = hexToRgba(accentColor, 0.9)
        ctx.fill()
        ctx.strokeStyle = '#fff'
        ctx.lineWidth = 2
        ctx.stroke()
      } else if (showTargetHighlight && isTarget) {
        ctx.fillStyle = hexToRgba(accentColor, 0.5)
        ctx.fill()
        ctx.strokeStyle = accentColor
        ctx.lineWidth = 3
        ctx.stroke()
      } else {
        ctx.fillStyle = 'rgba(100,100,100,0.3)'
        ctx.fill()
        ctx.strokeStyle = 'rgba(100,100,100,0.6)'
        ctx.lineWidth = 1
        ctx.stroke()
      }

      ctx.fillStyle = connected || (showTargetHighlight && isTarget) ? '#fff' : '#666'
      ctx.font = `bold ${Math.max(12, pointRadius)}px sans-serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(String(p.number), px, py)
    }
  }, [points, nextExpected, currentDifficultyConfig, accentColor, hexToRgba])

  useEffect(() => {
    if (gameState !== 'playing' || !currentDifficultyConfig) return
    drawCanvas()
  }, [gameState, currentDifficultyConfig, points, nextExpected, drawCanvas])

  const handleDifficultySelect = (level: DifficultyLevel) => {
    setSelectedDifficulty(level)
    setCurrentDifficultyConfig(DIFFICULTY_CONFIGS[level])
  }

  const handleStart = () => {
    if (!selectedDifficulty || !currentDifficultyConfig) return
    const initialPoints = generatePointsForRound(0, currentDifficultyConfig)
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/143e5328-082d-42a3-89a0-aa11798b559d',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'0d82ae'},body:JSON.stringify({sessionId:'0d82ae',location:'FlowConnectGame.tsx:handleStart',message:'handleStart points',data:{pointsLen:initialPoints.length,first:initialPoints[0]?{num:initialPoints[0].number,x:initialPoints[0].x,y:initialPoints[0].y}:null},timestamp:Date.now(),hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    setGameState('playing')
    setStats(createInitialFlowConnectStats())
    setTimeLeft(GAME_DURATION)
    setCurrentRound(0)
    setPoints(initialPoints)
    setNextExpected(1)
    setCombo(0)
    startTimeRef.current = Date.now()

    gameTimerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (gameTimerRef.current) clearInterval(gameTimerRef.current)
          setGameState('ended')
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  useEffect(() => {
    if (gameState !== 'playing') return
    const config = currentDifficultyConfig
    if (!config) return
    const nextPoints = generatePointsForRound(currentRound, config)
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/143e5328-082d-42a3-89a0-aa11798b559d',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'0d82ae'},body:JSON.stringify({sessionId:'0d82ae',location:'FlowConnectGame.tsx:useEffect points',message:'effect setPoints',data:{currentRound,pointsLen:nextPoints.length},timestamp:Date.now(),hypothesisId:'E'})}).catch(()=>{});
    // #endregion
    setPoints(nextPoints)
    setNextExpected(1)
  }, [gameState, currentRound, currentDifficultyConfig])

  const handleTap = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
      e.preventDefault()
      e.stopPropagation()
      if (gameState !== 'playing' || !currentDifficultyConfig) return
      const now = Date.now()
      if (isProcessingTap.current || now - lastTapTimeRef.current < 200) return
      isProcessingTap.current = true
      lastTapTimeRef.current = now

      const canvas = canvasRef.current
      if (!canvas) {
        isProcessingTap.current = false
        return
      }
      const rect = canvas.getBoundingClientRect()
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
      const tapX = ((clientX - rect.left) / rect.width) * 100
      const tapY = ((clientY - rect.top) / rect.height) * 100

      const tappedIndex = getTappedPointIndex(
        points,
        tapX,
        tapY,
        nextExpected,
        currentDifficultyConfig
      )

      if (tappedIndex === -1) {
        setTimeout(() => {
          isProcessingTap.current = false
        }, 200)
        return
      }

      const correct = isCorrectTap(tappedIndex, nextExpected)
      if (correct) {
        const addScore = scoreForCorrect(combo, currentDifficultyConfig)
        const newCombo = combo + 1
        setCombo(newCombo)
        setStats((s) => ({
          ...s,
          score: Math.max(0, s.score + addScore),
          correctConnections: s.correctConnections + 1,
          maxCombo: Math.max(s.maxCombo, newCombo),
        }))
        const next = nextExpected + 1
        if (next > points.length) {
          setStats((s) => ({
            ...s,
            score: s.score + currentDifficultyConfig.roundCompleteBonus,
            roundsCompleted: s.roundsCompleted + 1,
          }))
          setCurrentRound((r) => r + 1)
          setNextExpected(1)
        } else {
          setNextExpected(next)
        }
      } else {
        setCombo(0)
        setStats((s) => ({
          ...s,
          score: Math.max(0, s.score - currentDifficultyConfig.wrongTapPenalty),
          wrongTaps: s.wrongTaps + 1,
        }))
      }

      setTimeout(() => {
        isProcessingTap.current = false
      }, 200)
    },
    [
      gameState,
      currentDifficultyConfig,
      points,
      nextExpected,
      combo,
      currentRound,
    ]
  )

  useEffect(() => {
    if (gameState === 'ended') {
      const totalTime = Math.floor((Date.now() - startTimeRef.current) / 1000)
      setStats((s) => {
        const final = { ...s, totalTime }
        onGameEnd(final)
        return final
      })
    }
  }, [gameState, onGameEnd])

  useEffect(() => {
    return () => {
      if (gameTimerRef.current) clearInterval(gameTimerRef.current)
    }
  }, [])

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="min-h-full flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[min(90vh,calc(100dvh-2rem))] min-h-[280px]"
        >
          <div className="sticky top-0 z-10 shrink-0 p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between bg-white dark:bg-gray-800">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">에너지 흐름 연결</h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="창 닫기"
              className="flex items-center gap-1.5 shrink-0 px-3 min-h-[44px] justify-center rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 font-medium"
            >
              <span className="text-lg font-bold leading-none" aria-hidden>✕</span>
              <span className="text-sm">닫기</span>
            </button>
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
                  className="flex-1 flex flex-col items-center justify-start text-center space-y-4 py-4"
                >
                  <div className="text-6xl mb-4">🔗</div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white">게임 준비</h3>
                  <p className="text-gray-600 dark:text-gray-400 max-w-md">
                    번호가 매겨진 점을 <strong className="text-primary">1 → 2 → 3 …</strong> 순서대로 터치하여 연결하세요.
                  </p>

                  <div className="w-full max-w-2xl">
                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                      난이도를 선택하세요
                    </p>
                    <div className="grid grid-cols-3 gap-3 mb-4">
                      {(Object.keys(DIFFICULTY_CONFIGS) as DifficultyLevel[]).map((level) => {
                        const config = DIFFICULTY_CONFIGS[level]
                        const isSelected = selectedDifficulty === level
                        const colorClasses: Record<DifficultyLevel, string> = {
                          easy: 'border-green-500 bg-green-50 dark:bg-green-900/20',
                          normal: 'border-blue-500 bg-blue-50 dark:bg-blue-900/20',
                          hard: 'border-red-500 bg-red-50 dark:bg-red-900/20',
                        }
                        const textColorClasses: Record<DifficultyLevel, string> = {
                          easy: 'text-green-600 dark:text-green-400',
                          normal: 'text-blue-600 dark:text-blue-400',
                          hard: 'text-red-600 dark:text-red-400',
                        }
                        return (
                          <motion.div
                            key={level}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => handleDifficultySelect(level)}
                            className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                              isSelected
                                ? `${colorClasses[level]} border-opacity-100 shadow-lg`
                                : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 hover:border-opacity-50'
                            }`}
                          >
                            <div className="text-3xl mb-2">{config.icon}</div>
                            <div
                              className={`font-bold text-lg mb-1 ${
                                isSelected ? textColorClasses[level] : 'text-gray-700 dark:text-gray-300'
                              }`}
                            >
                              {config.korean}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {config.description}
                            </div>
                            {isSelected && (
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className={`mt-2 inline-block px-2 py-1 rounded text-xs font-semibold ${textColorClasses[level]} bg-white dark:bg-gray-800`}
                              >
                                선택됨
                              </motion.div>
                            )}
                          </motion.div>
                        )
                      })}
                    </div>
                  </div>

                  <div className="w-full max-w-md">
                    <Button
                      onClick={handleStart}
                      size="lg"
                      disabled={!selectedDifficulty}
                      className={`w-full ${!selectedDifficulty ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {selectedDifficulty
                        ? `${DIFFICULTY_CONFIGS[selectedDifficulty].korean} 난이도로 시작`
                        : '난이도를 선택하세요'}
                    </Button>
                  </div>
                </motion.div>
              )}

              {gameState === 'playing' && (
                <motion.div
                  key="playing"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex-1 flex flex-col min-h-0"
                  style={{ minHeight: '320px' }}
                >
                  <div className="flex justify-between items-center mb-4 flex-shrink-0">
                    <div className="flex gap-4 text-sm flex-wrap">
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">점수: </span>
                        <span className="font-bold text-primary">{stats.score}</span>
                      </div>
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">라운드: </span>
                        <span className="font-bold">{stats.roundsCompleted + 1}</span>
                      </div>
                      {combo > 0 && (
                        <div className="font-bold text-green-500">콤보 {combo}</div>
                      )}
                    </div>
                    <div
                      className={`text-lg font-bold ${
                        timeLeft <= 10 ? 'text-red-500' : 'text-primary'
                      }`}
                    >
                      {timeLeft}초
                    </div>
                  </div>

                  <div
                    className="flex-1 rounded-lg overflow-hidden relative bg-gray-100 dark:bg-gray-900"
                    style={{ minHeight: '280px' }}
                  >
                    <canvas
                      ref={(el) => {
                        (canvasRef as React.MutableRefObject<HTMLCanvasElement | null>).current = el
                        if (el && gameState === 'playing') drawCanvas()
                      }}
                      onClick={handleTap}
                      onTouchStart={(e) => {
                        e.preventDefault()
                        handleTap(e)
                      }}
                      onTouchEnd={(e) => e.preventDefault()}
                      className="absolute inset-0 w-full h-full cursor-pointer touch-none"
                      style={{ display: 'block' }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
                    {nextExpected <= points.length
                      ? `${nextExpected}번 점을 터치하세요`
                      : '라운드 완료!'}
                  </p>
                </motion.div>
              )}

              {gameState === 'ended' && (
                <motion.div
                  key="ended"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex-1 flex flex-col items-center justify-center text-center"
                >
                  <div className="text-6xl mb-4">🔗</div>
                  <h3 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">
                    게임 종료
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    최종 점수: {stats.score.toLocaleString()}점 · 라운드 {stats.roundsCompleted} 완료
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

export default FlowConnectGame
