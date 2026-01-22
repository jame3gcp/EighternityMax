import React, { useState } from 'react'
import Card from '@/components/Card/Card'
import Input from '@/components/Input/Input'

interface GuideContent {
  id: string
  title: string
  content: string
  tags: string[]
  category: string
}

const guideContents: GuideContent[] = [
  {
    id: '1',
    title: '기운 사이클이란?',
    content: '기운 사이클은 사람의 에너지, 감정, 집중도가 일정한 패턴으로 변화하는 것을 의미합니다. 이 패턴을 이해하면 자신의 최적의 활동 시간을 파악하고, 더 나은 하루를 계획할 수 있습니다.',
    tags: ['기초', '이론'],
    category: '기초',
  },
  {
    id: '2',
    title: '8단계 사이클 이해하기',
    content: 'Eighternity는 하루를 8개의 단계로 나눕니다: 새벽(Dawn), 상승(Rising), 정점(Peak), 유지(Sustained), 하강(Declining), 저점(Low), 회복(Recovery), 준비(Preparation). 각 단계마다 다른 특성이 있습니다.',
    tags: ['단계', '이해'],
    category: '기초',
  },
  {
    id: '3',
    title: '정점(Peak) 단계 관리법',
    content: '정점 단계에서는 에너지와 집중도가 최고조에 달합니다. 이 시기에는 중요한 결정이나 창의적인 작업을 하는 것이 좋습니다. 하지만 무리하지 않도록 주의하세요.',
    tags: ['관리', '정점'],
    category: '관리',
  },
  {
    id: '4',
    title: '저점(Low) 단계 관리법',
    content: '저점 단계에서는 에너지가 낮아집니다. 이 시기에는 휴식과 회복에 집중하세요. 가벼운 스트레칭이나 명상을 통해 몸과 마음을 회복할 수 있습니다.',
    tags: ['관리', '저점', '휴식'],
    category: '관리',
  },
  {
    id: '5',
    title: '사이클 기록의 중요성',
    content: '정기적으로 자신의 상태를 기록하면 개인만의 사이클 패턴을 발견할 수 있습니다. 이 패턴을 통해 미래의 에너지 수준을 예측하고 계획을 세울 수 있습니다.',
    tags: ['기록', '패턴'],
    category: '팁',
  },
  {
    id: '6',
    title: 'FAQ: 사이클이 매일 같나요?',
    content: '아니요, 사이클은 매일 조금씩 다를 수 있습니다. 수면, 스트레스, 건강 상태 등 여러 요인이 사이클에 영향을 미칩니다. 하지만 전반적인 패턴은 유사한 경향이 있습니다.',
    tags: ['FAQ', '질문'],
    category: 'FAQ',
  },
]

const Guide: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('전체')
  const [selectedTag, setSelectedTag] = useState<string>('')

  const categories = ['전체', ...Array.from(new Set(guideContents.map((c) => c.category)))]
  const allTags = Array.from(new Set(guideContents.flatMap((c) => c.tags)))

  const filteredContents = guideContents.filter((content) => {
    const matchesSearch = content.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      content.content.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === '전체' || content.category === selectedCategory
    const matchesTag = !selectedTag || content.tags.includes(selectedTag)
    return matchesSearch && matchesCategory && matchesTag
  })

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">콘텐츠 / 가이드</h1>
        <p className="text-gray-600 dark:text-gray-400">
          기운 사이클에 대해 더 알아보고 효과적으로 관리하는 방법을 배워보세요.
        </p>
      </div>

      {/* 검색 및 필터 */}
      <Card className="mb-6">
        <div className="space-y-4">
          <Input
            label="검색"
            placeholder="제목이나 내용을 검색하세요..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              카테고리
            </label>
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedCategory === category
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              태그
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedTag('')}
                className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                  !selectedTag
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                전체
              </button>
              {allTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => setSelectedTag(tag)}
                  className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                    selectedTag === tag
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* 콘텐츠 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredContents.length > 0 ? (
          filteredContents.map((content) => (
            <Card key={content.id} hover className="flex flex-col">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded">
                    {content.category}
                  </span>
                </div>
                <h3 className="text-lg font-semibold mb-2">{content.title}</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-3">
                  {content.content}
                </p>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {content.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-2 py-1 rounded"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </Card>
          ))
        ) : (
          <div className="col-span-full text-center py-12 text-gray-500">
            검색 결과가 없습니다.
          </div>
        )}
      </div>
    </div>
  )
}

export default Guide
