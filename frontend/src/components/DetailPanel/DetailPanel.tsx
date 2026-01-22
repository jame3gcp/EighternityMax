import React, { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Phase } from '@/types'
import Card from '../Card/Card'
import { trapFocus, isEscapeKey } from '@/utils/accessibility'

interface DetailPanelProps {
  phase: Phase | null
  isOpen: boolean
  onClose: () => void
  isMobile?: boolean
}

const DetailPanel: React.FC<DetailPanelProps> = ({
  phase,
  isOpen,
  onClose,
  isMobile = false,
}) => {
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isOpen && panelRef.current) {
      const cleanup = trapFocus(panelRef.current)
      return cleanup
    }
  }, [isOpen])

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (isEscapeKey(e as unknown as React.KeyboardEvent) && isOpen) {
        onClose()
      }
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  if (!phase) return null

  const panelContent = (
    <div className="h-full overflow-y-auto" ref={panelRef}>
      <div className="flex items-center justify-between mb-4">
        <h2 id="panel-title" className="text-2xl font-bold" style={{ color: phase.color }}>
          {phase.name}
        </h2>
        <button
          onClick={onClose}
          className="touch-target p-2 rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
          aria-label="닫기"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="space-y-4">
        <Card>
          <p className="text-gray-700 dark:text-gray-300">{phase.description}</p>
        </Card>

        <div className="grid grid-cols-3 gap-4" role="group" aria-label="상태 지표">
          <div className="text-center">
            <div className="text-2xl font-bold text-energy-green" aria-label={`에너지 ${Math.round(phase.energy)}`}>{Math.round(phase.energy)}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">에너지</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-energy-yellow" aria-label={`감정 ${Math.round(phase.emotion)}`}>{Math.round(phase.emotion)}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">감정</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-energy-orange" aria-label={`집중도 ${Math.round(phase.focus)}`}>{Math.round(phase.focus)}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">집중도</div>
          </div>
        </div>

        <Card>
          <h3 className="font-semibold mb-2">추천 행동</h3>
          <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300" role="list">
            {phase.recommendations.map((rec, index) => (
              <li key={index}>{rec}</li>
            ))}
          </ul>
        </Card>

        <Card>
          <h3 className="font-semibold mb-2 text-status-warning">주의사항</h3>
          <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300" role="list">
            {phase.warnings.map((warning, index) => (
              <li key={index}>{warning}</li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  )

  if (isMobile) {
    return (
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="fixed inset-0 bg-black bg-opacity-50 z-40"
              aria-hidden="true"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 rounded-t-xl shadow-2xl z-50 max-h-[80vh] p-6"
              role="dialog"
              aria-modal="true"
              aria-labelledby="panel-title"
            >
              {panelContent}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    )
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.aside
          initial={{ x: 400 }}
          animate={{ x: 0 }}
          exit={{ x: 400 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed top-16 right-0 bottom-0 w-96 bg-white dark:bg-gray-800 shadow-2xl border-l border-gray-200 dark:border-gray-700 z-40 p-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="panel-title"
        >
          {panelContent}
        </motion.aside>
      )}
    </AnimatePresence>
  )
}

export default DetailPanel
