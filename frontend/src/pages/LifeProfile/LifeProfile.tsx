import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Card from '@/components/Card/Card'
import Button from '@/components/Button/Button'
import { useLifeProfileStore } from '@/store/useLifeProfileStore'
import type { EnergyElement, EnergyTrait, EnergyBlueprint } from '@/types'

type TabType = 'overview' | 'blueprint' | 'elements' | 'traits' | 'insights'

/** API 데이터 없을 때 사용하는 폴백 (요약·청사진·5요소·특성) */
const FALLBACK_ELEMENTS: (EnergyElement & { bgColor?: string; textColor?: string })[] = [
  { id: 'growth', name: 'Growth', korean: '성장', value: 75, description: '확장, 창의성, 새로운 시작을 추구하는 에너지', traits: ['창의적 사고', '성장 지향', '도전 정신'], icon: '🌱', color: '#22c55e', bgColor: 'bg-green-500/10', textColor: 'text-green-600' },
  { id: 'vitality', name: 'Vitality', korean: '활력', value: 60, description: '열정, 표현력, 활동적인 에너지', traits: ['열정적', '표현력', '리더십'], icon: '🔥', color: '#ef4444', bgColor: 'bg-red-500/10', textColor: 'text-red-600' },
  { id: 'stability', name: 'Stability', korean: '안정', value: 85, description: '균형, 중심, 신뢰를 형성하는 에너지', traits: ['신뢰감', '일관성', '중재력'], icon: '⛰️', color: '#f59e0b', bgColor: 'bg-amber-500/10', textColor: 'text-amber-600' },
  { id: 'clarity', name: 'Clarity', korean: '명확', value: 70, description: '결단력, 집중력, 완성을 이끄는 에너지', traits: ['결단력', '분석력', '완결성'], icon: '💎', color: '#6366f1', bgColor: 'bg-indigo-500/10', textColor: 'text-indigo-600' },
  { id: 'flow', name: 'Flow', korean: '유연', value: 65, description: '적응력, 지혜, 회복을 담당하는 에너지', traits: ['적응력', '통찰력', '회복력'], icon: '💧', color: '#0ea5e9', bgColor: 'bg-sky-500/10', textColor: 'text-sky-600' },
]

const FALLBACK_TRAITS: EnergyTrait[] = [
  { id: 'self-expression', name: 'Self Expression', korean: '자기표현', score: 85, description: '자신의 생각과 감정을 표현하는 능력', strength: '강점: 명확한 의사소통, 자기 주장', icon: '🎯' },
  { id: 'resource-management', name: 'Resource Management', korean: '자원관리', score: 70, description: '재정, 시간, 에너지를 관리하는 능력', strength: '강점: 효율적 자원 배분, 계획성', icon: '💰' },
  { id: 'achievement-drive', name: 'Achievement Drive', korean: '성취동력', score: 80, description: '목표를 설정하고 달성하려는 추진력', strength: '강점: 목표 지향, 끈기', icon: '🏆' },
  { id: 'relationship-harmony', name: 'Relationship Harmony', korean: '관계조화', score: 75, description: '타인과 조화롭게 관계를 맺는 능력', strength: '강점: 협력, 공감능력', icon: '🤝' },
  { id: 'creative-insight', name: 'Creative Insight', korean: '창의통찰', score: 90, description: '새로운 아이디어와 통찰을 얻는 능력', strength: '강점: 혁신적 사고, 직관력', icon: '💡' },
  { id: 'adaptive-resilience', name: 'Adaptive Resilience', korean: '적응회복', score: 65, description: '변화에 적응하고 회복하는 능력', strength: '강점: 유연성, 스트레스 관리', icon: '🔄' },
]

const FALLBACK_BLUEPRINT: EnergyBlueprint = {
  coreType: {
    name: 'Stability Core',
    korean: '안정 코어',
    icon: '⛰️',
    description: '당신의 핵심 에너지는 "안정"입니다. 신뢰감 있고 일관된 에너지로 주변에 안정감을 줍니다.',
  },
  timeAxis: [
    { period: 'Year Energy', korean: '연간 에너지', type: 'Growth', icon: '🌱' },
    { period: 'Month Energy', korean: '월간 에너지', type: 'Vitality', icon: '🔥' },
    { period: 'Day Energy', korean: '일간 에너지', type: 'Stability', icon: '⛰️' },
    { period: 'Hour Energy', korean: '시간 에너지', type: 'Flow', icon: '💧' },
  ],
  balance: { overall: 78, message: '전반적으로 균형 잡힌 에너지 구조를 가지고 있습니다.' },
}

