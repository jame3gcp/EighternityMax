import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useCycleStore } from '@/store/useCycleStore'
import { useUserStore } from '@/store/useUserStore'
import { useLifeProfileStore } from '@/store/useLifeProfileStore'
import CycleChart from '@/components/CycleChart/CycleChart'
import StatusCard from '@/components/StatusCard/StatusCard'
import Card from '@/components/Card/Card'
import Button from '@/components/Button/Button'
import EnergyElementBadge from '@/components/EnergyElementBadge/EnergyElementBadge'
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver'
import { dailyGuideApi } from '@/services/api'
import type { DailyGuide } from '@/types'

const Home: React.FC = () => {
  const { currentCycle, fetchCycle, isLoading } = useCycleStore()
  const { user } = useUserStore()
  const { lifeProfile, fetchLifeProfile, isLoading: isLoadingLifeProfile } = useLifeProfileStore()
  const [dailyGuide, setDailyGuide] = useState<DailyGuide | null>(null)
  const [isLifeProfileExpanded, setIsLifeProfileExpanded] = useState(() => {
    const hasSeen = localStorage.getItem('hasSeenLifeProfileSummary')
    return !hasSeen // 첫 방문 시 true
  })
  const [ref1, isVisible1] = useIntersectionObserver()
  const [ref2, isVisible2] = useIntersectionObserver()
  const [ref3, isVisible3] = useIntersectionObserver()

  useEffect(() => {
    if (!currentCycle) {
      fetchCycle('day')
    }
  }, [currentCycle, fetchCycle])

  useEffect(() => {
    // Daily Guide 로드
    const loadDailyGuide = async () => {
      try {
        const guide = await dailyGuideApi.getDailyGuide()
        setDailyGuide(guide)
      } catch (error) {
        console.error('Failed to load daily guide:', error)
      }
    }
    loadDailyGuide()

    // Life Profile 로드
    if (!lifeProfile) {
      fetchLifeProfile()
    }

    // 첫 방문 플래그 설정
    if (isLifeProfileExpanded) {
      localStorage.setItem('hasSeenLifeProfileSummary', 'true')
    }
  }, [lifeProfile, fetchLifeProfile, isLifeProfileExpanded])

  const currentPhase = currentCycle?.phases[currentCycle.currentPhase]
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 },
  }

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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* 환영 메시지 */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          {user ? `${user.name}님, 안녕하세요!` : 'Eighternity에 오신 것을 환영합니다'}
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          오늘의 기운 사이클을 확인하고 최적의 하루를 계획하세요.
        </p>
      </motion.div>

      {/* Life Profile 요약 (첫 방문 시 강조) */}
      {lifeProfile && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Card className={isLifeProfileExpanded ? 'border-2 border-primary' : ''}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold">당신의 에너지 프로필</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  AI가 분석한 개인 에너지 특성입니다
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsLifeProfileExpanded(!isLifeProfileExpanded)}
              >
                {isLifeProfileExpanded ? '접기' : '펼치기'}
              </Button>
            </div>

            {isLifeProfileExpanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                transition={{ duration: 0.3 }}
                className="space-y-4"
              >
                {/* Core Energy Type */}
                {lifeProfile.energyBlueprint?.coreType && (
                  <div className="text-center p-6 bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl">
                    <div className="text-5xl mb-3">
                      {lifeProfile.energyBlueprint.coreType.icon || lifeProfile.energyTypeEmoji}
                    </div>
                    <div className="text-2xl font-bold text-primary mb-1">
                      {lifeProfile.energyBlueprint.coreType.name}
                    </div>
                    <div className="text-sm text-gray-500 mb-3">
                      {lifeProfile.energyBlueprint.coreType.korean}
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">
                      {lifeProfile.energyBlueprint.coreType.description}
                    </p>
                  </div>
                )}

                {/* 5 Energy Elements 요약 */}
                {lifeProfile.energyElements && lifeProfile.energyElements.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-3">5 Energy Elements</h3>
                    <div className="grid grid-cols-5 gap-2">
                      {lifeProfile.energyElements.map((element) => (
                        <div
                          key={element.id}
                          className="text-center p-3 rounded-lg"
                          style={{ backgroundColor: `${element.color || '#6b7280'}15` }}
                        >
                          <div className="text-2xl mb-1">
                            {element.icon || '✨'}
                          </div>
                          <div className="text-xs font-medium">{element.korean}</div>
                          <div
                            className="text-lg font-bold"
                            style={{ color: element.color || '#6b7280' }}
                          >
                            {element.value}%
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 상세 보기 링크 */}
                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  <Link to="/life-profile">
                    <Button variant="outline" className="w-full">
                      Life Profile 상세 보기
                    </Button>
                  </Link>
                </div>
              </motion.div>
            )}
          </Card>
        </motion.div>
      )}

      {/* 오늘의 기운 상태 요약 */}
      <motion.div
        ref={ref1}
        initial={{ opacity: 0 }}
        animate={{ opacity: isVisible1 ? 1 : 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">오늘의 기운 상태</h2>
            {dailyGuide && (
              <div className="text-right">
                <div className="text-sm text-gray-500">Energy Index</div>
                <div className="text-2xl font-bold text-primary">{dailyGuide.energy_index}</div>
              </div>
            )}
          </div>
          {currentPhase && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <StatusCard
                title="에너지"
                value={currentPhase.energy}
                icon="⚡"
                color="green"
                trend="stable"
              />
              <StatusCard
                title="감정"
                value={currentPhase.emotion}
                icon="💭"
                color="yellow"
                trend="up"
              />
              <StatusCard
                title="집중도"
                value={currentPhase.focus}
                icon="🎯"
                color="orange"
                trend="stable"
              />
            </div>
          )}
          {dailyGuide && (
            <div className="mt-4 p-4 bg-primary/5 rounded-lg">
              <p className="text-gray-700 dark:text-gray-300">{dailyGuide.summary}</p>
            </div>
          )}
        </Card>
      </motion.div>

      {/* 사이클 미니 시각화 */}
      <motion.div
        ref={ref2}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: isVisible2 ? 1 : 0, scale: isVisible2 ? 1 : 0.9 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <Card>
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex-1 mb-4 md:mb-0 md:mr-8">
              <h2 className="text-xl font-bold mb-2">나의 사이클</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                현재 {currentPhase?.name || '알 수 없음'} 단계에 있습니다.
              </p>
              <Link to="/my-cycle">
                <Button>전체 사이클 보기</Button>
              </Link>
            </div>
            {currentCycle && (
              <div className="flex-shrink-0">
                <CycleChart
                  phases={currentCycle.phases}
                  currentPhase={currentCycle.currentPhase}
                  size="sm"
                />
              </div>
            )}
          </div>
        </Card>
      </motion.div>

      {/* 빠른 진입 CTA */}
      <motion.div
        ref={ref3}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: isVisible3 ? 1 : 0, y: isVisible3 ? 0 : 20 }}
        transition={{ duration: 0.5 }}
        variants={containerVariants}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
      >
        <motion.div variants={itemVariants}>
          <Card hover onClick={() => window.location.href = '/interpretation'}>
            <div className="text-center">
              <div className="text-4xl mb-2">📖</div>
              <h3 className="font-semibold mb-2">사이클 해석</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                현재 단계에 대한 상세한 해석을 확인하세요
              </p>
            </div>
          </Card>
        </motion.div>
        <motion.div variants={itemVariants}>
          <Card hover onClick={() => window.location.href = '/record'}>
            <div className="text-center">
              <div className="text-4xl mb-2">📝</div>
              <h3 className="font-semibold mb-2">기록하기</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                오늘의 상태를 기록하고 추적하세요
              </p>
            </div>
          </Card>
        </motion.div>
        <motion.div variants={itemVariants}>
          <Card hover onClick={() => window.location.href = '/guide'}>
            <div className="text-center">
              <div className="text-4xl mb-2">📚</div>
              <h3 className="font-semibold mb-2">가이드</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                기운 사이클에 대해 더 알아보세요
              </p>
            </div>
          </Card>
        </motion.div>
      </motion.div>

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

export default Home
