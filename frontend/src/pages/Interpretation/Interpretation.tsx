import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useCycleStore } from '@/store/useCycleStore'
import { cycleApi } from '@/services/api'
import Card from '@/components/Card/Card'
import Button from '@/components/Button/Button'
import { motion } from 'framer-motion'
import html2canvas from 'html2canvas'
import type { Interpretation as InterpretationType, InterpretationItem } from '@/types'

const Interpretation: React.FC = () => {
  const { currentCycle, fetchCycle } = useCycleStore()
  const [interpretation, setInterpretation] = useState<InterpretationType | null>(null)
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['recommendations']))
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!currentCycle) {
      fetchCycle('day')
    }
  }, [currentCycle, fetchCycle])

  useEffect(() => {
    if (currentCycle) {
      loadInterpretation(currentCycle.currentPhase)
    }
  }, [currentCycle])

  const loadInterpretation = async (phaseId: number) => {
    setIsLoading(true)
    try {
      const data = await cycleApi.getInterpretation(phaseId)
      setInterpretation(data)
    } catch (error) {
      console.error('Failed to load interpretation:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev)
      if (next.has(section)) {
        next.delete(section)
      } else {
        next.add(section)
      }
      return next
    })
  }

  const handleShare = async () => {
    const element = document.getElementById('interpretation-card')
    if (!element) return

    try {
      const canvas = await html2canvas(element, {
        backgroundColor: '#ffffff',
        scale: 2,
      })
      const dataUrl = canvas.toDataURL('image/png')
      
      // 클립보드에 복사 또는 다운로드
      if (navigator.clipboard && navigator.clipboard.write) {
        const blob = await (await fetch(dataUrl)).blob()
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob }),
        ])
        alert('이미지가 클립보드에 복사되었습니다!')
      } else {
        // 폴백: 다운로드
        const link = document.createElement('a')
        link.download = 'eighternity-interpretation.png'
        link.href = dataUrl
        link.click()
      }
    } catch (error) {
      console.error('Failed to share:', error)
      alert('공유에 실패했습니다.')
    }
  }

  if (isLoading || !interpretation || !currentCycle) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">로딩 중...</p>
        </div>
      </div>
    )
  }

  const currentPhase = currentCycle.phases[currentCycle.currentPhase]

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">사이클 해석</h1>
        <p className="text-gray-600 dark:text-gray-400">
          현재 단계에 대한 상세한 해석과 가이드를 확인하세요.
        </p>
      </div>

      {interpretation.periodSummary && (
        <div className="mb-4 p-4 rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1">오늘의 흐름 요약</h3>
          <p className="text-gray-800 dark:text-gray-200">{interpretation.periodSummary}</p>
        </div>
      )}

      <Card id="interpretation-card" className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold" style={{ color: currentPhase.color }}>
            {interpretation.title}
          </h2>
          <Button onClick={handleShare} variant="outline" size="sm">
            공유하기
          </Button>
        </div>

        <div className="prose dark:prose-invert max-w-none">
          <p className="text-gray-700 dark:text-gray-300 text-lg leading-relaxed">
            {interpretation.description}
          </p>
          {interpretation.energyTraitSummary && (
            <p className="text-gray-600 dark:text-gray-400 mt-3 text-base">
              {interpretation.energyTraitSummary}
            </p>
          )}
          {interpretation.personalization && (
            <div className="mt-4 p-3 rounded-lg bg-primary/10 dark:bg-primary/20 border border-primary/20">
              <p className="text-gray-800 dark:text-gray-200 text-sm leading-relaxed">
                {interpretation.personalization}
              </p>
            </div>
          )}
        </div>
      </Card>

      {/* 추천 행동 아코디언 */}
      <Card className="mb-4">
        <button
          onClick={() => toggleSection('recommendations')}
          className="w-full flex items-center justify-between touch-target"
        >
          <h3 className="text-xl font-semibold text-energy-green">추천 행동</h3>
          <motion.svg
            animate={{ rotate: expandedSections.has('recommendations') ? 180 : 0 }}
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </motion.svg>
        </button>
        <motion.div
          initial={false}
          animate={{
            height: expandedSections.has('recommendations') ? 'auto' : 0,
            opacity: expandedSections.has('recommendations') ? 1 : 0,
          }}
          transition={{ duration: 0.3 }}
          className="overflow-hidden"
        >
          <ul className="mt-4 space-y-3 list-disc list-inside text-gray-700 dark:text-gray-300">
            {(interpretation.recommendationItems ?? interpretation.recommendations.map((text): InterpretationItem => ({ text }))).map((item, index) => (
              <li key={index} className="leading-relaxed">
                <span className="font-medium text-energy-green">{item.text}</span>
                {item.reason && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 ml-4">왜: {item.reason}</p>
                )}
              </li>
            ))}
          </ul>
        </motion.div>
      </Card>

      {/* 주의사항 아코디언 */}
      <Card className="mb-4">
        <button
          onClick={() => toggleSection('warnings')}
          className="w-full flex items-center justify-between touch-target"
        >
          <h3 className="text-xl font-semibold text-status-warning">주의사항</h3>
          <motion.svg
            animate={{ rotate: expandedSections.has('warnings') ? 180 : 0 }}
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </motion.svg>
        </button>
        <motion.div
          initial={false}
          animate={{
            height: expandedSections.has('warnings') ? 'auto' : 0,
            opacity: expandedSections.has('warnings') ? 1 : 0,
          }}
          transition={{ duration: 0.3 }}
          className="overflow-hidden"
        >
          <ul className="mt-4 space-y-3 list-disc list-inside text-gray-700 dark:text-gray-300">
            {(interpretation.warningItems ?? interpretation.warnings.map((text): InterpretationItem => ({ text }))).map((item, index) => (
              <li key={index} className="leading-relaxed">
                <span className="font-medium text-status-warning">{item.text}</span>
                {item.reason && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 ml-4">왜: {item.reason}</p>
                )}
              </li>
            ))}
          </ul>
        </motion.div>
      </Card>

      {/* 다음 단계 예측 */}
      <Card>
        <h3 className="text-xl font-semibold mb-4">다음 단계 예측</h3>
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 space-y-2">
          <p className="text-gray-700 dark:text-gray-300">
            다음 단계는 <span className="font-bold">{interpretation.nextPhaseName}</span>입니다.
          </p>
          {interpretation.nextPhaseDescription && (
            <p className="text-gray-700 dark:text-gray-300">
              {interpretation.nextPhaseDescription}
            </p>
          )}
          {interpretation.nextPhaseTransitionHint && (
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {interpretation.nextPhaseTransitionHint}
            </p>
          )}
          {!interpretation.nextPhaseDescription && !interpretation.nextPhaseTransitionHint && (
            <p className="text-sm text-gray-600 dark:text-gray-400">
              다음 단계로의 전환을 준비하세요.
            </p>
          )}
        </div>
      </Card>

      {/* 인생 방향·데일리 가이드 연동 */}
      <Card className="mt-4">
        <h3 className="text-xl font-semibold mb-3">함께 보면 좋아요</h3>
        <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
          지금 단계에서는 인생 방향의 커리어·관계·재물 영역이나 오늘의 데일리 가이드와 함께 보시면 더 효과적입니다.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link to="/life-directions">
            <Button variant="outline" size="sm">인생 방향 보기</Button>
          </Link>
          <Link to="/daily-guide">
            <Button variant="outline" size="sm">데일리 가이드 보기</Button>
          </Link>
        </div>
      </Card>
    </div>
  )
}

export default Interpretation
