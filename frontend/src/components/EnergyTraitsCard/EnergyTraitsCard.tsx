import React from 'react'
import type { EnergyTrait } from '@/types'

interface EnergyTraitsCardProps {
  trait: EnergyTrait
  className?: string
}

const EnergyTraitsCard: React.FC<EnergyTraitsCardProps> = ({
  trait,
  className = '',
}) => {
  const icon = trait.icon || '🎯'
  const scoreColor = trait.score >= 80 ? 'text-green-600' : trait.score >= 60 ? 'text-primary' : 'text-amber-600'

  return (
    <div className={`p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{icon}</span>
          <div>
            <div className="font-semibold">{trait.name}</div>
            <div className="text-xs text-gray-500">{trait.korean}</div>
          </div>
        </div>
        <div className="text-right">
          <div className={`text-2xl font-bold ${scoreColor}`}>{trait.score}</div>
          <div className="text-xs text-gray-500">/ 100</div>
        </div>
      </div>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{trait.description}</p>
      <p className="text-xs text-primary">{trait.strength}</p>
    </div>
  )
}

export default EnergyTraitsCard
