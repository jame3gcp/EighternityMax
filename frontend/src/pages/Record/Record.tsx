import React, { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { recordApi } from '@/services/api'
import { useUserStore } from '@/store/useUserStore'
import Card from '@/components/Card/Card'
import Button from '@/components/Button/Button'
import Input from '@/components/Input/Input'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import type { Record as RecordType } from '@/types'

interface RecordFormData {
  energy: number
  emotion: number
  focus: number
  memo: string
}

const Record: React.FC = () => {
  const { user } = useUserStore()
  const [records, setRecords] = useState<RecordType[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const { register, handleSubmit, reset, watch, setValue } = useForm<RecordFormData>({
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
  }, [])

  const loadRecords = async () => {
    if (!user) return
    try {
      const data = await recordApi.getRecords(user.id, 30)
      setRecords(data)
    } catch (error) {
      console.error('Failed to load records:', error)
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
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">기록 & 추적</h1>
        <p className="text-gray-600 dark:text-gray-400">
          오늘의 상태를 기록하고 변화 추이를 확인하세요.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 입력 폼 */}
        <Card>
          <h2 className="text-xl font-bold mb-4">오늘의 상태 기록</h2>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* 에너지 */}
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
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>매우 낮음</span>
                <span>매우 높음</span>
              </div>
            </div>

            {/* 감정 */}
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
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>매우 낮음</span>
                <span>매우 높음</span>
              </div>
            </div>

            {/* 집중도 */}
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
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>매우 낮음</span>
                <span>매우 높음</span>
              </div>
            </div>

            {/* 메모 */}
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

        {/* 변화 추이 그래프 */}
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

      {/* 타임라인 */}
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
