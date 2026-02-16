import React, { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useUserStore } from '@/store/useUserStore'
import { userApi, authApi, profileApi, lifeProfileApi, isNetworkError } from '@/services/api'
import Card from '@/components/Card/Card'
import Button from '@/components/Button/Button'
import Input from '@/components/Input/Input'
import type { Profile, SajuAnalysisResponse } from '@/types'

interface UserFormData {
  name: string
  email: string
}

interface ProfileFormData {
  calendarType: 'solar' | 'lunar'
  lunarIntercalation?: boolean
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
  const [sajuAnalysis, setSajuAnalysis] = useState<SajuAnalysisResponse | null>(null)
  const [isLoadingSajuAnalysis, setIsLoadingSajuAnalysis] = useState(false)
  const [isGeneratingSaju, setIsGeneratingSaju] = useState(false)
  const [showSajuDetail, setShowSajuDetail] = useState(false)
  const [connectionError, setConnectionError] = useState(false)
  const { register, handleSubmit, reset } = useForm<UserFormData>()
  const {
    register: registerProfile,
    handleSubmit: handleSubmitProfile,
    reset: resetProfile,
    watch: watchProfile,
  } = useForm<ProfileFormData>({ defaultValues: { calendarType: 'solar' } })
  const profileCalendarType = watchProfile('calendarType')

  // 가입 시 입력한 프로필 로드: 사용자 있으면 프로필 조회, 없으면 사용자 먼저 로드
  useEffect(() => {
    if (user) {
      reset({
        name: user.name,
        email: user.email,
      })
      loadProfile()
    } else {
      loadUser()
    }
  }, [user, reset])

