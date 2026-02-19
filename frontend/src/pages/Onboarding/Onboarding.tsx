import React, { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import Card from '@/components/Card/Card'
import Button from '@/components/Button/Button'
import Input from '@/components/Input/Input'
import RegionSelect from '@/components/RegionSelect/RegionSelect'
import { motion } from 'framer-motion'
import { profileApi, lifeProfileApi, userApi } from '@/services/api'
import { useUserStore } from '@/store/useUserStore'
import type { LifeProfile } from '@/types'

interface OnboardingFormData {
  calendarType: 'solar' | 'lunar'
  birthDate: string
  birthTime: string
  lunarIntercalation?: boolean
  gender: 'male' | 'female' | 'other'
  region?: string
}

const Onboarding: React.FC = () => {
  const navigate = useNavigate()
  const { setPrivacyConsentGiven } = useUserStore()
  const [step, setStep] = useState(0) // Step 0: 동의 화면 추가
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [profileId, setProfileId] = useState<string | null>(null)
  const [jobId, setJobId] = useState<string | null>(null)
  const [lifeProfile, setLifeProfile] = useState<LifeProfile | null>(null)
  const [consentPrivacy, setConsentPrivacy] = useState(false)
  const [consentTerms, setConsentTerms] = useState(false)
  const [consentSubmitting, setConsentSubmitting] = useState(false)
  const [profileSubmitting, setProfileSubmitting] = useState(false)
  const [profileError, setProfileError] = useState<string | null>(null)
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<OnboardingFormData>({
    defaultValues: { calendarType: 'solar' },
  })
  const calendarType = watch('calendarType')
  const regionValue = watch('region') ?? ''

  // AI 분석 진행 상태 확인
  useEffect(() => {
    if (jobId && step === 2) {
      const interval = setInterval(async () => {
        try {
          const job = await lifeProfileApi.getJobStatus(jobId)
          console.log('Job 상태 확인:', job.status, job.progress)
          if (job.status === 'done') {
            setIsAnalyzing(false)
            // Life Profile 조회
            const response = await lifeProfileApi.getLifeProfile()
            if (response && response.life_profile) {
              setLifeProfile(response.life_profile)
              setStep(4) // Step 4: 분석 결과 요약 화면으로 이동
            } else {
              // Life Profile이 아직 생성되지 않은 경우, 잠시 후 다시 시도
              console.warn('Life Profile이 아직 생성되지 않았습니다. 잠시 후 다시 시도합니다.')
              setTimeout(() => {
                // 다시 조회 시도
                lifeProfileApi.getLifeProfile().then((retryResponse) => {
                  if (retryResponse && retryResponse.life_profile) {
                    setLifeProfile(retryResponse.life_profile)
                    setStep(4)
                  } else {
                    alert('Life Profile 생성이 완료되지 않았습니다. 잠시 후 다시 시도해주세요.')
                    setStep(1)
                  }
                })
              }, 1000)
            }
            clearInterval(interval)
          } else if (job.status === 'failed') {
            alert('분석 생성에 실패했습니다. 다시 시도해주세요.')
            setIsAnalyzing(false)
            setStep(1) // Step 1로 돌아가서 다시 시도할 수 있도록
            clearInterval(interval)
          }
        } catch (error) {
          console.error('Job status check error:', error)
        }
      }, 2000) // 2초마다 확인

      return () => clearInterval(interval)
    }
  }, [jobId, step])

  const handleConsent = async () => {
    if (!consentPrivacy || !consentTerms) {
      alert('필수 동의 항목에 모두 동의해주세요.')
      return
    }
    setConsentSubmitting(true)
    try {
      await userApi.saveConsent()
      setPrivacyConsentGiven(true)
      setStep(1)
    } catch (error) {
      console.error('동의 저장 실패:', error)
      alert('동의 저장에 실패했습니다. 다시 시도해주세요.')
    } finally {
      setConsentSubmitting(false)
    }
  }

  const onSubmit = async (data: OnboardingFormData) => {
    if (step !== 1) return
    setProfileError(null)
    setProfileSubmitting(true)
    try {
      const genderMap: Record<string, 'M' | 'F' | 'X'> = {
        male: 'M',
        female: 'F',
        other: 'X',
      }

      console.log('프로필 저장 시작 (만세력 변환 포함):', data)

      const profileResponse = await profileApi.saveProfile({
        birth_date: data.birthDate,
        birth_time: data.birthTime || undefined,
        gender: genderMap[data.gender],
        region: data.region || undefined,
        calendar_type: data.calendarType,
        is_intercalation: data.calendarType === 'lunar' ? !!data.lunarIntercalation : undefined,
      })

      console.log('프로필 저장 완료:', profileResponse)

      // 저장 직후 조회로 검증 (가입 시 입력 데이터가 이후 마이페이지에서 불러와지는지 확인)
      if (profileResponse.profile) {
        console.log('[온보딩] 저장 응답에 프로필 포함됨. 마이페이지에서 동일 데이터 조회 가능해야 함.')
      } else {
        const verify = await profileApi.getProfile()
        if (verify) {
          console.log('[온보딩] getProfile 검증 성공:', verify.birthDate, verify.gender)
        } else {
          console.warn('[온보딩] getProfile 검증 실패: 저장 직후 조회 시 프로필 없음. 백엔드 로그 확인 권장.')
        }
      }

      setProfileId(profileResponse.profile_id)
      setStep(2)
      setIsAnalyzing(true)

      const jobResponse = await lifeProfileApi.generateLifeProfile(profileResponse.profile_id, {
        detail_level: 'standard',
        language: 'ko',
      })

      console.log('AI 분석 Job 생성 완료:', jobResponse)
      setJobId(jobResponse.job_id)
    } catch (error) {
      console.error('Profile save error:', error)
      const message = error instanceof Error ? error.message : '알 수 없는 오류'
      setProfileError(message)
      alert(`프로필 저장에 실패했습니다.\n\n에러: ${message}\n\n콘솔을 확인해주세요.`)
      setIsAnalyzing(false)
    } finally {
      setProfileSubmitting(false)
    }
  }

  const onFormError = (formErrors: Record<string, { message?: string }>) => {
    const first = Object.values(formErrors)[0]
    setProfileError(first?.message || '입력값을 확인해주세요.')
  }

  // Step 0: 개인정보 수집 및 이용 동의
  if (step === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            개인정보 수집 및 이용 동의
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            서비스 이용을 위해 아래 동의가 필요합니다.
          </p>
        </div>

        <Card className="mb-6">
          <div className="space-y-4">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={consentPrivacy}
                onChange={(e) => setConsentPrivacy(e.target.checked)}
                className="mt-1 w-5 h-5 text-primary rounded"
                required
              />
              <div className="flex-1">
                <span className="font-semibold text-gray-900 dark:text-white">
                  [필수] 개인정보 수집 및 이용 동의
                </span>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  생년월일, 성별 등 개인정보를 수집하여 AI 에너지 분석 서비스를 제공합니다.
                  <Link to="/privacy-policy" className="text-primary underline ml-1" target="_blank">
                    자세히 보기
                  </Link>
                </p>
              </div>
            </label>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={consentTerms}
                onChange={(e) => setConsentTerms(e.target.checked)}
                className="mt-1 w-5 h-5 text-primary rounded"
                required
              />
              <div className="flex-1">
                <span className="font-semibold text-gray-900 dark:text-white">
                  [필수] 서비스 이용약관 동의
                </span>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  서비스 이용약관에 동의합니다.
                  <Link to="/terms-of-service" className="text-primary underline ml-1" target="_blank">
                    자세히 보기
                  </Link>
                </p>
              </div>
            </label>
          </div>
        </Card>

        <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border-l-4 border-amber-500 rounded mb-6">
          <p className="text-sm text-amber-800 dark:text-amber-200">
            <strong>법적 고지:</strong> 본 서비스는 라이프 패턴 분석 기반의 참고용 가이드입니다.
            의료, 투자, 법률 판단을 대체하지 않으며, 모든 추천은 참고용으로만 활용해주세요.
          </p>
        </div>

        <Button
          onClick={handleConsent}
          disabled={!consentPrivacy || !consentTerms || consentSubmitting}
          className="w-full"
        >
          {consentSubmitting ? '저장 중...' : '동의하고 시작하기'}
        </Button>
      </div>
    )
  }

  // Step 1: 기본 정보 입력 (기존 Step 1)
  if (step === 1) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">기본 정보 입력</h1>
            <span className="text-sm text-gray-500">2/3</span>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            AI Personal Energy Modeling을 위해 기본 정보를 입력해주세요.
          </p>
        </div>

        <Card>
          <form onSubmit={handleSubmit(onSubmit, onFormError)} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                양력 / 음력
              </label>
              <div className="flex gap-4">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    value="solar"
                    {...register('calendarType')}
                    className="mr-2"
                  />
                  양력
                </label>
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    value="lunar"
                    {...register('calendarType')}
                    className="mr-2"
                  />
                  음력
                </label>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {calendarType === 'solar' ? '생년월일을 양력으로 입력합니다.' : '생년월일을 음력으로 입력합니다.'}
              </p>
            </div>

            <div>
              <Input
                label={calendarType === 'solar' ? '생년월일 (양력)' : '생년월일 (음력)'}
                type="date"
                {...register('birthDate', { required: '생년월일을 입력해주세요.' })}
              />
              {calendarType === 'lunar' && (
                <label className="flex items-center gap-2 mt-2 cursor-pointer">
                  <input
                    type="checkbox"
                    {...register('lunarIntercalation')}
                    className="w-4 h-4 rounded text-primary"
                  />
                  <span className="text-sm text-gray-600 dark:text-gray-400">윤달</span>
                </label>
              )}
              {errors.birthDate?.message && (
                <p className="text-sm text-red-600 dark:text-red-400 mt-1" role="alert">{errors.birthDate.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                출생 시간
              </label>
              <Input
                type="time"
                {...register('birthTime')}
              />
              <p className="mt-1 text-sm text-gray-500">모르는 경우 선택하지 않아도 됩니다.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                성별
              </label>
              <div className="flex space-x-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="male"
                    {...register('gender', { required: '성별을 선택해주세요.' })}
                    className="mr-2"
                  />
                  남성
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="female"
                    {...register('gender', { required: '성별을 선택해주세요.' })}
                    className="mr-2"
                  />
                  여성
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="other"
                    {...register('gender', { required: '성별을 선택해주세요.' })}
                    className="mr-2"
                  />
                  기타
                </label>
              </div>
              {errors.gender?.message && (
                <p className="text-sm text-red-600 dark:text-red-400 mt-1" role="alert">{errors.gender.message}</p>
              )}
            </div>

            <RegionSelect
              label="거주 지역 (선택사항)"
              value={regionValue}
              onChange={(v) => setValue('region', v)}
              disabled={profileSubmitting}
            />

            {profileError && (
              <p className="text-sm text-red-600 dark:text-red-400" role="alert">{profileError}</p>
            )}
            <button
              type="submit"
              disabled={profileSubmitting}
              className="touch-target font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed bg-primary text-white hover:bg-primary-light focus:ring-primary px-4 py-2 text-base w-full"
              aria-label="내 에너지 분석 시작"
            >
              {profileSubmitting ? '저장 중...' : '내 에너지 분석 시작'}
            </button>
          </form>
        </Card>
      </div>
    )
  }

  // Step 2: AI 분석 중
  if (step === 2) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="mb-8"
          >
            <div className="w-32 h-32 mx-auto bg-primary/20 rounded-full flex items-center justify-center">
              <span className="text-6xl">⚡</span>
            </div>
          </motion.div>
          <h2 className="text-2xl font-bold mb-4">당신의 라이프 패턴을 분석 중입니다</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-2">잠시만 기다려주세요...</p>
          {jobId && (
            <p className="text-sm text-gray-500">Job ID: {jobId}</p>
          )}
        </div>
      </div>
    )
  }

  // Step 3: 분석 완료 대기 (Job이 완료되었지만 Life Profile 로딩 중)
  if (step === 3 || (step === 4 && !lifeProfile)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">결과를 불러오는 중...</p>
        </div>
      </div>
    )
  }

  // Step 4: 분석 결과 요약
  if (step === 4 && lifeProfile) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">분석 완료</h1>
          <p className="text-gray-600 dark:text-gray-400">
            당신의 에너지 프로필이 생성되었습니다.
          </p>
          <p className="text-sm text-gray-500 mt-2">
            상세 정보는 Life Profile 메뉴에서 확인하실 수 있습니다.
          </p>
        </div>

      <Card className="mb-6">
        <h2 className="text-xl font-bold mb-4">Energy Type</h2>
        <div className="text-center p-6 bg-primary/10 rounded-lg">
          <div className="text-4xl mb-2">{lifeProfile.energyTypeEmoji}</div>
          <div className="text-2xl font-bold">{lifeProfile.energyType}</div>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            {lifeProfile.cycleDescription}
          </p>
        </div>
      </Card>

      <Card className="mb-6">
        <h2 className="text-xl font-bold mb-4">주요 강점</h2>
        <div className="flex flex-wrap gap-2">
          {lifeProfile.strengths.map((strength, index) => (
            <span
              key={index}
              className="px-4 py-2 bg-energy-green/20 text-energy-green rounded-full"
            >
              {strength}
            </span>
          ))}
        </div>
      </Card>

      <Card className="mb-6">
        <h2 className="text-xl font-bold mb-4">추천 사항</h2>
        <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
          {lifeProfile.recommendations.map((rec, index) => (
            <li key={index}>{rec}</li>
          ))}
        </ul>
      </Card>

      <Button onClick={() => navigate('/')} className="w-full">
        대시보드로 이동
      </Button>
    </div>
    )
  }

  // 기본 반환 (모든 조건이 충족되지 않은 경우)
  return null
}

export default Onboarding
