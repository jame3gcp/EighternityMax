import React from 'react'
import { motion } from 'framer-motion'
import Button from '@/components/Button/Button'
import EnergyElementBadge from '@/components/EnergyElementBadge/EnergyElementBadge'
import type { SnakeGameStats } from './SnakeGame.utils'

interface SnakeGameResultProps {
  stats: SnakeGameStats
  energyElement?: any
  onPlayAgain: () => void
  onClose: () => void
}

const SnakeGameResult: React.FC<SnakeGameResultProps> = ({
  stats,
  energyElement,
  onPlayAgain,
  onClose,
}) => {
  // 점수에 따른 등급 계산
  const getGrade = (score: number): { grade: string; message: string; color: string } => {
    if (score >= 500) {
      return { grade: 'S+', message: '완벽한 집중력!', color: 'text-purple-500' }
    } else if (score >= 300) {
      return { grade: 'S', message: '탁월한 성과!', color: 'text-blue-500' }
    } else if (score >= 200) {
      return { grade: 'A', message: '훌륭합니다!', color: 'text-green-500' }
    } else if (score >= 100) {
      return { grade: 'B', message: '잘했습니다!', color: 'text-yellow-500' }
    } else if (score >= 50) {
      return { grade: 'C', message: '좋습니다!', color: 'text-orange-500' }
    } else {
      return { grade: 'D', message: '다음엔 더 잘할 수 있어요!', color: 'text-gray-500' }
    }
  }

  // 에너지 타입 기반 분석 메시지 생성
  const getAnalysisMessage = (): string => {
    if (!energyElement) {
      return '게임을 통해 집중력과 반응 속도를 확인할 수 있습니다.'
    }

    const elementId = energyElement.id
    const score = stats.score
    const energyCollected = stats.energyCollected
    const survivalTime = stats.survivalTime
    const maxLength = stats.maxLength

    let message = ''

    switch (elementId) {
      case 'vitality':
        if (energyCollected >= 20) {
          message = `활발한 ${energyElement.korean} 에너지가 많은 에너지 수집으로 나타났습니다. 활력이 넘치는 하루가 될 것입니다!`
        } else {
          message = `${energyElement.korean} 에너지는 활력을 의미합니다. 더 적극적인 자세가 도움이 될 것입니다.`
        }
        break
      case 'flow':
        if (survivalTime >= 60) {
          message = `유연한 ${energyElement.korean} 에너지가 오래 생존하는 것으로 나타났습니다. 변화에 잘 적응하는 능력을 보여줍니다.`
        } else {
          message = `${energyElement.korean} 에너지는 유연성을 의미합니다. 더 자연스러운 흐름을 만들어보세요.`
        }
        break
      case 'growth':
        if (maxLength >= 15) {
          message = `성장하는 ${energyElement.korean} 에너지가 긴 지렁이로 나타났습니다. 계속 발전하고 있습니다!`
        } else {
          message = `${energyElement.korean} 에너지는 성장을 의미합니다. 연습을 통해 더욱 발전할 수 있습니다.`
        }
        break
      case 'stability':
        if (survivalTime >= 45) {
          message = `안정적인 ${energyElement.korean} 에너지가 오래 생존하는 것으로 나타났습니다. 꾸준함이 당신의 강점입니다.`
        } else {
          message = `${energyElement.korean} 에너지는 안정성을 의미합니다. 조금 더 꾸준한 연습이 도움이 될 것입니다.`
        }
        break
      case 'clarity':
        if (score >= 200) {
          message = `당신의 ${energyElement.korean} 에너지가 높은 점수로 나타났습니다. 명확한 판단력과 집중력을 보여줍니다.`
        } else {
          message = `${energyElement.korean} 에너지를 더욱 발휘하기 위해 집중력 훈련을 권장합니다.`
        }
        break
      default:
        message = '게임을 통해 에너지 패턴을 확인할 수 있습니다.'
    }

    return message
  }

  const grade = getGrade(stats.score)
  const analysisMessage = getAnalysisMessage()

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="w-full max-w-2xl mx-auto p-6"
    >
      <div className="text-center mb-6">
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ 
            type: 'spring', 
            stiffness: 200,
            damping: 15,
          }}
          className="text-6xl mb-4"
        >
          🐍
        </motion.div>
        <motion.h2
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-3xl font-bold text-gray-900 dark:text-white mb-2"
        >
          게임 결과
        </motion.h2>
      </div>

      {/* 점수 및 등급 */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ delay: 0.3, type: 'spring', stiffness: 100 }}
        className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl p-6 mb-6 text-center shadow-lg"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.5, type: 'spring', stiffness: 200 }}
          className={`text-6xl font-bold mb-2 ${grade.color} drop-shadow-lg`}
        >
          {grade.grade}
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="text-4xl font-bold text-gray-900 dark:text-white mb-2"
        >
          {stats.score.toLocaleString()}점
        </motion.div>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="text-lg text-gray-600 dark:text-gray-400"
        >
          {grade.message}
        </motion.p>
      </motion.div>

      {/* 통계 */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6"
      >
        {[
          { value: stats.energyCollected.toString(), label: '수집한 에너지', color: 'text-green-500', delay: 0.5 },
          { value: `${Math.floor(stats.survivalTime)}초`, label: '생존 시간', color: 'text-blue-500', delay: 0.6 },
          { value: stats.maxLength.toString(), label: '최대 길이', color: 'text-purple-500', delay: 0.7 },
          { value: stats.score.toString(), label: '점수', color: 'text-primary', delay: 0.8 },
        ].map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ delay: stat.delay, type: 'spring', stiffness: 150 }}
            className="bg-white dark:bg-gray-700 rounded-lg p-4 text-center border border-gray-200 dark:border-gray-600 shadow-md hover:shadow-lg transition-shadow"
          >
            <div className={`text-2xl font-bold ${stat.color} mb-1`}>
              {stat.value}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {stat.label}
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* 에너지 타입 분석 */}
      {energyElement && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.9 }}
          className="bg-primary/5 rounded-lg p-6 mb-6 border-l-4 border-primary shadow-md"
        >
          <div className="flex items-center gap-3 mb-3">
            <EnergyElementBadge element={energyElement} size="sm" />
            <h3 className="font-semibold text-gray-900 dark:text-white">
              에너지 타입 분석
            </h3>
          </div>
          <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
            {analysisMessage}
          </p>
        </motion.div>
      )}

      {/* 액션 버튼 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1 }}
        className="flex gap-3"
      >
        <Button onClick={onPlayAgain} className="flex-1" size="lg">
          다시 플레이
        </Button>
        <Button onClick={onClose} variant="outline" className="flex-1" size="lg">
          닫기
        </Button>
      </motion.div>
    </motion.div>
  )
}

export default SnakeGameResult
