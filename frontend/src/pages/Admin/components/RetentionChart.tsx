import React, { useEffect, useState } from 'react'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell } from 'recharts'
import Card from '@/components/Card/Card'
import { adminApi } from '@/services/api'

const RetentionChart: React.FC = () => {
  const [data, setData] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchRetention = async () => {
      try {
        const res = await adminApi.getRetention()
        setData(res)
      } catch (err) {
        console.error('Failed to fetch retention stats:', err)
      } finally {
        setIsLoading(false)
      }
    }
    fetchRetention()
  }, [])

  if (isLoading) {
    return <div className="h-64 flex items-center justify-center animate-pulse bg-gray-50 dark:bg-gray-800 rounded-xl" />
  }

  return (
    <Card title="사용자 코호트 리텐션 (최근 6개월)">
      <div className="h-80 w-full mt-4">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
            <XAxis type="number" hide />
            <YAxis 
              dataKey="cohort" 
              type="category" 
              tick={{ fontSize: 10 }}
              width={60}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const d = payload[0].payload
                  return (
                    <div className="bg-white dark:bg-gray-800 p-3 shadow-xl rounded-lg border border-gray-100 dark:border-gray-700">
                      <p className="text-xs font-bold">{d.cohort} 가입자</p>
                      <p className="text-sm text-primary mt-1">{d.activity_period} 활동: {d.user_count}명</p>
                    </div>
                  )
                }
                return null
              }}
            />
            <Bar dataKey="user_count" radius={[0, 4, 4, 0]}>
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={`rgba(99, 102, 241, ${Math.min(1, entry.user_count / 100 + 0.2)})`} 
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <p className="text-[10px] text-gray-400 mt-4 italic text-right">* 가입 월별 활동 유저 수 (코호트 분석)</p>
    </Card>
  )
}

export default RetentionChart
