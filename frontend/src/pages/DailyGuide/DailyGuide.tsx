import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import Card from '@/components/Card/Card'
import Button from '@/components/Button/Button'
import { motion } from 'framer-motion'
import { dailyGuideApi } from '@/services/api'
import { useLifeProfileStore } from '@/store/useLifeProfileStore'
import EnergyElementBadge from '@/components/EnergyElementBadge/EnergyElementBadge'
import type { DailyGuide } from '@/types'

interface DailyGuideFormData {
  mood: number
  condition: number
  sleep: number
  scheduleType: string
  memo: string
}

const DailyGuide: React.FC = () => {
  const { lifeProfile, fetchLifeProfile } = useLifeProfileStore()
  const [dailyGuide, setDailyGuide] = useState<DailyGuide | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
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

  useEffect(() => {
    loadDailyGuide(selectedDate)
    // Life Profile 로드 (설명용)
    if (!lifeProfile) {
      fetchLifeProfile()
    }
  }, [selectedDate, lifeProfile, fetchLifeProfile])

  const loadDailyGuide = async (date: string) => {
    try {
      setIsLoading(true)
      const guide = await dailyGuideApi.getDailyGuide(date)
      setDailyGuide(guide)
    } catch (error) {
      console.error('Failed to load daily guide:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const onSubmit = async (data: DailyGuideFormData) => {
    // 기록 저장 (STEP 2에서 구현 예정)
    console.log('Record data:', data)
    // 가이드 새로고침
    await loadDailyGuide(selectedDate)
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">데일리 가이드</h1>
            <p className="text-gray-600 dark:text-gray-400">
              오늘의 상태를 입력하면 AI가 맞춤 가이드를 제공합니다.
            </p>
          </div>
          <div>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-4 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-600"
            />
          </div>
        </div>
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
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-gray-500">가이드를 불러오는 중...</p>
            </div>
          ) : dailyGuide ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-500">Phase Tag</span>
                  <span className="px-3 py-1 bg-primary/20 text-primary rounded-full text-sm font-semibold">
                    {dailyGuide.phase_tag}
                  </span>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-500">Energy Index</span>
                  <span className="text-2xl font-bold text-primary">{dailyGuide.energy_index}</span>
                </div>
              </div>

              <div className="p-4 bg-primary/5 rounded-lg mb-4">
                <p className="text-gray-700 dark:text-gray-300">{dailyGuide.summary}</p>
              </div>

              {/* Life Profile 기반 추천 근거 */}
              {lifeProfile?.energyElements && lifeProfile.energyElements.length > 0 && (
                <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border-l-4 border-amber-500 rounded-lg mb-4">
                  <h3 className="font-semibold text-amber-800 dark:text-amber-200 mb-2">
                    💡 추천 근거
                  </h3>
                  <div className="space-y-2 text-sm text-amber-700 dark:text-amber-300">
                    {(() => {
                      // 오늘 입력값 기반으로 주요 Energy Element 판단
                      const avgInput = (moodValue + conditionValue + sleepValue) / 3
                      const dominantElement = lifeProfile.energyElements
                        .sort((a, b) => b.value - a.value)[0]
                      
                      return (
                        <p>
                          오늘 수면 {sleepValue}점, 컨디션 {conditionValue}점 상태에서,
                          당신의 <strong>{dominantElement.korean}({dominantElement.value}%)</strong> 에너지 특성상,
                          {avgInput < 60 
                            ? ' 조용하고 집중이 필요한 작업에 적합합니다.'
                            : ' 활발한 활동과 협업에 좋은 시기입니다.'
                          }
                        </p>
                      )
                    })()}
                  </div>
                </div>
              )}

              <div>
                <h3 className="font-semibold text-energy-green mb-2">오늘 적합한 활동</h3>
                <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300">
                  {dailyGuide.do.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
                {/* Life Profile 기반 추가 설명 */}
                {lifeProfile?.energyElements && (
                  <div className="mt-2 p-3 bg-green-50 dark:bg-green-900/20 rounded text-xs text-gray-600 dark:text-gray-400">
                    {(() => {
                      const topElements = lifeProfile.energyElements
                        .sort((a, b) => b.value - a.value)
                        .slice(0, 2)
                      return `당신의 ${topElements.map(e => e.korean).join(', ')} 에너지가 활성화되어 이러한 활동에 적합합니다.`
                    })()}
                  </div>
                )}
              </div>

              <div>
                <h3 className="font-semibold text-status-warning mb-2">피해야 할 행동</h3>
                <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300">
                  {dailyGuide.avoid.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
                {/* Life Profile 기반 추가 설명 */}
                {lifeProfile?.energyElements && (
                  <div className="mt-2 p-3 bg-red-50 dark:bg-red-900/20 rounded text-xs text-gray-600 dark:text-gray-400">
                    {(() => {
                      const lowElements = lifeProfile.energyElements
                        .filter(e => e.value < 60)
                        .sort((a, b) => a.value - b.value)
                        .slice(0, 1)
                      if (lowElements.length > 0) {
                        return `오늘 ${lowElements[0].korean} 에너지가 낮은 상태에서 과도한 활동은 피하세요.`
                      }
                      return null
                    })()}
                  </div>
                )}
              </div>

              <div>
                <h3 className="font-semibold mb-2">인간관계 대응 팁</h3>
                <p className="text-gray-700 dark:text-gray-300 mb-2">{dailyGuide.relationships}</p>
                {/* Life Profile 기반 추가 설명 */}
                {lifeProfile?.energyTraits && (
                  <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded text-xs">
                    {(() => {
                      const relationshipTraits = lifeProfile.energyTraits.filter(
                        t => t.id === 'relationship-harmony' || t.id === 'self-expression'
                      )
                      if (relationshipTraits.length > 0) {
                        const trait = relationshipTraits[0]
                        return (
                          <p className="text-gray-600 dark:text-gray-400">
                            당신의 <strong>{trait.korean}({trait.score}점)</strong> 특성상, 
                            {trait.strength}
                          </p>
                        )
                      }
                      return null
                    })()}
                  </div>
                )}
              </div>

              {/* 활성화된 Energy Elements 표시 */}
              {lifeProfile?.energyElements && (
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <h3 className="text-sm font-semibold mb-2 text-gray-600 dark:text-gray-400">
                    오늘 활성화된 에너지 요소
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {lifeProfile.energyElements
                      .filter(e => e.value >= 70)
                      .sort((a, b) => b.value - a.value)
                      .map((element) => (
                        <EnergyElementBadge
                          key={element.id}
                          element={element}
                          size="sm"
                        />
                      ))}
                  </div>
                </div>
              )}
            </motion.div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              가이드를 불러올 수 없습니다.
            </div>
          )}
        </Card>
      </div>

      {/* 법적 고지 */}
      <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
        <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
          본 서비스는 라이프 패턴 분석 기반의 참고용 가이드입니다.
          의료, 투자, 법률 판단을 대체하지 않으며, 모든 추천은 참고용으로만 활용해주세요.
        </p>
      </div>
    </div>
  )
}

export default DailyGuide
