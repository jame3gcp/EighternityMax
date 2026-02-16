import React, { useEffect, useState } from 'react'
import Card from '@/components/Card/Card'
import Button from '@/components/Button/Button'
import EnergyElementBadge from '@/components/EnergyElementBadge/EnergyElementBadge'
import NaverMap from '@/components/NaverMap/NaverMap'
import { spotApi } from '@/services/api'
import { useLifeProfileStore } from '@/store/useLifeProfileStore'
import type { Spot } from '@/types'

type Purpose = 'rest' | 'focus' | 'meet'

// 목적별 Energy Element 매핑
const getEnergyElementsForPurpose = (purpose: Purpose, lifeProfile?: any) => {
  if (!lifeProfile?.energyElements) return []

  const elements = lifeProfile.energyElements

  switch (purpose) {
    case 'rest':
      // 휴식 → Flow, Stability
      return [
        elements.find((e: any) => e.id === 'flow'),
        elements.find((e: any) => e.id === 'stability'),
      ].filter(Boolean)
    case 'focus':
      // 집중 → Clarity, Stability
      return [
        elements.find((e: any) => e.id === 'clarity'),
        elements.find((e: any) => e.id === 'stability'),
      ].filter(Boolean)
    case 'meet':
      // 만남 → Vitality, Growth
      return [
        elements.find((e: any) => e.id === 'vitality'),
        elements.find((e: any) => e.id === 'growth'),
      ].filter(Boolean)
    default:
      return []
  }
}

const EnergyMap: React.FC = () => {
  const { lifeProfile, fetchLifeProfile } = useLifeProfileStore()
  const [selectedPurpose, setSelectedPurpose] = useState<Purpose>('rest')
  const [spots, setSpots] = useState<Spot[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const mapCenter = { lat: 37.5665, lng: 126.978 }

  const purposes: { id: Purpose; label: string; icon: string }[] = [
    { id: 'rest', label: '휴식', icon: '🧘' },
    { id: 'focus', label: '집중', icon: '💼' },
    { id: 'meet', label: '만남', icon: '🤝' },
  ]

  useEffect(() => {
    loadSpots()
    // Life Profile 로드 (설명용)
    if (!lifeProfile) {
      fetchLifeProfile()
    }
  }, [selectedPurpose, lifeProfile, fetchLifeProfile])

  const loadSpots = async () => {
    try {
      setIsLoading(true)
      const lat = 37.5665
      const lng = 126.9780
      const data = await spotApi.getSpots(lat, lng, selectedPurpose)
      setSpots(data.spots)
    } catch (error) {
      console.error('Failed to load spots:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">에너지 스팟 지도</h1>
        <p className="text-gray-600 dark:text-gray-400">
          오늘의 에너지 상태에 맞는 장소를 추천해드립니다.
        </p>
      </div>

      <Card className="mb-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              활동 목적
            </label>
            <div className="flex flex-wrap gap-2">
              {purposes.map((purpose) => (
                <button
                  key={purpose.id}
                  onClick={() => setSelectedPurpose(purpose.id)}
                  className={`touch-target px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedPurpose === purpose.id
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  <span className="mr-2">{purpose.icon}</span>
                  {purpose.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Card>

      <Card className="mb-6">
        <NaverMap
          center={mapCenter}
          spots={spots}
          height="24rem"
          isLoading={isLoading}
        />
      </Card>

      <Card>
        <h2 className="text-xl font-bold mb-4">추천 장소</h2>
        {spots.length > 0 ? (
          <div className="space-y-4">
            {spots.map((spot) => {
              const relevantElements = getEnergyElementsForPurpose(selectedPurpose, lifeProfile)
              const primaryElement = relevantElements[0]

              return (
                <div
                  key={spot.id}
                  className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-2">
                        {spot.name} <span className="text-primary text-sm">({spot.score}점)</span>
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">{spot.description}</p>
                      <p className="text-xs text-gray-500 mb-2">📍 {spot.address}</p>
                      <div className="flex gap-2 mb-3">
                        {spot.tags.map((tag) => (
                          <span key={tag} className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs">
                            #{tag}
                          </span>
                        ))}
                      </div>

                      {/* Life Profile 기반 추천 근거 */}
                      {primaryElement && (
                        <div className="mt-3 p-3 bg-primary/5 rounded-lg border-l-4 border-primary">
                          <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            추천 근거
                          </h4>
                          <div className="flex items-center gap-2 mb-2">
                            <EnergyElementBadge element={primaryElement} size="sm" />
                          </div>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            당신의 <strong>{primaryElement.korean}({primaryElement.value}%)</strong> 에너지 특성상,
                            {selectedPurpose === 'rest' && ' 조용하고 편안한 공간에서 최고의 휴식을 취할 수 있습니다.'}
                            {selectedPurpose === 'focus' && ' 조용하고 안정적인 공간에서 최고의 집중력을 발휘합니다.'}
                            {selectedPurpose === 'meet' && ' 활기찬 분위기에서 원활한 소통과 협력을 이룰 수 있습니다.'}
                            {primaryElement.description && ` ${primaryElement.description}`}
                          </p>
                        </div>
                      )}
                    </div>
                    <Button variant="outline" size="sm">
                      길찾기
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            {isLoading ? '로딩 중...' : '조건에 맞는 장소가 없습니다.'}
          </div>
        )}
      </Card>
    </div>
  )
}

export default EnergyMap

