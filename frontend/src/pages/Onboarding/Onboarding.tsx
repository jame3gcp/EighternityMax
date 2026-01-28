import React, { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import Card from '@/components/Card/Card'
import Button from '@/components/Button/Button'
import Input from '@/components/Input/Input'
import { motion } from 'framer-motion'
import { profileApi, lifeProfileApi } from '@/services/api'
import type { LifeProfile } from '@/types'

interface OnboardingFormData {
  birthDate: string
  birthTime: string
  gender: 'male' | 'female' | 'other'
  region?: string
}

const Onboarding: React.FC = () => {
  const navigate = useNavigate()
  const [step, setStep] = useState(0) // Step 0: 동의 화면 추가
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [profileId, setProfileId] = useState<string | null>(null)
  const [jobId, setJobId] = useState<string | null>(null)
  const [lifeProfile, setLifeProfile] = useState<LifeProfile | null>(null)
  const [consentPrivacy, setConsentPrivacy] = useState(false)
  const [consentTerms, setConsentTerms] = useState(false)
  const { register, handleSubmit, watch } = useForm<OnboardingFormData>()

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

  const handleConsent = () => {
    if (consentPrivacy && consentTerms) {
      setStep(1)
    } else {
      alert('필수 동의 항목에 모두 동의해주세요.')
    }
  }

  const onSubmit = async (data: OnboardingFormData) => {
    // Step 1에서 폼 제출 처리
    if (step === 1) {
      try {
        // 성별 변환 (M/F/X)
        const genderMap: Record<string, 'M' | 'F' | 'X'> = {
          male: 'M',
          female: 'F',
          other: 'X',
        }

        console.log('프로필 저장 시작:', data)

        // 프로필 저장
        const profileResponse = await profileApi.saveProfile({
          birth_date: data.birthDate,
          birth_time: data.birthTime || undefined,
          gender: genderMap[data.gender],
          region: data.region || undefined,
        })

        console.log('프로필 저장 완료:', profileResponse)

        setProfileId(profileResponse.profile_id)
        setStep(2) // Step 2: AI 분석 중 화면으로 이동
        setIsAnalyzing(true)

        // AI 분석 생성
        console.log('AI 분석 생성 시작')
        const jobResponse = await lifeProfileApi.generateLifeProfile(profileResponse.profile_id, {
          detail_level: 'standard',
          language: 'ko',
        })

        console.log('AI 분석 Job 생성 완료:', jobResponse)
        setJobId(jobResponse.job_id)
      } catch (error) {
        console.error('Profile save error:', error)
        alert(`프로필 저장에 실패했습니다.\n\n에러: ${error instanceof Error ? error.message : '알 수 없는 오류'}\n\n콘솔을 확인해주세요.`)
        setIsAnalyzing(false)
      }
    }
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
          disabled={!consentPrivacy || !consentTerms}
          className="w-full"
        >
          동의하고 시작하기
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
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <Input
              label="생년월일"
              type="date"
              {...register('birthDate', { required: '생년월일을 입력해주세요.' })}
            />

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
                    {...register('gender', { required: true })}
                    className="mr-2"
                  />
                  남성
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="female"
                    {...register('gender', { required: true })}
                    className="mr-2"
                  />
                  여성
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="other"
                    {...register('gender', { required: true })}
                    className="mr-2"
                  />
                  기타
                </label>
              </div>
            </div>

            <Input
              label="거주 지역 (선택사항)"
              {...register('region')}
              placeholder="예: 서울시 강남구"
            />

            <Button type="submit" className="w-full">
              내 에너지 분석 시작
            </Button>
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
