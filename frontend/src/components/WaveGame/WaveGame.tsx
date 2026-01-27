import React, { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Button from '@/components/Button/Button'
import {
  createWave,
  updateWave,
  checkTapTiming,
  updateStats,
  createInitialStats,
  DIFFICULTY_CONFIGS,
  DEFAULT_DIFFICULTY,
  type Wave,
  type GameStats,
  type TapResult,
  type DifficultyLevel,
  type DifficultyConfig,
} from './WaveGame.utils'

interface WaveGameProps {
  onGameEnd: (stats: GameStats) => void
  onClose: () => void
  energyElement?: any
}

type GameState = 'ready' | 'playing' | 'paused' | 'ended'

const GAME_DURATION = 60 // 60초

const WaveGame: React.FC<WaveGameProps> = ({ onGameEnd, onClose, energyElement }) => {
  const [gameState, setGameState] = useState<GameState>('ready')
  const [selectedDifficulty, setSelectedDifficulty] = useState<DifficultyLevel | null>(null)
  const [currentDifficultyConfig, setCurrentDifficultyConfig] = useState<DifficultyConfig | null>(null)
  const [waves, setWaves] = useState<Wave[]>([])
  const [stats, setStats] = useState<GameStats>(createInitialStats())
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION)
  const [lastTapResult, setLastTapResult] = useState<TapResult | null>(null)
  
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationFrameRef = useRef<number>()
  const lastTimeRef = useRef<number>(Date.now())
  const waveSpawnTimerRef = useRef<NodeJS.Timeout>()
  const gameTimerRef = useRef<NodeJS.Timeout>()
  const waveIndexRef = useRef<number>(0)

  // 색상 변환 유틸리티
  const hexToRgba = useCallback((hex: string, alpha: number) => {
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    return `rgba(${r}, ${g}, ${b}, ${alpha})`
  }, [])

  // Canvas 그리기
  const drawWave = useCallback((ctx: CanvasRenderingContext2D, wave: Wave, canvasWidth: number, canvasHeight: number) => {
    const x = (wave.x / 100) * canvasWidth
    const waveY = (wave.y / 100) * canvasHeight // 파형이 지나갈 Y 위치
    const time = (Date.now() - wave.createdAt) / 1000
    
    // 중앙까지의 거리 계산 (타이밍 표시용)
    const distanceFromCenter = Math.abs(wave.x - 50)
    const isNearCenter = distanceFromCenter < 10 // 중앙 근처인지 확인
    
    // 파형 그리기 - 좌측에서 우측으로 흐르는 파형
    ctx.beginPath()
    const waveColor = energyElement?.color || '#1e3a5f'
    
    // 파형이 처음부터 명확하게 보이도록 투명도 조정
    // 중앙에 가까울수록 밝게, 멀수록 약간 어둡게 (하지만 항상 보이도록)
    const opacity = isNearCenter ? 1 : Math.max(0.7, 1 - (distanceFromCenter / 50) * 0.3)
    
    // 파형의 그라디언트 (좌측에서 우측으로)
    const gradient = ctx.createLinearGradient(x - 60, waveY, x + 60, waveY)
    gradient.addColorStop(0, hexToRgba(waveColor, opacity * 0.4))
    gradient.addColorStop(0.5, waveColor)
    gradient.addColorStop(1, hexToRgba(waveColor, opacity * 0.4))
    
    ctx.strokeStyle = gradient
    ctx.lineWidth = 8 // 두께 증가로 더 명확하게
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.shadowBlur = 20
    ctx.shadowColor = hexToRgba(waveColor, opacity * 0.5)
    
    // 파형 그리기 (사인파 패턴)
    const points = 50
    const waveWidth = 120 // 파형의 너비
    
    for (let i = 0; i < points; i++) {
      const t = i / points
      const offsetX = (t - 0.5) * waveWidth
      // 사인파로 위아래로 흔들리는 파형
      const offsetY = Math.sin(time * wave.frequency * 15 + wave.phase + t * Math.PI * 3) * wave.amplitude
      const px = x + offsetX
      const py = waveY + offsetY
      
      if (i === 0) {
        ctx.moveTo(px, py)
      } else {
        ctx.lineTo(px, py)
      }
    }
    ctx.stroke()
    ctx.shadowBlur = 0
    
    // 파형 중심에 강조 원 (처음부터 항상 표시)
    // 중앙에 가까울수록 더 밝게, 멀수록 약간 투명하게
    const circleOpacity = isNearCenter ? 1 : Math.max(0.6, 1 - (distanceFromCenter / 50) * 0.4)
    
    ctx.beginPath()
    ctx.arc(x, waveY, 12, 0, Math.PI * 2)
    ctx.fillStyle = hexToRgba(waveColor, circleOpacity)
    ctx.fill()
    ctx.strokeStyle = hexToRgba('#ffffff', circleOpacity)
    ctx.lineWidth = 3
    ctx.stroke()
  }, [energyElement, hexToRgba])

  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    // CSS 크기 기준으로 그리기 (DPR이 적용된 실제 크기가 아닌 표시 크기)
    const container = canvas.parentElement
    if (!container) return
    
    // 컨테이너의 실제 크기 측정
    const rect = container.getBoundingClientRect()
    const width = rect.width || container.clientWidth
    let height = rect.height || container.clientHeight
    
    // 높이가 너무 작으면 최소값 사용
    if (height < 300) {
      height = 300
    }
    
    // 배경 지우기 (실제 Canvas 크기로)
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    
    // 난이도에 따라 사용할 라인 결정
    if (!currentDifficultyConfig) return
    
    const maxLanes = currentDifficultyConfig.maxLanes
    // 5개 라인 위치 (0-100 기준): 10%, 30%, 50%, 70%, 90%
    const allLaneYPositions = [10, 30, 50, 70, 90]
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
    
    // 각 라인의 중앙선 그리기
    ctx.strokeStyle = 'rgba(16, 185, 129, 0.2)' // 초록색 반투명
    ctx.lineWidth = 1
    laneYPositions.forEach((yPercent) => {
      const y = (yPercent / 100) * height
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(width, y)
      ctx.stroke()
    })
    
    // 중앙 수직선 (X축 중앙)
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(width / 2, 0)
    ctx.lineTo(width / 2, height)
    ctx.stroke()
    
    // 각 라인의 목표 지점 표시 (파형이 지나오는 동안 계속 표시)
    const pulseTime = Date.now() / 200
    const pulseSize = 10 + Math.sin(pulseTime) * 3
    const pulseOpacity = 0.6 + Math.sin(pulseTime * 2) * 0.4
    
    // 현재 화면에 있는 파형들의 Y 위치 확인
    const activeWaveYs = new Set(waves.map(w => w.y))
    
    laneYPositions.forEach((yPercent) => {
      const y = (yPercent / 100) * height
      const yValue = yPercent // 0-100 기준
      
      // 파형이 해당 라인에 있거나 지나가는 중인지 확인
      const hasWaveNearby = Array.from(activeWaveYs).some(waveY => {
        // 파형이 해당 라인 근처에 있는지 확인 (Y축 5% 이내)
        return Math.abs(waveY - yValue) <= 5
      })
      
      // 파형이 있을 때 더 밝게, 없을 때도 표시 (항상 표시)
      const baseOpacity = 0.8
      const opacity = hasWaveNearby ? 1.0 : baseOpacity // 파형이 있을 때 더 밝게
      
      // 외부 링
      ctx.beginPath()
      ctx.arc(width / 2, y, pulseSize + 5, 0, Math.PI * 2)
      ctx.strokeStyle = hexToRgba('#10b981', pulseOpacity * 0.3 * opacity)
      ctx.lineWidth = 2
      ctx.stroke()
      
      // 메인 원 (항상 표시)
      ctx.beginPath()
      ctx.arc(width / 2, y, pulseSize, 0, Math.PI * 2)
      ctx.fillStyle = hexToRgba('#10b981', opacity)
      ctx.fill()
      ctx.strokeStyle = '#ffffff'
      ctx.lineWidth = 4
      ctx.stroke()
      
      // 목표 지점 내부 원
      ctx.beginPath()
      ctx.arc(width / 2, y, 5, 0, Math.PI * 2)
      ctx.fillStyle = '#ffffff'
      ctx.fill()
      
      // 십자선
      ctx.strokeStyle = hexToRgba('#10b981', 0.3 * opacity)
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(width / 2 - 15, y)
      ctx.lineTo(width / 2 + 15, y)
      ctx.moveTo(width / 2, y - 15)
      ctx.lineTo(width / 2, y + 15)
      ctx.stroke()
    })
    
    // 파형들 그리기
    waves.forEach(wave => {
      drawWave(ctx, wave, width, height)
    })
  }, [waves, drawWave, hexToRgba, currentDifficultyConfig])

  // 게임 루프
  useEffect(() => {
    if (gameState !== 'playing') return
    
    const animate = () => {
      const now = Date.now()
      const deltaTime = now - lastTimeRef.current
      lastTimeRef.current = now
      
      // 파형 업데이트
      setWaves(prevWaves => {
        const updated = prevWaves
          .map(wave => updateWave(wave, deltaTime))
          .filter(wave => {
            // 화면 밖으로 완전히 나간 파형만 제거 (우측으로 나간 경우)
            return wave.x <= 115 // 좌측은 -15까지 허용, 우측은 115까지
          })
        return updated
      })
      
      drawCanvas()
      animationFrameRef.current = requestAnimationFrame(animate)
    }
    
    animationFrameRef.current = requestAnimationFrame(animate)
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [gameState, waves, drawCanvas])

  // 파형 생성 타이머
  useEffect(() => {
    if (gameState !== 'playing') {
      if (waveSpawnTimerRef.current) {
        clearInterval(waveSpawnTimerRef.current)
        waveSpawnTimerRef.current = undefined
      }
      return
    }
    
    const spawnWave = () => {
      if (!currentDifficultyConfig) return
      
      const elapsedTime = GAME_DURATION - timeLeft
      const newWave = createWave(waveIndexRef.current, currentDifficultyConfig, elapsedTime)
      waveIndexRef.current++
      setWaves(prev => [...prev, newWave])
    }
    
    // 즉시 첫 파형 생성
    spawnWave()
    
    // 주기적으로 파형 생성 (난이도별 간격 사용)
    const spawnInterval = currentDifficultyConfig?.spawnInterval || 1500
    waveSpawnTimerRef.current = setInterval(spawnWave, spawnInterval)
    
    return () => {
      if (waveSpawnTimerRef.current) {
        clearInterval(waveSpawnTimerRef.current)
        waveSpawnTimerRef.current = undefined
      }
    }
  }, [gameState, timeLeft, currentDifficultyConfig]) // currentDifficultyConfig 추가

  // 게임 타이머
  useEffect(() => {
    if (gameState !== 'playing') {
      if (gameTimerRef.current) {
        clearInterval(gameTimerRef.current)
        gameTimerRef.current = undefined
      }
      return
    }
    
    // 정확한 1초 간격으로 타이머 설정
    const startTime = Date.now()
    
    // 즉시 첫 업데이트
    setTimeLeft(GAME_DURATION)
    
    // 1초마다 정확하게 업데이트 (경과 시간 기준으로 계산)
    gameTimerRef.current = setInterval(() => {
      const now = Date.now()
      const elapsedSeconds = Math.floor((now - startTime) / 1000)
      const newTimeLeft = GAME_DURATION - elapsedSeconds
      
      if (newTimeLeft <= 0) {
        setTimeLeft(0)
        setGameState('ended')
        if (gameTimerRef.current) {
          clearInterval(gameTimerRef.current)
          gameTimerRef.current = undefined
        }
      } else {
        // 경과 시간 기준으로 계산하므로 정확함
        setTimeLeft(newTimeLeft)
      }
    }, 1000) // 1초마다 실행
    
    return () => {
      if (gameTimerRef.current) {
        clearInterval(gameTimerRef.current)
        gameTimerRef.current = undefined
      }
    }
  }, [gameState]) // gameState만 의존성으로 사용

  // 게임 종료 처리
  useEffect(() => {
    if (gameState === 'ended') {
      onGameEnd(stats)
    }
  }, [gameState, stats, onGameEnd])

  // 탭 처리 중복 방지
  const isProcessingTap = useRef(false)
  const lastTapTime = useRef<number>(0)
  const processedWaveIds = useRef<Set<string>>(new Set())

  // 화면 탭/클릭 처리
  const handleTap = useCallback((e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    // 이벤트 전파 완전 차단
    e.preventDefault()
    e.stopPropagation()
    
    if (gameState !== 'playing') return
    
    const now = Date.now()
    
    // 중복 처리 방지 (200ms 이내 중복 탭 무시)
    if (isProcessingTap.current || (now - lastTapTime.current) < 200) {
      return
    }
    
    isProcessingTap.current = true
    lastTapTime.current = now
    
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
    
    // 탭한 위치에 가장 가까운 파형 찾기 (X축과 Y축 모두 고려)
    let closestWave: Wave | null = null
    let minDistance = Infinity
    
    // 현재 waves 배열을 한 번만 순회하여 가장 가까운 파형 하나만 선택
    // 이미 처리된 파형은 제외
    for (const wave of waves) {
      // 이미 처리된 파형은 건너뛰기
      if (processedWaveIds.current.has(wave.id)) {
        continue
      }
      
      // X축 거리 (중앙까지)
      const distanceX = Math.abs(wave.x - 50)
      // Y축 거리 (파형의 Y 위치까지)
      const distanceY = Math.abs(tapY - wave.y)
      // 전체 거리
      const totalDistance = Math.sqrt(distanceX ** 2 + distanceY ** 2)
      
      // 중앙 30 이내에 있고, Y축도 20 이내에 있는 파형만 고려
      if (distanceX <= 30 && distanceY <= 20 && totalDistance < minDistance) {
        minDistance = totalDistance
        closestWave = wave
      }
    }
    
    // 가장 가까운 파형이 있을 때만 처리
    if (closestWave && currentDifficultyConfig) {
      // 이미 처리된 파형으로 표시
      processedWaveIds.current.add(closestWave.id)
      
      const result = checkTapTiming(closestWave, tapX, tapY, currentDifficultyConfig)
      
      // 통계 업데이트 (한 번만) - 점수 변화 계산
      let actualScoreChange = 0
      setStats(prev => {
        const updated = updateStats(prev, result)
        // 실제 점수 변화량 계산 (콤보 보너스 포함)
        actualScoreChange = updated.score - prev.score
        return updated
      })
      
      // 피드백용 결과 설정 (실제 점수 변화량 포함)
      const feedbackResult = {
        ...result,
        score: Math.abs(actualScoreChange), // 절댓값으로 표시
      }
      setLastTapResult(feedbackResult)
      
      // 히트 시 해당 파형만 제거 (다른 파형은 영향 없음)
      if (result.hit) {
        setWaves(prev => {
          // 정확히 하나의 파형만 제거
          return prev.filter(w => w.id !== closestWave!.id)
        })
      } else {
        // Miss인 경우에도 처리된 것으로 표시하여 중복 처리 방지
        // 하지만 파형은 남겨둠 (다시 시도 가능하도록)
        setTimeout(() => {
          processedWaveIds.current.delete(closestWave!.id)
        }, 500) // 0.5초 후 다시 시도 가능
      }
      
      // 피드백 메시지 1초 후 제거
      setTimeout(() => setLastTapResult(null), 1000)
      
      // 중복 처리 방지 해제 (400ms 후)
      setTimeout(() => {
        isProcessingTap.current = false
      }, 400)
    } else {
      // 파형이 없으면 즉시 해제
      isProcessingTap.current = false
    }
  }, [gameState, waves])

  // 난이도 선택
  const handleDifficultySelect = (level: DifficultyLevel) => {
    setSelectedDifficulty(level)
    setCurrentDifficultyConfig(DIFFICULTY_CONFIGS[level])
  }

  // 게임 시작
  const handleStart = () => {
    if (!selectedDifficulty || !currentDifficultyConfig) {
      // 난이도가 선택되지 않았으면 경고 (실제로는 UI에서 버튼 비활성화)
      return
    }
    
    setGameState('playing')
    setStats(createInitialStats())
    setTimeLeft(GAME_DURATION)
    setWaves([])
    lastTimeRef.current = Date.now()
    waveIndexRef.current = 0 // 파형 인덱스 리셋
    processedWaveIds.current.clear() // 처리된 파형 ID 초기화
    isProcessingTap.current = false // 탭 처리 플래그 초기화
    lastTapTime.current = 0 // 마지막 탭 시간 초기화
  }

  // Canvas 리사이즈 처리
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const resizeCanvas = () => {
      const container = canvas.parentElement
      if (!container) return
      
      // 컨테이너의 실제 크기 측정 (getBoundingClientRect 사용)
      const rect = container.getBoundingClientRect()
      const containerWidth = rect.width || container.clientWidth
      let containerHeight = rect.height || container.clientHeight
      
      // absolute positioning이므로 부모의 실제 크기 사용
      // 높이가 0이거나 너무 작으면 최소값 사용
      if (containerHeight < 300 || containerHeight === 0 || !containerHeight) {
        // 부모 컨테이너에서 높이 계산 시도
        const parent = container.parentElement
        if (parent) {
          const parentRect = parent.getBoundingClientRect()
          const parentHeight = parentRect.height || parent.clientHeight
          // 헤더, 패딩 등을 고려 (대략 150px 차감)
          containerHeight = Math.max(parentHeight - 150, 300)
        } else {
          containerHeight = 300
        }
      }
      
      // 최소 높이 보장
      const minHeight = 300
      const calculatedHeight = Math.max(containerHeight, minHeight)
      
      // 디바이스 픽셀 비율 고려
      const dpr = window.devicePixelRatio || 1
      
      // Canvas 실제 크기 (고해상도 렌더링)
      const actualWidth = containerWidth * dpr
      const actualHeight = calculatedHeight * dpr
      
      // Canvas 크기 설정
      if (canvas.width !== actualWidth || canvas.height !== actualHeight) {
        canvas.width = actualWidth
        canvas.height = actualHeight
        
        // CSS 표시 크기
        canvas.style.width = `${containerWidth}px`
        canvas.style.height = `${calculatedHeight}px`
        
        // Canvas 컨텍스트 스케일 조정
        const ctx = canvas.getContext('2d')
        if (ctx) {
          ctx.setTransform(1, 0, 0, 1, 0, 0) // 리셋
          ctx.scale(dpr, dpr)
        }
      }
      
      // 그리기 실행
      drawCanvas()
    }
    
    // 초기 리사이즈 (약간의 지연으로 레이아웃 안정화 대기)
    const initialTimeout = setTimeout(resizeCanvas, 50)
    
    // 리사이즈 이벤트 리스너
    window.addEventListener('resize', resizeCanvas)
    
    // ResizeObserver로 컨테이너 크기 변화 감지
    let resizeObserver: ResizeObserver | null = null
    const container = canvas.parentElement
    if (container && typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => {
        resizeCanvas()
      })
      resizeObserver.observe(container)
    }
    
    // 게임 상태가 playing일 때 주기적으로 리사이즈 체크 (레이아웃 변화 대응)
    // 하지만 너무 자주 체크하지 않도록 2초마다 체크
    let resizeInterval: NodeJS.Timeout | null = null
    if (gameState === 'playing') {
      resizeInterval = setInterval(() => {
        resizeCanvas()
      }, 2000) // 2초마다 체크
    }
    
    return () => {
      clearTimeout(initialTimeout)
      window.removeEventListener('resize', resizeCanvas)
      if (resizeObserver) {
        resizeObserver.disconnect()
      }
      if (resizeInterval) {
        clearInterval(resizeInterval)
      }
    }
  }, [drawCanvas, gameState])

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col"
        style={{ 
          maxHeight: '90vh',
          height: '90vh',
          minHeight: '600px'
        }}
      >
        {/* 헤더 */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            에너지 파형 맞추기
          </h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            ✕
          </Button>
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
                className="flex-1 flex flex-col items-center justify-start text-center space-y-4 py-4"
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
                  🌊
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
                  파형이 <strong className="text-primary">좌측에서 우측으로</strong> 흐릅니다.<br />
                  파형이 <strong className="text-green-500">중앙(초록 원)</strong>을 지날 때 탭하세요!
                </motion.p>

                {/* 난이도 선택 */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="w-full max-w-2xl"
                >
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                    난이도를 선택하세요
                  </p>
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    {(Object.keys(DIFFICULTY_CONFIGS) as DifficultyLevel[]).map((level) => {
                      const config = DIFFICULTY_CONFIGS[level]
                      const isSelected = selectedDifficulty === level
                      const colorClasses = {
                        easy: 'border-green-500 bg-green-50 dark:bg-green-900/20',
                        normal: 'border-blue-500 bg-blue-50 dark:bg-blue-900/20',
                        hard: 'border-red-500 bg-red-50 dark:bg-red-900/20',
                      }
                      const textColorClasses = {
                        easy: 'text-green-600 dark:text-green-400',
                        normal: 'text-blue-600 dark:text-blue-400',
                        hard: 'text-red-600 dark:text-red-400',
                      }
                      
                      return (
                        <motion.div
                          key={level}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.4 + (level === 'easy' ? 0 : level === 'normal' ? 0.1 : 0.2) }}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleDifficultySelect(level)}
                          className={`
                            p-4 rounded-lg border-2 cursor-pointer transition-all
                            ${isSelected 
                              ? `${colorClasses[level]} border-opacity-100 shadow-lg` 
                              : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 hover:border-opacity-50'
                            }
                          `}
                        >
                          <div className="text-center">
                            <div className="text-3xl mb-2">{config.icon}</div>
                            <div className={`font-bold text-lg mb-1 ${isSelected ? textColorClasses[level] : 'text-gray-700 dark:text-gray-300'}`}>
                              {config.korean}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                              {config.description}
                            </div>
                            {isSelected && (
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className={`inline-block px-2 py-1 rounded text-xs font-semibold ${textColorClasses[level]} bg-white dark:bg-gray-800`}
                              >
                                선택됨
                              </motion.div>
                            )}
                          </div>
                        </motion.div>
                      )
                    })}
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.7 }}
                  className="space-y-2 text-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 p-4 rounded-lg w-full max-w-md"
                >
                  <p className="font-semibold text-gray-700 dark:text-gray-300 mb-2">점수 기준:</p>
                  <p>• <span className="text-purple-500 font-bold">Excellent</span> (파형+탭 모두 정확히 중앙): <span className="font-bold">30점</span></p>
                  <p>• <span className="text-green-500 font-bold">Perfect</span> (파형+탭 모두 중앙 근처): <span className="font-bold">20점</span></p>
                  <p>• <span className="text-yellow-500 font-bold">Good</span> (파형+탭 모두 어느 정도 근처): <span className="font-bold">10점</span></p>
                  <p>• <span className="text-red-500 font-bold">Miss</span>: <span className="font-bold">-5점</span> (점수 감점)</p>
                  <p className="mt-2 pt-2 border-t border-gray-300 dark:border-gray-600">
                    연속 성공 시 <span className="text-primary font-bold">콤보 보너스</span>! (최대 3배)
                  </p>
                </motion.div>
                
                {/* 게임 시작 버튼 - 항상 하단에 고정 */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.8 }}
                  className="w-full max-w-md mt-4"
                >
                  <Button 
                    onClick={handleStart} 
                    size="lg"
                    disabled={!selectedDifficulty}
                    className={`w-full ${!selectedDifficulty ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {selectedDifficulty ? `${DIFFICULTY_CONFIGS[selectedDifficulty].korean} 난이도로 시작` : '난이도를 선택하세요'}
                  </Button>
                </motion.div>
              </motion.div>
            )}

            {gameState === 'playing' && (
              <motion.div
                key="playing"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 flex flex-col min-h-0"
                style={{ 
                  minHeight: '400px',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column'
                }}
              >
                {/* 게임 정보 */}
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex justify-between items-center mb-4 flex-shrink-0"
                  style={{ minHeight: '50px' }}
                >
                  <div className="flex gap-4 text-sm flex-wrap">
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">점수: </span>
                      <motion.span
                        key={stats.score}
                        initial={{ scale: 1.2 }}
                        animate={{ scale: 1 }}
                        transition={{ duration: 0.2 }}
                        className="font-bold text-primary inline-block"
                      >
                        {stats.score.toLocaleString()}
                      </motion.span>
                    </div>
                    <motion.div
                      key={stats.combo}
                      initial={{ scale: stats.combo > 0 ? 1.3 : 1 }}
                      animate={{ scale: 1 }}
                      transition={{ duration: 0.2 }}
                      className={stats.combo > 0 ? 'text-green-500' : ''}
                    >
                      <span className="text-gray-500 dark:text-gray-400">콤보: </span>
                      <span className="font-bold text-green-500">{stats.combo}</span>
                    </motion.div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">정확도: </span>
                      <span className="font-bold">{stats.accuracy.toFixed(0)}%</span>
                    </div>
                  </div>
                  <motion.div
                    key={timeLeft}
                    initial={{ scale: 1.2 }}
                    animate={{ scale: 1 }}
                    className={`text-lg font-bold ${
                      timeLeft <= 10 ? 'text-red-500' : 'text-primary'
                    }`}
                  >
                    {timeLeft}초
                  </motion.div>
                </motion.div>

                {/* Canvas 영역 */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex-1 bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 rounded-lg overflow-hidden relative shadow-inner"
                  style={{ 
                    minHeight: '300px',
                    flex: '1 1 0%', // flex-grow, flex-shrink, flex-basis
                    display: 'flex',
                    flexDirection: 'column',
                    position: 'relative'
                  }}
                >
                  <canvas
                    ref={canvasRef}
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      handleTap(e)
                    }}
                    onTouchStart={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      handleTap(e)
                    }}
                    onTouchEnd={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                    }}
                    className="absolute inset-0 cursor-pointer touch-none"
                    style={{ 
                      display: 'block', 
                      width: '100%', 
                      height: '100%'
                    }}
                  />
                  
                  {/* 탭 피드백 (타이밍 + 점수 변화 통합) */}
                  <AnimatePresence>
                    {lastTapResult && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8, y: -20 }}
                        animate={{ 
                          opacity: 1, 
                          scale: 1.0, 
                          y: 0,
                          filter: 'blur(0px)',
                        }}
                        exit={{ 
                          opacity: 0, 
                          scale: 0.7, 
                          y: 15,
                          filter: 'blur(8px)',
                        }}
                        transition={{
                          type: 'spring',
                          stiffness: 300,
                          damping: 20,
                        }}
                        className={`absolute top-1/3 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none z-10 text-center ${
                          lastTapResult.timing === 'excellent'
                            ? 'text-purple-500 drop-shadow-[0_0_15px_rgba(168,85,247,0.7)]'
                            : lastTapResult.timing === 'perfect'
                            ? 'text-green-500 drop-shadow-[0_0_12px_rgba(34,197,94,0.6)]'
                            : lastTapResult.timing === 'good'
                            ? 'text-yellow-500 drop-shadow-[0_0_10px_rgba(234,179,8,0.5)]'
                            : 'text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.4)]'
                        }`}
                        style={{
                          fontWeight: 700,
                          textShadow: '0 0 10px currentColor',
                        }}
                      >
                        <div style={{
                          fontSize: lastTapResult.timing === 'excellent' ? '1.75rem' : 
                                   lastTapResult.timing === 'perfect' ? '1.5rem' : 
                                   lastTapResult.timing === 'good' ? '1.25rem' : '1rem',
                        }}>
                          {lastTapResult.timing === 'excellent' && '⭐ EXCELLENT! ⭐'}
                          {lastTapResult.timing === 'perfect' && '✨ PERFECT! ✨'}
                          {lastTapResult.timing === 'good' && 'GOOD!'}
                          {lastTapResult.timing === 'miss' && 'MISS'}
                        </div>
                        {/* 점수 변화 표시 (타이밍 아래) */}
                        <motion.div
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.1 }}
                          className="text-lg font-bold mt-1"
                        >
                          {lastTapResult.hit ? '+' : '-'}{lastTapResult.score}
                        </motion.div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>

                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center flex-shrink-0"
                >
                  💡 파형이 <span className="text-green-500 font-semibold">중앙(초록 원)</span>을 지날 때 탭하세요!
                </motion.p>
              </motion.div>
            )}

            {gameState === 'ended' && (
              <motion.div
                key="ended"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 flex items-center justify-center"
              >
                <div className="text-center">
                  <div className="text-4xl mb-4">🎉</div>
                  <p className="text-lg text-gray-600 dark:text-gray-400">
                    게임 종료!
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  )
}

export default WaveGame