  // 탭 포커스/다른 페이지에서 돌아왔을 때 프로필 다시 로드 (온보딩 직후 등)
  useEffect(() => {
    const onFocus = () => {
      if (user) loadProfile()
    }
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [user])

  const loadProfile = async () => {
    try {
      setIsLoadingProfile(true)
      setConnectionError(false)
      const profileData = await profileApi.getProfile()
      setProfile(profileData ?? null)
      resetProfile(
        profileData
          ? {
              calendarType: (profileData.saju?.calendarType as 'solar' | 'lunar') || 'solar',
              lunarIntercalation: !!profileData.saju?.isIntercalation,
              birthDate: profileData.birthDate,
              birthTime: profileData.birthTime || '',
              gender: profileData.gender,
              region: profileData.region || '',
            }
          : {
              calendarType: 'solar',
              lunarIntercalation: false,
              birthDate: '',
              birthTime: '',
              gender: 'M' as const,
              region: '',
            }
      )
    } catch (error) {
      if (isNetworkError(error)) {
        setConnectionError(true)
      }
      console.error('Failed to load profile:', error)
    } finally {
      setIsLoadingProfile(false)
    }
  }

  const loadSajuAnalysis = async () => {
    try {
      setIsLoadingSajuAnalysis(true)
      const data = await profileApi.getSajuAnalysis()
      setSajuAnalysis(data ?? null)
      return data
    } catch (e) {
      console.error('Failed to load saju analysis:', e)
      setSajuAnalysis(null)
      return null
    } finally {
      setIsLoadingSajuAnalysis(false)
    }
  }

  const POLL_INTERVAL_MS = 2000
  const POLL_TIMEOUT_MS = 120000

  const handleGenerateSajuAnalysis = async () => {
    try {
      await profileApi.generateSajuAnalysis()
    } catch (e: any) {
      const msg = e?.message || e?.body?.message || '분석 생성 요청에 실패했습니다.'
      alert(msg)
      return
    }
    setIsGeneratingSaju(true)
    const deadline = Date.now() + POLL_TIMEOUT_MS
    const poll = async () => {
      if (Date.now() > deadline) {
        setIsGeneratingSaju(false)
        alert('분석 생성이 지연되고 있습니다. 잠시 후 새로고침해 주세요.')
        return
      }
      try {
        const data = await profileApi.getSajuAnalysis()
        if (data && data.status !== 'not_found') {
          setSajuAnalysis(data)
          if (data.status === 'done' || data.status === 'failed') {
            setIsGeneratingSaju(false)
            if (data.status === 'done') setShowSajuDetail(true)
            return
          }
        }
      } catch (_) {
        // ignore poll errors, retry
      }
      setTimeout(poll, POLL_INTERVAL_MS)
    }
    setTimeout(poll, POLL_INTERVAL_MS)
  }

  useEffect(() => {
    if (profile?.profileId) {
      loadSajuAnalysis()
    } else {
      setSajuAnalysis(null)
    }
  }, [profile?.profileId])

  const loadUser = async () => {
    try {
      const userData = await userApi.getCurrentUser()
      setUser(userData)
      reset({
        name: userData.name,
        email: userData.email,
      })
      // user가 설정되면 useEffect에서 loadProfile()이 호출됨
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
    const confirmMessage = profile
      ? '프로필을 수정하면 Life Profile이 재생성됩니다.\n계속하시겠습니까?'
      : '프로필을 저장하면 Life Profile 생성이 필요합니다.\n계속하시겠습니까?'
    if (!confirm(confirmMessage)) return

    setIsUpdatingProfile(true)
    try {
      // 프로필 업데이트
      const response = await profileApi.saveProfile({
        birth_date: data.birthDate,
        birth_time: data.birthTime || undefined,
        gender: data.gender,
        region: data.region || undefined,
        calendar_type: data.calendarType,
        is_intercalation: data.calendarType === 'lunar' ? !!data.lunarIntercalation : undefined,
      })

      if (response.saju_analysis_status === 'queued') {
        const pollAnalysis = setInterval(async () => {
          const updated = await profileApi.getSajuAnalysis()
          if (updated) {
            setSajuAnalysis(updated)
            if (updated.status === 'done' || updated.status === 'failed') clearInterval(pollAnalysis)
          }
        }, 3000)
        setTimeout(() => clearInterval(pollAnalysis), 120000)
      }

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
      {connectionError && (
        <div
          className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200"
          role="alert"
        >
          <p className="font-medium">서버에 연결할 수 없습니다.</p>
          <p className="mt-1 text-sm">
            백엔드 서버(localhost:3001)가 실행 중인지 확인해 주세요. 개발 시에는 터미널에서 API 서버를 먼저 실행해야 합니다.
          </p>
        </div>
      )}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">마이페이지</h1>
        <p className="text-gray-600 dark:text-gray-400">
          개인정보를 관리하고 설정을 변경하세요.
        </p>
        {import.meta.env.DEV && (
          <Link
            to="/dev/profile-test"
            className="inline-block mt-2 text-sm text-primary hover:underline"
          >
            🧪 개발: 프로필·결과 테스트 페이지
          </Link>
        )}
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

      {/* 프로필 정보 (에너지 분석용) — 가입 시 입력한 개인정보 표시/입력 */}
      <Card className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold">프로필 정보</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              에너지 분석에 사용되는 정보입니다. 수정 시 Life Profile이 재생성됩니다.
            </p>
          </div>
          {user && (
            <Button
              type="button"
              variant="secondary"
              onClick={() => loadProfile()}
              disabled={isLoadingProfile}
              className="shrink-0"
            >
              {isLoadingProfile ? '불러오는 중…' : '프로필 다시 불러오기'}
            </Button>
          )}
        </div>
        {isLoadingProfile ? (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-sm text-gray-500">로딩 중...</p>
          </div>
        ) : (
          <>
            {!profile && (
              <div className="p-3 mb-4 bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 rounded text-sm text-blue-800 dark:text-blue-200">
                가입 시 입력한 프로필이 없거나 아직 저장되지 않았습니다. 아래에서 입력 후 저장해주세요.
              </div>
            )}
            <form onSubmit={handleSubmitProfile(onProfileSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                양력 / 음력
              </label>
              <div className="flex gap-4">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    value="solar"
                    {...registerProfile('calendarType')}
                    className="mr-2"
                  />
                  양력
                </label>
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    value="lunar"
                    {...registerProfile('calendarType')}
                    className="mr-2"
                  />
                  음력
                </label>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {profileCalendarType === 'solar' ? '생년월일을 양력으로 입력합니다.' : '생년월일을 음력으로 입력합니다.'}
              </p>
            </div>
            <div>
              <Input
                label={profileCalendarType === 'solar' ? '생년월일 (양력)' : '생년월일 (음력)'}
                type="date"
                {...registerProfile('birthDate', { required: '생년월일을 입력해주세요.' })}
              />
              {profileCalendarType === 'lunar' && (
                <label className="flex items-center gap-2 mt-2 cursor-pointer">
                  <input
                    type="checkbox"
                    {...registerProfile('lunarIntercalation')}
                    className="w-4 h-4 rounded text-primary"
                  />
                  <span className="text-sm text-gray-600 dark:text-gray-400">윤달</span>
                </label>
              )}
            </div>
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
                  : profile
                    ? '프로필 수정'
                    : '프로필 저장'}
            </Button>
          </form>
          </>
        )}
      </Card>

      {/* 사주 결과 (참조 페이지와 동일한 계산 결과 — 개인정보) */}
      {profile?.saju && (
        <Card className="mb-6">
          <h2 className="text-xl font-bold mb-4">사주 결과 (개인정보)</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            만세력 기준 계산 결과입니다. 참조 사이트와 동일한 항목으로 저장됩니다.
          </p>

          {/* 사주 4주 */}
          {(profile.saju.gapjaKorean || profile.saju.gapjaChinese) && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">사주 4주</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border border-gray-200 dark:border-gray-600 rounded-lg">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-700">
                      <th className="px-3 py-2 text-left">구분</th>
                      <th className="px-3 py-2 text-left">연주</th>
                      <th className="px-3 py-2 text-left">월주</th>
                      <th className="px-3 py-2 text-left">일주</th>
                      <th className="px-3 py-2 text-left">시주</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="px-3 py-2 font-medium">한글</td>
                      <td className="px-3 py-2">{profile.saju.gapjaKorean?.year ?? '-'}</td>
                      <td className="px-3 py-2">{profile.saju.gapjaKorean?.month ?? '-'}</td>
                      <td className="px-3 py-2">{profile.saju.gapjaKorean?.day ?? '-'}</td>
                      <td className="px-3 py-2">{profile.saju.gapjaKorean?.hour ?? '-'}</td>
                    </tr>
                    <tr className="bg-gray-50/50 dark:bg-gray-800/50">
                      <td className="px-3 py-2 font-medium">한자</td>
                      <td className="px-3 py-2">{profile.saju.gapjaChinese?.year ?? '-'}</td>
                      <td className="px-3 py-2">{profile.saju.gapjaChinese?.month ?? '-'}</td>
                      <td className="px-3 py-2">{profile.saju.gapjaChinese?.day ?? '-'}</td>
                      <td className="px-3 py-2">{profile.saju.gapjaChinese?.hour ?? '-'}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 오행 분포 */}
          {profile.saju.ohang?.distribution && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">오행 분포</h3>
              <div className="flex flex-wrap gap-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <span>목 {profile.saju.ohang.distribution.목 ?? 0}</span>
                <span>화 {profile.saju.ohang.distribution.화 ?? 0}</span>
                <span>토 {profile.saju.ohang.distribution.토 ?? 0}</span>
                <span>금 {profile.saju.ohang.distribution.금 ?? 0}</span>
                <span>수 {profile.saju.ohang.distribution.수 ?? 0}</span>
              </div>
            </div>
          )}

          {/* 십성 & 12운성 */}
          {(profile.saju.sipseong || profile.saju.unseong12) && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">십성 &amp; 12운성</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border border-gray-200 dark:border-gray-600 rounded-lg">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-700">
                      <th className="px-3 py-2 text-left">구분</th>
                      <th className="px-3 py-2 text-left">연주</th>
                      <th className="px-3 py-2 text-left">월주</th>
                      <th className="px-3 py-2 text-left">일주</th>
                      <th className="px-3 py-2 text-left">시주</th>
                    </tr>
                  </thead>
                  <tbody>
                    {profile.saju.sipseong && (
                      <tr>
                        <td className="px-3 py-2 font-medium">십성</td>
                        <td className="px-3 py-2">{profile.saju.sipseong.year?.ko ?? '-'}</td>
                        <td className="px-3 py-2">{profile.saju.sipseong.month?.ko ?? '-'}</td>
                        <td className="px-3 py-2">{profile.saju.sipseong.day?.ko ?? '-'}</td>
                        <td className="px-3 py-2">{profile.saju.sipseong.hour?.ko ?? '-'}</td>
                      </tr>
                    )}
                    {profile.saju.unseong12 && (
                      <tr className="bg-gray-50/50 dark:bg-gray-800/50">
                        <td className="px-3 py-2 font-medium">12운성</td>
                        <td className="px-3 py-2">{profile.saju.unseong12.year?.ko ?? '-'}</td>
                        <td className="px-3 py-2">{profile.saju.unseong12.month?.ko ?? '-'}</td>
                        <td className="px-3 py-2">{profile.saju.unseong12.day?.ko ?? '-'}</td>
                        <td className="px-3 py-2">{profile.saju.unseong12.hour?.ko ?? '-'}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 천간 특수관계 */}
          {profile.saju?.cheonganRelation && Object.values(profile.saju.cheonganRelation).some((arr: unknown) => Array.isArray(arr) && arr.length > 0) && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">천간 특수관계</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border border-gray-200 dark:border-gray-600 rounded-lg">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-700">
                      <th className="px-3 py-2 text-left">구분</th>
                      <th className="px-3 py-2 text-left">연주</th>
                      <th className="px-3 py-2 text-left">월주</th>
                      <th className="px-3 py-2 text-left">일주</th>
                      <th className="px-3 py-2 text-left">시주</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="px-3 py-2 font-medium">천간 합/冲</td>
                      {(['year', 'month', 'day', 'hour'] as const).map((k) => (
                        <td key={k} className="px-3 py-2">
                          {profile.saju?.cheonganRelation?.[k]?.length
                            ? profile.saju.cheonganRelation[k].map((r: { typeKo: string; withStem: string }, i: number) => (
                                <span key={i}>{r.typeKo}{r.withStem} </span>
                              ))
                            : '-'}
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 십이신살·신살 종합 (참조: 십이신살 행 + 신살 행) */}
          {(profile.saju?.sinsal12Pillar || profile.saju?.sinsalCombined || profile.saju?.sinsal12) && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">십이신살·신살 종합</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border border-gray-200 dark:border-gray-600 rounded-lg">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-700">
                      <th className="px-3 py-2 text-left">구분</th>
                      <th className="px-3 py-2 text-left">연주</th>
                      <th className="px-3 py-2 text-left">월주</th>
                      <th className="px-3 py-2 text-left">일주</th>
                      <th className="px-3 py-2 text-left">시주</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="px-3 py-2 font-medium">십이신살</td>
                      {(['year', 'month', 'day', 'hour'] as const).map((p) => (
                        <td key={p} className="px-3 py-2">
                          {profile.saju?.sinsal12?.[p]?.map((s: { ko: string }) => s.ko).join(', ') ?? '-'}
                        </td>
                      ))}
                    </tr>
                    <tr className="bg-gray-50/50 dark:bg-gray-800/50">
                      <td className="px-3 py-2 font-medium">신살</td>
                      {(['year', 'month', 'day', 'hour'] as const).map((p) => (
                        <td key={p} className="px-3 py-2">
                          {profile.saju?.sinsalCombined?.[p]?.join(', ') ?? '-'}
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 대운 (참조: 대운나이·간지·천간십성·지지십성·신살·12운성) */}
          {profile.saju?.daeun?.steps?.length && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">대운 (한국천문연구원 기준)</h3>
              {profile.saju?.daeun?.note && <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">{profile.saju.daeun.note}</p>}
              <div className="overflow-x-auto">
                <table className="w-full text-sm border border-gray-200 dark:border-gray-600 rounded-lg">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-700">
                      <th className="px-3 py-2 text-left">대운나이</th>
                      <th className="px-3 py-2 text-left">간지</th>
                      <th className="px-3 py-2 text-left">천간 십성</th>
                      <th className="px-3 py-2 text-left">지지 십성</th>
                      <th className="px-3 py-2 text-left">신살</th>
                      <th className="px-3 py-2 text-left">12운성</th>
                    </tr>
                  </thead>
                  <tbody>
                    {profile.saju?.daeun?.steps.map((s: { age?: number; gapjaKo: string; gapja: string; sipseong?: { ko: string } | null; sipseongJi?: { ko: string } | null; sinsal?: string | null; unseong12?: { ko: string } | null }, i: number) => (
                      <tr key={i} className="border-t border-gray-200 dark:border-gray-600">
                        <td className="px-3 py-2">{s.age ?? [7, 17, 27, 37, 47, 57, 67, 77, 87, 97][i]}세</td>
                        <td className="px-3 py-2 font-mono">{s.gapjaKo} ({s.gapja})</td>
                        <td className="px-3 py-2">{s.sipseong?.ko ?? '-'}</td>
                        <td className="px-3 py-2">{s.sipseongJi?.ko ?? '-'}</td>
                        <td className="px-3 py-2">{s.sinsal ?? '-'}</td>
                        <td className="px-3 py-2">{s.unseong12?.ko ?? '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 세운(년운): 현재 연도 중심 표시, 올해 행 강조 */}
          {profile.saju?.seun?.length && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">세운(년운)</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">현재 연도 중심으로 표시됩니다.</p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border border-gray-200 dark:border-gray-600 rounded-lg">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-700">
                      <th className="px-3 py-2 text-left">연도</th>
                      <th className="px-3 py-2 text-left">간지</th>
                      <th className="px-3 py-2 text-left">천간 십성</th>
                      <th className="px-3 py-2 text-left">지지 십성</th>
                      <th className="px-3 py-2 text-left">신살</th>
                      <th className="px-3 py-2 text-left">12운성</th>
                    </tr>
                  </thead>
                  <tbody>
                    {profile.saju?.seun.map((s: { year: number; gapjaKo: string; gapja: string; sipseong?: { ko: string } | null; sipseongJi?: { ko: string } | null; sinsal?: string | null; unseong12?: { ko: string } | null }, i: number) => {
                      const isCurrentYear = s.year === new Date().getFullYear();
                      return (
                        <tr
                          key={i}
                          className={`border-t border-gray-200 dark:border-gray-600 ${isCurrentYear ? 'bg-green-50 dark:bg-green-900/20 ring-1 ring-green-400 dark:ring-green-600' : ''}`}
                        >
                          <td className="px-3 py-2 font-medium">{s.year}{isCurrentYear ? ' (올해)' : ''}</td>
                          <td className="px-3 py-2 font-mono">{s.gapjaKo} ({s.gapja})</td>
                          <td className="px-3 py-2">{s.sipseong?.ko ?? '-'}</td>
                          <td className="px-3 py-2">{s.sipseongJi?.ko ?? '-'}</td>
                          <td className="px-3 py-2">{s.sinsal ?? '-'}</td>
                          <td className="px-3 py-2">{s.unseong12?.ko ?? '-'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 월운 (참조 사이트와 동일: 당해년 기준, 12월→1월 순) */}
          {profile.saju?.woleun?.length && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">월운</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">당해년(현재 연도) 기준, 양력 1월=丑月 … 12월=子月</p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border border-gray-200 dark:border-gray-600 rounded-lg">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-700">
                      <th className="px-3 py-2 text-left">월운월</th>
                      <th className="px-3 py-2 text-left">간지</th>
                      <th className="px-3 py-2 text-left">천간 십성</th>
                      <th className="px-3 py-2 text-left">지지 십성</th>
                      <th className="px-3 py-2 text-left">신살</th>
                      <th className="px-3 py-2 text-left">12운성</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...(profile.saju?.woleun ?? [])]
                      .sort((a, b) => b.month - a.month)
                      .map((s, i) => (
                        <tr key={s.month} className="border-t border-gray-200 dark:border-gray-600">
                          <td className="px-3 py-2">{s.month}월</td>
                          <td className="px-3 py-2 font-mono">{s.gapjaKo} ({s.gapja})</td>
                          <td className="px-3 py-2">{s.sipseong?.ko ?? '-'}</td>
                          <td className="px-3 py-2">{s.sipseongJi?.ko ?? '-'}</td>
                          <td className="px-3 py-2">{s.sinsal ?? '-'}</td>
                          <td className="px-3 py-2">{s.unseong12?.ko ?? '-'}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* 사주 상세 분석 (AI) — 저장된 데이터로 다른 메뉴에서 재사용 */}
      {profile?.saju && (
        <Card className="mb-6">
          <h2 className="text-xl font-bold mb-4">사주 상세 분석 (AI)</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            등록된 사주를 기준으로 생성된 상세 해석입니다. 한 번 저장된 분석은 다른 메뉴에서도 활용됩니다.
          </p>
          {isLoadingSajuAnalysis ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto" />
              <p className="mt-2 text-sm text-gray-500">분석 정보 불러오는 중...</p>
            </div>
          ) : isGeneratingSaju ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto" />
              <p className="mt-2 text-sm text-gray-500">AI 분석 생성 중...</p>
            </div>
          ) : !sajuAnalysis ? (
            <div className="space-y-3">
              <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg text-sm text-gray-600 dark:text-gray-400 space-y-2">
                <p>아직 분석이 없습니다. 아래 버튼을 누르면 저장된 사주를 바탕으로 AI가 상세 분석을 생성합니다.</p>
                <p className="text-xs">
                  프로필을 아직 저장하지 않았다면, 이 카드 위쪽의 <strong>프로필</strong> 카드에서 생년월일·출생시간·성별을 입력한 뒤 <strong>프로필 저장</strong> 버튼을 눌러주세요.
                </p>
              </div>
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={handleGenerateSajuAnalysis}
                disabled={isGeneratingSaju}
              >
                AI로 사주 상세 분석 생성하기
              </Button>
            </div>
          ) : sajuAnalysis.status === 'queued' ? (
            <div className="space-y-3">
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-sm text-blue-800 dark:text-blue-200">
                분석 생성 중입니다. 잠시 후 새로고침하거나 이 페이지를 다시 열어주세요.
              </div>
              <Button type="button" variant="outline" size="sm" onClick={() => loadSajuAnalysis()}>
                새로고침
              </Button>
            </div>
          ) : sajuAnalysis.status === 'failed' ? (
            <div className="space-y-3">
              <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg text-sm text-red-800 dark:text-red-200">
                분석 생성에 실패했습니다.
                {sajuAnalysis.error_message && ` (${sajuAnalysis.error_message})`}
              </div>
              <Button type="button" variant="outline" size="sm" onClick={() => loadSajuAnalysis()}>
                새로고침
              </Button>
            </div>
          ) : sajuAnalysis.status === 'done' && sajuAnalysis.analysis ? (
            <div className="space-y-4">
              <Button
                type="button"
                variant={showSajuDetail ? 'outline' : 'primary'}
                size="sm"
                onClick={() => setShowSajuDetail((v) => !v)}
              >
                {showSajuDetail ? '상세 접기' : '사주 상세 내용 보기'}
              </Button>
              {showSajuDetail && (
                <div className="space-y-4 pt-2 border-t border-gray-200 dark:border-gray-600">
                  {sajuAnalysis.analysis.item_interpretations && Object.keys(sajuAnalysis.analysis.item_interpretations).length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">항목별 해석</h3>
                      <div className="space-y-3">
                        {Object.entries(sajuAnalysis.analysis.item_interpretations).map(([key, value]) => (
                          <div key={key} className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                            <h4 className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">{key}</h4>
                            <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{String(value)}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {sajuAnalysis.analysis.summary && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">요약</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">{sajuAnalysis.analysis.summary}</p>
                    </div>
                  )}
                  {sajuAnalysis.analysis.personality && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">성향</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">{sajuAnalysis.analysis.personality}</p>
                    </div>
                  )}
                  {sajuAnalysis.analysis.strengths && sajuAnalysis.analysis.strengths.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">강점</h3>
                      <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-400">
                        {sajuAnalysis.analysis.strengths.map((s, i) => (
                          <li key={i}>{s}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {sajuAnalysis.analysis.weaknesses && sajuAnalysis.analysis.weaknesses.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">약점</h3>
                      <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-400">
                        {sajuAnalysis.analysis.weaknesses.map((w, i) => (
                          <li key={i}>{w}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {sajuAnalysis.analysis.life_phases && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">인생 국면</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">{sajuAnalysis.analysis.life_phases}</p>
                    </div>
                  )}
                  {sajuAnalysis.analysis.recommendations && sajuAnalysis.analysis.recommendations.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">추천</h3>
                      <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-400">
                        {sajuAnalysis.analysis.recommendations.map((r, i) => (
                          <li key={i}>{r}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg text-sm text-gray-600 dark:text-gray-400">
              분석 결과가 없습니다.
            </div>
          )}
        </Card>
      )}

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
