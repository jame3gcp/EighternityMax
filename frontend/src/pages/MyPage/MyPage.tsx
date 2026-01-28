import React, { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useUserStore } from '@/store/useUserStore'
import { userApi, authApi, profileApi, lifeProfileApi } from '@/services/api'
import Card from '@/components/Card/Card'
import Button from '@/components/Button/Button'
import Input from '@/components/Input/Input'
import type { Profile } from '@/types'

interface UserFormData {
  name: string
  email: string
}

interface ProfileFormData {
  birthDate: string
  birthTime: string
  gender: 'M' | 'F' | 'X'
  region?: string
}

const MyPage: React.FC = () => {
  const navigate = useNavigate()
  const { user, setUser, clearUser } = useUserStore()
  const [isLoading, setIsLoading] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isLoadingProfile, setIsLoadingProfile] = useState(false)
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false)
  const [isRegenerating, setIsRegenerating] = useState(false)
  const [isDeletingAccount, setIsDeletingAccount] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const { register, handleSubmit, reset } = useForm<UserFormData>()
  const {
    register: registerProfile,
    handleSubmit: handleSubmitProfile,
    reset: resetProfile,
    watch: watchProfile,
  } = useForm<ProfileFormData>()

  useEffect(() => {
    if (user) {
      reset({
        name: user.name,
        email: user.email,
      })
      loadProfile()
    } else {
      // 사용자 데이터 로드
      loadUser()
    }
  }, [user, reset])

  const loadProfile = async () => {
    try {
      setIsLoadingProfile(true)
      const profileData = await profileApi.getProfile()
      setProfile(profileData)
      resetProfile({
        birthDate: profileData.birthDate,
        birthTime: profileData.birthTime || '',
        gender: profileData.gender,
        region: profileData.region || '',
      })
    } catch (error) {
      console.error('Failed to load profile:', error)
    } finally {
      setIsLoadingProfile(false)
    }
  }

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

  const onProfileSubmit = async (data: ProfileFormData) => {
    if (!profile) return

    const confirmMessage = '프로필을 수정하면 Life Profile이 재생성됩니다.\n계속하시겠습니까?'
    if (!confirm(confirmMessage)) return

    setIsUpdatingProfile(true)
    try {
      // 프로필 업데이트
      const response = await profileApi.saveProfile({
        birth_date: data.birthDate,
        birth_time: data.birthTime || undefined,
        gender: data.gender,
        region: data.region || undefined,
      })

      // Life Profile 재생성
      setIsRegenerating(true)
      const jobResponse = await lifeProfileApi.generateLifeProfile(response.profile_id, {
        detail_level: 'standard',
        language: 'ko',
      })

      // 재생성 완료 대기
      const checkJobStatus = async () => {
        const interval = setInterval(async () => {
          try {
            const job = await lifeProfileApi.getJobStatus(jobResponse.job_id)
            if (job.status === 'done') {
              clearInterval(interval)
              setIsRegenerating(false)
              setIsUpdatingProfile(false)
              alert('프로필이 업데이트되고 Life Profile이 재생성되었습니다!')
              await loadProfile()
            } else if (job.status === 'failed') {
              clearInterval(interval)
              setIsRegenerating(false)
              setIsUpdatingProfile(false)
              alert('Life Profile 재생성에 실패했습니다. 다시 시도해주세요.')
            }
          } catch (error) {
            console.error('Job status check error:', error)
          }
        }, 2000)
      }

      checkJobStatus()
    } catch (error) {
      console.error('Failed to update profile:', error)
      alert('프로필 업데이트에 실패했습니다.')
      setIsUpdatingProfile(false)
      setIsRegenerating(false)
    }
  }

  const handleLogout = async () => {
    if (confirm('로그아웃 하시겠습니까?')) {
      setIsLoggingOut(true)
      try {
        await authApi.logout()
        clearUser()
        navigate('/login')
      } catch (error) {
        console.error('Logout failed:', error)
        // 에러가 발생해도 로컬 상태는 정리
        clearUser()
        navigate('/login')
      } finally {
        setIsLoggingOut(false)
      }
    }
  }

  const handleDeleteAccount = async () => {
    if (!showDeleteConfirm) {
      setShowDeleteConfirm(true)
      return
    }

    // 최종 확인
    const finalConfirm = confirm(
      '정말 계정을 삭제하시겠습니까?\n\n' +
      '이 작업은 되돌릴 수 없으며, 다음 데이터가 모두 삭제됩니다:\n' +
      '- 프로필 정보 (생년월일시, 성별 등)\n' +
      '- Life Profile\n' +
      '- 모든 기록 데이터\n' +
      '- 에너지 사이클 데이터\n\n' +
      '계속하시겠습니까?'
    )

    if (!finalConfirm) {
      setShowDeleteConfirm(false)
      return
    }

    setIsDeletingAccount(true)
    try {
      const result = await userApi.deleteAccount()
      if (result.success) {
        alert('계정이 삭제되었습니다.')
        clearUser()
        navigate('/login')
      } else {
        alert('계정 삭제에 실패했습니다. 다시 시도해주세요.')
      }
    } catch (error) {
      console.error('Account deletion failed:', error)
      alert('계정 삭제 중 오류가 발생했습니다. 다시 시도해주세요.')
    } finally {
      setIsDeletingAccount(false)
      setShowDeleteConfirm(false)
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

      {/* 프로필 정보 (에너지 분석용) */}
      <Card className="mb-6">
        <h2 className="text-xl font-bold mb-4">프로필 정보</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          에너지 분석에 사용되는 정보입니다. 수정 시 Life Profile이 재생성됩니다.
        </p>
        {isLoadingProfile ? (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-sm text-gray-500">로딩 중...</p>
          </div>
        ) : profile ? (
          <form onSubmit={handleSubmitProfile(onProfileSubmit)} className="space-y-4">
            <Input
              label="생년월일"
              type="date"
              {...registerProfile('birthDate', { required: '생년월일을 입력해주세요.' })}
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                출생 시간
              </label>
              <Input
                type="time"
                {...registerProfile('birthTime')}
              />
              <p className="mt-1 text-xs text-gray-500">모르는 경우 선택하지 않아도 됩니다.</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                성별
              </label>
              <div className="flex space-x-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="M"
                    {...registerProfile('gender', { required: true })}
                    className="mr-2"
                  />
                  남성
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="F"
                    {...registerProfile('gender', { required: true })}
                    className="mr-2"
                  />
                  여성
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="X"
                    {...registerProfile('gender', { required: true })}
                    className="mr-2"
                  />
                  기타
                </label>
              </div>
            </div>
            <Input
              label="거주 지역 (선택사항)"
              {...registerProfile('region')}
              placeholder="예: 서울시 강남구"
            />
            <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border-l-4 border-amber-500 rounded">
              <p className="text-sm text-amber-800 dark:text-amber-200">
                ⚠️ 프로필을 수정하면 Life Profile이 재생성됩니다. 재생성에는 몇 분이 소요될 수 있습니다.
              </p>
            </div>
            <Button
              type="submit"
              disabled={isUpdatingProfile || isRegenerating}
              className="w-full"
            >
              {isRegenerating
                ? 'Life Profile 재생성 중...'
                : isUpdatingProfile
                ? '프로필 업데이트 중...'
                : '프로필 수정'}
            </Button>
          </form>
        ) : (
          <p className="text-gray-500 text-center py-4">프로필 정보를 불러올 수 없습니다.</p>
        )}
      </Card>

      {/* 개인정보 보호 */}
      <Card className="mb-6">
        <h2 className="text-xl font-bold mb-4">개인정보 보호</h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div>
              <h3 className="font-semibold text-sm">개인정보 처리방침</h3>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                수집 항목, 이용 목적, 보관 기간 등
              </p>
            </div>
            <Link to="/privacy-policy" target="_blank">
              <Button variant="outline" size="sm">
                보기
              </Button>
            </Link>
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div>
              <h3 className="font-semibold text-sm">서비스 이용약관</h3>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                서비스 이용 규칙 및 면책 조항
              </p>
            </div>
            <Link to="/terms-of-service" target="_blank">
              <Button variant="outline" size="sm">
                보기
              </Button>
            </Link>
          </div>
        </div>
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
      <Card className="mb-6">
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

      {/* 로그아웃 */}
      <Card className="mb-6">
        <h2 className="text-xl font-bold mb-4">계정</h2>
        <div className="flex items-center justify-between p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
          <div>
            <h3 className="font-semibold text-red-600 dark:text-red-400">로그아웃</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              현재 계정에서 로그아웃합니다.
            </p>
          </div>
          <Button 
            variant="outline" 
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
          >
            {isLoggingOut ? '로그아웃 중...' : '로그아웃'}
          </Button>
        </div>
      </Card>

      {/* 계정 탈퇴 */}
      <Card>
        <h2 className="text-xl font-bold mb-4 text-red-600 dark:text-red-400">계정 탈퇴</h2>
        <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border-2 border-red-200 dark:border-red-800">
          <div className="mb-4">
            <h3 className="font-semibold text-red-700 dark:text-red-300 mb-2">⚠️ 주의사항</h3>
            <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
              계정을 삭제하면 다음 데이터가 <strong>영구적으로 삭제</strong>되며 복구할 수 없습니다:
            </p>
            <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-400 space-y-1 mb-4">
              <li>프로필 정보 (생년월일시, 성별, 거주지역)</li>
              <li>Life Profile (AI 분석 결과)</li>
              <li>모든 기록 데이터</li>
              <li>에너지 사이클 데이터</li>
              <li>OAuth 연동 정보</li>
            </ul>
            {showDeleteConfirm && (
              <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded border border-yellow-300 dark:border-yellow-700 mb-4">
                <p className="text-sm text-yellow-800 dark:text-yellow-200 font-semibold">
                  정말 계정을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
                </p>
              </div>
            )}
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handleDeleteAccount}
              disabled={isDeletingAccount}
              className="border-red-600 text-red-600 hover:bg-red-600 hover:text-white"
            >
              {isDeletingAccount 
                ? '삭제 중...' 
                : showDeleteConfirm 
                  ? '최종 확인: 계정 삭제' 
                  : '계정 탈퇴하기'}
            </Button>
            {showDeleteConfirm && (
              <Button
                variant="outline"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeletingAccount}
                className="border-gray-400 text-gray-600 hover:bg-gray-400 hover:text-white"
              >
                취소
              </Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  )
}

export default MyPage
