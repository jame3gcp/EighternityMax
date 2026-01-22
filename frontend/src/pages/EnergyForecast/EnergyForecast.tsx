import React, { useState } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from 'recharts'
import Card from '@/components/Card/Card'

const EnergyForecast: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<number>(0)

  // 30일 예보 데이터 생성
  const forecastData = Array.from({ length: 30 }, (_, i) => {
    const date = new Date()
    date.setDate(date.getDate() + i)
    const energy = 50 + Math.sin(i / 5) * 30 + Math.random() * 10
    const focus = 50 + Math.cos(i / 5) * 30 + Math.random() * 10
    const recovery = 50 + Math.sin(i / 5 + 1) * 20 + Math.random() * 10

    let tag = '일반'
    if (energy > 70) tag = '집중'
    else if (energy < 40) tag = '회복'
    else if (focus > 70) tag = '확장'
    else if (recovery < 40) tag = '주의'

    return {
      date: date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' }),
      fullDate: date.toISOString().split('T')[0],
      energy: Math.round(energy),
      focus: Math.round(focus),
      recovery: Math.round(recovery),
      tag,
    }
  })

  const selectedDay = forecastData[selectedDate]

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">에너지 예보 (30일)</h1>
        <p className="text-gray-600 dark:text-gray-400">
          앞으로 30일간의 에너지 흐름을 미리 확인하세요.
        </p>
      </div>

      <Card className="mb-6">
        <h2 className="text-xl font-bold mb-4">30일 에너지 곡선</h2>
        <ResponsiveContainer width="100%" height={400}>
          <AreaChart data={forecastData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis domain={[0, 100]} />
            <Tooltip />
            <Legend />
            <Area
              type="monotone"
              dataKey="energy"
              stroke="#10b981"
              fill="#10b981"
              fillOpacity={0.3}
              name="에너지"
            />
            <Area
              type="monotone"
              dataKey="focus"
              stroke="#fbbf24"
              fill="#fbbf24"
              fillOpacity={0.3}
              name="집중도"
            />
            <Area
              type="monotone"
              dataKey="recovery"
              stroke="#06b6d4"
              fill="#06b6d4"
              fillOpacity={0.3}
              name="회복력"
            />
          </AreaChart>
        </ResponsiveContainer>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <h2 className="text-xl font-bold mb-4">캘린더 스트립</h2>
          <div className="grid grid-cols-7 gap-2">
            {forecastData.slice(0, 14).map((day, index) => (
              <button
                key={index}
                onClick={() => setSelectedDate(index)}
                className={`p-2 rounded-lg text-sm transition-colors ${
                  selectedDate === index
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                <div className="text-xs">{day.date.split(' ')[0]}</div>
                <div className="font-semibold">{day.date.split(' ')[1]}</div>
                <div className="text-xs mt-1">{day.tag}</div>
              </button>
            ))}
          </div>
        </Card>

        <Card>
          <h2 className="text-xl font-bold mb-4">선택한 날짜 상세</h2>
          {selectedDay && (
            <div className="space-y-4">
              <div>
                <div className="text-2xl font-bold mb-2">{selectedDay.date}</div>
                <span className={`px-3 py-1 rounded-full text-sm ${
                  selectedDay.tag === '집중' ? 'bg-energy-green/20 text-energy-green' :
                  selectedDay.tag === '회복' ? 'bg-energy-blue/20 text-energy-blue' :
                  selectedDay.tag === '확장' ? 'bg-energy-yellow/20 text-energy-yellow' :
                  'bg-gray-200 dark:bg-gray-700'
                }`}>
                  {selectedDay.tag}
                </span>
              </div>

              <div className="space-y-2">
                <div>
                  <div className="flex justify-between mb-1">
                    <span>에너지</span>
                    <span className="font-semibold">{selectedDay.energy}</span>
                  </div>
                  <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full">
                    <div
                      className="h-2 bg-energy-green rounded-full"
                      style={{ width: `${selectedDay.energy}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <span>집중도</span>
                    <span className="font-semibold">{selectedDay.focus}</span>
                  </div>
                  <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full">
                    <div
                      className="h-2 bg-energy-yellow rounded-full"
                      style={{ width: `${selectedDay.focus}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <h3 className="font-semibold mb-2">추천 일정 타입</h3>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  {selectedDay.tag === '집중' && '중요한 업무나 창의적 작업에 집중하기 좋은 날입니다.'}
                  {selectedDay.tag === '회복' && '휴식과 회복에 집중하는 것이 좋습니다.'}
                  {selectedDay.tag === '확장' && '새로운 도전이나 네트워킹에 적합한 시기입니다.'}
                  {selectedDay.tag === '주의' && '과도한 활동을 피하고 안정적인 일정을 권장합니다.'}
                  {selectedDay.tag === '일반' && '일상적인 활동에 적합한 날입니다.'}
                </p>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}

export default EnergyForecast
