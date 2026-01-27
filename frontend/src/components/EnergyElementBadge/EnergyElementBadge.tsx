import React from 'react'
import type { EnergyElement } from '@/types'

interface EnergyElementBadgeProps {
  element: EnergyElement
  size?: 'sm' | 'md' | 'lg'
  showValue?: boolean
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

const EnergyElementBadge: React.FC<EnergyElementBadgeProps> = ({
  element,
  size = 'md',
  showValue = true,
  className = '',
}) => {
  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-2',
    lg: 'text-base px-4 py-3',
  }

  const iconSize = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl',
  }

  const bgColor = element.color || elementColors[element.id] || '#6b7280'
  const icon = element.icon || elementIcons[element.id] || '✨'

  return (
    <div
      className={`inline-flex items-center gap-2 rounded-lg ${sizeClasses[size]} ${className}`}
      style={{ backgroundColor: `${bgColor}15` }}
    >
      <span className={iconSize[size]}>{icon}</span>
      <span className="font-medium">{element.korean}</span>
      {showValue && (
        <span className="font-bold" style={{ color: bgColor }}>
          {element.value}%
        </span>
      )}
    </div>
  )
}

export default EnergyElementBadge
