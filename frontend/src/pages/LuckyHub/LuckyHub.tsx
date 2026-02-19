import React, { useState, useEffect, useCallback, useRef } from 'react'
import { Link } from 'react-router-dom'
import Card from '@/components/Card/Card'
import Button from '@/components/Button/Button'
import EnergyElementBadge from '@/components/EnergyElementBadge/EnergyElementBadge'
import { motion, AnimatePresence } from 'framer-motion'
import { luckyApi, gameScoresApi } from '@/services/api'
import { useLifeProfileStore } from '@/store/useLifeProfileStore'
import WaveGame from '@/components/WaveGame/WaveGame'
import WaveGameResult from '@/components/WaveGame/WaveGameResult'
import type { GameStats } from '@/components/WaveGame/WaveGame.utils'
import SnakeGame from '@/components/SnakeGame/SnakeGame'
import SnakeGameResult from '@/components/SnakeGame/SnakeGameResult'
import type { SnakeGameStats } from '@/components/SnakeGame/SnakeGame.utils'
import BalanceGame from '@/components/BalanceGame/BalanceGame'
import BalanceGameResult from '@/components/BalanceGame/BalanceGameResult'
import type { BalanceGameStats } from '@/components/BalanceGame/BalanceGame.utils'
import FlowConnectGame from '@/components/FlowConnectGame/FlowConnectGame'
import FlowConnectGameResult from '@/components/FlowConnectGame/FlowConnectGameResult'
import type { FlowConnectGameStats } from '@/components/FlowConnectGame/FlowConnectGame.utils'

// 오늘 날짜 기반으로 활성화된 Energy Element 계산
const getTodayEnergyElement = (lifeProfile?: any) => {
  if (!lifeProfile?.energyElements) return null
  
  // 간단한 로직: 오늘 날짜의 일(day)을 사용하여 Element 선택
  const today = new Date()
  const dayOfMonth = today.getDate()
  const elements = lifeProfile.energyElements
  
  // 날짜 기반 순환 로직 (5개 Element)
  const elementIndex = dayOfMonth % 5
  const elementIds = ['growth', 'vitality', 'stability', 'clarity', 'flow']
  const selectedId = elementIds[elementIndex]
  
  return elements.find((e: any) => e.id === selectedId) || elements.sort((a: any, b: any) => b.value - a.value)[0]
}

// 주차별 게임 목록 (나중에 사용 예정)
// const GAMES_BY_WEEK: Record<number, string[]> = {
//   1: ['wave', 'snake', 'flow-connect'], // 1주차: 파형, 지렁이, 흐름 연결
//   2: ['balance', 'color-match', 'direction-tap'], // 2주차
//   3: ['sequence-memory', 'pattern-find', 'symmetry-match'], // 3주차
//   4: ['choice-sim', 'path-select', 'energy-combo'] // 4주차
// }

// 게임별 Energy Element 매핑
const getEnergyElementForGame = (gameId: string, lifeProfile?: any) => {
  if (!lifeProfile?.energyElements) return null
  
  const elements = lifeProfile.energyElements
  
  switch (gameId) {
    case 'wave':
      // 파형 맞추기 → Clarity, Focus
      return elements.find((e: any) => e.id === 'clarity') || 
             elements.find((e: any) => e.id === 'stability') ||
             elements.sort((a: any, b: any) => b.value - a.value)[0]
    case 'snake':
      // 지렁이 게임 → Vitality, Flow (활동성, 흐름)
      return elements.find((e: any) => e.id === 'vitality') ||
             elements.find((e: any) => e.id === 'flow') ||
             elements.sort((a: any, b: any) => b.value - a.value)[0]
    case 'balance':
      // 밸런스 컨트롤 → Flow, Stability
      return elements.find((e: any) => e.id === 'flow') ||
             elements.find((e: any) => e.id === 'stability') ||
             elements.sort((a: any, b: any) => b.value - a.value)[0]
    case 'choice':
      // 선택 시뮬레이션 → Growth, Vitality
      return elements.find((e: any) => e.id === 'growth') ||
             elements.find((e: any) => e.id === 'vitality') ||
             elements.sort((a: any, b: any) => b.value - a.value)[0]
    case 'flow-connect':
      // 에너지 흐름 연결 → Flow, Clarity (순서·흐름)
      return elements.find((e: any) => e.id === 'flow') ||
             elements.find((e: any) => e.id === 'clarity') ||
             elements.sort((a: any, b: any) => b.value - a.value)[0]
    default:
      return null
  }
}

