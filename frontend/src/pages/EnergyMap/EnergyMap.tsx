import React, { useState } from 'react'
import Card from '@/components/Card/Card'
import Button from '@/components/Button/Button'

type Purpose = 'rest' | 'focus' | 'meet'
type Category = 'cafe' | 'park' | 'work' | 'rest'

const EnergyMap: React.FC = () => {
  const [selectedPurpose, setSelectedPurpose] = useState<Purpose>('rest')
  const [selectedCategory, setSelectedCategory] = useState<Category | 'all'>('all')

  const purposes: { id: Purpose; label: string; icon: string }[] = [
    { id: 'rest', label: '휴식', icon: '🧘' },
    { id: 'focus', label: '집중', icon: '💼' },
    { id: 'meet', label: '만남', icon: '🤝' },
  ]

  const categories: { id: Category; label: string }[] = [
    { id: 'cafe', label: '카페' },
    { id: 'park', label: '공원' },
    { id: 'work', label: '업무공간' },
    { id: 'rest', label: '휴식공간' },
  ]

  // 목업 장소 데이터
  const spots = [
    { id: 1, name: '스타벅스 강남점', category: 'cafe' as Category, purpose: ['rest', 'focus'] as Purpose[], reason: '조용한 분위기와 좋은 조명으로 집중과 휴식 모두에 적합합니다.' },
    { id: 2, name: '한강공원', category: 'park' as Category, purpose: ['rest', 'meet'] as Purpose[], reason: '자연 속에서 에너지를 회복하고 사람들과 만나기 좋은 장소입니다.' },
    { id: 3, name: '코워킹 스페이스', category: 'work' as Category, purpose: ['focus'] as Purpose[], reason: '업무 집중에 최적화된 환경을 제공합니다.' },
  ]

  const filteredSpots = spots.filter(spot => {
    const categoryMatch = selectedCategory === 'all' || spot.category === selectedCategory
    const purposeMatch = spot.purpose.includes(selectedPurpose)
    return categoryMatch && purposeMatch
  })

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">에너지 스팟 지도</h1>
        <p className="text-gray-600 dark:text-gray-400">
          오늘의 에너지 상태에 맞는 장소를 추천해드립니다.
        </p>
      </div>

      {/* 필터 */}
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

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              장소 카테고리
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`touch-target px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedCategory === 'all'
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                전체
              </button>
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`touch-target px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedCategory === category.id
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {category.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* 지도 영역 (목업) */}
      <Card className="mb-6">
        <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
          <div className="text-center text-gray-500">
            <div className="text-4xl mb-4">📍</div>
            <p>지도 API 연동 예정</p>
            <p className="text-sm mt-2">Kakao Map / Naver Map / Google Map</p>
          </div>
        </div>
      </Card>

      {/* 추천 장소 목록 */}
      <Card>
        <h2 className="text-xl font-bold mb-4">추천 장소</h2>
        {filteredSpots.length > 0 ? (
          <div className="space-y-4">
            {filteredSpots.map((spot) => (
              <div
                key={spot.id}
                className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-2">{spot.name}</h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">{spot.reason}</p>
                    <div className="flex gap-2">
                      {spot.purpose.map((p) => {
                        const purpose = purposes.find(pr => pr.id === p)
                        return purpose ? (
                          <span key={p} className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs">
                            {purpose.icon} {purpose.label}
                          </span>
                        ) : null
                      })}
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    길찾기
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            조건에 맞는 장소가 없습니다.
          </div>
        )}
      </Card>
    </div>
  )
}

export default EnergyMap
