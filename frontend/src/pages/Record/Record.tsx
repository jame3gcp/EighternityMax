import React, { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { recordApi, reportApi } from '@/services/api'
import { useUserStore } from '@/store/useUserStore'
import { useLifeProfileStore } from '@/store/useLifeProfileStore'
import Card from '@/components/Card/Card'
import Button from '@/components/Button/Button'
import Input from '@/components/Input/Input'
import EnergyElementBadge from '@/components/EnergyElementBadge/EnergyElementBadge'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import type { Record as RecordType, MonthlyReport } from '@/types'

interface RecordFormData {
  energy: number
  emotion: number
  focus: number
  memo: string
}

const Record: React.FC = () => {
  const { user } = useUserStore()
  const { lifeProfile, fetchLifeProfile } = useLifeProfileStore()
  const [records, setRecords] = useState<RecordType[]>([])
  const [report, setReport] = useState<MonthlyReport | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const { register, handleSubmit, reset, watch } = useForm<RecordFormData>({
    defaultValues: {
      energy: 50,
      emotion: 50,
      focus: 50,
      memo: '',
    },
  })

  const energyValue = watch('energy')
  const emotionValue = watch('emotion')
  const focusValue = watch('focus')

  useEffect(() => {
    loadRecords()
    loadReport()
    // Life Profile 로드 (비교 기준선)
    if (!lifeProfile) {
      fetchLifeProfile()
    }
  }, [lifeProfile, fetchLifeProfile])

  const loadRecords = async () => {
    if (!user) return
    try {
      const data = await recordApi.getRecords(user.id, 30)
      setRecords(data)
    } catch (error) {
      console.error('Failed to load records:', error)
    }
  }

  const loadReport = async () => {
    try {
      const data = await reportApi.getMonthlyReport()
      setReport(data)
    } catch (error) {
      console.error('Failed to load report:', error)
    }
  }

  const onSubmit = async (data: RecordFormData) => {
    if (!user) return
    setIsLoading(true)
    try {
      await recordApi.createRecord({
        userId: user.id,
        date: new Date().toISOString().split('T')[0],
        energy: data.energy,
        emotion: data.emotion,
        focus: data.focus,
        memo: data.memo || undefined,
      })
      reset()
      await loadRecords()
      await loadReport()
      alert('기록이 저장되었습니다!')
    } catch (error) {
      console.error('Failed to save record:', error)
      alert('기록 저장에 실패했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  const emojiOptions = [
    { value: 0, emoji: '😴', label: '매우 낮음' },
    { value: 25, emoji: '😔', label: '낮음' },
    { value: 50, emoji: '😐', label: '보통' },
    { value: 75, emoji: '😊', label: '좋음' },
    { value: 100, emoji: '🤩', label: '매우 좋음' },
  ]

  const getEmojiForValue = (value: number) => {
    if (value < 20) return emojiOptions[0]
    if (value < 40) return emojiOptions[1]
    if (value < 60) return emojiOptions[2]
    if (value < 80) return emojiOptions[3]
    return emojiOptions[4]
  }

  const chartData = records
    .slice()
    .reverse()
    .slice(-14)
    .map((record) => ({
      date: new Date(record.date).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' }),
      에너지: Math.round(record.energy),
      감정: Math.round(record.emotion),
      집중도: Math.round(record.focus),
    }))

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">기록 & 리포트</h1>
        <p className="text-gray-600 dark:text-gray-400">
          오늘의 상태를 기록하고 AI 분석 리포트를 확인하세요.
        </p>
      </div>

      {report && report.total_logs > 0 && (
        <Card className="mb-8 border-primary/20 bg-primary/5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex-1">
              <h2 className="text-xl font-bold text-primary mb-2">{report.month} 에너지 리포트</h2>
              <p className="text-gray-700 dark:text-gray-300">{report.insight}</p>
              <div className="mt-4 flex gap-2 flex-wrap">
                {report.top_activities.map(act => (
                  <span key={act} className="px-3 py-1 bg-white dark:bg-gray-800 rounded-full text-xs font-medium border border-primary/10">
                    ✨ {act}
                  </span>
                ))}
              </div>
            </div>
            <div className="flex gap-4">
              <div className="text-center">
                <div className="text-xs text-gray-500">평균 에너지</div>
                <div className="text-xl font-bold">{report.averages.energy}</div>
              </div>
              <div className="text-center">
                <div className="text-xs text-gray-500">평균 감정</div>
                <div className="text-xl font-bold">{report.averages.emotion}</div>
              </div>
              <div className="text-center">
                <div className="text-xs text-gray-500">기록 횟수</div>
                <div className="text-xl font-bold">{report.total_logs}</div>
              </div>
            </div>
          </div>

          {/* Life Profile 비교 분석 */}
          {lifeProfile?.energyElements && (
            <div className="mt-6 pt-6 border-t border-primary/20">
              <h3 className="font-semibold mb-3 text-gray-700 dark:text-gray-300">
                Life Profile 비교 분석
              </h3>
              <div className="space-y-3">
                {lifeProfile.energyElements.map((element) => {
                  // 기록 평균과 Energy Element 값 비교
                  const avgEnergy = report.averages.energy
                  const elementValue = element.value
                  const diff = avgEnergy - elementValue
                  const isHigher = diff > 5
                  const isLower = diff < -5
                  const isSimilar = Math.abs(diff) <= 5

                  if (isSimilar) return null // 유사한 경우 표시하지 않음

                  return (
                    <div
                      key={element.id}
                      className={`p-3 rounded-lg ${
                        isHigher
                          ? 'bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500'
                          : 'bg-amber-50 dark:bg-amber-900/20 border-l-4 border-amber-500'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <EnergyElementBadge element={element} size="sm" showValue={false} />
                        <span className="text-xs text-gray-600 dark:text-gray-400">
                          기본값: {elementValue}% | 기록 평균: {avgEnergy}%
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        {isHigher
                          ? `이번 달 평균(${avgEnergy}%)이 기본 ${element.korean} 에너지(${elementValue}%)보다 높았습니다. 활발한 시기를 경험하셨네요.`
                          : `이번 달 평균(${avgEnergy}%)이 기본 ${element.korean} 에너지(${elementValue}%)보다 낮았습니다. 평소보다 낮은 ${element.korean}을 경험하셨습니다.`}
                      </p>
                    </div>
                  )
                })}
              </div>

              {/* 패턴 해석 */}
              <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
                  패턴 해석
                </h4>
                {(() => {
                  const topElement = lifeProfile.energyElements.sort((a, b) => b.value - a.value)[0]
                  return (
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      <strong>{topElement.korean}({topElement.value}%)</strong> 에너지가 높은 당신은
                      {topElement.id === 'stability' && ' 규칙적인 일과에서 최고의 성과를 낼 수 있습니다.'}
                      {topElement.id === 'growth' && ' 새로운 도전과 창의적 활동에서 에너지를 얻습니다.'}
                      {topElement.id === 'vitality' && ' 활발한 활동과 리더십 역할에서 능력을 발휘합니다.'}
                      {topElement.id === 'clarity' && ' 집중이 필요한 작업과 명확한 결정에서 강점을 보입니다.'}
                      {topElement.id === 'flow' && ' 유연한 대응과 회복 시간이 중요합니다.'}
                    </p>
                  )
                })()}
              </div>
            </div>
          )}
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <h2 className="text-xl font-bold mb-4">오늘의 상태 기록</h2>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                에너지: {energyValue} {getEmojiForValue(energyValue).emoji}
              </label>
              <input
                type="range"
                min="0"
                max="100"
                step="1"
                {...register('energy', { valueAsNumber: true })}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                감정: {emotionValue} {getEmojiForValue(emotionValue).emoji}
              </label>
              <input
                type="range"
                min="0"
                max="100"
                step="1"
                {...register('emotion', { valueAsNumber: true })}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                집중도: {focusValue} {getEmojiForValue(focusValue).emoji}
              </label>
              <input
                type="range"
                min="0"
                max="100"
                step="1"
                {...register('focus', { valueAsNumber: true })}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            <Input
              label="메모 (선택사항)"
              {...register('memo')}
              placeholder="오늘의 느낌이나 특별한 일을 기록하세요..."
            />

            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? '저장 중...' : '기록 저장'}
            </Button>
          </form>
        </Card>

        <Card>
          <h2 className="text-xl font-bold mb-4">변화 추이</h2>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="에너지" stroke="#10b981" strokeWidth={2} />
                <Line type="monotone" dataKey="감정" stroke="#fbbf24" strokeWidth={2} />
                <Line type="monotone" dataKey="집중도" stroke="#f59e0b" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-500">
              기록된 데이터가 없습니다.
            </div>
          )}
        </Card>
      </div>

      <Card className="mt-6">
        <h2 className="text-xl font-bold mb-4">기록 타임라인</h2>
        <div className="space-y-4">
          {records.length > 0 ? (
            records.slice(0, 10).map((record) => (
              <div
                key={record.id}
                className="flex items-start space-x-4 p-4 border-l-4 border-primary rounded bg-gray-50 dark:bg-gray-700"
              >
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold">
                      {new Date(record.date).toLocaleDateString('ko-KR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </span>
                    <div className="flex space-x-4 text-sm">
                      <span>⚡ {Math.round(record.energy)}</span>
                      <span>💭 {Math.round(record.emotion)}</span>
                      <span>🎯 {Math.round(record.focus)}</span>
                    </div>
                  </div>
                  {record.memo && (
                    <p className="text-gray-600 dark:text-gray-400 text-sm">{record.memo}</p>
                  )}
                </div>
              </div>
            ))
          ) : (
            <p className="text-center text-gray-500 py-8">아직 기록이 없습니다.</p>
          )}
        </div>
      </Card>
    </div>
  )
}

export default Record
