import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import Card from '@/components/Card/Card'
import Button from '@/components/Button/Button'
import { motion } from 'framer-motion'

interface DailyGuideFormData {
  mood: number
  condition: number
  sleep: number
  scheduleType: string
  memo: string
}

const DailyGuide: React.FC = () => {
  const [guideGenerated, setGuideGenerated] = useState(false)
  const { register, handleSubmit, watch } = useForm<DailyGuideFormData>({
    defaultValues: {
      mood: 50,
      condition: 50,
      sleep: 50,
      scheduleType: '',
      memo: '',
    },
  })

  const moodValue = watch('mood')
  const conditionValue = watch('condition')
  const sleepValue = watch('sleep')

  const onSubmit = async (data: DailyGuideFormData) => {
    // AI 가이드 생성 시뮬레이션
    setTimeout(() => {
      setGuideGenerated(true)
    }, 1000)
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">데일리 가이드</h1>
        <p className="text-gray-600 dark:text-gray-400">
          오늘의 상태를 입력하면 AI가 맞춤 가이드를 제공합니다.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <h2 className="text-xl font-bold mb-4">오늘의 상태</h2>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                기분: {moodValue}
              </label>
              <input
                type="range"
                min="0"
                max="100"
                {...register('mood', { valueAsNumber: true })}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                컨디션: {conditionValue}
              </label>
              <input
                type="range"
                min="0"
                max="100"
                {...register('condition', { valueAsNumber: true })}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                수면 품질: {sleepValue}
              </label>
              <input
                type="range"
                min="0"
                max="100"
                {...register('sleep', { valueAsNumber: true })}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                일정 유형
              </label>
              <div className="flex flex-wrap gap-2">
                {['업무', '회의', '학습', '휴식', '운동', '만남'].map((type) => (
                  <label key={type} className="flex items-center">
                    <input
                      type="checkbox"
                      value={type}
                      {...register('scheduleType')}
                      className="mr-2"
                    />
                    <span className="px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-lg text-sm">
                      {type}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <textarea
              {...register('memo')}
              placeholder="오늘의 특별한 일이나 메모를 입력하세요..."
              className="w-full px-4 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-600"
              rows={3}
            />

            <Button type="submit" className="w-full">
              가이드 생성하기
            </Button>
          </form>
        </Card>

        <Card>
          <h2 className="text-xl font-bold mb-4">AI 가이드</h2>
          {guideGenerated ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div>
                <h3 className="font-semibold text-energy-green mb-2">오늘 적합한 활동</h3>
                <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300">
                  <li>창의적인 작업에 집중하기</li>
                  <li>중요한 결정은 오전에 하기</li>
                  <li>가벼운 운동으로 에너지 회복</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-status-warning mb-2">피해야 할 행동</h3>
                <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300">
                  <li>과도한 업무 스케줄</li>
                  <li>중요한 약속을 오후 늦게 잡기</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2">인간관계 대응 팁</h3>
                <p className="text-gray-700 dark:text-gray-300">
                  오늘은 협력적인 대화가 잘 통할 시기입니다. 팀 프로젝트나 협업에 집중하세요.
                </p>
              </div>
            </motion.div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              상태를 입력하고 가이드를 생성해주세요.
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}

export default DailyGuide
