import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import Card from '@/components/Card/Card'
import Button from '@/components/Button/Button'
import Input from '@/components/Input/Input'
import { motion } from 'framer-motion'

interface OnboardingFormData {
  birthDate: string
  birthTime: string
  gender: 'male' | 'female' | 'other'
  region?: string
}

const Onboarding: React.FC = () => {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const { register, handleSubmit, watch } = useForm<OnboardingFormData>()

  const onSubmit = async (data: OnboardingFormData) => {
    if (step === 1) {
      setStep(2)
      setIsAnalyzing(true)
      // AI 분석 시뮬레이션
      setTimeout(() => {
        setIsAnalyzing(false)
        setStep(3)
      }, 3000)
    }
  }

  if (step === 1) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">기본 정보 입력</h1>
            <span className="text-sm text-gray-500">1/2</span>
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
          <p className="text-gray-600 dark:text-gray-400">잠시만 기다려주세요...</p>
        </div>
      </div>
    )
  }

  // Step 3: AI 분석 결과 요약
  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">분석 완료</h1>
        <p className="text-gray-600 dark:text-gray-400">
          당신의 에너지 프로필이 생성되었습니다.
        </p>
      </div>

      <Card className="mb-6">
        <h2 className="text-xl font-bold mb-4">Energy Type</h2>
        <div className="text-center p-6 bg-primary/10 rounded-lg">
          <div className="text-4xl mb-2">🌊</div>
          <div className="text-2xl font-bold">활동형 리듬</div>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            오전 집중력이 높고 오후 회복 패턴을 보입니다.
          </p>
        </div>
      </Card>

      <Card className="mb-6">
        <h2 className="text-xl font-bold mb-4">주요 강점</h2>
        <div className="flex flex-wrap gap-2">
          <span className="px-4 py-2 bg-energy-green/20 text-energy-green rounded-full">집중력</span>
          <span className="px-4 py-2 bg-energy-yellow/20 text-energy-yellow rounded-full">창의성</span>
          <span className="px-4 py-2 bg-energy-orange/20 text-energy-orange rounded-full">리더십</span>
        </div>
      </Card>

      <Button onClick={() => navigate('/')} className="w-full">
        대시보드로 이동
      </Button>
    </div>
  )
}

export default Onboarding