const todayDateString = () => new Date().toISOString().split('T')[0]

const LuckyHub: React.FC = () => {
  const { lifeProfile, fetchLifeProfile } = useLifeProfileStore()
  const [luckyNumbers, setLuckyNumbers] = useState<number[]>([])
  const [alreadyGeneratedToday, setAlreadyGeneratedToday] = useState(false)
  const [isLoadingToday, setIsLoadingToday] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedGame, setSelectedGame] = useState<string | null>(null)
  const [gameStats, setGameStats] = useState<GameStats | SnakeGameStats | BalanceGameStats | FlowConnectGameStats | null>(null)
  const [showGameResult, setShowGameResult] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [history, setHistory] = useState<{ date: string; type: string; numbers: number[] }[]>([])
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)

  useEffect(() => {
    if (!lifeProfile) {
      fetchLifeProfile().catch((error: any) => {
        if (error?.message?.includes('Not Found') || error?.statusCode === 404) {
          console.log('Life Profile not found - this is normal if profile is not created yet')
        } else {
          console.error('Failed to fetch life profile:', error)
        }
      })
    }
  }, [lifeProfile, fetchLifeProfile])

  const loadIdRef = useRef(0)
  const load = useCallback(async () => {
    const loadId = loadIdRef.current + 1
    loadIdRef.current = loadId
    const clientToday = todayDateString()
    setIsLoadingToday(true)
    try {
      const data = await luckyApi.getTodayLuckyNumbers(clientToday)
      if (loadId !== loadIdRef.current) return
      if (data) {
        const isStale = data.date < clientToday
        if (isStale) {
          setLuckyNumbers([])
          setAlreadyGeneratedToday(false)
        } else {
          setLuckyNumbers(data.numbers)
          setAlreadyGeneratedToday(!!data.alreadyGeneratedToday)
        }
      } else {
        setLuckyNumbers([])
        setAlreadyGeneratedToday(false)
      }
    } catch (e) {
      if (loadId === loadIdRef.current) {
        setLuckyNumbers([])
        setAlreadyGeneratedToday(false)
      }
    } finally {
      if (loadId === loadIdRef.current) setIsLoadingToday(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') load()
    }
    document.addEventListener('visibilitychange', onVisibilityChange)
    return () => document.removeEventListener('visibilitychange', onVisibilityChange)
  }, [load])

  const generateLuckyNumbers = async () => {
    try {
      setIsLoading(true)
      const data = await luckyApi.generateLuckyNumbers('lotto')
      setLuckyNumbers(data.numbers)
      setAlreadyGeneratedToday(data.alreadyGeneratedToday)
      if (data.alreadyGeneratedToday) {
        alert('오늘 이미 행운 번호를 생성했습니다. 내일 다시 시도해 주세요.')
      }
    } catch (error: any) {
      console.error('[LuckyHub] 행운 번호 생성 실패:', error)
      alert(`행운 번호 생성에 실패했습니다.\n\n${error?.message || '알 수 없는 오류'}`)
    } finally {
      setIsLoading(false)
    }
  }

  const loadHistory = async () => {
    if (history.length > 0) {
      setShowHistory((v) => !v)
      return
    }
    setIsLoadingHistory(true)
    try {
      const list = await luckyApi.getLuckyNumbersHistory(30)
      setHistory(list)
      setShowHistory(true)
    } catch (e) {
      console.error('[LuckyHub] 히스토리 로드 실패:', e)
      alert('이전 행운 번호를 불러오지 못했습니다.')
    } finally {
      setIsLoadingHistory(false)
    }
  }

  // 전체 게임 목록 (모든 게임 표시)
  const games = [
    { id: 'wave', name: '에너지 파형 맞추기', description: '파동에 맞춰 탭하여 집중력을 높이세요', icon: '🌊', available: true },
    { id: 'snake', name: '에너지 모으기 지렁이', description: '지렁이를 조작하여 에너지를 모으세요', icon: '🐍', available: true },
    { id: 'balance', name: '밸런스 컨트롤', description: '에너지 게이지를 중앙에 유지하세요', icon: '⚖️', available: true },
    { id: 'choice', name: '선택형 시뮬레이션', description: '상황을 선택하면 오늘 타입을 분석합니다', icon: '🎯', available: false },
    { id: 'flow-connect', name: '에너지 흐름 연결', description: '점들을 순서대로 연결하세요', icon: '🔗', available: true },
    { id: 'color-match', name: '에너지 색상 구분', description: '목표 색상을 빠르게 찾아 탭하세요', icon: '🎨', available: false },
    { id: 'direction-tap', name: '에너지 방향 맞추기', description: '화살표 방향을 따라 탭하세요', icon: '➡️', available: false },
    { id: 'sequence-memory', name: '에너지 시퀀스 기억', description: '패턴을 기억하여 재현하세요', icon: '🧠', available: false },
    { id: 'pattern-find', name: '에너지 패턴 찾기', description: '여러 패턴 중 목표 패턴을 찾으세요', icon: '🔍', available: false },
    { id: 'symmetry-match', name: '에너지 대칭 맞추기', description: '대칭되는 위치에 탭하세요', icon: '⚖️', available: false },
    { id: 'path-select', name: '에너지 경로 선택', description: '최적의 경로를 선택하세요', icon: '🗺️', available: false },
    { id: 'energy-combo', name: '에너지 조합 맞추기', description: '주어진 에너지 조합을 완성하세요', icon: '🧩', available: false },
  ]

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">행운 센터</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Energy Pattern 기반 행운 번호와 미니 게임을 즐겨보세요.
        </p>
      </div>

      {/* 행운 번호 섹션 */}
      <Card className="mb-6">
        <h2 className="text-xl font-bold mb-4">행운 번호 추천</h2>
        <div className="text-center">
          {luckyNumbers.length > 0 ? (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="flex justify-center gap-3 mb-6 flex-wrap"
            >
              {luckyNumbers.map((num, index) => (
                <motion.div
                  key={index}
                  initial={{ rotateY: 180 }}
                  animate={{ rotateY: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="w-16 h-16 bg-primary text-white rounded-full flex items-center justify-center text-2xl font-bold shadow-lg"
                >
                  {num}
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <div className="py-12 text-gray-500">
              {isLoadingToday ? '불러오는 중...' : '행운 번호를 생성해보세요! (하루 1회)'}
            </div>
          )}
          {alreadyGeneratedToday && (
            <p className="text-sm text-amber-600 dark:text-amber-400 mb-2">
              오늘의 행운 번호를 이미 생성했습니다. 내일 다시 시도해 주세요.
            </p>
          )}
          <div className="flex flex-wrap gap-3 justify-center">
            <Button
              onClick={generateLuckyNumbers}
              disabled={isLoading || isLoadingToday || alreadyGeneratedToday}
              aria-label="행운 번호 생성"
            >
              {isLoading ? '생성 중...' : alreadyGeneratedToday ? '오늘 생성 완료 (내일 가능)' : luckyNumbers.length > 0 ? '다시 생성' : '행운 번호 생성'}
            </Button>
            {luckyNumbers.length > 0 && (
              <>
                <Button variant="outline" onClick={() => navigator.clipboard.writeText(luckyNumbers.join(', '))}>
                  복사
                </Button>
                <Button variant="outline" onClick={() => {
                  const text = `오늘의 행운 번호: ${luckyNumbers.join(', ')}`
                  if (navigator.share) {
                    navigator.share({ text })
                  } else {
                    alert(text)
                  }
                }}>
                  공유
                </Button>
              </>
            )}
          </div>

          {/* Life Profile 기반 설명 */}
          {luckyNumbers.length > 0 && (() => {
            const todayElement = getTodayEnergyElement(lifeProfile)
            if (todayElement) {
              return (
                <div className="mt-6 p-4 bg-primary/5 rounded-lg border-l-4 border-primary">
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    번호 해석
                  </h4>
                  <div className="flex items-center gap-2 mb-2">
                    <EnergyElementBadge element={todayElement} size="sm" />
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    오늘은 당신의 <strong>{todayElement.korean}({todayElement.value}%)</strong> 에너지가 활성화되는 날입니다.
                    {todayElement.id === 'growth' && ' 새로운 시작을 의미하는 번호들이 추천되었습니다.'}
                    {todayElement.id === 'vitality' && ' 활발한 에너지를 상징하는 번호들이 추천되었습니다.'}
                    {todayElement.id === 'stability' && ' 안정과 균형을 나타내는 번호들이 추천되었습니다.'}
                    {todayElement.id === 'clarity' && ' 명확한 의도와 집중을 나타내는 번호들이 추천되었습니다.'}
                    {todayElement.id === 'flow' && ' 유연한 흐름과 변화를 의미하는 번호들이 추천되었습니다.'}
                  </p>
                </div>
              )
            }
            return null
          })()}

          <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
            * 본 번호는 오락용 추천이며, 실제 로또 당첨을 보장하지 않습니다.
          </p>

          <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button
              variant="outline"
              size="sm"
              onClick={loadHistory}
              disabled={isLoadingHistory}
            >
              {isLoadingHistory ? '불러오는 중...' : showHistory ? '이전 행운 번호 접기' : '이전 행운 번호 보기'}
            </Button>
            {showHistory && (
              <div className="mt-4 space-y-3 max-h-64 overflow-y-auto">
                {history.length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400">저장된 이력이 없습니다.</p>
                ) : (
                  history.map((item) => (
                    <div
                      key={item.date}
                      className="flex flex-wrap items-center gap-2 text-sm py-2 px-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                    >
                      <span className="font-medium text-gray-700 dark:text-gray-300 shrink-0">
                        {item.date === todayDateString() ? '오늘' : item.date}
                      </span>
                      <span className="flex gap-1.5 flex-wrap">
                        {item.numbers.map((n, i) => (
                          <span
                            key={i}
                            className="w-8 h-8 flex items-center justify-center rounded-full bg-primary/20 text-primary dark:bg-primary/30 dark:text-primary font-medium"
                          >
                            {n}
                          </span>
                        ))}
                      </span>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* 미니 게임 섹션 */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">미니 게임</h2>
          <Link
            to="/lucky-hub/rankings"
            className="text-sm text-primary hover:underline font-medium"
          >
            이번 주 랭킹 보기
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {games.map((game) => {
            const gameElement = getEnergyElementForGame(game.id, lifeProfile)
            
            return (
              <Card
                key={game.id}
                hover={game.available}
                onClick={() => game.available && setSelectedGame(game.id)}
                className={`text-center ${game.available ? 'cursor-pointer' : 'opacity-60 cursor-not-allowed'}`}
              >
                <div className="text-5xl mb-4">{game.icon}</div>
                <h3 className="font-semibold mb-2">{game.name}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{game.description}</p>
                
                {!game.available && (
                  <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      곧 출시 예정
                    </p>
                  </div>
                )}
                
                {/* Life Profile 기반 추천 이유 */}
                {game.available && gameElement && (
                  <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex justify-center mb-2">
                      <EnergyElementBadge element={gameElement} size="sm" showValue={false} />
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      당신의 <strong>{gameElement.korean}</strong> 에너지 특성상 이 게임이 적합합니다.
                    </p>
                  </div>
                )}
              </Card>
            )
          })}
        </div>


        {/* 게임 모달 */}
        <AnimatePresence>
          {selectedGame === 'wave' && !showGameResult && (
            <WaveGame
              onGameEnd={(stats: GameStats) => {
                setGameStats(stats)
                setShowGameResult(true)
                gameScoresApi.submit('wave', stats.score).catch(() => {})
              }}
              onClose={() => {
                setSelectedGame(null)
                setShowGameResult(false)
                setGameStats(null)
              }}
              energyElement={getEnergyElementForGame('wave', lifeProfile)}
            />
          )}
          {selectedGame === 'snake' && !showGameResult && (
            <SnakeGame
              onGameEnd={(stats: SnakeGameStats) => {
                setGameStats(stats)
                setShowGameResult(true)
                gameScoresApi.submit('snake', stats.score).catch(() => {})
              }}
              onClose={() => {
                setSelectedGame(null)
                setShowGameResult(false)
                setGameStats(null)
              }}
              energyElement={getEnergyElementForGame('snake', lifeProfile)}
            />
          )}
          {selectedGame === 'balance' && !showGameResult && (
            <BalanceGame
              onGameEnd={(stats: BalanceGameStats) => {
                setGameStats(stats)
                setShowGameResult(true)
                gameScoresApi.submit('balance', stats.score).catch(() => {})
              }}
              onClose={() => {
                setSelectedGame(null)
                setShowGameResult(false)
                setGameStats(null)
              }}
              energyElement={getEnergyElementForGame('balance', lifeProfile)}
            />
          )}
          {selectedGame === 'flow-connect' && !showGameResult && (
            <FlowConnectGame
              onGameEnd={(stats: FlowConnectGameStats) => {
                setGameStats(stats)
                setShowGameResult(true)
                gameScoresApi.submit('flow-connect', stats.score).catch(() => {})
              }}
              onClose={() => {
                setSelectedGame(null)
                setShowGameResult(false)
                setGameStats(null)
              }}
              energyElement={getEnergyElementForGame('flow-connect', lifeProfile)}
            />
          )}
        </AnimatePresence>

        {/* 게임 결과 모달 */}
        <AnimatePresence>
          {showGameResult && gameStats && selectedGame === 'wave' && (
            <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
              >
                <WaveGameResult
                  stats={gameStats as GameStats}
                  energyElement={getEnergyElementForGame('wave', lifeProfile)}
                  gameId="wave"
                  score={(gameStats as GameStats).score}
                  onPlayAgain={() => {
                    setShowGameResult(false)
                    setGameStats(null)
                    setSelectedGame(null)
                    setTimeout(() => setSelectedGame('wave'), 100)
                  }}
                  onClose={() => {
                    setSelectedGame(null)
                    setShowGameResult(false)
                    setGameStats(null)
                  }}
                />
              </motion.div>
            </div>
          )}
          {showGameResult && gameStats && selectedGame === 'snake' && (
            <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
              >
                <SnakeGameResult
                  stats={gameStats as SnakeGameStats}
                  energyElement={getEnergyElementForGame('snake', lifeProfile)}
                  gameId="snake"
                  score={(gameStats as SnakeGameStats).score}
                  onPlayAgain={() => {
                    setShowGameResult(false)
                    setGameStats(null)
                    setSelectedGame(null)
                    setTimeout(() => setSelectedGame('snake'), 100)
                  }}
                  onClose={() => {
                    setSelectedGame(null)
                    setShowGameResult(false)
                    setGameStats(null)
                  }}
                />
              </motion.div>
            </div>
          )}
          {showGameResult && gameStats && selectedGame === 'balance' && (
            <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
              >
                <BalanceGameResult
                  stats={gameStats as BalanceGameStats}
                  energyElement={getEnergyElementForGame('balance', lifeProfile)}
                  gameId="balance"
                  score={(gameStats as BalanceGameStats).score}
                  onPlayAgain={() => {
                    setShowGameResult(false)
                    setGameStats(null)
                    setSelectedGame(null)
                    setTimeout(() => setSelectedGame('balance'), 100)
                  }}
                  onClose={() => {
                    setSelectedGame(null)
                    setShowGameResult(false)
                    setGameStats(null)
                  }}
                />
              </motion.div>
            </div>
          )}
          {showGameResult && gameStats && selectedGame === 'flow-connect' && (
            <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
              >
                <FlowConnectGameResult
                  stats={gameStats as FlowConnectGameStats}
                  energyElement={getEnergyElementForGame('flow-connect', lifeProfile)}
                  gameId="flow-connect"
                  score={(gameStats as FlowConnectGameStats).score}
                  onPlayAgain={() => {
                    setShowGameResult(false)
                    setGameStats(null)
                    setSelectedGame(null)
                    setTimeout(() => setSelectedGame('flow-connect'), 100)
                  }}
                  onClose={() => {
                    setSelectedGame(null)
                    setShowGameResult(false)
                    setGameStats(null)
                  }}
                />
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* 다른 게임들은 아직 준비 중 */}
        {selectedGame && selectedGame !== 'wave' && selectedGame !== 'snake' && selectedGame !== 'balance' && selectedGame !== 'flow-connect' && (
          <div className="mt-6 p-6 bg-gray-50 dark:bg-gray-700 rounded-lg text-center">
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              {games.find(g => g.id === selectedGame)?.name} 게임은 곧 출시될 예정입니다.
            </p>
            <Button variant="outline" onClick={() => setSelectedGame(null)}>
              닫기
            </Button>
          </div>
        )}
      </Card>

      {/* 법적 고지 */}
      <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
        <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
          본 서비스는 라이프 패턴 분석 기반의 참고용 가이드입니다.
          의료, 투자, 법률 판단을 대체하지 않으며, 모든 추천은 참고용으로만 활용해주세요.
        </p>
      </div>
    </div>
  )
}

export default LuckyHub
