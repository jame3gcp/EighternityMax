import React, { useEffect, useState } from 'react'
import { gameScoresApi, type GameRankingResponse } from '@/services/api'

const GAME_NAMES: Record<string, string> = {
  wave: '에너지 파형 맞추기',
  snake: '에너지 모으기 지렁이',
  balance: '밸런스 컨트롤',
  'flow-connect': '에너지 흐름 연결',
}

interface GameResultRankingSectionProps {
  gameId: string
  score: number
  weekKey?: string
}

const GameResultRankingSection: React.FC<GameResultRankingSectionProps> = ({
  gameId,
  score,
  weekKey,
}) => {
  const [data, setData] = useState<GameRankingResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    const fetchRanking = async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await gameScoresApi.getRanking(gameId, weekKey, 10)
        if (!cancelled) {
          setData(res)
        }
      } catch (e: unknown) {
        if (!cancelled) {
          const err = e as Error & { statusCode?: number }
          const msg = err?.message ?? '랭킹을 불러올 수 없습니다.'
          const is404 = err?.statusCode === 404 || /not found|찾을 수 없습니다/i.test(msg)
          setError(is404 ? '랭킹 API를 사용할 수 없습니다. 백엔드 서버(포트 3001)가 실행 중인지 확인하고 재시작해 주세요.' : msg)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    fetchRanking()
    return () => { cancelled = true }
  }, [gameId, weekKey])

  const gameName = GAME_NAMES[gameId] ?? gameId

  if (loading) {
    return (
      <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-600">
        <p className="text-sm text-gray-500 dark:text-gray-400">이번 주 랭킹 불러오는 중...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-600">
        <p className="text-sm text-amber-600 dark:text-amber-400">{error}</p>
      </div>
    )
  }

  if (!data) return null

  const { list, myRank, myScore, total, weekKey: resWeekKey } = data

  return (
    <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-600">
      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        🏆 {gameName} · 이번 주 랭킹 ({resWeekKey})
      </h4>
      {total === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">아직 참가자가 없습니다. 첫 기록을 남겨 보세요!</p>
      ) : (
        <>
          {myRank != null && (
            <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
              당신의 순위: <span className="font-semibold text-indigo-600 dark:text-indigo-400">{myRank}위</span>
              {myScore != null && ` (${myScore.toLocaleString()}점)`} / 총 {total}명
            </p>
          )}
          {list.length > 0 && (
            <ul className="text-sm space-y-1 max-h-32 overflow-y-auto">
              {list.map((entry) => (
                <li
                  key={entry.userId}
                  className="flex justify-between items-center py-0.5"
                >
                  <span className="text-gray-600 dark:text-gray-400">
                    {entry.rank}위 {entry.displayName}
                  </span>
                  {entry.score != null && (
                    <span className="font-medium text-gray-800 dark:text-gray-200">
                      {entry.score.toLocaleString()}점
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  )
}

export default GameResultRankingSection
