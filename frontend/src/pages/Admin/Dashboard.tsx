import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import Card from '@/components/Card/Card'
import { adminApi } from '@/services/api'
import RetentionChart from './components/RetentionChart'

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<any>(null)
  const [recentUsers, setRecentUsers] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [statsData, usersData] = await Promise.all([
          adminApi.getStats(),
          adminApi.getUsers(1, 5)
        ])
        setStats(statsData)
        setRecentUsers(usersData.users)
      } catch (error) {
        console.error('Failed to fetch admin dashboard data:', error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchDashboardData()
  }, [])

  if (isLoading) {
    return (
      <div className="p-8 flex justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600" />
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">관리자 대시보드</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <MetricCard 
          title="총 사용자" 
          value={stats?.totalUsers || 0} 
          change={stats?.monthlyGrowth?.users}
          icon="👥"
        />
        <MetricCard 
          title="활성 구독자" 
          value={stats?.totalSubscribers || 0} 
          change={stats?.monthlyGrowth?.subscribers}
          icon="⭐"
        />
        <MetricCard 
          title="이번 달 매출" 
          value={`${(stats?.totalRevenue / 100).toLocaleString()}원`} 
          change={stats?.monthlyGrowth?.revenue}
          icon="💰"
        />
        <MetricCard 
          title="AI 사용량 (오늘)" 
          value={stats?.aiUsageToday || 0} 
          icon="🤖"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <RetentionChart />
        </div>
        
        <div className="space-y-8">
          <Card title="최근 가입 유저">
            <div className="space-y-4">
              {recentUsers.map(user => (
                <div key={user.id} className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-bold">{user.display_name || '사용자'}</div>
                    <div className="text-[10px] text-gray-500">{user.email}</div>
                  </div>
                  <div className="text-[10px] text-gray-400">
                    {new Date(user.created_at).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card title="시스템 상태">
            <div className="space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">API Server</span>
                <span className="flex items-center gap-1.5 text-green-600 font-bold">
                  <span className="w-2 h-2 rounded-full bg-green-600 animate-pulse" />
                  Online
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">Database</span>
                <span className="text-green-600 font-bold">Healthy</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">AI Engine</span>
                <span className="text-green-600 font-bold">Ready</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

const MetricCard: React.FC<{ title: string; value: string | number; change?: number; icon: string }> = ({ 
  title, value, change, icon 
}) => (
  <Card hover>
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
        <p className="text-2xl font-bold mt-1">{value}</p>
        {change !== undefined && (
          <p className={`text-xs mt-1 ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {change >= 0 ? '↑' : '↓'} {Math.abs(change)}% 전월 대비
          </p>
        )}
      </div>
      <div className="text-3xl opacity-20">{icon}</div>
    </div>
  </Card>
)

export default AdminDashboard
