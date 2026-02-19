import React, { useEffect, useState } from 'react'
import Card from '@/components/Card/Card'
import { adminApi } from '@/services/api'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts'

const COLORS = ['#ef4444', '#f59e0b', '#3b82f6', '#10b981', '#8b5cf6']

const AdminAICostMonitor: React.FC = () => {
  const [data, setData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchCosts = async () => {
      try {
        const res = await adminApi.getAiCosts()
        setData(res)
      } catch (error) {
        console.error('Failed to fetch AI costs:', error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchCosts()
  }, [])

  const pieData = data ? Object.entries(data.usageByModel).map(([name, value]) => ({ name, value })) : []

  if (isLoading) {
    return (
      <div className="p-8 flex justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600" />
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">AI 비용 모니터링</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        <Card className="lg:col-span-1">
          <h2 className="text-lg font-semibold mb-4">누적 비용 (Cents)</h2>
          <div className="text-4xl font-bold text-red-600">${(data?.totalCost / 100).toFixed(2)}</div>
          <p className="text-sm text-gray-500 mt-2">OpenAI API 사용량 기준</p>
        </Card>

        <Card className="lg:col-span-2">
          <h2 className="text-lg font-semibold mb-4">모델별 사용 비중</h2>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <Card title="최근 AI 요청 로그">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 dark:bg-gray-700/50 text-gray-700 dark:text-gray-300 uppercase text-xs font-semibold">
              <tr>
                <th className="px-6 py-4">사용자 ID</th>
                <th className="px-6 py-4">기능</th>
                <th className="px-6 py-4">모델</th>
                <th className="px-6 py-4">토큰 (T/P/C)</th>
                <th className="px-6 py-4">비용</th>
                <th className="px-6 py-4">일시</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {data?.recentLogs.map((log: any) => (
                <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                  <td className="px-6 py-4 font-mono text-[10px]">{log.userId}</td>
                  <td className="px-6 py-4">{log.feature}</td>
                  <td className="px-6 py-4">{log.model}</td>
                  <td className="px-6 py-4">{log.totalTokens} ({log.promptTokens}/{log.completionTokens})</td>
                  <td className="px-6 py-4 font-medium">${(log.costCents / 100).toFixed(4)}</td>
                  <td className="px-6 py-4 text-gray-500">{new Date(log.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}

export default AdminAICostMonitor
