import React, { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useCycleStore } from '@/store/useCycleStore'
import { useUserStore } from '@/store/useUserStore'
import CycleChart from '@/components/CycleChart/CycleChart'
import StatusCard from '@/components/StatusCard/StatusCard'
import Card from '@/components/Card/Card'
import Button from '@/components/Button/Button'
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver'

const Home: React.FC = () => {
  const { currentCycle, fetchCycle, isLoading } = useCycleStore()
  const { user } = useUserStore()
  const [ref1, isVisible1] = useIntersectionObserver()
  const [ref2, isVisible2] = useIntersectionObserver()
  const [ref3, isVisible3] = useIntersectionObserver()

  useEffect(() => {
    if (!currentCycle) {
      fetchCycle('day')
    }
  }, [currentCycle, fetchCycle])

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

      {/* 오늘의 기운 상태 요약 */}
      <motion.div
        ref={ref1}
        initial={{ opacity: 0 }}
        animate={{ opacity: isVisible1 ? 1 : 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <Card>
          <h2 className="text-xl font-bold mb-4">오늘의 기운 상태</h2>
          {currentPhase && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
    </div>
  )
}

export default Home
