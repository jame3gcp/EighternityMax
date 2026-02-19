import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Card from '@/components/Card/Card'
import { gameScoresApi, type GameRankingResponse, type GameRankingAllResponse } from '@/services/api'

const GAME_IDS = ['wave', 'snake', 'balance', 'flow-connect'] as const
const GAME_NAMES: Record<string, string> = {
  wave: '에너지 파형 맞추기',
  snake: '에너지 모으기 지렁이',
  balance: '밸런스 컨트롤',
  'flow-connect': '에너지 흐름 연결',
}

function getISOWeekKey(date: Date): string {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  const monday = new Date(d.setDate(diff))
  const year = monday.getFullYear()
  const startOfYear = new Date(year, 0, 1)
  const weekNum = Math.ceil((((monday.getTime() - startOfYear.getTime()) / 86400000) + startOfYear.getDay() + 1) / 7)
  return `${year}-W${String(weekNum).padStart(2, '0')}`
}

const LuckyHubRankings: React.FC = () => {
  const [weekKey, setWeekKey] = useState(() => getISOWeekKey(new Date()))
  const [tab, setTab] = useState<string>('all')
  const [gameRanking, setGameRanking] = useState<GameRankingResponse | null>(null)
  const [allRanking, setAllRanking] = useState<GameRankingAllResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        if (tab === 'all') {
          const res = await gameScoresApi.getRankingAll(weekKey, 50)
          if (!cancelled) setAllRanking(res)
        } else {
          const res = await gameScoresApi.getRanking(tab, weekKey, 50)
          if (!cancelled) setGameRanking(res)
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
    load()
    return () => { cancelled = true }
  }, [weekKey, tab])

  const weekOptions: string[] = []
  const now = new Date()
  for (let i = 0; i < 5; i++) {
    const d = new Date(now)
    d.setDate(d.getDate() - 7 * i)
    weekOptions.push(getISOWeekKey(d))
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <main className="transition-all duration-300 pt-16 flex-1">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center gap-4 mb-6">
            <Link to="/lucky-hub" className="text-gray-600 dark:text-gray-400 hover:text-primary">
              ← 행운 센터
            </Link>
          </div>
          <Card className="mb-6">
            <h1 className="text-2xl font-bold mb-4">게임 랭킹</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              주간 랭킹은 매주 초기화됩니다. 게임별·종합 순위를 확인하세요.
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                주차
              </label>
              <select
                value={weekKey}
                onChange={(e) => setWeekKey(e.target.value)}
                className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm"
              >
                {weekOptions.map((wk) => (
                  <option key={wk} value={wk}>
                    {wk}
                  </option>
                ))}
              </select>
            </div>
          </Card>

          <Card>
            <div className="flex flex-wrap gap-2 border-b border-gray-200 dark:border-gray-600 pb-3 mb-4">
              <button
                type="button"
                onClick={() => setTab('all')}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  tab === 'all'
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                종합 랭킹
              </button>
              {GAME_IDS.map((id) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setTab(id)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium ${
                    tab === id
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {GAME_NAMES[id]}
                </button>
              ))}
            </div>

            {loading && (
              <p className="text-gray-500 dark:text-gray-400 py-8 text-center">불러오는 중...</p>
            )}
            {error && (
              <p className="text-amber-600 dark:text-amber-400 py-8 text-center">{error}</p>
            )}
            {!loading && !error && tab === 'all' && allRanking && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-600">
                      <th className="text-left py-2 px-2">순위</th>
                      <th className="text-left py-2 px-2">닉네임</th>
                      <th className="text-right py-2 px-2">종합 점수</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allRanking.list.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="py-8 text-center text-gray-500 dark:text-gray-400">
                          이 주차에 참가자가 없습니다.
                        </td>
                      </tr>
                    ) : (
                      allRanking.list.map((entry) => (
                        <tr key={entry.userId} className="border-b border-gray-100 dark:border-gray-700">
                          <td className="py-2 px-2 font-medium">{entry.rank}위</td>
                          <td className="py-2 px-2">{entry.displayName}</td>
                          <td className="py-2 px-2 text-right">{entry.points ?? 0}pt</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
                {allRanking.myRank != null && (
                  <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
                    내 종합 순위: <strong>{allRanking.myRank}위</strong> / 총 {allRanking.total}명
                  </p>
                )}
              </div>
            )}
            {!loading && !error && tab !== 'all' && gameRanking && (
              <div className="overflow-x-auto">
                <h3 className="font-semibold mb-2">{GAME_NAMES[tab]} · {gameRanking.weekKey}</h3>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-600">
                      <th className="text-left py-2 px-2">순위</th>
                      <th className="text-left py-2 px-2">닉네임</th>
                      <th className="text-right py-2 px-2">점수</th>
                    </tr>
                  </thead>
                  <tbody>
                    {gameRanking.list.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="py-8 text-center text-gray-500 dark:text-gray-400">
                          이 주차에 참가자가 없습니다.
                        </td>
                      </tr>
                    ) : (
                      gameRanking.list.map((entry) => (
                        <tr key={entry.userId} className="border-b border-gray-100 dark:border-gray-700">
                          <td className="py-2 px-2 font-medium">{entry.rank}위</td>
                          <td className="py-2 px-2">{entry.displayName}</td>
                          <td className="py-2 px-2 text-right">{entry.score?.toLocaleString() ?? 0}점</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
                {gameRanking.myRank != null && (
                  <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
                    내 순위: <strong>{gameRanking.myRank}위</strong>
                    {gameRanking.myScore != null && ` (${gameRanking.myScore.toLocaleString()}점)`} / 총 {gameRanking.total}명
                  </p>
                )}
              </div>
            )}
          </Card>
        </div>
      </main>
    </div>
  )
}

export default LuckyHubRankings
