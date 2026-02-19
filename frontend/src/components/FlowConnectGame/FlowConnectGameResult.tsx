import React from 'react'
import { motion } from 'framer-motion'
import Button from '@/components/Button/Button'
import EnergyElementBadge from '@/components/EnergyElementBadge/EnergyElementBadge'
import GameResultRankingSection from '@/components/GameResultRanking/GameResultRankingSection'
import type { FlowConnectGameStats } from './FlowConnectGame.utils'

interface FlowConnectGameResultProps {
  stats: FlowConnectGameStats
  energyElement?: { id?: string; korean?: string; color?: string }
  gameId?: string
  score?: number
  onPlayAgain: () => void
  onClose: () => void
}

const FlowConnectGameResult: React.FC<FlowConnectGameResultProps> = ({
  stats,
  energyElement,
  gameId = 'flow-connect',
  score: scoreProp,
  onPlayAgain,
  onClose,
}) => {
  const score = scoreProp ?? stats.score
  const getGrade = (score: number): { grade: string; message: string; color: string } => {
    if (score >= 800) return { grade: 'S+', message: '완벽한 흐름 연결!', color: 'text-purple-500' }
    if (score >= 600) return { grade: 'S', message: '탁월한 성과!', color: 'text-blue-500' }
    if (score >= 400) return { grade: 'A', message: '훌륭합니다!', color: 'text-green-500' }
    if (score >= 250) return { grade: 'B', message: '잘했습니다!', color: 'text-yellow-500' }
    if (score >= 100) return { grade: 'C', message: '좋습니다!', color: 'text-orange-500' }
    return { grade: 'D', message: '다음엔 더 잘할 수 있어요!', color: 'text-gray-500' }
  }

  const getAnalysisMessage = (): string => {
    if (!energyElement) {
      return '게임을 통해 순서 감각과 집중력을 확인할 수 있습니다.'
    }
    const { id, korean } = energyElement
    if (id === 'flow') {
      if (stats.maxCombo >= 5)
        return `유연한 ${korean} 에너지가 연속 연결로 나타났습니다. 흐름을 읽는 능력이 뛰어납니다.`
      return `${korean} 에너지는 흐름을 의미합니다. 순서대로 연결하는 연습이 도움이 됩니다.`
    }
    if (id === 'clarity') {
      if (stats.wrongTaps <= 2)
        return `명확한 ${korean} 에너지가 정확한 순서 선택으로 나타났습니다. 판단력이 좋습니다.`
      return `${korean} 에너지는 명확성을 의미합니다. 천천히 순서를 확인해 보세요.`
    }
    if (stats.roundsCompleted >= 3)
      return `당신의 ${korean} 에너지가 에너지 흐름 게임에서 잘 발휘되었습니다.`
    return '게임을 통해 에너지 패턴을 확인할 수 있습니다.'
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
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          className="text-6xl mb-4"
        >
          🔗
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

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6"
      >
        {[
          { value: stats.score.toString(), label: '점수', color: 'text-primary', delay: 0.5 },
          { value: stats.correctConnections.toString(), label: '올바른 연결', color: 'text-green-500', delay: 0.6 },
          { value: stats.wrongTaps.toString(), label: '잘못된 터치', color: 'text-red-500', delay: 0.7 },
          { value: stats.roundsCompleted.toString(), label: '완료 라운드', color: 'text-blue-500', delay: 0.8 },
          { value: stats.maxCombo.toString(), label: '최대 콤보', color: 'text-purple-500', delay: 0.9 },
          { value: `${stats.totalTime}초`, label: '플레이 시간', color: 'text-gray-600 dark:text-gray-400', delay: 1 },
        ].map((stat) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ delay: stat.delay, type: 'spring', stiffness: 150 }}
            className="bg-white dark:bg-gray-700 rounded-lg p-4 text-center border border-gray-200 dark:border-gray-600 shadow-md"
          >
            <div className={`text-2xl font-bold ${stat.color} mb-1`}>{stat.value}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">{stat.label}</div>
          </motion.div>
        ))}
      </motion.div>

      {energyElement && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.9 }}
          className="bg-primary/5 rounded-lg p-6 mb-6 border-l-4 border-primary shadow-md"
        >
          <div className="flex items-center gap-3 mb-3">
            <EnergyElementBadge
              element={{
                id: (energyElement.id as 'growth' | 'vitality' | 'stability' | 'clarity' | 'flow') || 'flow',
                name: energyElement.korean || '',
                korean: energyElement.korean || '',
                value: 0,
                description: '',
                traits: [],
                color: energyElement.color,
              }}
              size="sm"
              showValue={false}
            />
            <h3 className="font-semibold text-gray-900 dark:text-white">에너지 타입 분석</h3>
          </div>
          <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
            {analysisMessage}
          </p>
        </motion.div>
      )}

      {gameId && (
        <GameResultRankingSection gameId={gameId} score={score} />
      )}

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

export default FlowConnectGameResult
