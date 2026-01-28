import React, { useEffect, useState } from 'react'
import Card from '@/components/Card/Card'
import EnergyTraitsCard from '@/components/EnergyTraitsCard/EnergyTraitsCard'
import { directionApi } from '@/services/api'
import { useLifeProfileStore } from '@/store/useLifeProfileStore'
import type { Directions } from '@/types'

const categories: { id: string; label: string; icon: string }[] = [
  { id: 'love', label: '애정/관계', icon: '❤️' },
  { id: 'money', label: '재정/소비', icon: '💰' },
  { id: 'career', label: '커리어/업무', icon: '💼' },
  { id: 'health', label: '건강/회복', icon: '🧘' },
  { id: 'move', label: '이동/변화', icon: '✈️' },
  { id: 'connect', label: '만남/연락', icon: '🤝' },
]

// 카테고리별 Energy Traits 매핑
const getTraitsForCategory = (categoryId: string, energyTraits?: any[]) => {
  if (!energyTraits) return []
  
  const mapping: Record<string, string[]> = {
    love: ['relationship-harmony', 'self-expression'],
    money: ['resource-management'],
    career: ['achievement-drive', 'creative-insight'],
    health: ['adaptive-resilience'],
    move: ['flow'], // Flow Element
    connect: ['self-expression', 'relationship-harmony'],
  }
  
  const traitIds = mapping[categoryId] || []
  return energyTraits.filter(t => traitIds.includes(t.id))
}

const LifeDirections: React.FC = () => {
  const { lifeProfile, fetchLifeProfile } = useLifeProfileStore()
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('love')
  const [directions, setDirections] = useState<Directions | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadDirections = async () => {
      try {
        setIsLoading(true)
        const data = await directionApi.getDirections()
        setDirections(data)
      } catch (error) {
        console.error('Failed to load directions:', error)
      } finally {
        setIsLoading(false)
      }
    }
    loadDirections()
    
    // Life Profile 로드 (설명용)
    if (!lifeProfile) {
      fetchLifeProfile()
    }
  }, [lifeProfile, fetchLifeProfile])

  const selectedCategory = directions?.categories.find(c => c.id === selectedCategoryId)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">인생 방향 가이드</h1>
        <p className="text-gray-600 dark:text-gray-400">
          AI가 분석한 당신의 에너지 패턴을 바탕으로 한 생활 의사결정 가이드입니다.
        </p>
      </div>

      <Card className="mb-6">
        <h2 className="text-xl font-bold mb-4">카테고리</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategoryId(cat.id)}
              className={`touch-target p-4 rounded-lg text-center transition-colors ${
                selectedCategoryId === cat.id
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              <div className="text-3xl mb-2">{cat.icon}</div>
              <div className="text-sm font-medium">{cat.label}</div>
            </button>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <h2 className="text-xl font-bold mb-4">오늘의 방향</h2>
          {selectedCategory ? (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-energy-green mb-2">지수: {selectedCategory.score}</h3>
                <p className="text-gray-700 dark:text-gray-300">{selectedCategory.guide}</p>
              </div>
              
              {/* Life Profile 기반 추천 근거 */}
              {lifeProfile?.energyTraits && (() => {
                const relevantTraits = getTraitsForCategory(selectedCategoryId, lifeProfile.energyTraits)
                if (relevantTraits.length > 0) {
                  const topTrait = relevantTraits.sort((a, b) => b.score - a.score)[0]
                  return (
                    <div className="p-3 bg-primary/5 rounded-lg border-l-4 border-primary">
                      <h4 className="text-sm font-semibold text-primary mb-1">추천 근거</h4>
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        당신의 <strong>{topTrait.korean}({topTrait.score}점)</strong> 특성상,
                        {topTrait.strength}
                      </p>
                    </div>
                  )
                }
                return null
              })()}

              <div>
                <h3 className="font-semibold text-primary mb-2">추천 활동</h3>
                <p className="text-gray-700 dark:text-gray-300">{selectedCategory.recommendation}</p>
              </div>
            </div>
          ) : (
            <p className="text-gray-500">카테고리를 선택해주세요.</p>
          )}
        </Card>

        <Card>
          <h2 className="text-xl font-bold mb-4">AI 분석 리포트</h2>
          <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg mb-4">
            <p className="text-gray-700 dark:text-gray-300">{directions?.explanation}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              * 본 가이드는 라이프 패턴 분석 기반의 참고용입니다.
            </p>
          </div>

          {/* 관련 Energy Traits 표시 */}
          {lifeProfile?.energyTraits && (() => {
            const relevantTraits = getTraitsForCategory(selectedCategoryId, lifeProfile.energyTraits)
            if (relevantTraits.length > 0) {
              return (
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                  <h3 className="text-sm font-semibold mb-3 text-gray-600 dark:text-gray-400">
                    이 카테고리에 영향을 미치는 에너지 특성
                  </h3>
                  <div className="space-y-2">
                    {relevantTraits.map((trait) => (
                      <EnergyTraitsCard key={trait.id} trait={trait} />
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
                    이 특성들이 오늘의 추천에 영향을 미쳤습니다.
                  </p>
                </div>
              )
            }
            return null
          })()}
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

export default LifeDirections

