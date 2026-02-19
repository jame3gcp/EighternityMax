import React, { useEffect, useState } from 'react'
import Card from '@/components/Card/Card'
import Button from '@/components/Button/Button'
import UserDetailModal from './components/UserDetailModal'
import { adminApi } from '@/services/api'

const AdminUserList: React.FC = () => {
  const [data, setData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await adminApi.getUsers(page)
        setData(res)
      } catch (error) {
        console.error('Failed to fetch users:', error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchUsers()
  }, [page])

  const handleOpenDetail = (userId: string) => {
    setSelectedUserId(userId)
    setIsModalOpen(true)
  }

  const handleRoleUpdated = (userId: string, newRole: string) => {
    if (!data) return
    const updatedUsers = data.users.map((u: any) => 
      u.id === userId ? { ...u, role: newRole } : u
    )
    setData({ ...data, users: updatedUsers })
  }

  if (isLoading) {
    return (
      <div className="p-8 flex justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600" />
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">사용자 관리</h1>
        <div className="text-sm text-gray-500">총 {data?.total || 0}명의 사용자</div>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 dark:bg-gray-700/50 text-gray-700 dark:text-gray-300 uppercase text-xs font-semibold">
              <tr>
                <th className="px-6 py-4">사용자</th>
                <th className="px-6 py-4">이메일</th>
                <th className="px-6 py-4">가입일</th>
                <th className="px-6 py-4">역할</th>
                <th className="px-6 py-4">구독 상태</th>
                <th className="px-6 py-4">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {data?.users.map((user: any) => (
                <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                  <td className="px-6 py-4 font-medium">{user.display_name || '사용자'}</td>
                  <td className="px-6 py-4 text-gray-500">{user.email}</td>
                  <td className="px-6 py-4 text-gray-500">{new Date(user.created_at).toLocaleDateString()}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                      user.role === 'admin' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                      user.subscription?.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {user.subscription?.status || 'none'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <Button variant="outline" size="sm" onClick={() => handleOpenDetail(user.id)}>상세보기</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="p-4 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <Button 
            variant="outline" 
            size="sm" 
            disabled={page === 1}
            onClick={() => setPage(p => p - 1)}
          >이전</Button>
          <span className="text-xs text-gray-500">페이지 {page} / {data?.pages || 1}</span>
          <Button 
            variant="outline" 
            size="sm"
            disabled={page >= (data?.pages || 1)}
            onClick={() => setPage(p => p + 1)}
          >다음</Button>
        </div>
      </Card>

      <UserDetailModal
        isOpen={isModalOpen}
        userId={selectedUserId}
        onClose={() => setIsModalOpen(false)}
        onRoleUpdated={handleRoleUpdated}
      />
    </div>
  )
}

export default AdminUserList

