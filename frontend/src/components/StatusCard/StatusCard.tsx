import React from 'react'
import Card from '../Card/Card'
import { motion } from 'framer-motion'

interface StatusCardProps {
  title: string
  value: number
  maxValue?: number
  unit?: string
  color?: string
  icon?: string
  trend?: 'up' | 'down' | 'stable'
}

const StatusCard: React.FC<StatusCardProps> = ({
  title,
  value,
  maxValue = 100,
  unit = '',
  color = 'primary',
  icon,
  trend,
}) => {
  const percentage = (value / maxValue) * 100
  const colorClasses = {
    primary: 'bg-primary',
    green: 'bg-energy-green',
    yellow: 'bg-energy-yellow',
    orange: 'bg-energy-orange',
    red: 'bg-energy-red',
  }

  return (
    <Card hover className="relative overflow-hidden">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            {icon && <span className="text-2xl">{icon}</span>}
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</h3>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-bold">{Math.round(value)}</span>
            {unit && <span className="text-lg text-gray-500">{unit}</span>}
          </div>
          {trend && (
            <div className="mt-2 flex items-center space-x-1">
              {trend === 'up' && (
                <span className="text-energy-green text-sm">↑ 상승</span>
              )}
              {trend === 'down' && (
                <span className="text-energy-red text-sm">↓ 하락</span>
              )}
              {trend === 'stable' && (
                <span className="text-status-neutral text-sm">→ 유지</span>
              )}
            </div>
          )}
        </div>
      </div>
      <div className="mt-4 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className={`h-full ${colorClasses[color as keyof typeof colorClasses] || colorClasses.primary}`}
        />
      </div>
    </Card>
  )
}

export default StatusCard
