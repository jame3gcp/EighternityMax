import React, { useEffect, useState } from 'react'
import Card from '@/components/Card/Card'
import { adminApi } from '@/services/api'
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, AreaChart, Area
} from 'recharts'

const getTodaySeoul = () => {
  const d = new Date()
  return d.toLocaleDateString('en-CA', { timeZone: 'Asia/Seoul' })
}

const subtractDays = (yyyyMmDd: string, days: number) => {
  const [y, m, d] = yyyyMmDd.split('-').map(Number)
  const date = new Date(Date.UTC(y, m - 1, d, 12, 0, 0, 0))
  date.setUTCDate(date.getUTCDate() - days)
  return date.toISOString().slice(0, 10)
}

const AdminBehaviorAnalytics: React.FC = () => {
  const today = getTodaySeoul()
  const [fromDate, setFromDate] = useState(() => subtractDays(getTodaySeoul(), 6))
  const [toDate, setToDate] = useState(() => getTodaySeoul())
  const [data, setData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchStats(fromDate, toDate)
  }, [fromDate, toDate])

  const fetchStats = async (from: string, to: string) => {
    setIsLoading(true)
    try {
      const res = await adminApi.getBehaviorStats(from, to)
      setData(res)
    } catch (err) {
      console.error('Failed to fetch behavior stats:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const applyPreset = (preset: 'day' | 'week' | 'month') => {
    const to = today
    const from = preset === 'day' ? to : preset === 'week' ? subtractDays(to, 6) : subtractDays(to, 29)
    setFromDate(from)
    setToDate(to)
  }

  if (isLoading) {
    return (
      <div className="p-8 flex justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    )
  }

  const graphIndex = [
    {
      id: 'topMenus',
      title: '가장 많이 방문한 메뉴 (Top 10)',
      description: '페이지 뷰(page_view) 이벤트 기준, 경로(path)별 조회 횟수. 어떤 메뉴/페이지가 가장 많이 열렸는지 보여줍니다.',
      axisX: '조회 수',
      axisY: '페이지 경로',
    },
    {
      id: 'avgDuration',
      title: '메뉴별 평균 체류 시간 (초)',
      description: '각 페이지에서 사용자가 머문 평균 시간(초). 체류 시간이 긴 페이지를 파악할 수 있습니다.',
      axisX: '평균 시간 (초)',
      axisY: '페이지 경로',
    },
    {
      id: 'hourlyActive',
      title: '시간대별 활성 사용자 활동량',
      description: '0~23시 시간대별 활동 이벤트 수. 언제 사용자가 가장 활발한지 파악할 수 있습니다.',
      axisX: '시간대',
      axisY: '활동 수',
    },
  ]

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col gap-4 mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">사용자 행동 및 Engagement 분석</h1>
        <Card className="p-4" title="기간 선택">
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">시작일</label>
              <input
                type="date"
                value={fromDate}
                max={toDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">종료일</label>
              <input
                type="date"
                value={toDate}
                min={fromDate}
                max={today}
                onChange={(e) => setToDate(e.target.value)}
                className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="text-sm text-gray-500 dark:text-gray-400 self-center">빠른 선택:</span>
              <button
                type="button"
                onClick={() => applyPreset('day')}
                className="px-3 py-1.5 rounded-md text-sm border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600"
              >
                오늘
              </button>
              <button
                type="button"
                onClick={() => applyPreset('week')}
                className="px-3 py-1.5 rounded-md text-sm border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600"
              >
                최근 7일
              </button>
              <button
                type="button"
                onClick={() => applyPreset('month')}
                className="px-3 py-1.5 rounded-md text-sm border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600"
              >
                최근 30일
              </button>
            </div>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            기준: {fromDate} ~ {toDate} (한국 시간)
          </p>
        </Card>
      </div>

      {/* 그래프 인덱스: 각 차트가 무엇을 의미하는지 요약 */}
      <Card className="mb-8" title="📋 그래프 인덱스">
        <ul className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
          <li><strong className="text-gray-900 dark:text-white">1. 가장 많이 방문한 메뉴 (Top 10)</strong> — 페이지별 조회 수. 인기 메뉴 파악용.</li>
          <li><strong className="text-gray-900 dark:text-white">2. 메뉴별 평균 체류 시간 (초)</strong> — 페이지별 평균 머문 시간. 관심도 파악용.</li>
          <li><strong className="text-gray-900 dark:text-white">3. 시간대별 활성 사용자 활동량</strong> — 시간대(0~23시)별 활동 이벤트 수. 피크 시간대 파악용.</li>
        </ul>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <Card title={graphIndex[0].title}>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-3" title={graphIndex[0].description}>
            {graphIndex[0].description}
          </p>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.topMenus} layout="vertical" margin={{ left: 40 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" name={graphIndex[0].axisX} />
                <YAxis dataKey="path" type="category" tick={{ fontSize: 10 }} width={100} name={graphIndex[0].axisY} />
                <Tooltip formatter={(value: number) => [value, graphIndex[0].axisX]} />
                <Bar dataKey="views" fill="#6366f1" radius={[0, 4, 4, 0]} name="조회 수" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title={graphIndex[1].title}>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-3" title={graphIndex[1].description}>
            {graphIndex[1].description}
          </p>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={data?.avgDuration?.map((d: any) => ({ ...d, seconds: (d.avg_ms / 1000).toFixed(1) }))} 
                layout="vertical" 
                margin={{ left: 40 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" name={graphIndex[1].axisX} />
                <YAxis dataKey="path" type="category" tick={{ fontSize: 10 }} width={100} name={graphIndex[1].axisY} />
                <Tooltip formatter={(value: number) => [value, '초']} />
                <Bar dataKey="seconds" fill="#10b981" radius={[0, 4, 4, 0]} name="평균 체류 (초)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <Card title={graphIndex[2].title}>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-3" title={graphIndex[2].description}>
          {graphIndex[2].description}
        </p>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data?.hourlyActive}>
              <defs>
                <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="hour" tickFormatter={(h) => `${h}시`} name={graphIndex[2].axisX} />
              <YAxis name={graphIndex[2].axisY} />
              <Tooltip formatter={(value: number) => [value, graphIndex[2].axisY]} />
              <Area type="monotone" dataKey="activity_count" stroke="#ef4444" fillOpacity={1} fill="url(#colorCount)" name="활동 수" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  )
}

export default AdminBehaviorAnalytics
