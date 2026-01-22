import React, { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useUserStore } from '@/store/useUserStore'
import { userApi } from '@/services/api'
import Card from '@/components/Card/Card'
import Button from '@/components/Button/Button'
import Input from '@/components/Input/Input'

interface UserFormData {
  name: string
  email: string
}

const MyPage: React.FC = () => {
  const { user, setUser } = useUserStore()
  const [isLoading, setIsLoading] = useState(false)
  const { register, handleSubmit, reset } = useForm<UserFormData>()

  useEffect(() => {
    if (user) {
      reset({
        name: user.name,
        email: user.email,
      })
    } else {
      // 사용자 데이터 로드
      loadUser()
    }
  }, [user, reset])

  const loadUser = async () => {
    try {
      const userData = await userApi.getCurrentUser()
      setUser(userData)
      reset({
        name: userData.name,
        email: userData.email,
      })
    } catch (error) {
      console.error('Failed to load user:', error)
    }
  }

  const onSubmit = async (data: UserFormData) => {
    if (!user) return
    setIsLoading(true)
    try {
      const updatedUser = await userApi.updateUser(user.id, data)
      setUser(updatedUser)
      alert('정보가 업데이트되었습니다!')
    } catch (error) {
      console.error('Failed to update user:', error)
      alert('정보 업데이트에 실패했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDownloadData = () => {
    // 실제로는 API에서 데이터를 가져와서 다운로드
    const data = {
      user,
      exportDate: new Date().toISOString(),
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `eighternity-data-${Date.now()}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  const handleResetData = () => {
    if (confirm('모든 데이터를 초기화하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
      localStorage.clear()
      window.location.reload()
    }
  }

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <p className="text-center text-gray-600 dark:text-gray-400">사용자 정보를 불러올 수 없습니다.</p>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">마이페이지</h1>
        <p className="text-gray-600 dark:text-gray-400">
          개인정보를 관리하고 설정을 변경하세요.
        </p>
      </div>

      {/* 개인정보 관리 */}
      <Card className="mb-6">
        <h2 className="text-xl font-bold mb-4">개인정보 관리</h2>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="이름"
            {...register('name', { required: '이름을 입력해주세요.' })}
          />
          <Input
            label="이메일"
            type="email"
            {...register('email', { required: '이메일을 입력해주세요.' })}
          />
          <Button type="submit" disabled={isLoading}>
            {isLoading ? '저장 중...' : '정보 업데이트'}
          </Button>
        </form>
      </Card>

      {/* 알림 설정 */}
      <Card className="mb-6">
        <h2 className="text-xl font-bold mb-4">알림 설정</h2>
        <div className="space-y-4">
          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-gray-700 dark:text-gray-300">일일 리마인더</span>
            <input type="checkbox" className="w-5 h-5 text-primary rounded" defaultChecked />
          </label>
          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-gray-700 dark:text-gray-300">사이클 변화 알림</span>
            <input type="checkbox" className="w-5 h-5 text-primary rounded" defaultChecked />
          </label>
          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-gray-700 dark:text-gray-300">주간 리포트</span>
            <input type="checkbox" className="w-5 h-5 text-primary rounded" />
          </label>
        </div>
      </Card>

      {/* 데이터 관리 */}
      <Card className="mb-6">
        <h2 className="text-xl font-bold mb-4">데이터 관리</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div>
              <h3 className="font-semibold">데이터 다운로드</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                모든 기록 데이터를 JSON 형식으로 다운로드합니다.
              </p>
            </div>
            <Button variant="outline" onClick={handleDownloadData}>
              다운로드
            </Button>
          </div>
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div>
              <h3 className="font-semibold text-status-warning">데이터 초기화</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                모든 데이터를 삭제하고 처음부터 시작합니다.
              </p>
            </div>
            <Button variant="outline" onClick={handleResetData}>
              초기화
            </Button>
          </div>
        </div>
      </Card>

      {/* 구독 상태 (확장 고려) */}
      <Card>
        <h2 className="text-xl font-bold mb-4">구독 상태</h2>
        <div className="p-4 bg-primary/10 rounded-lg">
          <p className="text-gray-700 dark:text-gray-300">
            현재 무료 버전을 사용 중입니다.
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            프리미엄 기능은 곧 출시될 예정입니다.
          </p>
        </div>
      </Card>
    </div>
  )
}

export default MyPage
