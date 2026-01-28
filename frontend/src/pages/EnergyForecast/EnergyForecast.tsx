import React, { useState, useEffect } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from 'recharts'
import Card from '@/components/Card/Card'
import EnergyElementBadge from '@/components/EnergyElementBadge/EnergyElementBadge'
import { useLifeProfileStore } from '@/store/useLifeProfileStore'

// 날짜별 Energy Element 매핑
const getEnergyElementForEnergy = (energy: number, lifeProfile?: any) => {
  if (!lifeProfile?.energyElements) return null
  
  if (energy >= 70) {
    return lifeProfile.energyElements.find((e: any) => e.id === 'vitality') || 
           lifeProfile.energyElements.find((e: any) => e.id === 'growth') ||
           lifeProfile.energyElements.sort((a: any, b: any) => b.value - a.value)[0]
  } else if (energy >= 50) {
    return lifeProfile.energyElements.find((e: any) => e.id === 'stability') ||
           lifeProfile.energyElements.find((e: any) => e.id === 'clarity') ||
           lifeProfile.energyElements.sort((a: any, b: any) => b.value - a.value)[0]
  } else {
    return lifeProfile.energyElements.find((e: any) => e.id === 'flow') ||
           lifeProfile.energyElements.sort((a: any, b: any) => a.value - b.value)[0]
  }
}

const EnergyForecast: React.FC = () => {
  const { lifeProfile, fetchLifeProfile } = useLifeProfileStore()
  const [selectedDate, setSelectedDate] = useState<number>(0)

  useEffect(() => {
    // Life Profile 로드 (설명용)
    if (!lifeProfile) {
      fetchLifeProfile()
    }
  }, [lifeProfile, fetchLifeProfile])

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
                <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
                  {selectedDay.tag === '집중' && '중요한 업무나 창의적 작업에 집중하기 좋은 날입니다.'}
                  {selectedDay.tag === '회복' && '휴식과 회복에 집중하는 것이 좋습니다.'}
                  {selectedDay.tag === '확장' && '새로운 도전이나 네트워킹에 적합한 시기입니다.'}
                  {selectedDay.tag === '주의' && '과도한 활동을 피하고 안정적인 일정을 권장합니다.'}
                  {selectedDay.tag === '일반' && '일상적인 활동에 적합한 날입니다.'}
                </p>
                
                {/* Life Profile 기반 해석 */}
                {lifeProfile && (() => {
                  const dayElement = getEnergyElementForEnergy(selectedDay.energy, lifeProfile)
                  if (dayElement) {
                    return (
                      <div className="mt-3 pt-3 border-t border-gray-300 dark:border-gray-600">
                        <h4 className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">
                          에너지 해석
                        </h4>
                        <div className="flex items-center gap-2 mb-2">
                          <EnergyElementBadge element={dayElement} size="sm" />
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          이 날짜는 당신의 <strong>{dayElement.korean}({dayElement.value}%)</strong> 에너지가 활성화되는 시기입니다.
                          {dayElement.id === 'growth' && ' 창의적인 작업이나 새로운 시작에 좋은 타이밍입니다.'}
                          {dayElement.id === 'vitality' && ' 활발한 활동과 리더십을 발휘하기 좋은 시기입니다.'}
                          {dayElement.id === 'stability' && ' 안정적인 업무와 계획 실행에 적합합니다.'}
                          {dayElement.id === 'clarity' && ' 중요한 결정이나 집중이 필요한 작업에 좋습니다.'}
                          {dayElement.id === 'flow' && ' 유연하게 대응하고 회복하기 좋은 시기입니다.'}
                        </p>
                      </div>
                    )
                  }
                  return null
                })()}
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}

export default EnergyForecast
