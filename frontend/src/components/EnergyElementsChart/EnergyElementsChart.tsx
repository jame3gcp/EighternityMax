import React from 'react'
import { motion } from 'framer-motion'
import type { EnergyElement } from '@/types'

interface EnergyElementsChartProps {
  elements: EnergyElement[]
  showDescription?: boolean
  className?: string
}

const elementIcons: Record<string, string> = {
  growth: '🌱',
  vitality: '🔥',
  stability: '⛰️',
  clarity: '💎',
  flow: '💧',
}

const elementColors: Record<string, string> = {
  growth: '#22c55e',
  vitality: '#ef4444',
  stability: '#f59e0b',
  clarity: '#6366f1',
  flow: '#0ea5e9',
}

const EnergyElementsChart: React.FC<EnergyElementsChartProps> = ({
  elements,
  showDescription = false,
  className = '',
}) => {
  return (
    <div className={`space-y-4 ${className}`}>
      {elements.map((element) => {
        const icon = element.icon || elementIcons[element.id] || '✨'
        const color = element.color || elementColors[element.id] || '#6b7280'

        return (
          <div key={element.id} className="mb-4">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <span className="text-xl">{icon}</span>
                <span className="font-medium">{element.name}</span>
                <span className="text-sm text-gray-500">({element.korean})</span>
              </div>
              <span className="font-bold" style={{ color }}>
                {element.value}%
              </span>
            </div>
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${element.value}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
                className="h-full rounded-full"
                style={{ backgroundColor: color }}
              />
            </div>
            {showDescription && (
              <p className="text-xs text-gray-500 mt-1">{element.description}</p>
            )}
          </div>
        )
      })}
    </div>
  )
}

export default EnergyElementsChart
