import React, { useState } from 'react'
import Card from '@/components/Card/Card'
import Button from '@/components/Button/Button'
import { motion } from 'framer-motion'

type Category = 'love' | 'money' | 'career' | 'health' | 'move' | 'connect'

const categories: { id: Category; label: string; icon: string }[] = [
  { id: 'love', label: '애정/관계', icon: '❤️' },
  { id: 'money', label: '재정/소비', icon: '💰' },
  { id: 'career', label: '커리어/업무', icon: '💼' },
  { id: 'health', label: '건강/회복', icon: '🧘' },
  { id: 'move', label: '이동/변화', icon: '✈️' },
  { id: 'connect', label: '만남/연락', icon: '🤝' },
]

const LifeDirections: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<Category>('love')

  const getDirectionData = (category: Category) => {
    const data: Record<Category, any> = {
      love: {
        today: {
          focus: '오늘은 깊은 대화를 나누기에 좋은 시기입니다.',
          attention: '감정적 판단보다는 논리적 접근이 도움이 됩니다.',
        },
        monthly: {
          try: '새로운 관계를 시작하거나 기존 관계를 발전시킬 수 있는 시기입니다.',
          avoid: '중요한 관계 결정은 서두르지 마세요.',
        },
        reason: '현재 에너지 패턴이 협력과 소통에 유리한 단계입니다.',
      },
      money: {
        today: {
          focus: '재정 계획을 세우거나 검토하기 좋은 날입니다.',
          attention: '충동적 소비는 피하고 장기적 관점을 유지하세요.',
        },
        monthly: {
          try: '투자나 저축 계획을 수립하는 것이 좋습니다.',
          avoid: '큰 금액의 결정은 신중하게 검토하세요.',
        },
        reason: '에너지 흐름이 계획과 분석에 유리한 시기입니다.',
      },
      career: {
        today: {
          focus: '중요한 업무나 프로젝트에 집중할 수 있는 날입니다.',
          attention: '팀워크를 중시하고 협력적인 접근이 효과적입니다.',
        },
        monthly: {
          try: '새로운 도전이나 스킬 개발에 적합한 시기입니다.',
          avoid: '급격한 직장 변경은 신중하게 결정하세요.',
        },
        reason: '현재 단계가 창의성과 리더십 발휘에 유리합니다.',
      },
      health: {
        today: {
          focus: '규칙적인 수면과 식사 패턴을 유지하세요.',
          attention: '과도한 운동보다는 적절한 휴식이 필요합니다.',
        },
        monthly: {
          try: '건강한 습관을 형성하고 유지하는 좋은 시기입니다.',
          avoid: '무리한 다이어트나 운동 계획은 피하세요.',
        },
        reason: '회복과 균형에 집중해야 할 에너지 단계입니다.',
      },
      move: {
        today: {
          focus: '이사나 환경 변화를 계획하기 좋은 날입니다.',
          attention: '성급한 결정보다는 신중한 검토가 필요합니다.',
        },
        monthly: {
          try: '새로운 환경이나 변화를 준비하는 시기입니다.',
          avoid: '충동적인 이동이나 변화는 피하세요.',
        },
        reason: '변화에 대한 준비가 잘 되는 에너지 흐름입니다.',
      },
      connect: {
        today: {
          focus: '네트워킹이나 새로운 인연을 만나기에 좋은 날입니다.',
          attention: '진정성 있는 소통을 중시하세요.',
        },
        monthly: {
          try: '사회적 활동이나 모임에 참여하는 것이 좋습니다.',
          avoid: '표면적인 관계보다는 깊은 연결을 추구하세요.',
        },
        reason: '소통과 협력에 유리한 에너지 패턴입니다.',
      },
    }
    return data[category]
  }

  const directionData = getDirectionData(selectedCategory)

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
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`touch-target p-4 rounded-lg text-center transition-colors ${
                selectedCategory === category.id
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              <div className="text-3xl mb-2">{category.icon}</div>
              <div className="text-sm font-medium">{category.label}</div>
            </button>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <h2 className="text-xl font-bold mb-4">오늘의 방향</h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-energy-green mb-2">지금 하기 좋은 행동</h3>
              <p className="text-gray-700 dark:text-gray-300">{directionData.today.focus}</p>
            </div>
            <div>
              <h3 className="font-semibold text-status-warning mb-2">피해야 할 선택</h3>
              <p className="text-gray-700 dark:text-gray-300">{directionData.today.attention}</p>
            </div>
          </div>
        </Card>

        <Card>
          <h2 className="text-xl font-bold mb-4">이번 달 흐름</h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-energy-green mb-2">시도하면 좋은 영역</h3>
              <p className="text-gray-700 dark:text-gray-300">{directionData.monthly.try}</p>
            </div>
            <div>
              <h3 className="font-semibold text-status-warning mb-2">미루는 것이 좋은 영역</h3>
              <p className="text-gray-700 dark:text-gray-300">{directionData.monthly.avoid}</p>
            </div>
          </div>
        </Card>
      </div>

      <Card className="mt-6">
        <h2 className="text-xl font-bold mb-4">AI 판단 근거</h2>
        <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <p className="text-gray-700 dark:text-gray-300">{directionData.reason}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            * 본 가이드는 라이프 패턴 분석 기반의 참고용입니다.
          </p>
        </div>
      </Card>
    </div>
  )
}

export default LifeDirections