const LifeProfile: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('overview')
  const { lifeProfile, fetchLifeProfile, isLoading, error } = useLifeProfileStore()

  useEffect(() => {
    if (!lifeProfile) {
      fetchLifeProfile()
    }
  }, [lifeProfile, fetchLifeProfile])

  const displayElements = lifeProfile?.energyElements?.length
    ? lifeProfile.energyElements.map((el) => ({
        ...el,
        bgColor: (el as { bgColor?: string }).bgColor ?? 'bg-primary/10',
        textColor: (el as { textColor?: string }).textColor ?? 'text-primary',
      }))
    : FALLBACK_ELEMENTS
  const displayTraits = (lifeProfile?.energyTraits?.length ? lifeProfile.energyTraits : FALLBACK_TRAITS) as EnergyTrait[]
  const displayBlueprint = lifeProfile?.energyBlueprint ?? FALLBACK_BLUEPRINT
  const insightsSummary = lifeProfile?.insightsSummary ?? ''

  const tabs: { id: TabType; label: string; icon: string }[] = [
    { id: 'overview', label: '요약', icon: '📊' },
    { id: 'blueprint', label: '에너지 청사진', icon: '🧬' },
    { id: 'elements', label: '5 Energy Elements', icon: '✨' },
    { id: 'traits', label: '에너지 특성', icon: '🎯' },
    { id: 'insights', label: '종합 분석', icon: '💡' },
  ]

  const EnergyBar = ({ element }: { element: typeof displayElements[0] }) => (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <span className="text-xl">{element.icon}</span>
          <span className="font-medium">{element.name}</span>
          <span className="text-sm text-gray-500">({element.korean})</span>
        </div>
        <span className={`font-bold ${element.textColor}`}>{element.value}%</span>
      </div>
      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${element.value}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
          className="h-full rounded-full"
          style={{ backgroundColor: element.color }}
        />
      </div>
      <p className="text-xs text-gray-500 mt-1">{element.description}</p>
    </div>
  )

  const TraitCard = ({ trait }: { trait: EnergyTrait }) => (
    <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{trait.icon}</span>
          <div>
            <div className="font-semibold">{trait.name}</div>
            <div className="text-xs text-gray-500">{trait.korean}</div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-primary">{trait.score}</div>
          <div className="text-xs text-gray-500">/ 100</div>
        </div>
      </div>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{trait.description}</p>
      <p className="text-xs text-primary">{trait.strength}</p>
    </div>
  )

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg text-red-800 dark:text-red-200">
          <p className="font-medium">Life Profile을 불러올 수 없습니다.</p>
          <p className="text-sm mt-1">{error}</p>
          <Button className="mt-3" variant="outline" size="sm" onClick={() => fetchLifeProfile()}>
            다시 시도
          </Button>
        </div>
      </div>
    )
  }

  if (!lifeProfile && isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex flex-col items-center justify-center py-16">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Life Profile을 불러오는 중입니다.</p>
          <p className="text-sm text-gray-500 mt-1">프로필이 없다면 마이페이지에서 프로필을 저장한 뒤 생성해 주세요.</p>
        </div>
      </div>
    )
  }

  if (!lifeProfile) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="p-6 bg-amber-50 dark:bg-amber-900/20 rounded-xl text-center">
          <h2 className="text-xl font-bold text-amber-800 dark:text-amber-200 mb-2">Life Profile이 없습니다</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            생년월일시와 성별을 입력한 뒤 프로필을 저장하면 Life Profile이 생성됩니다. 마이페이지에서 프로필을 저장해 주세요.
          </p>
          <Button variant="primary" onClick={() => fetchLifeProfile()}>
            새로고침
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Life Profile</h1>
        <p className="text-gray-600 dark:text-gray-400">
          생년월일시와 성별을 바탕으로 계산된 사주와 AI 분석 결과를 반영한 개인 에너지 프로필입니다.
        </p>
      </div>

      <div className="mb-6 overflow-x-auto">
        <div className="flex gap-2 min-w-max">
          {tabs.map((tab) => (
            <Button
              key={tab.id}
              variant={activeTab === tab.id ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setActiveTab(tab.id)}
            >
              <span className="mr-1">{tab.icon}</span>
              {tab.label}
            </Button>
          ))}
        </div>
      </div>

      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <Card>
              <h2 className="text-xl font-bold mb-4">Core Energy Type</h2>
              <div className="text-center p-6 bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl">
                <div className="text-5xl mb-3">{displayBlueprint.coreType.icon}</div>
                <div className="text-2xl font-bold text-primary mb-1">{displayBlueprint.coreType.name}</div>
                <div className="text-sm text-gray-500 mb-3">{displayBlueprint.coreType.korean}</div>
                <p className="text-gray-600 dark:text-gray-400">{displayBlueprint.coreType.description}</p>
              </div>
            </Card>

            <Card>
              <h2 className="text-xl font-bold mb-4">Energy Balance Score</h2>
              <div className="flex items-center justify-center gap-6">
                <div className="relative w-32 h-32">
                  <svg className="w-32 h-32 transform -rotate-90">
                    <circle cx="64" cy="64" r="56" stroke="currentColor" strokeWidth="12" fill="none" className="text-gray-200 dark:text-gray-700" />
                    <motion.circle
                      cx="64"
                      cy="64"
                      r="56"
                      stroke="currentColor"
                      strokeWidth="12"
                      fill="none"
                      strokeLinecap="round"
                      className="text-primary"
                      initial={{ strokeDasharray: '0 352' }}
                      animate={{ strokeDasharray: `${displayBlueprint.balance.overall * 3.52} 352` }}
                      transition={{ duration: 1.5, ease: 'easeOut' }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-3xl font-bold">{displayBlueprint.balance.overall}</span>
                  </div>
                </div>
                <div className="flex-1">
                  <p className="text-gray-600 dark:text-gray-400">{displayBlueprint.balance.message}</p>
                </div>
              </div>
            </Card>

            <Card>
              <h2 className="text-xl font-bold mb-4">주요 에너지 요소</h2>
              <div className="grid grid-cols-5 gap-2">
                {displayElements.map((el) => (
                  <div key={el.id} className={`text-center p-3 rounded-lg ${el.bgColor}`}>
                    <div className="text-2xl mb-1">{el.icon}</div>
                    <div className="text-xs font-medium">{el.korean}</div>
                    <div className={`text-lg font-bold ${el.textColor}`}>{el.value}%</div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'blueprint' && (
          <div className="space-y-6">
            <Card>
              <h2 className="text-xl font-bold mb-4">Personal Energy Blueprint</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                당신의 출생 정보를 기반으로 분석한 개인 에너지 청사진입니다. 시간대별 에너지 흐름 패턴을 이해하면 일상의 리듬을 최적화할 수 있습니다.
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {displayBlueprint.timeAxis.map((axis, index) => (
                  <motion.div
                    key={axis.period}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="text-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                  >
                    <div className="text-3xl mb-2">{axis.icon}</div>
                    <div className="text-xs text-gray-500 mb-1">{axis.period}</div>
                    <div className="font-semibold text-primary">{axis.type}</div>
                    <div className="text-xs text-gray-500">{axis.korean}</div>
                  </motion.div>
                ))}
              </div>
              <div className="p-4 bg-primary/5 rounded-lg">
                <h3 className="font-semibold mb-2">💡 에너지 흐름 해석</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  연·월·일·시 각 기둥의 에너지가 위와 같이 구성되어 있습니다. 이 흐름을 활용하면 하루와 인생 국면별 에너지를 더 잘 관리할 수 있습니다.
                </p>
              </div>
            </Card>
            <Card>
              <h2 className="text-xl font-bold mb-4">Core Energy Characteristics</h2>
              <div className="p-6 bg-gradient-to-r from-amber-500/10 to-amber-500/5 rounded-xl">
                <div className="flex items-center gap-4 mb-4">
                  <div className="text-5xl">{displayBlueprint.coreType.icon}</div>
                  <div>
                    <div className="text-xl font-bold">{displayBlueprint.coreType.name}</div>
                    <div className="text-sm text-gray-500">{displayBlueprint.coreType.korean}</div>
                  </div>
                </div>
                <p className="text-gray-600 dark:text-gray-400">{displayBlueprint.coreType.description}</p>
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'elements' && (
          <div className="space-y-6">
            <Card>
              <h2 className="text-xl font-bold mb-2">5 Energy Elements Analysis</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                당신을 구성하는 5가지 에너지 요소의 분포입니다. 각 요소의 균형이 삶의 다양한 영역에 영향을 줍니다.
              </p>
              {displayElements.map((element) => (
                <EnergyBar key={element.id} element={element} />
              ))}
            </Card>
            <Card>
              <h2 className="text-xl font-bold mb-4">에너지 요소별 특성</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {displayElements.map((element) => (
                  <div key={element.id} className={`p-4 rounded-lg ${element.bgColor}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl">{element.icon}</span>
                      <span className="font-semibold">{element.name}</span>
                      <span className="text-sm text-gray-500">({element.korean})</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {element.traits.map((trait) => (
                        <span key={trait} className="px-2 py-1 bg-white dark:bg-gray-800 rounded text-xs">
                          {trait}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
            {lifeProfile?.energyElements?.length ? (
              <Card>
                <h2 className="text-xl font-bold mb-4">에너지 균형 분석</h2>
                <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Energy Balance Score는 {displayBlueprint.balance.overall}점입니다. {displayBlueprint.balance.message}
                  </p>
                </div>
              </Card>
            ) : null}
          </div>
        )}

        {activeTab === 'traits' && (
          <div className="space-y-6">
            <Card>
              <h2 className="text-xl font-bold mb-2">Energy Traits Profile</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                당신의 에너지가 발현되는 6가지 주요 특성입니다. 각 특성은 삶의 다양한 영역에서 강점으로 작용합니다.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {displayTraits.map((trait) => (
                  <TraitCard key={trait.id} trait={trait} />
                ))}
              </div>
            </Card>
            {displayTraits.length >= 2 && (
              <Card>
                <h2 className="text-xl font-bold mb-4">특성 요약</h2>
                <div className="space-y-4">
                  <div className="p-4 bg-green-500/10 rounded-lg">
                    <h3 className="font-semibold text-green-700 dark:text-green-400 mb-2">🌟 최고 강점</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {(() => {
                        const top = [...displayTraits].sort((a, b) => b.score - a.score)[0]
                        return top ? <><strong>{top.name}({top.korean})</strong> 특성이 {top.score}점으로 가장 높습니다. {top.strength}</> : null
                      })()}
                    </p>
                  </div>
                  <div className="p-4 bg-amber-500/10 rounded-lg">
                    <h3 className="font-semibold text-amber-700 dark:text-amber-400 mb-2">💪 발전 영역</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {(() => {
                        const low = [...displayTraits].sort((a, b) => a.score - b.score)[0]
                        return low ? <>적응회복 등 낮은 점수 특성을 보완하면 변화에 더 유연하게 대응할 수 있습니다.</> : null
                      })()}
                    </p>
                  </div>
                </div>
              </Card>
            )}
          </div>
        )}

        {activeTab === 'insights' && (
          <div className="space-y-6">
            <Card>
              <h2 className="text-xl font-bold mb-4">종합 에너지 분석</h2>
              <div className="prose prose-sm dark:prose-invert max-w-none">
                {insightsSummary ? (
                  <p className="text-gray-600 dark:text-gray-400 whitespace-pre-wrap">{insightsSummary}</p>
                ) : (
                  <p className="text-gray-600 dark:text-gray-400">
                    당신의 에너지 프로필은 <strong>{displayBlueprint.coreType.korean}</strong>을(를) 핵심으로 합니다. {lifeProfile.cycleDescription}
                  </p>
                )}
                {lifeProfile.recommendations?.length ? (
                  <div className="my-6 p-4 bg-primary/5 rounded-lg">
                    <h3 className="text-lg font-semibold mb-3">📌 추천</h3>
                    <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                      {lifeProfile.recommendations.map((r, i) => (
                        <li key={i}>✓ {r}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
            </Card>
            <Card>
              <h2 className="text-xl font-bold mb-4">에너지 최적화 가이드</h2>
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <h3 className="font-semibold mb-2">⏰ 최적 활동 시간대</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    당신의 패턴({lifeProfile.energyType})에 따르면, {lifeProfile.cycleDescription}
                  </p>
                </div>
                {lifeProfile.strengths?.length ? (
                  <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <h3 className="font-semibold mb-2">💼 강점 활용</h3>
                    <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                      {lifeProfile.strengths.map((s, i) => (
                        <li key={i}>• {s}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
            </Card>
            <Card>
              <h2 className="text-xl font-bold mb-4">서비스 연동 안내</h2>
              <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                <p>✓ 이 분석 결과가 <strong>Daily Guide</strong>의 맞춤 추천에 반영됩니다</p>
                <p>✓ <strong>에너지 예보</strong>에서 개인화된 30일 흐름을 확인하세요</p>
                <p>✓ <strong>인생 방향 가이드</strong>에서 분야별 조언을 받아보세요</p>
                <p>✓ <strong>에너지 스팟</strong>에서 당신에게 맞는 장소를 추천받으세요</p>
              </div>
            </Card>
          </div>
        )}
      </motion.div>
    </div>
  )
}

export default LifeProfile
