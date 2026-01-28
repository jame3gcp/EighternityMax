import React, { useEffect, useState } from 'react'
import { useCycleStore } from '@/store/useCycleStore'
import { useLifeProfileStore } from '@/store/useLifeProfileStore'
import CycleChart from '@/components/CycleChart/CycleChart'
import DetailPanel from '@/components/DetailPanel/DetailPanel'
import Card from '@/components/Card/Card'
import Button from '@/components/Button/Button'
import EnergyElementBadge from '@/components/EnergyElementBadge/EnergyElementBadge'
import type { Period } from '@/types'

// Phase별 Energy Element 매핑 (에너지 수준 기반)
const getEnergyElementForPhase = (energy: number, lifeProfile?: any) => {
  if (!lifeProfile?.energyElements) return null
  
  // 에너지 수준에 따라 적절한 Element 선택
  if (energy >= 80) {
    // 높은 에너지 → Vitality 또는 Growth
    return lifeProfile.energyElements.find((e: any) => e.id === 'vitality') || 
           lifeProfile.energyElements.find((e: any) => e.id === 'growth') ||
           lifeProfile.energyElements.sort((a: any, b: any) => b.value - a.value)[0]
  } else if (energy >= 60) {
    // 중간 에너지 → Stability 또는 Clarity
    return lifeProfile.energyElements.find((e: any) => e.id === 'stability') ||
           lifeProfile.energyElements.find((e: any) => e.id === 'clarity') ||
           lifeProfile.energyElements.sort((a: any, b: any) => b.value - a.value)[0]
  } else {
    // 낮은 에너지 → Flow (회복)
    return lifeProfile.energyElements.find((e: any) => e.id === 'flow') ||
           lifeProfile.energyElements.sort((a: any, b: any) => a.value - b.value)[0]
  }
}

const MyCycle: React.FC = () => {
  const { currentCycle, period, fetchCycle, setPeriod, isLoading } = useCycleStore()
  const { lifeProfile, fetchLifeProfile } = useLifeProfileStore()
  const [selectedPhase, setSelectedPhase] = useState<number | null>(null)
  const [isPanelOpen, setIsPanelOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024)

  useEffect(() => {
    if (!currentCycle) {
      fetchCycle('day')
    }
    // Life Profile 로드
    if (!lifeProfile) {
      fetchLifeProfile()
    }
  }, [currentCycle, fetchCycle, lifeProfile, fetchLifeProfile])

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const handlePhaseClick = (phaseId: number) => {
    setSelectedPhase(phaseId)
    setIsPanelOpen(true)
  }

  const handlePeriodChange = (newPeriod: Period) => {
    setPeriod(newPeriod)
  }

  const periods: { value: Period; label: string }[] = [
    { value: 'day', label: '일' },
    { value: 'week', label: '주' },
    { value: 'month', label: '월' },
    { value: 'year', label: '년' },
  ]

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">로딩 중...</p>
        </div>
      </div>
    )
  }

  if (!currentCycle) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <p className="text-center text-gray-600 dark:text-gray-400">사이클 데이터를 불러올 수 없습니다.</p>
        </Card>
      </div>
    )
  }

  const selectedPhaseData = selectedPhase !== null ? currentCycle.phases[selectedPhase] : null

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">나의 사이클</h1>
        
        {/* 기간 선택 */}
        <Card>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">기간:</span>
            {periods.map((p) => (
              <Button
                key={p.value}
                variant={period === p.value ? 'primary' : 'outline'}
                size="sm"
                onClick={() => handlePeriodChange(p.value)}
              >
                {p.label}
              </Button>
            ))}
          </div>
        </Card>
      </div>

      {/* 사이클 차트 */}
      <div className="mb-6">
        <Card>
          <div className="flex flex-col items-center">
            <h2 className="text-xl font-bold mb-4">에너지 사이클 시각화</h2>
            <CycleChart
              phases={currentCycle.phases}
              currentPhase={currentCycle.currentPhase}
              onPhaseClick={handlePhaseClick}
              size="lg"
            />
            <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
              차트의 각 구간을 클릭하면 상세 정보를 볼 수 있습니다.
            </p>
          </div>
        </Card>
      </div>

      {/* 현재 단계 정보 */}
      <Card>
        <h2 className="text-xl font-bold mb-4">현재 단계</h2>
        {currentCycle.phases[currentCycle.currentPhase] && (() => {
          const currentPhase = currentCycle.phases[currentCycle.currentPhase]
          const phaseElement = getEnergyElementForPhase(currentPhase.energy, lifeProfile)
          
          return (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold" style={{ color: currentPhase.color }}>
                  {currentPhase.name}
                </h3>
                <p className="text-gray-700 dark:text-gray-300 mt-2">
                  {currentPhase.description}
                </p>
                {/* Life Profile 기반 설명 */}
                {phaseElement && (
                  <div className="mt-3 p-3 bg-primary/5 rounded-lg border-l-4 border-primary">
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      이 단계는 <strong>{phaseElement.korean}({phaseElement.value}%)</strong> 에너지가 활성화됩니다.
                      {phaseElement.description}
                    </p>
                  </div>
                )}
              </div>
              {phaseElement && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">활성 에너지:</span>
                  <EnergyElementBadge element={phaseElement} size="sm" />
                </div>
              )}
              <Button onClick={() => handlePhaseClick(currentCycle.currentPhase)}>
                상세 정보 보기
              </Button>
            </div>
          )
        })()}
      </Card>

      {/* 상세 패널 */}
      <DetailPanel
        phase={selectedPhaseData}
        isOpen={isPanelOpen}
        onClose={() => setIsPanelOpen(false)}
        isMobile={isMobile}
        lifeProfile={lifeProfile}
      />
    </div>
  )
}

export default MyCycle
