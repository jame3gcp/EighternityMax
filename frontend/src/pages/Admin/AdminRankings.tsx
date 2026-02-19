import React, { useEffect, useState } from 'react'
import Card from '@/components/Card/Card'
import Button from '@/components/Button/Button'
import { adminApi } from '@/services/api'

const GAME_IDS = ['wave', 'snake', 'balance', 'flow-connect'] as const
const GAME_NAMES: Record<string, string> = {
  wave: '에너지 파형',
  snake: '지렁이',
  balance: '밸런스',
  'flow-connect': '흐름 연결',
}

const WEEKDAY_LABELS: Record<number, string> = {
  0: '일요일',
  1: '월요일',
  2: '화요일',
  3: '수요일',
  4: '목요일',
  5: '금요일',
  6: '토요일',
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

const AdminRankings: React.FC = () => {
  const [settings, setSettings] = useState<{ week_start_day: number; games_enabled: Record<string, boolean> } | null>(null)
  const [weekStartDay, setWeekStartDay] = useState(1)
  const [gamesEnabled, setGamesEnabled] = useState<Record<string, boolean>>({})
  const [settingsSaving, setSettingsSaving] = useState(false)
  const [weekKey, setWeekKey] = useState(() => getISOWeekKey(new Date()))
  const [gameId, setGameId] = useState<string>('wave')
  const [rankingsData, setRankingsData] = useState<{
    weekKey: string
    gameId?: string
    list?: Array<{ rank: number; userId: string; displayName: string; email?: string; score: number }>
    byGame?: Record<string, Array<{ rank: number; userId: string; score: number }>>
  } | null>(null)
  const [rankingsLoading, setRankingsLoading] = useState(false)

  useEffect(() => {
    adminApi.getRankingSettings().then((res) => {
      setSettings(res)
      setWeekStartDay(res.week_start_day)
      setGamesEnabled(res.games_enabled || {})
    }).catch(() => {})
  }, [])

  useEffect(() => {
    let cancelled = false
    setRankingsLoading(true)
    adminApi.getRankings({ weekKey, gameId, limit: 100 })
      .then((res) => { if (!cancelled) setRankingsData(res) })
      .catch(() => { if (!cancelled) setRankingsData(null) })
      .finally(() => { if (!cancelled) setRankingsLoading(false) })
    return () => { cancelled = true }
  }, [weekKey, gameId])

  const handleSaveSettings = async () => {
    setSettingsSaving(true)
    try {
      const res = await adminApi.updateRankingSettings({
        week_start_day: weekStartDay,
        games_enabled: gamesEnabled,
      })
      setSettings(res)
    } finally {
      setSettingsSaving(false)
    }
  }

  const weekOptions: string[] = []
  const now = new Date()
  for (let i = 0; i < 8; i++) {
    const d = new Date(now)
    d.setDate(d.getDate() - 7 * i)
    weekOptions.push(getISOWeekKey(d))
  }

  const list = rankingsData?.gameId ? rankingsData.list : null
  const byGame = rankingsData?.byGame

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">게임 랭킹 관리</h1>

      <Card className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">랭킹 설정</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              주차 시작 요일
            </label>
            <select
              value={weekStartDay}
              onChange={(e) => setWeekStartDay(Number(e.target.value))}
              className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm"
            >
              {[0, 1, 2, 3, 4, 5, 6].map((d) => (
                <option key={d} value={d}>{WEEKDAY_LABELS[d]}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              게임별 랭킹 노출
            </label>
            <div className="flex flex-wrap gap-4">
              {GAME_IDS.map((id) => (
                <label key={id} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={gamesEnabled[id] !== false}
                    onChange={(e) => setGamesEnabled((prev) => ({ ...prev, [id]: e.target.checked }))}
                    className="rounded border-gray-300 dark:border-gray-600"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">{GAME_NAMES[id]}</span>
                </label>
              ))}
            </div>
          </div>
          <Button onClick={handleSaveSettings} disabled={settingsSaving}>
            {settingsSaving ? '저장 중...' : '설정 저장'}
          </Button>
        </div>
      </Card>

      <Card>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">주차별 랭킹 조회</h2>
        <div className="flex flex-wrap items-center gap-4 mb-4">
          <select
            value={weekKey}
            onChange={(e) => setWeekKey(e.target.value)}
            className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm"
          >
            {weekOptions.map((wk) => (
              <option key={wk} value={wk}>{wk}</option>
            ))}
          </select>
          <select
            value={gameId}
            onChange={(e) => setGameId(e.target.value)}
            className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm"
          >
            {GAME_IDS.map((id) => (
              <option key={id} value={id}>{GAME_NAMES[id]}</option>
            ))}
          </select>
        </div>

        {rankingsLoading && (
          <p className="text-gray-500 dark:text-gray-400 py-4">불러오는 중...</p>
        )}
        {!rankingsLoading && list && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-600">
                  <th className="text-left py-2 px-2">순위</th>
                  <th className="text-left py-2 px-2">닉네임</th>
                  <th className="text-left py-2 px-2">이메일</th>
                  <th className="text-right py-2 px-2">점수</th>
                </tr>
              </thead>
              <tbody>
                {list.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-gray-500">참가자가 없습니다.</td>
                  </tr>
                ) : (
                  list.map((row) => (
                    <tr key={row.userId} className="border-b border-gray-100 dark:border-gray-700">
                      <td className="py-2 px-2">{row.rank}위</td>
                      <td className="py-2 px-2">{row.displayName}</td>
                      <td className="py-2 px-2 text-gray-500 dark:text-gray-400">{row.email ?? '—'}</td>
                      <td className="py-2 px-2 text-right">{row.score.toLocaleString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
        {!rankingsLoading && byGame && !list && (
          <p className="text-gray-500 dark:text-gray-400 py-4">게임을 선택하면 해당 주차 랭킹을 볼 수 있습니다.</p>
        )}
      </Card>
    </div>
  )
}

export default AdminRankings
